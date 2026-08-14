use super::query_helper;
use crate::errors::Error;
use crate::models::{
    NewRepository, NewUser, Permission, Plugins, Repository, User, UsersRepositories,
};
use crate::rpc::{
    luclerpc::{Platforms, UpdateServer, User as LucleUser},
    Hosts,
};
use crate::schema::{plugins, repositories, users, users_repositories};
use crate::utils;
use argon2::{
    self,
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use chrono::NaiveDateTime;
use diesel::prelude::*;
use diesel::result;
use diesel::select;
use diesel::sqlite::SqliteConnection;
use diesel_async::pooled_connection::{deadpool::Pool, AsyncDieselConnectionManager};
use diesel_async::sync_connection_wrapper::SyncConnectionWrapper;
use diesel_async::{
    AsyncConnection, AsyncMigrationHarness, AsyncMysqlConnection, AsyncPgConnection, RunQueryDsl,
};
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use serde_json::Value;
use std::{
    collections::HashMap,
    sync::{Mutex, OnceLock},
};
use url::Url;

pub const MYSQL_MIGRATIONS: EmbeddedMigrations = embed_migrations!("migrations");
// SQLite/PostgreSQL don't accept MySQL's AUTO_INCREMENT/native ENUM syntax,
// so each backend gets its own portable migration set rather than sharing
// MYSQL_MIGRATIONS. See migrations_sqlite/, migrations_postgres/, and
// models.rs's per-backend ToSql/FromSql impls for Permission.
pub const SQLITE_MIGRATIONS: EmbeddedMigrations = embed_migrations!("migrations_sqlite");
pub const POSTGRES_MIGRATIONS: EmbeddedMigrations = embed_migrations!("migrations_postgres");

// Interim multi-backend pool: diesel_async's upstream `MultiConnection` trait
// (which would let a single Pool<C> cover all three backends) isn't released
// yet, so this enum + the with_conn! macro below stand in for it. Every
// function using with_conn! runs the *same* Diesel DSL body against whichever
// concrete connection type the pool holds — the query code itself doesn't
// change per backend, only which connection type executes it.
pub enum DbPool {
    Mysql(Pool<AsyncMysqlConnection>),
    Pg(Pool<AsyncPgConnection>),
    Sqlite(Pool<SyncConnectionWrapper<SqliteConnection>>),
}

impl Clone for DbPool {
    fn clone(&self) -> Self {
        match self {
            DbPool::Mysql(p) => DbPool::Mysql(p.clone()),
            DbPool::Pg(p) => DbPool::Pg(p.clone()),
            DbPool::Sqlite(p) => DbPool::Sqlite(p.clone()),
        }
    }
}

pub static POOL: OnceLock<Mutex<Option<DbPool>>> = OnceLock::new();

pub enum Backend {
    Pg,
    Sqlite,
    Mysql,
}

impl Backend {
    pub fn for_url(database_url: &str) -> Self {
        let mut available_schemes: Vec<&str> = Vec::new();
        match database_url {
            _ if database_url.starts_with("postgres://")
                || database_url.starts_with("postgresql://") =>
            {
                available_schemes.push("`postgres://`");
                Backend::Pg
            }
            _ if database_url.starts_with("mysql://") => {
                available_schemes.push("`mysql://`");
                Backend::Mysql
            }
            _ => Backend::Sqlite,
        }
    }
}

pub fn set_pool(backend: &Backend, db_url: &str) {
    let pool = match backend {
        Backend::Mysql => {
            let manager = AsyncDieselConnectionManager::<AsyncMysqlConnection>::new(db_url);
            DbPool::Mysql(Pool::builder(manager).build().unwrap())
        }
        Backend::Pg => {
            let manager = AsyncDieselConnectionManager::<AsyncPgConnection>::new(db_url);
            DbPool::Pg(Pool::builder(manager).build().unwrap())
        }
        Backend::Sqlite => {
            let manager =
                AsyncDieselConnectionManager::<SyncConnectionWrapper<SqliteConnection>>::new(
                    db_url,
                );
            DbPool::Sqlite(Pool::builder(manager).build().unwrap())
        }
    };
    let cell = POOL.get_or_init(|| Mutex::new(None));
    *cell.lock().unwrap() = Some(pool);
}

pub fn get_pool() -> Option<DbPool> {
    if let Some(mutex) = POOL.get() {
        let pool = mutex.lock().unwrap();
        pool.clone()
    } else {
        None
    }
}

// Runs `$body` (an async block using `$conn`) against whichever backend
// `$pool` (a DbPool) actually holds. `$body` must be pure Diesel DSL with no
// backend-specific syntax — that's what makes running the identical code
// against three different connection types sound rather than three separately
// hand-verified implementations.
macro_rules! with_conn {
    ($pool:expr, |$conn:ident| $body:expr) => {
        match $pool {
            DbPool::Mysql(p) => {
                let mut $conn = p.get().await?;
                $body
            }
            DbPool::Pg(p) => {
                let mut $conn = p.get().await?;
                $body
            }
            DbPool::Sqlite(p) => {
                let mut $conn = p.get().await?;
                $body
            }
        }
    };
}

pub async fn create_database(database_url: &str) -> Result<(), crate::errors::Error> {
    match Backend::for_url(database_url) {
        Backend::Pg => {
            if AsyncPgConnection::establish(database_url).await.is_err() {
                let (database, postgres_url) = change_database_of_url(database_url, "postgres")?;
                tracing::info!("Creating database: {database}");
                let mut conn =
                    AsyncPgConnection::establish(&postgres_url)
                        .await
                        .map_err(|error| crate::errors::Error::Connection {
                            error,
                            url: postgres_url,
                        })?;
                query_helper::create_database(&database)
                    .execute(&mut conn)
                    .await?;
            }

            set_pool(&Backend::Pg, database_url);
            if let Some(pool) = get_pool() {
                run_migrations(&pool, POSTGRES_MIGRATIONS).await?;
            } else {
                return Err(crate::errors::Error::GetPool);
            }
        }
        Backend::Sqlite => {
            let path = path_from_sqlite_url(database_url)?;
            if !path.exists() {
                tracing::info!("Creating database: {database_url}");
                SyncConnectionWrapper::<SqliteConnection>::establish(database_url)
                    .await
                    .map_err(|error| crate::errors::Error::Connection {
                        error,
                        url: database_url.to_owned(),
                    })?;
            }

            set_pool(&Backend::Sqlite, database_url);
            if let Some(pool) = get_pool() {
                run_migrations(&pool, SQLITE_MIGRATIONS).await?;
            } else {
                return Err(crate::errors::Error::GetPool);
            }
        }
        Backend::Mysql => {
            if AsyncMysqlConnection::establish(database_url).await.is_err() {
                let (database, mysql_url) =
                    change_database_of_url(database_url, "information_schema")?;

                tracing::info!("Creating database: {database}");

                let mut conn =
                    AsyncMysqlConnection::establish(&mysql_url)
                        .await
                        .map_err(|error| crate::errors::Error::Connection {
                            error,
                            url: mysql_url,
                        })?;
                if let Err(err) = query_helper::create_database(&database)
                    .execute(&mut conn)
                    .await
                {
                    tracing::error!("Unable to create database: {}", err);
                    return Err(crate::errors::Error::Query(err));
                }
            }

            set_pool(&Backend::Mysql, database_url);
            if let Some(pool) = get_pool() {
                run_migrations(&pool, MYSQL_MIGRATIONS).await?;
            } else {
                return Err(crate::errors::Error::GetPool);
            }
        }
    }
    Ok(())
}

// AsyncMigrationHarness::new() takes conn by value, not &mut, so the `mut`
// with_conn! always binds is unused here (but is needed by every other
// with_conn! call site in this file, which do run &mut queries) — allowed
// rather than special-casing the shared macro for this one caller.
#[allow(unused_mut)]
async fn run_migrations(
    pool: &DbPool,
    migrations: EmbeddedMigrations,
) -> Result<(), crate::errors::Error> {
    with_conn!(pool.clone(), |conn| {
        let mut harness = AsyncMigrationHarness::new(conn);
        if let Err(err) = harness.run_pending_migrations(migrations) {
            tracing::error!("Unable to run migrations: {}", err);
            return Err(crate::errors::Error::Migration(err));
        }
        Ok(())
    })
}

fn change_database_of_url(
    database_url: &str,
    default_database: &str,
) -> Result<(String, String), crate::errors::Error> {
    let base = Url::parse(database_url)?;
    let database = base
        .path_segments()
        .expect("The database url has at least one path segment")
        .next_back()
        .expect("The database url has at least one path segment")
        .to_owned();
    let mut new_url = base
        .join(default_database)
        .expect("The provided database is always valid");
    new_url.set_query(base.query());
    Ok((database, new_url.into()))
}

fn path_from_sqlite_url(database_url: &str) -> Result<std::path::PathBuf, crate::errors::Error> {
    if database_url.starts_with("file:/") {
        // looks like a file URL
        match Url::parse(database_url) {
            Ok(url) if url.scheme() == "file" => {
                Ok(url
                    .to_file_path()
                    .map_err(|_err| crate::errors::Error::Connection {
                        error: result::ConnectionError::InvalidConnectionUrl(String::from(
                            database_url,
                        )),
                        url: database_url.into(),
                    })?)
            }
            _ => {
                // invalid URL or scheme
                Err(crate::errors::Error::Connection {
                    error: result::ConnectionError::InvalidConnectionUrl(String::from(
                        database_url,
                    )),
                    url: database_url.into(),
                })
            }
        }
    } else {
        // assume it's a bare path
        Ok(::std::path::PathBuf::from(database_url))
    }
}

pub async fn create_user(username: String, password: String, email: String) -> Result<(), Error> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)?
        .to_string();
    if let Some(pool) = get_pool() {
        with_conn!(pool, |conn| {
            let now = select(diesel::dsl::now)
                .get_result::<NaiveDateTime>(&mut conn)
                .await?;

            let new_user = NewUser {
                username,
                password: password_hash,
                email,
                created_at: now,
                modified_at: now,
            };

            diesel::insert_into(users::table)
                .values(&new_user)
                .execute(&mut conn)
                .await?;
            Ok(())
        })
    } else {
        Err(crate::errors::Error::GetPool)
    }
}

