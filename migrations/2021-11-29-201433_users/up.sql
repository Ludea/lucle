-- Your SQL goes here
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username VARCHAR NOT NULL,
  password VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  role VARCHAR NOT NULL,
  createdAt VARCHAR NOT NULL
)
