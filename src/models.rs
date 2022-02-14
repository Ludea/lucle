use rocket::serde::{Serialize, Deserialize, json::Json};
use super::schema::users;

#[derive(Debug, Clone, Deserialize, Serialize, Queryable, Insertable)]
#[serde(crate = "rocket::serde")]
#[table_name="users"]
pub struct Users {
    #[serde(skip_deserializing)]
    id: Option<i32>,
    username: String,
    password: String,
    email: String,
    #[serde(skip_deserializing)]
    role: String,
//    #[serde(skip_deserializing)]
    createdat: String,
}
