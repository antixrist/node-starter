require('./bootstrap');
const { join } = require('path');

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
  },
  useNullAsDefault: true,
  migrations: {
    schemaName: null,
    tableName: 'knex_migrations',
    directory: resolver('migrations'),
    stub: resolver('migrations/migration.stub'),
  },
  seeds: {
    directory: resolver('seeds'),
    stub: resolver('seeds/seed.stub'),
  },
};
