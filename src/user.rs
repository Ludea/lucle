use crate::errors::Error;
use crate::models::{NewUser, Permission, Repository, User, UsersRepositories};
use crate::rpc::{
    luclerpc::{Platforms, UpdateServer, User as LucleUser},
    Hosts,
};
use crate::schema::{repositories, users, users_repositories};
use crate::utils;
use argon2::{
    self,
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use chrono::NaiveDateTime;
use diesel::prelude::*;
use diesel::select;
use diesel_async::pooled_connection::{deadpool::Pool, AsyncDieselConnectionManager};
use diesel_async::{AsyncMysqlConnection, RunQueryDsl};
use once_cell::sync::Lazy;
use serde_json::Value;

static POOL: Lazy<Pool<AsyncMysqlConnection>> = Lazy::new(|| {
    let config = AsyncDieselConnectionManager::<diesel_async::AsyncMysqlConnection>::new(
        "mysql://root@127.0.0.1:3306/lucle",
        //        "mysql://root@mariadb-min.mariadb.svc.cluster.local/lucle",
    );
    Pool::builder(config).build().unwrap()
});

pub async fn create_user(username: String, password: String, email: String) -> Result<(), Error> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)?
        .to_string();
    let mut conn = POOL.get().await?;
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
}

pub async fn register_update_server(
    username: String,
    repository: String,
    platforms: Vec<Hosts>,
) -> Result<(), Error> {
    let mut conn = POOL.get().await?;
    let now = select(diesel::dsl::now)
        .get_result::<NaiveDateTime>(&mut conn)
        .await?;

    let json_platforms = serde_json::to_string(&platforms).unwrap();
    let repo = Repository {
        name: repository.clone(),
        created_at: now,
        platforms: json_platforms,
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
}

pub async fn list_update_server_by_user(username: String) -> Result<Vec<String>, Error> {
    let mut conn = POOL.get().await?;
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
}

pub async fn join_update_server(username: String, repository: String) -> Result<(), Error> {
    let mut conn = POOL.get().await?;
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
}

pub async fn login(username_or_email: String, password: String) -> Result<LucleUser, Error> {
    let mut conn = POOL.get().await?;
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
                    let mut new_repo = UpdateServer {
                        path: "".to_string(),
                        username: "".to_string(),
                        platforms: Vec::new(),
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
                                        serde_json::from_str(&r.platforms).unwrap();
                                    if let Some(list_platforms) = parsed_platforms.as_array() {
                                        for platform in list_platforms {
                                            if let Some(plat) = platform.as_str() {
                                                match plat {
                                                    "Win64" => {
                                                        repo_platforms.push(Platforms::Win64.into())
                                                    }
                                                    "Macosx8664" => repo_platforms
                                                        .push(Platforms::MacosX8664.into()),
                                                    "Macosarm64" => repo_platforms
                                                        .push(Platforms::MacosArm64.into()),
                                                    "Linux" => {
                                                        repo_platforms.push(Platforms::Linux.into())
                                                    }
                                                    _ => {}
                                                }
                                            }
                                        }
                                        new_repo = UpdateServer {
                                            path: r.name.clone(),
                                            username: val.username.clone(),
                                            platforms: repo_platforms.clone(),
                                        };
                                        repo_platforms.clear();
                                    }
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
                Ok(None) => login_user(val.username, val.password, password, val.email, Vec::new()),
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
                                            match r.platforms.as_str() {
                                                "win64" => {
                                                    repo_platforms.push(Platforms::Win64.into())
                                                }
                                                "macos_x86_64" => repo_platforms
                                                    .push(Platforms::MacosX8664.into()),
                                                "macos_arm64" => repo_platforms
                                                    .push(Platforms::MacosArm64.into()),
                                                "linux" => {
                                                    repo_platforms.push(Platforms::Linux.into())
                                                }
                                                _ => {}
                                            }
                                        }
                                    }
                                    Ok(None) => {}
                                    Err(err) => return Err(crate::errors::Error::Query(err)),
                                }
                                let new_repo = UpdateServer {
                                    path: repo.repository_name,
                                    username: val.username.clone(),
                                    platforms: repo_platforms.clone(),
                                };
                                user_repo.push(new_repo);
                            }
                            login_user(val.username, val.password, password, val.email, user_repo)
                        }
                        Ok(None) => {
                            login_user(val.username, val.password, password, val.email, Vec::new())
                        }
                        Err(err) => Err(crate::errors::Error::Query(err)),
                    }
                }
                Ok(None) => Err(crate::errors::Error::UserNotFound),
                Err(err) => Err(crate::errors::Error::Query(err)),
            }
        }
        Err(err) => Err(crate::errors::Error::Query(err)),
    }
}

pub async fn is_table_and_user_created() -> Result<(), Error> {
    let mut conn = POOL.get().await?;
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
}

pub async fn reset_password(email: String) -> Result<(), Error> {
    let mut conn = POOL.get().await?;
    match users::table
        .filter(users::dsl::email.eq(email.clone()))
        .select(User::as_select())
        .first(&mut conn)
        .await
        .optional()
    {
        Ok(Some(val)) => {
            let token = utils::generate_jwt(val.username, val.email.clone());
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
}

fn login_user(
    username: String,
    stored_password: String,
    password: String,
    email: String,
    repositories: Vec<UpdateServer>,
) -> Result<LucleUser, Error> {
    let parsed_hash = PasswordHash::new(&stored_password).unwrap();
    Argon2::default().verify_password(password.as_bytes(), &parsed_hash)?;
    let token = utils::generate_jwt(username.clone(), email);
    Ok(LucleUser {
        username,
        token,
        repositories,
    })
}
