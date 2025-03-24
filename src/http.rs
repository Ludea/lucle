use axum::{
    handler::HandlerWithoutStateExt,
    http::StatusCode,
    routing::{get, get_service},
    Router,
};
use tower_http::{
    services::{ServeDir, ServeFile},
    trace::TraceLayer,
};

async fn health_check() -> &'static str {
    "OK"
}

pub fn serve_dir() -> Router {
    async fn handle_404() -> (StatusCode, &'static str) {
        (StatusCode::NOT_FOUND, "Not found")
    }

    let service = handle_404.into_service();
    let serve_dir = ServeDir::new("web/dist")
        .fallback(ServeFile::new("web/dist/index.html"))
        .not_found_service(service);

    Router::new()
        .route("/health", get(health_check))
        .route("/", get_service(serve_dir))
        .layer(TraceLayer::new_for_http())
}