pub async fn register_update_server(
    username: String,
    repository: String,
    platforms: Vec<Hosts>,
    list_plugin: Vec<String>,
) -> Result<(), Error> {
    if let Some(pool) = get_pool() {
        with_conn!(pool, |conn| {
            let now = select(diesel::dsl::now)
                .get_result::<NaiveDateTime>(&mut conn)
                .await?;

            let json_platforms = serde_json::to_string(&platforms)?;
            let json_plugins = serde_json::to_string(&list_plugin)?;
            let repo = NewRepository {
                name: repository.clone(),
                created_at: now,
                platforms: json_platforms,
                plugins: json_plugins,
            };

            diesel::insert_into(repositories::table)
                .values(&repo)
                .execute(&mut conn)
                .await?;

            match users::table
                .filter(users::dsl::username.eq(username))
                .select(User::as_select())
                .first(&mut conn)
                .await
            {
                Ok(val) => {
                    let users_repos = UsersRepositories {
                        user_id: val.id,
                        repository_name: repository,
                        permission: Permission::Write,
                    };
                    diesel::insert_into(users_repositories::table)
                        .values(&users_repos)
                        .execute(&mut conn)
                        .await?;
                    Ok(())
                }
                Err(err) => Err(crate::errors::Error::Query(err)),
            }
        })
    } else {
        Err(crate::errors::Error::GetPool)
    }
}

