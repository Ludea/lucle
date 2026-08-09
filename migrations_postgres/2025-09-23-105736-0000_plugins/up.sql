-- Your SQL goes here
CREATE TABLE plugins (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  version VARCHAR(255) NOT NULL
);
