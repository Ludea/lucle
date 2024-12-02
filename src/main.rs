use diesel_async::pooled_connection::deadpool::Pool;
use diesel_async::AsyncMysqlConnection;
use once_cell::sync::Lazy;
use rustls_pemfile::certs;
use std::path::Path;
use std::{fs::File, io::BufReader, sync::Arc};
use tokio_rustls::rustls::ServerConfig;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod diesel;
mod errors;
mod http;
//#[cfg(any(target_os = "windows", target_os = "linux", target_os = "macos"))]
//mod mail;
pub mod models;
mod query_helper;
mod rpc;
pub mod schema;
mod surreal;
mod user;
mod utils;

pub enum DbType {
    Mysql(Lazy<Pool<AsyncMysqlConnection>>),
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

    let db = match utils::get_config_key("database".to_string()).as_str() {
        "mysql" => DbType::Mysql(diesel::create_pool()),
        "surrealdb" => DbType::Surrealdb(surreal::create_database().await),
        _ => DbType::NoDatabase,
    };

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

    //    #[cfg(any(target_os = "windows", target_os = "linux", target_os = "macos"))]
    //    tokio::spawn(async { mail::start_mail_server().await });

    if let Err(err) = tokio::join!(
        rpc::rpc_api(&mut cert_buf, &mut key_buf, db),
        http::serve_dir()
    )
    .0
    {
        tracing::error!("GRPC and HTTP server doesn't start: {err}");
    }
}
