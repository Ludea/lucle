-- Your SQL goes here
CREATE TABLE IF NOT EXISTS plugins (
    id           TEXT     NOT NULL PRIMARY KEY,
    name         TEXT     NOT NULL,
    icon         TEXT     NOT NULL DEFAULT '',
    author       TEXT     NOT NULL,
    version      TEXT     NOT NULL,
    category     TEXT     NOT NULL,
    price_type   TEXT     NOT NULL DEFAULT 'free',
    description  TEXT     NOT NULL DEFAULT '',
    tags         TEXT     NOT NULL DEFAULT '[]',
    downloads    INTEGER  NOT NULL DEFAULT 0,
    stars        INTEGER  NOT NULL DEFAULT 0,
    featured     INTEGER  NOT NULL DEFAULT 0,
    enabled      INTEGER  NOT NULL DEFAULT 1,
    installed_at TEXT     NOT NULL DEFAULT (datetime('now'))
);