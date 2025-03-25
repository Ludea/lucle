use axum::{
    routing::{get, get_service},
    Router,
};
use tower_http::{services::ServeDir, trace::TraceLayer};

async fn health_check() -> &'static str {
    "OK"
}

pub fn serve_dir() -> Router {
    let serve_dir = ServeDir::new("web/dist");

    Router::new()
        .route("/health", get(health_check))
        .route_service("/", get_service(serve_dir))
        .layer(TraceLayer::new_for_http())
}
