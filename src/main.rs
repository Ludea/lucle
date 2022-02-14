#[macro_use] extern crate rocket;
#[macro_use] extern crate rocket_sync_db_pools;
#[macro_use] extern crate diesel_migrations;
#[macro_use] extern crate diesel;

use rocket::{Rocket, Build, Request, Catcher, catcher};
use rocket::response::{Responder, status::Custom};
use rocket::http::{Status, Method};

use rocket::fs::{FileServer, relative};
use rocket::{State};
use rocket::fairing::AdHoc;
use rocket::serde::Deserialize;

use rocket_cors::{AllowedHeaders, AllowedOrigins};

use std::error::Error;
use notify::{RecommendedWatcher, RecursiveMode, Watcher};
use std::path::Path;

mod diesel_sqlite;
mod database;
pub mod models;
pub mod schema;

#[derive(Debug, Deserialize)]
#[serde(crate = "rocket::serde")]
struct AppConfig {
    local: bool,
}
          
#[post("/")]
fn write_config(app_config: &State<AppConfig>) -> String {
  AppConfig {
     local: true,
    };
  format!("{:#?}\n", app_config)
}

fn not_found_handler<'r>(_: Status, req: &'r Request) -> catcher::BoxFuture<'r> {
    let responder = Custom(Status::NotFound, format!("Couldn't find: {}", req.uri()));
    Box::pin(async move { responder.respond_to(req) })
}

#[rocket::main]
async fn main() -> Result<(), Box<dyn Error>> {//Rocket<Build> {
  let not_found_catcher = Catcher::new(404, not_found_handler);
  let allowed_origins = AllowedOrigins::all();

  let cors = rocket_cors::CorsOptions {
        allowed_origins,
        allowed_methods: vec![Method::Get, Method::Delete, Method::Post].into_iter().map(From::from).collect(),
        allowed_headers: AllowedHeaders::some(&["Authorization", "Accept"]),
        allow_credentials: true,
        ..Default::default()
    }
    .to_cors()?;
  

  rocket::build()
        .mount("/api", routes![write_config])
        .mount("/admin", FileServer::from(relative!("web/dist")))
	.mount("/test", FileServer::from(relative!("web/templates/blog/dist")))
	.register("/", vec![not_found_catcher])
	.attach(diesel_sqlite::stage())
	.attach(cors)
	.attach(AdHoc::config::<AppConfig>())
	.launch()
        .await?;

    Ok(())
}

/*#[rocket::main]
async fn main() -> notify::Result<()> {
   let path = Path::new("./Rocket.toml");
   let mut watcher = RecommendedWatcher::new(move |res| {
       match res {
           Ok(event) => println!("event: {:?}", event),
           Err(e) => println!("watch error: {:?}", e),
        }
    })?;
   watcher.watch(path, RecursiveMode::Recursive)?;
    if let Err(e) = rocket().launch().await {
        println!("Whoops! Rocket didn't launch!");
        // We drop the error to get a Rocket-formatted panic.
        drop(e);
    };

    Ok(())
}*/

