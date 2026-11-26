-- Your SQL goes here
CREATE TABLE users_repositories (
  user_id INT NOT NULL,
  repository_name VARCHAR(255) NOT NULL,
  permission ENUM("read", "write") NOT NULL,
  PRIMARY KEY(user_id, repository_name)
);
