'use strict';
const { initSchema } = require('./db');
const { seedSuperAdmin } = require('./db/seedSuperAdmin');
let ready;
function initialize() {
  if (!ready) ready = (async () => {
    await initSchema();
    await seedSuperAdmin();
  })().catch((err) => { ready = undefined; throw err; });
  return ready;
}
module.exports = { initialize };
