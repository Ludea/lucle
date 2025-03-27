use axum::{routing::get, Router};
use tower_http::{services::ServeDir, trace::TraceLayer};

async fn health_check() -> &'static str {
    "OK"
}

pub fn serve_dir() -> Router {
    let serve_dir = ServeDir::new("web/dist/").append_index_html_on_directories(true);

    Router::new()
        .route("/health", get(health_check))
        .route_service("/", serve_dir)
        .layer(TraceLayer::new_for_http())
}
