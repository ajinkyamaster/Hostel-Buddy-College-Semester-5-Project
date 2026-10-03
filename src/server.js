'use strict';
const app = require('./app');
const config = require('./config/env');
const { initialize } = require('./bootstrap');

if (require.main === module) {
  initialize().then(() => {
    app.listen(config.port, () => console.log(`[server] Hostel Buddy running at http://localhost:${config.port}`));
  }).catch((err) => {
    console.error('[startup]', err.message);
    process.exitCode = 1;
  });
}
module.exports = app;
