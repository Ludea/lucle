use super::schema::{
    plugins, repositories, sql_types::UsersRepositoriesPermissionEnum, users, users_repositories,
};
use chrono::NaiveDateTime;
use diesel::prelude::*;
use diesel::FromSqlRow;
use diesel::{
    deserialize::{self, FromSql},
    serialize::{self, IsNull, Output, ToSql},
    AsExpression,
};
use std::io::Write;

#[derive(Debug, Queryable, Selectable)]
#[diesel(table_name = users)]
#[diesel(check_for_backend(diesel::mysql::Mysql, diesel::sqlite::Sqlite, diesel::pg::Pg))]
pub struct User {
    pub id: i32,
    pub username: String,
    pub password: String,
    pub email: String,
    pub created_at: NaiveDateTime,
    pub modified_at: NaiveDateTime,
    pub reset_token: Option<String>,
}

#[derive(Insertable)]
#[diesel(table_name = users)]
pub struct NewUser {
    pub username: String,
    pub password: String,
    pub email: String,
    pub created_at: NaiveDateTime,
    pub modified_at: NaiveDateTime,
}

#[derive(Insertable, Selectable, Queryable, Debug, PartialEq)]
#[diesel(table_name = repositories)]
#[diesel(check_for_backend(diesel::mysql::Mysql, diesel::sqlite::Sqlite, diesel::pg::Pg))]
pub struct Repository {
    pub id: i32,
    pub name: String,
    pub created_at: NaiveDateTime,
    pub platforms: String,
    pub plugins: String,
}

#[derive(Insertable)]
#[diesel(table_name = repositories)]
pub struct NewRepository {
    pub name: String,
    pub created_at: NaiveDateTime,
    pub platforms: String,
    pub plugins: String,
}

#[derive(Insertable, Selectable, Queryable, Debug, PartialEq)]
#[diesel(table_name = users_repositories)]
#[diesel(check_for_backend(diesel::mysql::Mysql, diesel::sqlite::Sqlite, diesel::pg::Pg))]
pub struct UsersRepositories {
    pub user_id: i32,
    pub repository_name: String,
    pub permission: Permission,
}

#[derive(Debug, FromSqlRow, AsExpression, PartialEq, Clone)]
#[diesel(sql_type = UsersRepositoriesPermissionEnum)]
pub enum Permission {
    Write,
    Read,
    Pending,
}

impl ToSql<UsersRepositoriesPermissionEnum, diesel::mysql::Mysql> for Permission {
    fn to_sql<'b>(&'b self, out: &mut Output<'b, '_, diesel::mysql::Mysql>) -> serialize::Result {
        match *self {
            Permission::Read => out.write_all(b"read")?,
            Permission::Write => out.write_all(b"write")?,
            Permission::Pending => out.write_all(b"pending")?,
        }
        Ok(IsNull::No)
    }
}

impl FromSql<UsersRepositoriesPermissionEnum, diesel::mysql::Mysql> for Permission {
    fn from_sql(bytes: diesel::mysql::MysqlValue) -> deserialize::Result<Self> {
        match bytes.as_bytes() {
            b"read" => Ok(Permission::Read),
            b"write" => Ok(Permission::Write),
            b"pending" => Ok(Permission::Pending),
            _ => Err("Unrecognized enum variant".into()),
        }
    }
}

// SQLite has no native enum type — UsersRepositoriesPermissionEnum maps to
// Text there (see schema.rs's sqlite_type annotation), so this stores the
// same lowercase strings as the MySQL native enum does.
impl ToSql<UsersRepositoriesPermissionEnum, diesel::sqlite::Sqlite> for Permission {
    fn to_sql<'b>(&'b self, out: &mut Output<'b, '_, diesel::sqlite::Sqlite>) -> serialize::Result {
        let value = match *self {
            Permission::Read => "read",
            Permission::Write => "write",
            Permission::Pending => "pending",
        };
        out.set_value(value);
        Ok(IsNull::No)
    }
}

impl FromSql<UsersRepositoriesPermissionEnum, diesel::sqlite::Sqlite> for Permission {
    fn from_sql(value: diesel::sqlite::SqliteValue<'_, '_, '_>) -> deserialize::Result<Self> {
        match <String as FromSql<diesel::sql_types::Text, diesel::sqlite::Sqlite>>::from_sql(value)?
            .as_str()
        {
            "read" => Ok(Permission::Read),
            "write" => Ok(Permission::Write),
            "pending" => Ok(Permission::Pending),
            _ => Err("Unrecognized enum variant".into()),
        }
    }
}

// PostgreSQL path, same Text-backed approach as SQLite above. NOT verified
// against a live PostgreSQL server in this environment (no server available
// to test against) — compiles and mirrors the SQLite impl exactly, but
// please test this against a real Postgres instance before relying on it.
impl ToSql<UsersRepositoriesPermissionEnum, diesel::pg::Pg> for Permission {
    fn to_sql<'b>(&'b self, out: &mut Output<'b, '_, diesel::pg::Pg>) -> serialize::Result {
        let value = match *self {
            Permission::Read => "read",
            Permission::Write => "write",
            Permission::Pending => "pending",
        };
        <str as ToSql<diesel::sql_types::Text, diesel::pg::Pg>>::to_sql(value, out)
    }
}

impl FromSql<UsersRepositoriesPermissionEnum, diesel::pg::Pg> for Permission {
    fn from_sql(value: diesel::pg::PgValue<'_>) -> deserialize::Result<Self> {
        match <String as FromSql<diesel::sql_types::Text, diesel::pg::Pg>>::from_sql(value)?
            .as_str()
        {
            "read" => Ok(Permission::Read),
            "write" => Ok(Permission::Write),
            "pending" => Ok(Permission::Pending),
            _ => Err("Unrecognized enum variant".into()),
        }
    }
}

#[derive(Insertable, Selectable, Queryable, Debug, PartialEq)]
#[diesel(table_name = plugins)]
#[diesel(check_for_backend(diesel::mysql::Mysql, diesel::sqlite::Sqlite, diesel::pg::Pg))]
pub struct Plugins {
    pub id: i32,
    pub name: String,
    pub version: String,
}

#[derive(Insertable)]
#[diesel(table_name = plugins)]
pub struct NewPlugins {
    pub name: String,
    pub version: String,
}
