use rocket::{Rocket, Build};
use rocket::fairing::AdHoc;
use rocket::response::{Debug, status::Created};
use rocket::serde::{Serialize, Deserialize, json::Json};

use rocket_sync_db_pools::diesel;

use self::diesel::prelude::*;
use crate::schema::users;
use crate::models::Users;

#[database("diesel")]
struct Db(diesel::SqliteConnection);

type Result<T, E = Debug<diesel::result::Error>> = std::result::Result<T, E>;

#[derive(Debug, Clone, Deserialize, Serialize, Queryable, Insertable)]
#[serde(crate = "rocket::serde")]
#[table_name="sqlite_master"]
struct Tables {
    name: String,
}

table! {
    sqlite_master (name) {
        name -> VarChar,
    }
}

#[post("/", data = "<user>")]
async fn create(db: Db, user: Json<Users>) -> Result<Created<Json<Users>>> {
//    let current_date = chrono::Utc::today().to_string();
//    post.createdAt = current_date.clone();
    let user_value = user.clone();
    db.run(move |conn| {
        diesel::insert_into(users::table)
            .values(&user_value)
            .execute(conn)
    }).await?;

    Ok(Created::new("/").body(user))
}

#[get("/tables")]
async fn list(db: Db) -> Result<Json<Vec<String>>> {
    let id = db.run(move |conn| {
        sqlite_master::table
            .select(sqlite_master::name)
	    .filter(sqlite_master::name.not_like("\\_\\_%").escape('\\'))
            .filter(sqlite_master::name.not_like("sqlite%"))
           // .filter(sql::<sql_types::Bool>("type='table'"))
            .load(conn)
    }).await?;
      Ok(Json(id))
}

#[get("/table")]
async fn getusers(db: Db) -> Option<Json<Vec<Users>>> { 
    db.run(move |conn| {
        users::table
            .load(conn)
    }).await.map(Json).ok()
}

#[get("/<id>")]
async fn read(db: Db, id: i32) -> Option<Json<Users>> {
    db.run(move |conn| {
        users::table
            .filter(users::id.eq(id))
            .first(conn)
    }).await.map(Json).ok()
}

#[delete("/<id>")]
async fn delete(db: Db, id: i32) -> Result<Option<()>> {
    let affected = db.run(move |conn| {
        diesel::delete(users::table)
            .filter(users::id.eq(id))
            .execute(conn)
    }).await?;

    Ok((affected == 1).then(|| ()))
}

#[delete("/")]
async fn destroy(db: Db) -> Result<()> {
    db.run(move |conn| diesel::delete(users::table).execute(conn)).await?;

    Ok(())
}

async fn run_migrations(rocket: Rocket<Build>) -> Rocket<Build> {
    // This macro from `diesel_migrations` defines an `embedded_migrations`
    // module containing a function named `run` that runs the migrations in the
    // specified directory, initializing the database.
    embed_migrations!("db/diesel/migrations");

    let conn = Db::get_one(&rocket).await.expect("database connection");
    conn.run(|c| embedded_migrations::run(c)).await.expect("diesel migrations");

    rocket
}

pub fn stage() -> AdHoc {
    AdHoc::on_ignite("Diesel SQLite Stage", |rocket| async {
        rocket.attach(Db::fairing())
            .attach(AdHoc::on_ignite("Diesel Migrations", run_migrations))
            .mount("/diesel", routes![list, read, create, delete, destroy, getusers])
    })
}
