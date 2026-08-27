use axum::Router;
use dotenvy::dotenv;
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod diesel;
mod errors;
mod http;
pub mod models;
mod plugin_db;
#[cfg(any(target_os = "linux", target_os = "windows", target_os = "macos"))]
mod plugins;
mod query_helper;
mod rpc;
pub mod schema;
mod utils;

// rpc::rpc_api() takes this but doesn't currently read it (its param is
// `_db`) — the real source of truth for "is a database available" is
// diesel::get_pool(), populated below. Kept as a marker rather than removed
// outright since rpc_api()'s signature already expects it.
pub enum DbType {
    Mysql,
    Postgresql,
    Sqlite,
    Surrealdb,
    NoDatabase,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .with(
            tracing_subscriber::fmt::layer()
                .pretty()
                .with_writer(std::io::stdout)
                .with_target(false)
                .with_ansi(true)
                .with_line_number(false)
                .with_file(false),
        )
        .init();

    dotenv().ok();
    if utils::has_jwt_private_key().is_none() {
        tracing::error!("JWT_PKEY not configured. You have to create an .env file or set JWT_PKEY environnement variable");
    }
    if let Err(err) = utils::create_config_file() {
        tracing::error!("{}", err);
    }

    #[cfg(any(target_os = "linux", target_os = "windows", target_os = "macos"))]
    if let Err(err) = plugins::load_wasm_runtime().await {
        tracing::error!("{}", err);
    }

    let mut database: DbType = DbType::NoDatabase;
    if let Some(db) = utils::get_config_key("database", "type") {
        database = match db.as_str() {
            "mysql" => {
                let url = utils::get_config_key("database", "url").unwrap();
                let port = utils::get_config_key("database", "port").unwrap();
                let name = utils::get_config_key("database", "name").unwrap();
                let user = utils::get_config_key("database", "user").unwrap();
                let password = utils::get_config_key("database", "password").unwrap();
                diesel::set_pool(
                    &diesel::Backend::Mysql,
                    &format!("mysql://{user}:{password}@{url}:{port}/{name}"),
                );
                if diesel::get_pool().is_some() {
                    DbType::Mysql
                } else {
                    tracing::error!("Unable to get pool connection");
                    DbType::NoDatabase
                }
            }
            "postgresql" => {
                let url = utils::get_config_key("database", "url").unwrap();
                let port = utils::get_config_key("database", "port").unwrap();
                let name = utils::get_config_key("database", "name").unwrap();
                let user = utils::get_config_key("database", "user").unwrap();
                let password = utils::get_config_key("database", "password").unwrap();
                diesel::set_pool(
                    &diesel::Backend::Pg,
                    &format!("postgres://{user}:{password}@{url}:{port}/{name}"),
                );
                if diesel::get_pool().is_some() {
                    DbType::Postgresql
                } else {
                    tracing::error!("Unable to get pool connection");
                    DbType::NoDatabase
                }
            }
            "sqlite" => {
                let path = utils::get_config_key("database", "path").unwrap();
                diesel::set_pool(&diesel::Backend::Sqlite, &path);
                if diesel::get_pool().is_some() {
                    DbType::Sqlite
                } else {
                    tracing::error!("Unable to get pool connection");
                    DbType::NoDatabase
                }
            }
            "surrealdb" => DbType::Surrealdb,
            _ => DbType::NoDatabase,
        };
    }

    let addr = SocketAddr::from(([0, 0, 0, 0], 8112));
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();

    let cors_layer = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any)
        .expose_headers(Any);

    let grpc = rpc::rpc_api(database);
    let http = http::serve_dir();
    let app = Router::new().merge(grpc).merge(http).layer(cors_layer);

    tracing::info!("http and gRPC server listening on {addr}");

    if let Err(err) = axum::serve(listener, app).await {
        tracing::error!("Cannot start server: {err}");
    }
}
