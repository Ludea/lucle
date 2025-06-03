use diesel::backend::Backend;
use diesel::query_builder::*;
use diesel::result::QueryResult;

#[derive(Debug, Clone)]
pub struct CreateDatabaseStatement {
    db_name: String,
}

impl CreateDatabaseStatement {
    pub fn new(db_name: &str) -> Self {
        CreateDatabaseStatement {
            db_name: db_name.to_owned(),
        }
    }
}

impl<DB: Backend> QueryFragment<DB> for CreateDatabaseStatement {
    fn walk_ast<'b>(&'b self, mut out: AstPass<'_, 'b, DB>) -> QueryResult<()> {
        out.push_sql("CREATE DATABASE ");
        out.push_identifier(&self.db_name)?;
        Ok(())
    }
}

impl QueryId for CreateDatabaseStatement {
    type QueryId = ();

    const HAS_STATIC_QUERY_ID: bool = false;
}

pub fn create_database(db_name: &str) -> CreateDatabaseStatement {
    CreateDatabaseStatement::new(db_name)
}
