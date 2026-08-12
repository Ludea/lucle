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
    Empty as EmptySparus, EventType, Message, Options, Plugins,
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
                let db_path = "lucle.db";
                if let Err(err) = diesel::create_database(db_path).await {
                    tracing::error!("Unable to create database : {}", err);
                    return Err(Status::internal(err.to_string()));
                }
                utils::set_config_key("database", "type", "sqlite");
                utils::set_config_key("database", "path", db_path);
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
                // NOTE: this path compiles and mirrors the Mysql branch, but
                // is not verified against a live PostgreSQL server in this
                // environment (see the PR description). Please test before
                // relying on it.
                if let Some(db_connection) = inner.db_connection {
                    let db_url = &("postgres://".to_owned()
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
                    utils::set_config_key("database", "type", "postgresql");
                    utils::set_config_key("database", "url", &db_connection.hostname);
                    utils::set_config_key("database", "port", &db_connection.port.to_string());
                    utils::set_config_key("database", "name", &db_name);
                    utils::set_config_key("database", "user", &db_connection.username);
                    utils::set_config_key("database", "password", &db_connection.password);
                } else {
                    return Err(Status::invalid_argument(
                        "Missing PostgreSQL connection information",
                    ));
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

        // Clone the senders out and release the registry lock *before* sending.
        // Awaiting `send()` while holding the lock meant one slow client (the
        // channel holds 32 messages, and Sparus stops polling the stream while
        // it downloads a plugin) blocked delivery to every other client, and
        // also blocked `sparus()` from registering newly connected clients.
        let receivers: Vec<_> = {
            let clients = self.clients.lock().await;
            clients.iter().map(|(id, tx)| (*id, tx.clone())).collect()
        };

        let mut delivered = 0usize;
        for (client_id, tx) in &receivers {
            // `try_send` rather than `send().await`: a client whose buffer is
            // full is already behind, and must not stall the broadcast.
            match tx.try_send(Ok(message.clone())) {
                Ok(()) => delivered += 1,
                Err(err) => tracing::warn!("client {client_id}: event not delivered: {err}"),
            }
        }

        // Without this, a broadcast that reached nobody was indistinguishable
        // from one that reached everybody: the RPC returns Empty either way.
        if delivered == 0 {
            tracing::warn!(
                "event {:?} for plugin {:?} broadcast to 0 connected clients",
                message.event_type,
                message.plugin
            );
        } else {
            tracing::info!(
                "event {:?} for plugin {:?} broadcast to {delivered}/{} connected clients",
                message.event_type,
                message.plugin,
                receivers.len()
            );
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
            // IMPORTANT: never send `Err(Status)` on this channel. tonic turns
            // an Err item in a server-streaming body into the HTTP/2 TRAILERS
            // frame and marks the response ended, which permanently closes the
            // subscription: `rx` drops, the cleanup task above removes this
            // client from the registry, and every later `send_event_all` finds
            // an empty map. A failure to compute the *initial* plugin diff is
            // not a reason to drop the client's subscription -- log it and keep
            // the stream open so broadcasts still reach them.
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

            // Skip the query entirely when there is nothing in common: it would
            // otherwise still hit the database (and fail when no pool/table
            // exists) just to return an empty map.
            if !common_plugin.is_empty() {
                match diesel::get_plugin_version(common_plugin).await {
                    Ok(registered_plugin_with_version) => {
                        for (registered_plugin, registered_version) in
                            registered_plugin_with_version
                        {
                            let Some(version_from_client) =
                                plugin_list_from_client.get(&registered_plugin)
                            else {
                                continue;
                            };
                            // Skip just this plugin on an unparseable version
                            // rather than tearing down the whole subscription.
                            let registered_semver = match Version::parse(&registered_version) {
                                Ok(v) => v,
                                Err(err) => {
                                    tracing::error!(
                                        "plugin {registered_plugin}: bad registered version {registered_version:?}: {err}"
                                    );
                                    continue;
                                }
                            };
                            let semver_from_client = match Version::parse(version_from_client) {
                                Ok(v) => v,
                                Err(err) => {
                                    tracing::error!(
                                        "plugin {registered_plugin}: bad version {version_from_client:?} from client: {err}"
                                    );
                                    continue;
                                }
                            };
                            if registered_semver.gt(&semver_from_client)
                                && tx_init
                                    .send(Ok(Message {
                                        plugin: registered_plugin,
                                        event_type: EventType::Update.into(),
                                    }))
                                    .await
                                    .is_err()
                            {
                                return;
                            }
                        }
                    }
                    Err(err) => {
                        tracing::error!("unable to read registered plugin versions: {err}");
                    }
                }
            }

            for plugin in diff {
                if tx_init
                    .send(Ok(Message {
                        plugin,
                        event_type: EventType::Delete.into(),
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

// Regression test for the "send_event_all reaches nobody" bug.
//
// Lives here rather than in tests/ because `lucle` is a binary crate, so an
// integration test cannot reach `EventRoute`. Being a descendant module of
// `rpc` also lets it read the private `clients` registry to assert on it.
// Same style as src/diesel.rs's existing test.
#[cfg(test)]
mod event_stream_tests {
    use super::*;
    use sparus::event_client::EventClient;
    use tokio::time::timeout;

    /// Serves the real `rpc_api()` route stack (including `GrpcWebLayer`) and
    /// hands back the client registry so tests can assert on it.
    async fn spawn_server() -> (std::net::SocketAddr, ClientRegistry) {
        let route = EventRoute::new();
        let registry = route.clients.clone();

        let mut routes = RoutesBuilder::default();
        routes.add_service(LucleServer::new(LucleApi::default()));
        routes.add_service(EventServer::new(route));
        let router = routes
            .routes()
            .into_axum_router()
            .reset_fallback()
            .layer(GrpcWebLayer::new());

        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();
        tokio::spawn(async move {
            let _ = axum::serve(listener, router).await;
        });
        tokio::time::sleep(Duration::from_millis(50)).await;
        (addr, registry)
    }

    /// A client subscribes while the database is unavailable, so the initial
    /// plugin diff cannot be computed. The subscription must survive that and
    /// still receive a later broadcast.
    ///
    /// This is the exact scenario that was broken: the init task used to push
    /// `Err(Status)` into the stream, which tonic turns into end-of-stream
    /// trailers, dropping the client from the registry within milliseconds --
    /// so every later `send_event_all` silently reached nobody while still
    /// returning `Ok(Empty)` to the caller.
    #[tokio::test(flavor = "multi_thread")]
    async fn broadcast_reaches_client_whose_init_burst_failed() {
        // No pool is configured in tests, so `get_plugin_version` would error.
        // Send a non-empty plugin list so the init task has work to attempt.
        let (addr, registry) = spawn_server().await;
        let url = format!("http://{addr}");

        let mut streaming_client = EventClient::connect(url.clone()).await.unwrap();
        let mut stream = streaming_client
            .sparus(Plugins {
                repository_name: "some-repo".to_string(),
                // An empty list means there is no diff to send, so the only
                // thing the init task does is the database lookup that fails.
                // The old code turned that failure into end-of-stream trailers.
                list_plugin: HashMap::new(),
            })
            .await
            .unwrap()
            .into_inner();

        // Give the init task time to run (and, before the fix, to kill us).
        tokio::time::sleep(Duration::from_millis(300)).await;

        assert_eq!(
            registry.lock().await.len(),
            1,
            "client must still be registered after a failed initial plugin diff"
        );

        let mut broadcaster = EventClient::connect(url).await.unwrap();
        broadcaster
            .send_event_all(Message {
                plugin: "a-plugin".to_string(),
                event_type: EventType::Update.into(),
            })
            .await
            .unwrap();

        let received = timeout(Duration::from_secs(5), stream.message())
            .await
            .expect("timed out waiting for the broadcast")
            .expect("stream returned an error instead of the broadcast")
            .expect("stream ended instead of delivering the broadcast");

        assert_eq!(received.plugin, "a-plugin");
        assert_eq!(received.event_type, EventType::Update as i32);
    }

    /// A broadcast with no connected clients must not fail the RPC (the web UI
    /// relies on it returning), but it must be visible in the logs -- see the
    /// `tracing::warn!` in `send_event_all`.
    #[tokio::test(flavor = "multi_thread")]
    async fn broadcast_with_no_clients_is_not_an_error() {
        let (addr, registry) = spawn_server().await;
        assert_eq!(registry.lock().await.len(), 0);

        let mut broadcaster = EventClient::connect(format!("http://{addr}"))
            .await
            .unwrap();
        broadcaster
            .send_event_all(Message {
                plugin: "nobody-listening".to_string(),
                event_type: EventType::Install.into(),
            })
            .await
            .expect("send_event_all must still succeed with zero clients");
    }
}
