use super::diesel;
use super::utils;
use crate::DbType;
use email_address_parser::EmailAddress;
use luclerpc::{
    lucle_server::{Lucle, LucleServer},
    Credentials, Database, DatabaseType, Empty, ListUpdateServer, Platforms, Plugin, ResetPassword,
    UpdateServer, User, UserCreation, Username,
};
use serde::{Deserialize, Serialize};
use sparus::{
    event_server::{Event, EventServer},
    Empty as EmptyMessage, Message,
};

use std::{
    fs::{self, File},
    io::{BufReader, Cursor},
    pin::Pin,
};
use tokio::sync::mpsc;
use tokio_stream::{wrappers::ReceiverStream, Stream};
use tonic::{
    service::{AxumRouter, RoutesBuilder},
    Request, Response, Status,
};
use tonic_web::GrpcWebLayer;
use tower_http::cors::{Any, CorsLayer};
use wasmsign2::PublicKey;

pub mod luclerpc {
    tonic::include_proto!("luclerpc");
}

pub mod sparus {
    tonic::include_proto!("sparus");
}

#[derive(Serialize, Deserialize)]
pub enum Hosts {
    Win64,
    Macosx8664,
    Macosarm64,
    Linux,
}

#[derive(Default)]
pub struct LucleApi {}

#[tonic::async_trait]
impl Lucle for LucleApi {
    async fn create_db(&self, request: Request<Database>) -> Result<Response<Empty>, Status> {
        let inner = request.into_inner();
        let db_type = inner.db_type;
        let db_name = inner.clone().db_name.unwrap_or("lucle".to_string());
        match DatabaseType::try_from(db_type) {
            Ok(DatabaseType::Sqlite) => {
                if let Err(err) = diesel::create_database("lucle.db").await {
                    tracing::error!("Unable to create database : {}", err);
                    return Err(Status::internal(err.to_string()));
                }
            }
            Ok(DatabaseType::Mysql) => {
                utils::set_config_key("database", "type", "mysql");
                if let Some(db_connection) = inner.db_connection {
                    let db_url = &("mysql://".to_owned()
                        + &db_connection.username
                        + ":"
                        + &db_connection.password
                        + "@"
                        + &db_connection.hostname
                        + ":"
                        + &db_connection.port.to_string()
                        + "/"
                        + &db_name);
                    utils::set_config_key("database", "url", &db_connection.hostname);
                    utils::set_config_key("database", "port", &db_connection.port.to_string());
                    utils::set_config_key("database", "name", &db_name);
                    utils::set_config_key("database", "user", &db_connection.username);
                    utils::set_config_key("database", "password", &db_connection.password);

                    if let Err(err) = diesel::create_database(db_url).await {
                        tracing::error!("Unable to create database : {}", err);
                        return Err(Status::internal(err.to_string()));
                    }
                    diesel::set_pool(db_url);
                }
            }
            Ok(DatabaseType::Postgresql) => {
                if let Err(err) = diesel::create_database("postgres://").await {
                    tracing::error!("Unable to create database : {}", err);
                    return Err(Status::internal(err.to_string()));
                }
            }
            Ok(DatabaseType::Surrealdb) => {
                tracing::error!(
                    "Unable to create SurrealDb database, it's currently not supported"
                );
                return Err(Status::internal("Database not supported".to_string()));
            }
            _ => {}
        }

        let reply = Empty {};
        Ok(Response::new(reply))
    }

    async fn create_user(&self, request: Request<UserCreation>) -> Result<Response<Empty>, Status> {
        let inner = request.into_inner();
        let username = inner.username;
        let password = inner.password;
        let email = inner.email;
        let reply = Empty {};
        if EmailAddress::is_valid(&email.clone(), None) {
            match diesel::create_user(username.clone(), password, email).await {
                Ok(()) => {
                    tracing::info!("user {} created", username);
                    return Ok(Response::new(reply));
                }
                Err(err) => {
                    tracing::error!("{}", err);
                    return Err(Status::internal(err.to_string()));
                }
            }
        } else {
            tracing::error!("Email is not valid");
            return Err(Status::internal(
                crate::errors::Error::EmailNotValid.to_string(),
            ));
        }
    }

    async fn register_update_server(
        &self,
        request: Request<UpdateServer>,
    ) -> Result<Response<Empty>, Status> {
        let inner = request.into_inner();
        let platforms = inner.platforms;
        let path = inner.path;
        let username = inner.username;
        let reply = Empty {};

        let mut db_platforms = Vec::new();
        for host in platforms {
            match Platforms::try_from(host) {
                Ok(Platforms::Win64) => db_platforms.push(Hosts::Win64),
                Ok(Platforms::MacosX8664) => db_platforms.push(Hosts::Macosx8664),
                Ok(Platforms::MacosArm64) => db_platforms.push(Hosts::Macosarm64),
                Ok(Platforms::Linux) => db_platforms.push(Hosts::Linux),
                _ => {}
            }
        }

        match diesel::register_update_server(username.clone(), path.clone(), db_platforms).await {
            Ok(()) => {
                tracing::info!("User {} created {} repository", username, path);
                return Ok(Response::new(reply));
            }
            Err(err) => {
                tracing::error!("{}", err);
                return Err(Status::internal(err.to_string()));
            }
        };
    }

