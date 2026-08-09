-- Your SQL goes here
-- Text + CHECK rather than a native Postgres enum type, to keep the Rust
-- side (models.rs's Permission ToSql/FromSql) identical to the SQLite path.
-- Includes 'pending' (used by src/diesel.rs's join_update_server via
-- Permission::Pending), which the original MySQL migration's
-- ENUM("read", "write") is missing.
CREATE TABLE users_repositories (
  user_id INTEGER NOT NULL,
  repository_name VARCHAR(255) NOT NULL,
  permission TEXT NOT NULL CHECK (permission IN ('read', 'write', 'pending')),
  PRIMARY KEY(user_id, repository_name)
);
