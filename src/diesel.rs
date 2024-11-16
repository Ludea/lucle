use super::query_helper;

use diesel::result;
use diesel::sqlite::SqliteConnection;
use diesel_async::pooled_connection::{deadpool::Pool, AsyncDieselConnectionManager};
use diesel_async::{
    async_connection_wrapper::AsyncConnectionWrapper,
    sync_connection_wrapper::SyncConnectionWrapper,
};
use diesel_async::{AsyncConnection, AsyncMysqlConnection, AsyncPgConnection, RunQueryDsl};
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use once_cell::sync::Lazy;
use url::Url;

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("migrations");

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
                } else {
                    conn = AsyncMysqlConnection::establish(database_url)
                        .await
                        .map_err(|error| crate::errors::Error::Connection {
                            error,
                            url: database_url.to_string(),
                        })?;
                    let mut async_wrapper: AsyncConnectionWrapper<AsyncMysqlConnection> =
                        AsyncConnectionWrapper::from(conn);

                    if let Err(err) = tokio::task::spawn_blocking(move || {
                        if let Err(err) = async_wrapper.run_pending_migrations(MIGRATIONS) {
                            tracing::error!("Unable to run migrations: {}", err);
                            Err(crate::errors::Error::Migration(err))
                        } else {
                            tracing::info!("Running migrations");
                            Ok(())
                        }
                    })
                    .await
                    {
                        tracing::error!("Unable to join task: {} ", err);
                    }
                }
            }
        }
    }

    Ok(())
}

fn change_database_of_url(
    database_url: &str,
    default_database: &str,
) -> Result<(String, String), crate::errors::Error> {
    let base = Url::parse(database_url)?;
    let database = base
        .path_segments()
        .expect("The database url has at least one path segment")
        .last()
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

pub fn create_pool() -> Lazy<Pool<AsyncMysqlConnection>> {
    Lazy::new(|| {
        let config = AsyncDieselConnectionManager::<diesel_async::AsyncMysqlConnection>::new(
            "mysql://mariadb-min.mariadb.svc.cluster.local/lucle",
        );
        Pool::builder(config).build().unwrap()
    })
}
