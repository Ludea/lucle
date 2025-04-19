use axum::Router;
use diesel_async::{pooled_connection::deadpool::Pool, AsyncMysqlConnection};
use std::net::SocketAddr;
use std::{fs::File, io::BufReader, path::Path, sync::Arc};
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
                diesel::set_pool(&(format!("mysql://{}:{}/{}", url, port, name)));
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

    let http_addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    let http_listener = tokio::net::TcpListener::bind(http_addr).await.unwrap();
    let grpc_addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    let grpc_listener = tokio::net::TcpListener::bind(grpc_addr).await.unwrap();

    let grpc = rpc::rpc_api(database);
    let http = http::serve_dir();
    //let app = Router::new().merge(grpc).merge(http);

    tracing::info!("gRPC listening on {grpc_addr}");
    tracing::info!("http listening on {http_addr}");
    if let Err(err) = tokio::join!(
        axum::serve(grpc_listener, grpc),
        axum::serve(http_listener, http),
    )
    .0
    {
        tracing::error!("GRPC and HTTP server doesn't start: {err}");
    }
}
