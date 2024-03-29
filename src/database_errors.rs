use diesel::result;
use std::error::Error;
use std::path::PathBuf;
use std::{fmt, io};

use self::DatabaseError::*;

pub type DatabaseResult<T> = Result<T, DatabaseError>;

#[derive(Debug)]
pub enum DatabaseError {
    ProjectRootNotFound(PathBuf),
    IoError(io::Error),
    QueryError(result::Error),
    ConnectionError(result::ConnectionError),
    MigrationError(Box<dyn Error + Send + Sync + 'static>),
    UserNotFound,
    NotAuthorized,
    Argon2Error(argon2::password_hash::Error),
}

impl From<io::Error> for DatabaseError {
    fn from(e: io::Error) -> Self {
        IoError(e)
    }
}

impl From<result::Error> for DatabaseError {
    fn from(e: result::Error) -> Self {
        QueryError(e)
    }
}

impl From<result::ConnectionError> for DatabaseError {
    fn from(e: result::ConnectionError) -> Self {
        ConnectionError(e)
    }
}

impl From<Box<dyn Error + Send + Sync + 'static>> for DatabaseError {
    fn from(e: Box<dyn Error + Send + Sync + 'static>) -> Self {
        MigrationError(e)
    }
}

impl From<argon2::password_hash::Error> for DatabaseError {
    fn from(e: argon2::password_hash::Error) -> Self {
        Argon2Error(e)
    }
}

impl Error for DatabaseError {}

impl fmt::Display for DatabaseError {
    fn fmt(&self, f: &mut fmt::Formatter) -> Result<(), fmt::Error> {
        match *self {
            ProjectRootNotFound(ref p) => {
                write!(
                    f,
                    "Unable to find diesel.toml or Cargo.toml in {:?} or any parent directories.",
                    p
                )
            }
            IoError(ref error) => f.write_str(
                &error
                    .source()
                    .map(ToString::to_string)
                    .unwrap_or_else(|| error.to_string()),
            ),
            QueryError(ref error) => f.write_str(
                &error
                    .source()
                    .map(ToString::to_string)
                    .unwrap_or_else(|| error.to_string()),
            ),
            ConnectionError(ref error) => f.write_str(
                &error
                    .source()
                    .map(ToString::to_string)
                    .unwrap_or_else(|| error.to_string()),
            ),
            MigrationError(ref error) => {
                write!(f, "Failed to run migrations: {}", error)
            }
            UserNotFound => write!(f, "User not found"),
            NotAuthorized => write!(f, "You haven't the right role to access here"),
            Argon2Error(ref error) => write!(f, "{}", error),
        }
    }
}

impl PartialEq for DatabaseError {
    fn eq(&self, other: &Self) -> bool {
        matches!(
            (self, other),
            (&ProjectRootNotFound(_), &ProjectRootNotFound(_))
        )
    }
}
