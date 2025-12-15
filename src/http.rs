use axum::{
    routing::{get, post},
    Json, Router,
};
use serde_json::Value;
use tower_http::{
    services::{ServeDir, ServeFile},
    trace::TraceLayer,
};

async fn health_check() -> &'static str {
    "OK"
}

async fn handler(Json(body): Json<Value>) {
    tracing::info!("ok: {:?}", body["workflow_run"]["run_number"]);
    if body["action"] == "completed" && body["workflow_run"]["status"] == "completed" {
        tracing::info!("ok: {:?}", body["workflow_run"]["conclusion"]);
    }
}

pub fn serve_dir() -> Router {
    let serve_dir = ServeDir::new("web/dist").fallback(ServeFile::new("web/dist/index.html"));

    Router::new()
        .route("/health", get(health_check))
        .route("/github/webhook", post(handler))
        .fallback_service(serve_dir)
        .layer(TraceLayer::new_for_http())
}