pub async fn list_update_server_by_user(username: String) -> Result<Vec<String>, Error> {
    if let Some(pool) = get_pool() {
        with_conn!(pool, |conn| {
            match users::table
                .filter(users::dsl::username.eq(username.clone()))
                .select(User::as_select())
                .first(&mut conn)
                .await
                .optional()
            {
                Ok(Some(val)) => {
                    match users_repositories::table
                        .filter(users_repositories::dsl::user_id.eq(val.id))
                        .select(UsersRepositories::as_select())
                        .load(&mut conn)
                        .await
                        .optional()
                    {
                        Ok(Some(list_repo)) => {
                            let mut user_repo: Vec<String> = Vec::new();
                            for repo in list_repo {
                                user_repo.push(repo.repository_name);
                            }
                            Ok(user_repo)
                        }
                        Ok(None) => Ok(Vec::new()),
                        Err(err) => Err(crate::errors::Error::Query(err)),
                    }
                }
                Ok(None) => Err(crate::errors::Error::UserNotFound),
                Err(err) => Err(crate::errors::Error::Query(err)),
            }
        })
    } else {
        Err(crate::errors::Error::GetPool)
    }
}

pub async fn join_update_server(username: String, repository: String) -> Result<(), Error> {
    if let Some(pool) = get_pool() {
        with_conn!(pool, |conn| {
            match users::table
                .filter(users::dsl::username.eq(username))
                .select(User::as_select())
                .first(&mut conn)
                .await
            {
                Ok(val) => {
                    let users_repos = UsersRepositories {
                        user_id: val.id,
                        repository_name: repository,
                        permission: Permission::Pending,
                    };
                    diesel::insert_into(users_repositories::table)
                        .values(&users_repos)
                        .execute(&mut conn)
                        .await?;
                    Ok(())
                }
                Err(err) => Err(crate::errors::Error::Query(err)),
            }
        })
    } else {
        Err(crate::errors::Error::GetPool)
    }
}

