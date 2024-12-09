use super::schema::{
    repositories,
    sql_types::{RepositoriesPlatformsEnum, UsersRepositoriesPermissionEnum},
    users, users_repositories,
};
use chrono::NaiveDateTime;
use diesel::prelude::*;
use diesel::FromSqlRow;
use diesel::{
    deserialize::{self, FromSql},
    serialize::{self, IsNull, Output, ToSql},
    AsExpression,
};
use serde::{Deserialize, Serialize};
use std::io::Write;

#[derive(Debug, Queryable, Selectable)]
#[diesel(table_name = users)]
#[diesel(check_for_backend(diesel::mysql::Mysql))]
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

#[derive(Insertable)]
#[diesel(table_name = repositories)]
#[diesel(check_for_backend(diesel::mysql::Mysql))]
pub struct Repository {
    pub name: String,
    pub created_at: NaiveDateTime,
    pub platforms: Vec<Platforms>,
}

#[derive(Insertable, Selectable, Queryable, Debug, PartialEq)]
#[diesel(table_name = users_repositories)]
#[diesel(check_for_backend(diesel::mysql::Mysql))]
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

#[derive(Debug, Serialize, Deserialize, FromSqlRow, AsExpression, PartialEq, Clone)]
#[diesel(sql_type = RepositoriesPlatformsEnum)]
pub enum Platforms {
    Win64,
    Macosx8664,
    Macosarm64,
    Linux,
}

impl ToSql<RepositoriesPlatformsEnum, diesel::mysql::Mysql> for Platforms {
    fn to_sql<'b>(&'b self, out: &mut Output<'b, '_, diesel::mysql::Mysql>) -> serialize::Result {
        match *self {
            Platforms::Win64 => out.write_all(b"win64")?,
            Platforms::Macosx8664 => out.write_all(b"macos_x86_64")?,
            Platforms::Macosarm64 => out.write_all(b"macos_arm64")?,
            Platforms::Linux => out.write_all(b"linux")?,
        }
        Ok(IsNull::No)
    }
}

impl FromSql<RepositoriesPlatformsEnum, diesel::mysql::Mysql> for Platforms {
    fn from_sql(bytes: diesel::mysql::MysqlValue) -> deserialize::Result<Self> {
        match bytes.as_bytes() {
            b"win64" => Ok(Platforms::Win64),
            b"macos_x86_64" => Ok(Platforms::Macosx8664),
            b"macos_arm64" => Ok(Platforms::Macosarm64),
            b"linux" => Ok(Platforms::Linux),
            _ => Err("Unrecognized enum variant".into()),
        }
    }
}
