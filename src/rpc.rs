use super::diesel;
use super::utils;
use crate::DbType;
use dotenvy::dotenv;
use email_address_parser::EmailAddress;
use luclerpc::{
    lucle_server::{Lucle, LucleServer},
    Credentials, Database, DatabaseType, Empty, ListUpdateServer, Platforms, Plugin, ResetPassword,
    UpdateServer, User, UserCreation, Username,
};
use octocrab::Octocrab;
use semver::Version;
use serde::{Deserialize, Serialize};
use serde_json::json;
use sparus::{
    event_server::{Event, EventServer},
    Empty as EmptySparus, Message, Options, Plugins,
};
use std::collections::HashSet;
use std::{
    collections::HashMap,
    fs::{self, File},
    io::{BufReader, Cursor},
    pin::Pin,
    sync::{
        atomic::{AtomicU64, Ordering},
        Arc,
    },
};
use tokio::{
    sync::{mpsc, Mutex},
    time::{sleep, Duration},
};
use tokio_stream::{wrappers::ReceiverStream, Stream};
use tonic::{
    service::{AxumRouter, RoutesBuilder},
    Request, Response, Status,
};
use tonic_web::GrpcWebLayer;
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
                // create_database() creates the file, but there's no connection
                // pool implementation for SQLite yet (POOL is hardcoded to
                // AsyncMysqlConnection) — every request after this would fail
                // with "Cannot get Pool" while the client believes install
                // succeeded (#140). Fail loudly instead, same as Surrealdb.
                tracing::error!("Unable to create Sqlite database, it's currently not supported");
                return Err(Status::internal("Database not supported".to_string()));
            }
            Ok(DatabaseType::Mysql) => {
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

                    if let Err(err) = diesel::create_database(db_url).await {
                        tracing::error!("Unable to create database : {}", err);
                        return Err(Status::internal(err.to_string()));
                    }
                    diesel::set_pool(db_url);
                    utils::set_config_key("database", "type", "mysql");
                    utils::set_config_key("database", "url", &db_connection.hostname);
                    utils::set_config_key("database", "port", &db_connection.port.to_string());
                    utils::set_config_key("database", "name", &db_name);
                    utils::set_config_key("database", "user", &db_connection.username);
                    utils::set_config_key("database", "password", &db_connection.password);
                } else {
                    return Err(Status::invalid_argument(
                        "Missing MySQL connection information",
                    ));
                }
            }
            Ok(DatabaseType::Postgresql) => {
                // Same problem as Sqlite above (no pool implementation for
                // AsyncPgConnection), plus this call was passing the literal
                // string "postgres://" instead of a URL built from
                // inner.db_connection, so database creation itself was never
                // going to succeed either. Fail loudly instead of pretending.
                tracing::error!(
                    "Unable to create PostgreSQL database, it's currently not supported"
                );
                return Err(Status::internal("Database not supported".to_string()));
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
        let list_plugins = inner.plugins;
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

        match diesel::register_update_server(
            username.clone(),
            path.clone(),
            db_platforms,
            list_plugins,
        )
        .await
        {
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

    async fn is_default_user_created(
        &self,
        _request: Request<Empty>,
    ) -> Result<Response<Empty>, Status> {
        let reply = Empty {};
        match diesel::is_default_user_created().await {
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
static CLIENT_ID: AtomicU64 = AtomicU64::new(0);

type ClientId = u64;
type ClientRegistry = Arc<Mutex<HashMap<ClientId, mpsc::Sender<Result<Message, Status>>>>>;

pub struct EventRoute {
    clients: ClientRegistry,
}

impl EventRoute {
    pub fn new() -> Self {
        Self {
            clients: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

#[tonic::async_trait]
impl Event for EventRoute {
    async fn create_workflow(
        &self,
        req: Request<Options>,
    ) -> Result<Response<EmptySparus>, Status> {
        let inner = req.into_inner();
        let launcher_name = inner.launcher_name;
        let repository_name = inner.repository_name;
        let game_name = inner.game_name;
        let speedupdate_server_url = inner.speedupdate_server_url;
        let plugins_url = inner.plugins_url;
        let config_file = inner.config_file;
        let json_config = json!({"game_name":game_name, "repository_url": speedupdate_server_url, "plugins_url": plugins_url});

        dotenv().ok();
        let octocrab;

        if let Ok(pat) = std::env::var("GH_PAT") {
            octocrab = match Octocrab::builder().personal_token(pat).build() {
                Ok(octo) => octo,
                Err(err) => {
                    tracing::error!("{}", err.to_string());
                    return Err(Status::internal(err.to_string()));
                }
            }
        } else {
            tracing::error!("You must create an .env file with GH_PAT");
            return Err(Status::internal("You must create an .env file with GH_PAT"));
        }

        if let Err(err) = octocrab
            .actions()
            .create_workflow_dispatch("Ludea", "Sparus", "dispatch.yml", "main")
            .inputs(json!({"launcher_name": launcher_name, "repository_name": repository_name, "filename": config_file, "content": json_config.to_string()}))
            .send()
            .await
        {
            tracing::error!("Error on starting workflow: {:?}", err);
            return Err(Status::internal(err.to_string()));
        }

        sleep(Duration::from_secs(5)).await;
        if let Err(err) = octocrab
            .workflows("Ludea", "Sparus")
            .list_runs("dispatch.yml")
            .event("workflow_dispatch")
            .send()
            .await
        {
            tracing::error!("{}", err);
            return Err(Status::internal(err.to_string()));
        }

        let response = EmptySparus {};
        Ok(Response::new(response))
    }

    async fn send_event_all(&self, req: Request<Message>) -> Result<Response<EmptySparus>, Status> {
        let message = req.into_inner();

        let clients = self.clients.lock().await;
        for tx in clients.values() {
            let _ = tx.send(Ok(message.clone())).await;
        }

        let response = EmptySparus {};
        Ok(Response::new(response))
    }

    type SparusStream = ResponseStream;

    async fn sparus(&self, req: Request<Plugins>) -> SparusResult<Self::SparusStream> {
        let inner = req.into_inner();
        let plugin_list_from_client = inner.list_plugin;
        let repo_name = inner.repository_name;

        let client_id = CLIENT_ID.fetch_add(1, Ordering::Relaxed);
        let (tx, rx) = mpsc::channel(32);

        self.clients.lock().await.insert(client_id, tx.clone());

        let clients_cleanup = self.clients.clone();

        let tx_cloned = tx.clone();
        tokio::spawn(async move {
            tx_cloned.closed().await;
            clients_cleanup.lock().await.remove(&client_id);
        });

        let tx_init = tx.clone();
        tokio::spawn(async move {
            let plugin_name_from_client: HashSet<_> =
                plugin_list_from_client.keys().cloned().collect();

            let registered_plugins = diesel::list_plugin_by_repository(repo_name)
                .await
                .unwrap_or_else(|err| {
                    tracing::error!("{}", err);
                    Vec::new()
                });

            let registered_plugins_hashset: HashSet<_> =
                registered_plugins.iter().cloned().collect();

            let diff: Vec<String> = plugin_name_from_client
                .difference(&registered_plugins_hashset)
                .cloned()
                .collect();

            let common_plugin: Vec<String> = registered_plugins_hashset
                .intersection(&plugin_name_from_client)
                .cloned()
                .collect();

            match diesel::get_plugin_version(common_plugin).await {
                Ok(registered_plugin_with_version) => {
                    for (registered_plugin, registered_version) in registered_plugin_with_version {
                        if let Some(version_from_client) =
                            plugin_list_from_client.get(&registered_plugin)
                        {
                            let registered_semver = match Version::parse(&registered_version) {
                                Ok(v) => v,
                                Err(err) => {
                                    let _ =
                                        tx_init.send(Err(Status::internal(err.to_string()))).await;
                                    return;
                                }
                            };
                            let semver_from_client = match Version::parse(version_from_client) {
                                Ok(v) => v,
                                Err(err) => {
                                    let _ =
                                        tx_init.send(Err(Status::internal(err.to_string()))).await;
                                    return;
                                }
                            };
                            if registered_semver.gt(&semver_from_client)
                                && tx_init
                                    .send(Ok(Message {
                                        plugin: registered_plugin,
                                        event_type: 1,
                                    }))
                                    .await
                                    .is_err()
                            {
                                return;
                            }
                        }
                    }
                }
                Err(err) => {
                    let _ = tx_init.send(Err(Status::internal(err.to_string()))).await;
                    return;
                }
            }

            for plugin in diff {
                if tx_init
                    .send(Ok(Message {
                        plugin,
                        event_type: 2,
                    }))
                    .await
                    .is_err()
                {
                    return;
                }
            }
        });

        let output_stream = ReceiverStream::new(rx);
        Ok(Response::new(Box::pin(output_stream)))
    }
}

pub fn rpc_api(_db: DbType) -> AxumRouter {
    let api = LucleApi::default();
    let api = LucleServer::new(api);

    let event_route = EventRoute::new();
    let event_route = EventServer::new(event_route);

    let mut routes = RoutesBuilder::default();
    routes.add_service(api);
    routes.add_service(event_route);

    routes
        .routes()
        .into_axum_router()
        .reset_fallback()
        .layer(GrpcWebLayer::new())
}
