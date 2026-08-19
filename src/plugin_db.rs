use crate::diesel::{get_pool, DbPool};
use crate::errors::Error;
use crate::models::NewPlugin;
use crate::models::Plugin;
use crate::schema::plugins;
use crate::with_conn;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use std::collections::HashMap;

pub async fn list_plugins() -> Result<Vec<Plugin>, Error> {
    if let Some(pool) = get_pool() {
        with_conn!(pool, |conn| {
            plugins::table
                .order(plugins::dsl::installed_at.desc())
                .select(Plugin::as_select())
                .load(&mut conn)
                .await
                .map_err(Error::Query)
        })
    } else {
        Err(Error::GetPool)
    }
}

pub async fn get_plugin(plugin_id: &str) -> Result<Plugin, Error> {
    if let Some(pool) = get_pool() {
        with_conn!(pool, |conn| {
            plugins::table
                .find(plugin_id)
                .select(Plugin::as_select())
                .first(&mut conn)
                .await
                .map_err(|e| match e {
                    diesel::result::Error::NotFound => {
                        Error::RepositoryNotFound(plugin_id.to_string())
                    }
                    other => Error::Query(other),
                })
        })
    } else {
        Err(Error::GetPool)
    }
}

pub async fn install_plugin(new_plugin: NewPlugin) -> Result<Plugin, Error> {
    if let Some(pool) = get_pool() {
        with_conn!(pool, |conn| {
            diesel::insert_into(plugins::table)
                .values(&new_plugin)
                .execute(&mut conn)
                .await
                .map_err(Error::Query)?;

            plugins::table
                .find(&new_plugin.id)
                .select(Plugin::as_select())
                .first(&mut conn)
                .await
                .map_err(Error::Query)
        })
    } else {
        Err(Error::GetPool)
    }
}

pub async fn toggle_plugin(plugin_id: &str) -> Result<Plugin, Error> {
    if let Some(pool) = get_pool() {
        with_conn!(pool, |conn| {
            let current = plugins::table
                .find(plugin_id)
                .select(Plugin::as_select())
                .first(&mut conn)
                .await
                .map_err(|e| match e {
                    diesel::result::Error::NotFound => {
                        Error::RepositoryNotFound(plugin_id.to_string())
                    }
                    other => Error::Query(other),
                })?;

            diesel::update(plugins::table.find(plugin_id))
                .set(plugins::dsl::enabled.eq(!current.enabled))
                .execute(&mut conn)
                .await
                .map_err(Error::Query)?;

            plugins::table
                .find(plugin_id)
                .select(Plugin::as_select())
                .first(&mut conn)
                .await
                .map_err(Error::Query)
        })
    } else {
        Err(Error::GetPool)
    }
}

pub async fn remove_plugin(plugin_id: &str) -> Result<(), Error> {
    if let Some(pool) = get_pool() {
        with_conn!(pool, |conn| {
            let count = diesel::delete(plugins::table.find(plugin_id))
                .execute(&mut conn)
                .await
                .map_err(Error::Query)?;

            if count == 0 {
                return Err(Error::RepositoryNotFound(plugin_id.to_string()));
            }

            Ok(())
        })
    } else {
        Err(Error::GetPool)
    }
}

pub async fn get_plugin_version(
    plugins_name: Vec<String>,
) -> Result<HashMap<String, String>, Error> {
    if let Some(pool) = get_pool() {
        with_conn!(pool, |conn| {
            match plugins::table
                .filter(plugins::dsl::name.eq_any(plugins_name))
                .select(Plugin::as_select())
                .load(&mut conn)
                .await
                .optional()
            {
                Ok(Some(plugins)) => {
                    let plugin_with_version: HashMap<String, String> = plugins
                        .into_iter()
                        .map(|plug| (plug.name, plug.version))
                        .collect();
                    Ok(plugin_with_version)
                }
                Ok(None) => Ok(HashMap::new()),
                Err(err) => Err(crate::errors::Error::Query(err)),
            }
        })
    } else {
        Err(crate::errors::Error::GetPool)
    }
}
