use super::diesel;
use super::surreal;
use super::utils;
use crate::DbType;
use email_address_parser::EmailAddress;
use luclerpc::{
    lucle_server::{Lucle, LucleServer},
    Credentials, Database, DatabaseType, Empty, ListUpdateServer, Message, Platforms,
    ResetPassword, UpdateServer, User, UserCreation, Username,
};
use serde::{Deserialize, Serialize};
use std::pin::Pin;
use std::{error::Error, fs::File, io::BufReader, io::ErrorKind};
use tokio::sync::mpsc;
use tokio_stream::{wrappers::ReceiverStream, Stream, StreamExt};
use tonic::{
    service::{AxumRouter, Routes, RoutesBuilder},
    Request, Response, Status, Streaming,
};
use tonic_web::GrpcWebLayer;
use tower_http::cors::{Any, CorsLayer};

pub mod luclerpc {
    tonic::include_proto!("luclerpc");
}

#[derive(Serialize, Deserialize)]
pub enum Hosts {
    Win64,
    Macosx8664,
    Macosarm64,
    Linux,
}

type ResponseStream = Pin<Box<dyn Stream<Item = Result<Message, Status>> + Send>>;
type StreamResult<T> = Result<Response<T>, Status>;

fn match_for_io_error(err_status: &Status) -> Option<&std::io::Error> {
    let mut err: &(dyn Error + 'static) = err_status;

    loop {
        if let Some(io_err) = err.downcast_ref::<std::io::Error>() {
            return Some(io_err);
        }

        if let Some(h2_err) = err.downcast_ref::<h2::Error>() {
            if let Some(io_err) = h2_err.get_io() {
                return Some(io_err);
            }
        }

        err = err.source()?;
    }
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
                if let Err(err) = surreal::create_database().await {
                    tracing::error!("Unable to create database : {}", err);
                    return Err(Status::internal(err.to_string()));
                }
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
        match diesel::is_table_and_user_created().await {
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

    type ServerStreamingEchoStream = ResponseStream;

    async fn server_streaming_echo(
        &self,
        req: Request<Streaming<Empty>>,
    ) -> StreamResult<Self::ServerStreamingEchoStream> {
        tracing::info!("client connected from {:?}", req.remote_addr().unwrap());

        let message = Message {
            plugin: "allo".to_string(),
        };

        let mut in_stream = req.into_inner();
        let (tx, rx) = mpsc::channel(128);

        tokio::spawn(async move {
            while let Some(result) = in_stream.next().await {
                match result {
                    Ok(_) => tx
                        .send(Result::<_, Status>::Ok(message.clone()))
                        .await
                        .expect("working rx"),
                    Err(err) => {
                        if let Some(io_err) = match_for_io_error(&err) {
                            if io_err.kind() == ErrorKind::BrokenPipe {
                                tracing::error!("client disconnected: broken pipe");
                                break;
                            }
                        }
                        match tx.send(Err(err)).await {
                            Ok(_) => (),
                            Err(_err) => break,
                        }
                    }
                }
            }
            tracing::info!("stream ended");
        });

        let output_stream = ReceiverStream::new(rx);
        Ok(Response::new(
            Box::pin(output_stream) as Self::ServerStreamingEchoStream
        ))
    }
}

pub fn rpc_api(_db: DbType) -> AxumRouter {
    let api = LucleApi::default();
    let api = LucleServer::new(api);

    let mut routes = RoutesBuilder::default();
    routes.add_service(api);

    let cors_layer = CorsLayer::new()
        .allow_origin(Any)
        .allow_headers(Any)
        .expose_headers(Any);

    routes
        .routes()
        .into_axum_router()
        .layer(GrpcWebLayer::new())
        .layer(cors_layer)
}
