pub fn setup_database(args: &ArgMatches, migrations_dir: &Path) -> DatabaseResult<()> {
    let database_url = database_url(args);

    create_database_if_needed(&database_url)?;
    create_default_migration_if_needed(&database_url, migrations_dir)?;
    create_schema_table_and_run_migrations_if_needed(&database_url, migrations_dir)?;
    Ok(())
}
