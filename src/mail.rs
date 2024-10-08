use common::{config::server::ServerProtocol, manager::boot::BootManager, Ipc, IPC_CHANNEL_BUFFER};
use imap::core::{ImapSessionManager, IMAP};
use jmap::{api::JmapSessionManager, services::gossip::spawn::GossiperBuilder, JMAP};
use managesieve::core::ManageSieveSessionManager;
use pop3::Pop3SessionManager;
use smtp::core::{SmtpSessionManager, SMTP};
use tokio::sync::mpsc;
use utils::wait_for_shutdown;

use std::{env, time::Duration};

pub async fn start_mail_server() -> std::io::Result<()> {
    // Load config and apply macros
    let key = "CONFIG_PATH";
    env::set_var(key, "./config.toml");
    let init = BootManager::init().await;

    // Parse core
    let mut config = init.config;
    let core = init.core;

    // Spawn webhook manager
    let webhook_tx = spawn_webhook_manager(core.clone());

    // Init servers
    let (delivery_tx, delivery_rx) = mpsc::channel(IPC_CHANNEL_BUFFER);
    let ipc = Ipc { delivery_tx };

    let smtp = SMTP::init(
        &mut config,
        core.clone(),
        ipc,
        init.servers.span_id_gen.clone(),
    )
    .await;
    let jmap = JMAP::init(&mut config, delivery_rx, core.clone(), smtp.inner.clone()).await;
    let imap = IMAP::init(&mut config, jmap.clone()).await;
    let gossiper = GossiperBuilder::try_parse(&mut config);

    // Log configuration errors
    config.log_errors();
    config.log_warnings();

    // Spawn servers
    let (shutdown_tx, shutdown_rx) = init.servers.spawn(|server, acceptor, shutdown_rx| {
        match &server.protocol {
            ServerProtocol::Smtp | ServerProtocol::Lmtp => server.spawn(
                SmtpSessionManager::new(smtp.clone()),
                core.clone(),
                acceptor,
                shutdown_rx,
            ),
            ServerProtocol::Http => server.spawn(
                JmapSessionManager::new(jmap.clone()),
                core.clone(),
                acceptor,
                shutdown_rx,
            ),
            ServerProtocol::Imap => server.spawn(
                ImapSessionManager::new(imap.clone()),
                core.clone(),
                acceptor,
                shutdown_rx,
            ),
            ServerProtocol::Pop3 => server.spawn(
                Pop3SessionManager::new(imap.clone()),
                core.clone(),
                acceptor,
                shutdown_rx,
            ),
            ServerProtocol::ManageSieve => server.spawn(
                ManageSieveSessionManager::new(imap.clone()),
                core.clone(),
                acceptor,
                shutdown_rx,
            ),
        };
    });

    if let Some(gossiper) = gossiper {
        gossiper.spawn(jmap, shutdown_rx).await;
    }

    // Wait for shutdown signal
    wait_for_shutdown().await;

    // Stop services
    let _ = shutdown_tx.send(true);

    // Wait for services to finish
    tokio::time::sleep(Duration::from_secs(1)).await;

    Ok(())
}
