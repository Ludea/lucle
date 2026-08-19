-- Your SQL goes here
CREATE TABLE IF NOT EXISTS plugins (
    id           VARCHAR(128)  NOT NULL PRIMARY KEY,
    name         VARCHAR(255)  NOT NULL,
    icon         VARCHAR(8)    NOT NULL DEFAULT '',
    author       VARCHAR(255)  NOT NULL,
    version      VARCHAR(64)   NOT NULL,
    category     VARCHAR(64)   NOT NULL,
    price_type   VARCHAR(32)   NOT NULL DEFAULT 'free',
    description  TEXT          NOT NULL DEFAULT '',
    tags         TEXT          NOT NULL DEFAULT '[]',
    downloads    INTEGER       NOT NULL DEFAULT 0,
    stars        INTEGER       NOT NULL DEFAULT 0,
    featured     BOOLEAN       NOT NULL DEFAULT FALSE,
    enabled      BOOLEAN       NOT NULL DEFAULT TRUE,
    installed_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
