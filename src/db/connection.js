'use strict';

// Async interface shared by local SQLite and remote libSQL (Turso).
// Transaction context is request-local; unrelated requests cannot accidentally
// execute inside another request's transaction on a warm serverless instance.
const fs = require('node:fs');
const path = require('node:path');
const config = require('../config/env');
let client;
let local;

if (config.databaseUrl) {
  const { createClient } = require('@libsql/client/web');
  client = createClient({ url: config.databaseUrl, authToken: config.databaseToken });
} else {
  const { DatabaseSync } = require('node:sqlite');
  fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
  local = new DatabaseSync(config.dbPath);
  local.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000');
}

module.exports = require('./adapter').createDatabase({ local, client });