pub async fn delete_repo(path: String) -> Result<(), Error> {
    if let Some(pool) = get_pool() {
        with_conn!(pool, |conn| {
            diesel::delete(repositories::table.filter(repositories::dsl::name.eq(path.clone())))
                .execute(&mut conn)
                .await?;

            diesel::delete(
                users_repositories::table.filter(users_repositories::dsl::repository_name.eq(path)),
            )
            .execute(&mut conn)
            .await?;

            Ok(())
        })
    } else {
        Err(crate::errors::Error::GetPool)
    }
}

pub async fn login(username_or_email: String, password: String) -> Result<LucleUser, Error> {
    if let Some(pool) = get_pool() {
        with_conn!(pool, |conn| {
            match users::table
                .filter(users::dsl::username.eq(username_or_email.clone()))
                .select(User::as_select())
                .first(&mut conn)
                .await
                .optional()
            {
                Ok(Some(val)) => {
                    match users_repositories::table
                        .filter(users_repositories::dsl::user_id.eq(val.id))
                        .select(UsersRepositories::as_select())
                        .load(&mut conn)
                        .await
                        .optional()
                    {
                        Ok(Some(list_repo)) => {
                            let mut user_repo: Vec<UpdateServer> = Vec::new();
                            let mut repo_platforms: Vec<i32> = Vec::new();
                            let mut list_plugins: Vec<String> = Vec::new();

                            let mut new_repo = UpdateServer {
                                path: "".to_string(),
                                username: "".to_string(),
                                platforms: Vec::new(),
                                plugins: Vec::new(),
                            };
                            for repo in list_repo {
                                match repositories::table
                                    .filter(
                                        repositories::dsl::name.eq(repo.repository_name.clone()),
                                    )
                                    .select(Repository::as_select())
                                    .load(&mut conn)
                                    .await
                                    .optional()
                                {
                                    Ok(Some(repo)) => {
                                        for r in &repo {
                                            let parsed_platforms: Value =
                                                serde_json::from_str(&r.platforms)?;
                                            let parsed_plugins: Value =
                                                serde_json::from_str(&r.plugins)?;
                                            if let Some(list_plug) = parsed_plugins.as_array() {
                                                for list in list_plug {
                                                    if let Some(p) = list.as_str() {
                                                        list_plugins.push(p.into());
                                                    }
                                                }
                                            }
                                            if let Some(list_platforms) =
                                                parsed_platforms.as_array()
                                            {
                                                for platform in list_platforms {
                                                    if let Some(plat) = platform.as_str() {
                                                        match plat {
                                                            "Win64" => repo_platforms
                                                                .push(Platforms::Win64.into()),
                                                            "Macosx8664" => repo_platforms
                                                                .push(Platforms::MacosX8664.into()),
                                                            "Macosarm64" => repo_platforms
                                                                .push(Platforms::MacosArm64.into()),
                                                            "Linux" => repo_platforms
                                                                .push(Platforms::Linux.into()),
                                                            _ => {}
                                                        }
                                                    }
                                                }
                                            }
                                            new_repo = UpdateServer {
                                                path: r.name.clone(),
                                                username: val.username.clone(),
                                                platforms: repo_platforms.clone(),
                                                plugins: list_plugins.clone(),
                                            };
                                            repo_platforms.clear();
                                        }
                                    }
                                    Ok(None) => {}
                                    Err(err) => {
                                        return Err(crate::errors::Error::Query(err));
                                    }
                                }
                                user_repo.push(new_repo.clone());
                            }
                            login_user(val.username, val.password, password, val.email, user_repo)
                        }
                        Ok(None) => {
                            login_user(val.username, val.password, password, val.email, Vec::new())
                        }
                        Err(err) => Err(crate::errors::Error::Query(err)),
                    }
                }
                Ok(None) => {
                    match users::table
                        .filter(users::dsl::email.eq(username_or_email.clone()))
                        .select(User::as_select())
                        .first(&mut conn)
                        .await
                        .optional()
                    {
                        Ok(Some(val)) => {
                            match users_repositories::table
                                .filter(users_repositories::dsl::user_id.eq(val.id))
                                .select(UsersRepositories::as_select())
                                .load(&mut conn)
                                .await
                                .optional()
                            {
                                Ok(Some(list_repo)) => {
                                    let mut user_repo: Vec<UpdateServer> = Vec::new();
                                    let mut repo_platforms: Vec<i32> = Vec::new();
                                    let mut list_plugins: Vec<String> = Vec::new();

                                    for repo in list_repo {
                                        match repositories::table
                                            .filter(
                                                repositories::dsl::name
                                                    .eq(repo.repository_name.clone()),
                                            )
                                            .select(Repository::as_select())
                                            .load(&mut conn)
                                            .await
                                            .optional()
                                        {
                                            Ok(Some(repo)) => {
                                                for r in &repo {
                                                    match r.platforms.as_str() {
                                                        "win64" => repo_platforms
                                                            .push(Platforms::Win64.into()),
                                                        "macos_x86_64" => repo_platforms
                                                            .push(Platforms::MacosX8664.into()),
                                                        "macos_arm64" => repo_platforms
                                                            .push(Platforms::MacosArm64.into()),
                                                        "linux" => repo_platforms
                                                            .push(Platforms::Linux.into()),
                                                        _ => {}
                                                    }
                                                    let parsed_plugins: Value =
                                                        serde_json::from_str(&r.plugins)?;
                                                    if let Some(list_plug) =
                                                        parsed_plugins.as_array()
                                                    {
                                                        for list in list_plug {
                                                            if let Some(p) = list.as_str() {
                                                                list_plugins.push(p.into());
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                            Ok(None) => {}
                                            Err(err) => {
                                                return Err(crate::errors::Error::Query(err))
                                            }
                                        }
                                        let new_repo = UpdateServer {
                                            path: repo.repository_name,
                                            username: val.username.clone(),
                                            platforms: repo_platforms.clone(),
                                            plugins: list_plugins.clone(),
                                        };
                                        user_repo.push(new_repo);
                                    }
                                    login_user(
                                        val.username,
                                        val.password,
                                        password,
                                        val.email,
                                        user_repo,
                                    )
                                }
                                Ok(None) => login_user(
                                    val.username,
                                    val.password,
                                    password,
                                    val.email,
                                    Vec::new(),
                                ),
                                Err(err) => Err(crate::errors::Error::Query(err)),
                            }
                        }
                        Ok(None) => Err(crate::errors::Error::UserNotFound),
                        Err(err) => Err(crate::errors::Error::Query(err)),
                    }
                }
                Err(err) => Err(crate::errors::Error::Query(err)),
            }
        })
    } else {
        Err(crate::errors::Error::GetPool)
    }
}

pub async fn is_table_created() -> Result<(), Error> {
    if let Some(pool) = get_pool() {
        with_conn!(pool, |conn| {
            match users::table.count().get_result::<i64>(&mut conn).await {
                Ok(user_count) => {
                    if user_count > 0 {
                        Ok(())
                    } else {
                        Err(crate::errors::Error::UserNotCreated)
                    }
                }
                Err(err) => Err(crate::errors::Error::Query(err)),
            }
        })
    } else {
        Err(crate::errors::Error::GetPool)
    }
}

pub async fn is_default_user_created() -> Result<(), Error> {
    if let Some(pool) = get_pool() {
        with_conn!(pool, |conn| {
            match users::table.count().get_result::<i64>(&mut conn).await {
                Ok(user_count) => {
                    if user_count > 0 {
                        Ok(())
                    } else {
                        Err(crate::errors::Error::UserNotCreated)
                    }
                }
                Err(err) => Err(crate::errors::Error::Query(err)),
            }
        })
    } else {
        Err(crate::errors::Error::GetPool)
    }
}

pub async fn reset_password(email: String) -> Result<(), Error> {
    if let Some(pool) = get_pool() {
        with_conn!(pool, |conn| {
            match users::table
                .filter(users::dsl::email.eq(email.clone()))
                .select(User::as_select())
                .first(&mut conn)
                .await
                .optional()
            {
                Ok(Some(val)) => {
                    let mut user_repo: Vec<UpdateServer> = Vec::new();
                    if let Some(list_repo) = users_repositories::table
                        .filter(users_repositories::dsl::user_id.eq(val.id))
                        .select(UsersRepositories::as_select())
                        .load(&mut conn)
                        .await
                        .optional()?
                    {
                        let mut repo_platforms: Vec<i32> = Vec::new();
                        let mut list_plugins: Vec<String> = Vec::new();

                        let mut new_repo = UpdateServer {
                            path: "".to_string(),
                            username: "".to_string(),
                            platforms: Vec::new(),
                            plugins: Vec::new(),
                        };
                        for repo in list_repo {
                            match repositories::table
                                .filter(repositories::dsl::name.eq(repo.repository_name.clone()))
                                .select(Repository::as_select())
                                .load(&mut conn)
                                .await
                                .optional()
                            {
                                Ok(Some(repo)) => {
                                    for r in &repo {
                                        let parsed_platforms: Value =
                                            serde_json::from_str(&r.platforms)?;
                                        let parsed_plugins: Value =
                                            serde_json::from_str(&r.plugins)?;
                                        if let Some(list_plug) = parsed_plugins.as_array() {
                                            for list in list_plug {
                                                if let Some(p) = list.as_str() {
                                                    list_plugins.push(p.into());
                                                }
                                            }
                                        }
                                        if let Some(list_platforms) = parsed_platforms.as_array() {
                                            for platform in list_platforms {
                                                if let Some(plat) = platform.as_str() {
                                                    match plat {
                                                        "Win64" => repo_platforms
                                                            .push(Platforms::Win64.into()),
                                                        "Macosx8664" => repo_platforms
                                                            .push(Platforms::MacosX8664.into()),
                                                        "Macosarm64" => repo_platforms
                                                            .push(Platforms::MacosArm64.into()),
                                                        "Linux" => repo_platforms
                                                            .push(Platforms::Linux.into()),
                                                        _ => {}
                                                    }
                                                }
                                            }
                                        }
                                        new_repo = UpdateServer {
                                            path: r.name.clone(),
                                            username: val.username.clone(),
                                            platforms: repo_platforms.clone(),
                                            plugins: list_plugins.clone(),
                                        };
                                        repo_platforms.clear();
                                    }
                                }
                                Ok(None) => {}
                                Err(err) => {
                                    return Err(crate::errors::Error::Query(err));
                                }
                            }
                            user_repo.push(new_repo.clone());
                        }
                    }
                    let repo_string: Vec<String> = user_repo
                        .into_iter()
                        .map(|update_server| update_server.path)
                        .collect();
                    let token = utils::generate_jwt(val.username, val.email.clone(), repo_string)?;
                    if diesel::update(users::table.filter(users::dsl::email.eq(val.email.clone())))
                        .set(users::dsl::reset_token.eq(token))
                        .execute(&mut conn)
                        .await
                        .is_ok()
                    {
                        utils::send_mail(&email, &val.email, "test", "hi");
                        return Ok(());
                    }
                }
                Ok(None) => return Err(crate::errors::Error::EmailNotFound),
                Err(err) => return Err(crate::errors::Error::Query(err)),
            }
            Ok(())
        })
    } else {
        Ok(())
    }
}

pub async fn list_plugin_by_repository(repository_name: String) -> Result<Vec<String>, Error> {
    if let Some(pool) = get_pool() {
        with_conn!(pool, |conn| {
            match repositories::table
                .filter(repositories::dsl::name.eq(&repository_name))
                .select(Repository::as_select())
                .first(&mut conn)
                .await
                .optional()
            {
                Ok(Some(repo)) => {
                    let mut plugins_list: Vec<String> = Vec::new();
                    let parsed_plugins: Value = serde_json::from_str(&repo.plugins)?;
                    if let Some(list_plug) = parsed_plugins.as_array() {
                        for list in list_plug {
                            if let Some(p) = list.as_str() {
                                plugins_list.push(p.into());
                            }
                        }
                    }
                    Ok(plugins_list)
                }
                Ok(None) => Err(crate::errors::Error::RepositoryNotFound(repository_name)),
                Err(err) => Err(crate::errors::Error::Query(err)),
            }
        })
    } else {
        Err(crate::errors::Error::GetPool)
    }
}

pub async fn get_plugin_version(
    plugins_name: Vec<String>,
) -> Result<HashMap<String, String>, Error> {
    if let Some(pool) = get_pool() {
        with_conn!(pool, |conn| {
            match plugins::table
                .filter(plugins::dsl::name.eq_any(plugins_name))
                .select(Plugins::as_select())
                .load(&mut conn)
                .await
                .optional()
            {
                Ok(Some(plugins)) => {
                    let plugin_with_version: HashMap<String, String> = plugins
                        .into_iter()
                        .map(|plug| (plug.name, plug.version))
                        .collect();
                    Ok(plugin_with_version)
                }
                Ok(None) => Ok(HashMap::new()),
                Err(err) => Err(crate::errors::Error::Query(err)),
            }
        })
    } else {
        Err(crate::errors::Error::GetPool)
    }
}

fn login_user(
    username: String,
    stored_password: String,
    password: String,
    email: String,
    repositories: Vec<UpdateServer>,
) -> Result<LucleUser, Error> {
    let parsed_hash = PasswordHash::new(&stored_password)?;
    Argon2::default().verify_password(password.as_bytes(), &parsed_hash)?;
    let repo_string: Vec<String> = repositories
        .clone()
        .into_iter()
        .map(|update_server| update_server.path)
        .collect();
    let token = utils::generate_jwt(username.clone(), email, repo_string)?;
    Ok(LucleUser {
        username,
        token,
        repositories,
    })
}

#[cfg(test)]
mod temp_sqlite_verification {
    use super::*;

    // SyncConnectionWrapper (SQLite) needs a multi-threaded runtime for its
    // internal spawn_blocking calls — the default #[tokio::test] runtime is
    // single-threaded and panics here with "can call blocking only when
    // running on the multi-threaded runtime". main.rs's #[tokio::main] is
    // multi-threaded by default (no flavor override), so production is fine;
    // this only affects this test's own runtime choice.
    #[tokio::test(flavor = "multi_thread")]
    async fn sqlite_end_to_end() {
        let path = std::env::temp_dir().join(format!("lucle_verify_{}.db", std::process::id()));
        let path_str = path.to_str().unwrap().to_string();
        let _ = std::fs::remove_file(&path);

        create_database(&path_str).await.expect("create_database");

        create_user("alice".into(), "hunter2".into(), "alice@example.com".into())
            .await
            .expect("create_user");

        register_update_server("alice".into(), "myrepo".into(), vec![], vec![])
            .await
            .expect("register_update_server (permission = Write)");

        let repos = list_update_server_by_user("alice".into())
            .await
            .expect("list_update_server_by_user");
        assert_eq!(repos, vec!["myrepo".to_string()]);

        is_table_created().await.expect("is_table_created");

        let plugins = get_plugin_version(vec!["nonexistent".into()])
            .await
            .expect("get_plugin_version");
        assert!(plugins.is_empty());

        join_update_server("alice".into(), "otherrepo".into())
            .await
            .expect("join_update_server (permission = Pending)");

        delete_repo("myrepo".into()).await.expect("delete_repo");

        let _ = std::fs::remove_file(&path);
    }
}
