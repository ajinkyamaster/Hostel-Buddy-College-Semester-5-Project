'use strict';

// Loads environment variables from .env and exposes a single typed config object.
// Every other module imports configuration from here rather than reading
// process.env directly, so there is one place that defines defaults.
require('dotenv').config();

const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');
const resolveFromRoot = (p, fallback) =>
  path.resolve(rootDir, p || fallback);

// How much of the request stream to print. See middleware/requestLogger.js.
// An unrecognised value falls back to the default rather than being treated as
// "none" — a typo in LOG_LEVEL should not silently turn logging off.
const LOG_LEVELS = ['none', 'api', 'all'];
const DEFAULT_LOG_LEVEL = 'api';

function readLogLevel(raw) {
  if (raw === undefined || raw === '') return DEFAULT_LOG_LEVEL;
  const value = String(raw).trim().toLowerCase();
  if (LOG_LEVELS.includes(value)) return value;
  console.warn(
    `[config] LOG_LEVEL="${raw}" is not one of ${LOG_LEVELS.join(', ')} — using "${DEFAULT_LOG_LEVEL}".`
  );
  return DEFAULT_LOG_LEVEL;
}

const config = {
  env: process.env.VERCEL ? 'production' : process.env.NODE_ENV || 'development',
  vercel: Boolean(process.env.VERCEL),
  databaseUrl: process.env.TURSO_DATABASE_URL || '',
  databaseToken: process.env.TURSO_AUTH_TOKEN || '',
  port: Number(process.env.PORT) || 4000,

  // Auth
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: '24h',

  // Seeded administrator account
  admin: {
    name: process.env.ADMIN_NAME || 'Hostel Administrator',
    email: process.env.ADMIN_EMAIL || 'admin@hostel.test',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },

  // Logging: 'api' (default), 'all', or 'none'
  logLevel: readLogLevel(process.env.LOG_LEVEL),

  // Storage
  dbPath: resolveFromRoot(process.env.DB_PATH, './data/hostel.db'),
  uploadDir: process.env.VERCEL ? '/tmp/hostel-buddy-uploads' : resolveFromRoot(process.env.UPLOAD_DIR, './uploads'),

  // Upload limits.
  //
  // Video gets its own, much larger ceiling: a phone clip of a leaking pipe is
  // an order of magnitude bigger than a photo of one. They are separate numbers
  // so raising the video cap never quietly raises the image cap too.
  //
  // The size cap is also the *only* deliberate limit on a video. Enforcing a
  // maximum duration would mean decoding container metadata on the server, and
  // a bitrate-independent byte ceiling bounds the storage cost just as well.
  maxUploadBytes: 5 * 1024 * 1024, // 5 MB  — images
  maxVideoBytes: 30 * 1024 * 1024, // 30 MB — video
};

// In production, refuse to start on insecure defaults instead of only warning.
// A graded/deployed demo must never boot with a guessable secret or password.
if (config.env === 'production') {
  const problems = [];
  if (!process.env.JWT_SECRET || ['dev-secret-change-me', 'change-me-to-a-long-random-secret'].includes(config.jwtSecret)) {
    problems.push('JWT_SECRET must be set to a strong, random value');
  } else if (config.jwtSecret.length < 16) {
    problems.push('JWT_SECRET is too short (use at least 16 characters)');
  }
  if (config.admin.password === 'admin123') {
    problems.push('ADMIN_PASSWORD must be changed from the default');
  }
  if (!process.env.ADMIN_EMAIL) problems.push('ADMIN_EMAIL must be set');
  if (config.vercel && (!config.databaseUrl || !config.databaseToken)) {
    problems.push('Vercel requires TURSO_DATABASE_URL and TURSO_AUTH_TOKEN (local SQLite is not persistent)');
  }
  if (problems.length) {
    throw new Error(
      '[config] Refusing to start in production with insecure settings:\n  - ' +
        problems.join('\n  - ')
    );
  }
}

module.exports = config;

if (config.databaseUrl && !/^(libsql|https):\/\//.test(config.databaseUrl)) {
  throw new Error('TURSO_DATABASE_URL must use libsql:// or https://');
}
