'use strict';
const { AsyncLocalStorage } = require('node:async_hooks');

// Each transaction owns its connection; local SQLite queues unrelated work.
function createDatabase({ local, client }) {
  const context = new AsyncLocalStorage();
  let queue = Promise.resolve();

  function exclusive(fn) {
    const task = queue.then(fn);
    queue = task.catch(() => {});
    return task;
  }

  async function execute(sql, args, mode) {
    const tx = context.getStore();
    if (local) {
      const run = () => local.prepare(sql)[mode](...args);
      return tx ? run() : exclusive(run);
    }
    const result = await (tx || client).execute({ sql, args });
    if (mode === 'get') return result.rows[0];
    if (mode === 'all') return result.rows;
    return { changes: result.rowsAffected, lastInsertRowid: result.lastInsertRowid };
  }

  const db = {
    prepare(sql) {
      return {
        get: (...args) => execute(sql, args, 'get'),
        all: (...args) => execute(sql, args, 'all'),
        run: (...args) => execute(sql, args, 'run'),
      };
    },
    async exec(sql) {
      const tx = context.getStore();
      if (local) return tx ? local.exec(sql) : exclusive(() => local.exec(sql));
      return (tx || client).executeMultiple(sql);
    },
    async transaction(fn) {
      if (context.getStore()) return fn();
      if (local) return exclusive(async () => {
        local.exec('BEGIN IMMEDIATE');
        try {
          const result = await context.run(local, fn);
          local.exec('COMMIT');
          return result;
        } catch (err) {
          local.exec('ROLLBACK');
          throw err;
        }
      });
      const tx = await client.transaction('write');
      try {
        const result = await context.run(tx, fn);
        await tx.commit();
        return result;
      } catch (err) {
        try { await tx.rollback(); } catch { /* preserve original error */ }
        throw err;
      } finally {
        tx.close();
      }
    },
    close() { if (local) local.close(); else client.close(); },
  };
  return db;
}
module.exports = { createDatabase };
