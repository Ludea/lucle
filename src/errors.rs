#[derive(thiserror::Error, Debug)]
pub enum Error {
    #[error("Could not connect to database via `{url}`: {error}")]
    Connection {
        error: diesel::ConnectionError,
        url: String,
    },
    #[error("Failed to execute a database query: {0}")]
    Query(#[from] diesel::result::Error),
    #[error("Failed to run migrations: {0}")]
    Migration(Box<dyn std::error::Error + Send + Sync + 'static>),
    #[error("User not found")]
    GetPool,
    #[error("Cannot get Pool")]
    UserNotFound,
    #[error("No user created")]
    UserNotCreated,
    #[error("Email not found")]
    EmailNotFound,
    #[error("Email not valid")]
    EmailNotValid,
    #[error("Io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Failed to encode private key: {0}")]
    Jwt(#[from] jsonwebtoken::errors::Error),
    #[error("Failed to hash password: {0}")]
    Argon2(#[from] argon2::password_hash::Error),
    #[error("Failed to create database connection")]
    Deadpool(#[from] diesel_async::pooled_connection::deadpool::PoolError),
    #[error("Failed to parse database url: {0}")]
    UrlParsing(#[from] url::ParseError),
    #[error("Failed to parse json data")]
    Json(#[from] serde_json::Error),
}
