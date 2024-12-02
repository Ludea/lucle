use surrealdb::engine::local::SurrealKv;
use surrealdb::Surreal;

pub async fn create_database() -> surrealdb::Result<()> {
    let db = Surreal::new::<SurrealKv>("./").await?;
    db.use_ns("lucle").use_db("lucle").await?;
    tracing::info!("Creating database lucle");
    Ok(())
}