    async fn join_update_server(
        &self,
        request: Request<UpdateServer>,
    ) -> Result<Response<Empty>, Status> {
        let inner = request.into_inner();
        let path = inner.path;
        let username = inner.username;
        let reply = Empty {};

        match diesel::join_update_server(username.clone(), path.clone()).await {
            Ok(()) => {
                tracing::info!("User {} ask to join {} repository", username, path);
                return Ok(Response::new(reply));
            }
            Err(err) => {
                tracing::error!("{}", err);
                return Err(Status::internal(err.to_string()));
            }
        };
    }

    async fn list_update_server_by_user(
        &self,
        request: Request<Username>,
    ) -> Result<Response<ListUpdateServer>, Status> {
        let inner = request.into_inner();
        let username = inner.username;
        match diesel::list_update_server_by_user(username).await {
            Ok(list) => {
                let reply = ListUpdateServer { repositories: list };
                Ok(Response::new(reply))
            }
            Err(err) => {
                tracing::error!("{}", err);
                return Err(Status::internal(err.to_string()));
            }
        }
    }

    async fn login(&self, request: Request<Credentials>) -> Result<Response<User>, Status> {
        let inner = request.into_inner();
        let username_or_email = inner.username_or_email;
        let password = inner.password;
        match diesel::login(username_or_email, password).await {
            Ok(user) => Ok(Response::new(user)),
            Err(err) => {
                tracing::error!("{}", err);
                return Err(Status::internal(err.to_string()));
            }
        }
    }

    async fn is_database_created(
        &self,
        _request: Request<Empty>,
    ) -> Result<Response<Empty>, Status> {
        let reply = Empty {};
        match diesel::is_table_created().await {
            Ok(()) => Ok(Response::new(reply)),
            Err(err) => {
                tracing::error!("{}", err);
                Err(Status::internal(err.to_string()))
            }
        }
    }

    async fn delete_repo(&self, request: Request<UpdateServer>) -> Result<Response<Empty>, Status> {
        let reply = Empty {};
        let inner = request.into_inner();
        let path = inner.path;

        match diesel::delete_repo(path.clone()).await {
            Ok(()) => {
                tracing::info!("Repo {} deleted", path);
                Ok(Response::new(reply))
            }
            Err(err) => {
                tracing::error!("{}", err);
                Err(Status::internal(err.to_string()))
            }
        }
    }

    async fn forgot_password(
        &self,
        request: Request<ResetPassword>,
    ) -> Result<Response<Empty>, Status> {
        let inner = request.into_inner();
        let email = inner.email;
        let reply = Empty {};
        if EmailAddress::is_valid(email.as_str(), None) {
            if let Err(err) = diesel::reset_password(email).await {
                tracing::error!("{}", err);
                return Err(Status::internal(err.to_string()));
            }
        }
        Ok(Response::new(reply))
    }

    async fn get_plugins(&self, request: Request<Plugin>) -> Result<Response<Empty>, Status> {
        let name = request.into_inner().name;
        match reqwest::get(format!("http://127.0.0.1:8012/plugins/{name}")).await {
            Ok(res) => {
                let file_name = format!("{name}.wasm");
                let public_key = PublicKey::from_file("pk_file").unwrap();

                match res.bytes().await {
                    Err(err) => {
                        tracing::error!("Error reading response: {err}");
                        return Err(Status::internal(err.to_string()));
                    }
                    Ok(bytes) => {
                        let cursor = Cursor::new(bytes.clone());
                        let mut reader = BufReader::new(cursor);

                        if let Err(err) = public_key.verify(&mut reader, None) {
                            tracing::error!("Error during plugins verification: {err}");
                            return Err(Status::internal(err.to_string()));
                        }

                        if let Err(err) = File::create(&file_name) {
                            tracing::error!("Error on saving plugins: {err}");
                            return Err(Status::internal(err.to_string()));
                        }

                        if let Err(err) = fs::write(&file_name, &bytes) {
                            tracing::error!("Error on writing plugins data: {err}");
                            return Err(Status::internal(err.to_string()));
                        }
                    }
                }
            }
            Err(err) => return Err(Status::not_found(err.to_string())),
        }
        let reply = Empty {};
        Ok(Response::new(reply))
    }
}
type SparusResult<T> = Result<Response<T>, Status>;
type ResponseStream = Pin<Box<dyn Stream<Item = Result<Message, Status>> + Send>>;

#[derive(Default)]
pub struct EventRoute {}

#[tonic::async_trait]
impl Event for EventRoute {
    type SparusStream = ResponseStream;

    async fn sparus(&self, req: Request<EmptyMessage>) -> SparusResult<Self::SparusStream> {
        let (tx, rx) = mpsc::channel(128);

        let output_stream = ReceiverStream::new(rx);
        Ok(Response::new(Box::pin(output_stream) as Self::SparusStream))
    }
}

pub fn rpc_api(_db: DbType) -> AxumRouter {
    let api = LucleApi::default();
    let api = LucleServer::new(api);

    let event_route = EventRoute::default();
    let event_route = EventServer::new(event_route);

    let mut routes = RoutesBuilder::default();
    routes.add_service(api);
    routes.add_service(event_route);

    let cors_layer = CorsLayer::new()
        .allow_origin(Any)
        .allow_headers(Any)
        .expose_headers(Any);

    routes
        .routes()
        .into_axum_router()
        .reset_fallback()
        .layer(GrpcWebLayer::new())
        .layer(cors_layer)
}
