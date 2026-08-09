-- Your SQL goes here
CREATE TABLE repositories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  platforms TEXT,
  plugins TEXT,
  UNIQUE (name)
);
