-- Your SQL goes here
-- SQLite has no native ENUM type; store the same lowercase strings as the
-- MySQL ENUM column would, constrained the same way. Includes 'pending'
-- (used by src/diesel.rs's join_update_server via Permission::Pending),
-- which the original MySQL migration's ENUM("read", "write") is missing.
CREATE TABLE users_repositories (
  user_id INTEGER NOT NULL,
  repository_name VARCHAR(255) NOT NULL,
  permission TEXT NOT NULL CHECK (permission IN ('read', 'write', 'pending')),
  PRIMARY KEY(user_id, repository_name)
);
