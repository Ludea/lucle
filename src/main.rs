use axum::Router;
use diesel_async::{pooled_connection::deadpool::Pool, AsyncMysqlConnection};
use rustls_pemfile::certs;
use std::net::SocketAddr;
use std::{fs::File, io::BufReader, path::Path, sync::Arc};
use tokio_rustls::rustls::ServerConfig;
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
mod surreal;
mod utils;

pub enum DbType {
    Mysql(Pool<AsyncMysqlConnection>),
    Surrealdb(surrealdb::Result<()>),
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
    if let Some(db) = utils::get_config_key("database", "name") {
        database = match db.as_str() {
            "mysql" => {
                let url = utils::get_config_key("database", "url").unwrap();
                diesel::set_pool(&url);
                if let Some(pool) = diesel::get_pool() {
                    DbType::Mysql(pool)
                } else {
                    tracing::error!("Unable to get pool connection");
                    DbType::NoDatabase
                }
            }
            "surrealdb" => DbType::Surrealdb(surreal::create_database().await),
            _ => DbType::NoDatabase,
        };
    }

    if !Path::new(".tls/ca_cert.pem").exists()
        || !Path::new(".tls/server_cert.pem").exists()
        || !Path::new(".tls/server_private_key.pem").exists()
    {
        let pki = Arc::new(utils::Pki::new());

        if let Err(err) = std::fs::create_dir_all(".tls") {
            tracing::error!("{}", err);
        }
        if let Err(err) = utils::write_pem(".tls/ca_cert.pem", &pki.ca_cert.cert.pem()) {
            tracing::error!("{}", err);
        }
        if let Err(err) = utils::write_pem(".tls/server_cert.pem", &pki.server_cert.cert.pem()) {
            tracing::error!("{}", err);
        }
        if let Err(err) = utils::write_pem(
            ".tls/server_private_key.pem",
            &pki.server_cert.key_pair.serialize_pem(),
        ) {
            tracing::error!("{}", err);
        }
    }

    let cert_file = File::open(".tls/server_cert.pem").unwrap();
    let mut cert_buf = BufReader::new(cert_file);
    let certs = certs(&mut cert_buf).map(|result| result.unwrap()).collect();

    let key_file = File::open(".tls/server_private_key.pem").unwrap();
    let mut key_buf = BufReader::new(key_file);
    let private_key = rustls_pemfile::private_key(&mut key_buf).unwrap().unwrap();

    ServerConfig::builder()
        .with_no_client_auth()
        .with_single_cert(certs, private_key)
        .unwrap();

    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();

    let grpc = rpc::rpc_api(&mut cert_buf, &mut key_buf, database);
    let http = http::serve_dir();
    let app = Router::new().merge(grpc).merge(http);

    tracing::info!("gRPC and http server listening on {addr}");
    axum::serve(listener, app).await.unwrap();
}
