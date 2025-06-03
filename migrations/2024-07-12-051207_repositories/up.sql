-- Your SQL goes here
CREATE TABLE repositories (
  id INTEGER AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  platforms TEXT,
  UNIQUE (name)
);
