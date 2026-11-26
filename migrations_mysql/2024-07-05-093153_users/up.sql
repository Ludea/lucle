-- Your SQL goes here
CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        email TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL,
        modified_at TIMESTAMP NOT NULL,
	reset_token TEXT,
	CONSTRAINT UC_Users UNIQUE (username,email)
      );
