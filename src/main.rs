use axum::Router;
use diesel_async::{pooled_connection::deadpool::Pool, AsyncMysqlConnection};
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod diesel;
mod errors;
mod http;
pub mod models;
#[cfg(any(target_os = "linux", target_os = "windows", target_os = "macos"))]
mod plugins;
mod query_helper;
mod rpc;
pub mod schema;
mod utils;

pub enum DbType {
    Mysql(Pool<AsyncMysqlConnection>),
    Surrealdb(),
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
                diesel::set_pool(&(format!("mysql://{user}:{password}@{url}:{port}/{name}")));
                if let Some(pool) = diesel::get_pool() {
                    DbType::Mysql(pool)
                } else {
                    tracing::error!("Unable to get pool connection");
                    DbType::NoDatabase
                }
            }
            "surrealdb" => DbType::Surrealdb(),
            _ => DbType::NoDatabase,
        };
    }

    let addr = SocketAddr::from(([0, 0, 0, 0], 8112));
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();

    let cors_layer = CorsLayer::new()
        .allow_origin(Any)
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
