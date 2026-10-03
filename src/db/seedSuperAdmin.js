'use strict';

const bcrypt = require('bcryptjs');
const { db } = require('./index');
const config = require('../config/env');

async function seedSuperAdmin() {
  const email = config.admin.email.trim().toLowerCase();
  const existing = await db.prepare('SELECT user_id, role FROM user WHERE email = ?').get(email);
  if (existing) {
    if (existing.role !== 'super_admin') throw new Error('ADMIN_EMAIL belongs to a non-admin account');
    return existing;
  }
  const hash = await bcrypt.hash(config.admin.password, 10);
  return db.transaction(async () => {
    // Another instance may have initialized the same database in the meantime.
    await db.prepare("INSERT INTO user (name, email, password_hash, role) VALUES (?, ?, ?, 'super_admin') ON CONFLICT(email) DO NOTHING")
      .run(config.admin.name, email, hash);
    const user = await db.prepare('SELECT user_id, role FROM user WHERE email = ?').get(email);
    if (user.role !== 'super_admin') throw new Error('ADMIN_EMAIL belongs to a non-admin account');
    await db.prepare('INSERT OR IGNORE INTO super_admin (user_id) VALUES (?)').run(user.user_id);
    return user;
  });
}
module.exports = { seedSuperAdmin };
