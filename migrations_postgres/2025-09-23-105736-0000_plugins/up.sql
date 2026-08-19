-- Your SQL goes here
CREATE TYPE price_type AS ENUM ('free', 'paid', 'subscription');
CREATE TYPE plugin_category AS ENUM ('ui', 'backend', 'auth', 'devtools', 'gaming', 'theme');

CREATE TABLE IF NOT EXISTS plugins (
    id           VARCHAR(128)     NOT NULL PRIMARY KEY,
    name         VARCHAR(255)     NOT NULL,
    icon         VARCHAR(8)       NOT NULL DEFAULT '',
    author       VARCHAR(255)     NOT NULL,
    version      VARCHAR(64)      NOT NULL,
    category     plugin_category  NOT NULL,
    price_type   price_type       NOT NULL DEFAULT 'free',
    description  TEXT             NOT NULL DEFAULT '',
    tags         TEXT             NOT NULL DEFAULT '[]',
    downloads    INTEGER          NOT NULL DEFAULT 0,
    stars        INTEGER          NOT NULL DEFAULT 0,
    featured     BOOLEAN          NOT NULL DEFAULT FALSE,
    enabled      BOOLEAN          NOT NULL DEFAULT TRUE,
    installed_at TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);