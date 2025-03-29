use axum::{routing::get, Router};
use tower_http::{
    services::{ServeDir, ServeFile},
    trace::TraceLayer,
};

async fn health_check() -> &'static str {
    "OK"
}

pub fn serve_dir() -> Router {
    let serve_dir = ServeDir::new("web/dist").fallback(ServeFile::new("web/dist/index.html"));

    Router::new()
        .route("/health", get(health_check))
        .fallback_service(serve_dir)
        .layer(TraceLayer::new_for_http())
}
