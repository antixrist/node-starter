require('./bootstrap');
const { join } = require('path');

// todo: `knex-db-manager`

const KNEX_DATA_DIR = process.env.KNEX_CREATOR ? './src' : './dist';
/**
 * @param {string} path
 * @returns {string}
 */
const resolver = path => join(KNEX_DATA_DIR, path);

module.exports = {
  client: 'pg',
  connection: process.env.PG_CONNECTION_URI,
  pool: {
    min: 2,
    max: 10,
    afterCreate: (conn, done) => conn.query('SET LC_MESSAGES TO "C";', done),
  },
  useNullAsDefault: true,
  doNotRejectOnRollback: false,
  migrations: {
    schemaName: null,
    tableName: 'knex_migrations',
    directory: resolver('services/db/.migrations'),
    stub: resolver('services/db/.migrations/migration.stub'),
  },
  seeds: {
    directory: resolver('services/db/.seeds'),
    stub: resolver('services/db/.seeds/seed.stub'),
  },
};
