const { join } = require('path');

const KNEX_DATA_DIR = process.env.KNEX_CREATOR ? './src' : './dist';
/**
 * @param {string} path
 * @returns {string}
 */
const resolver = path => join(KNEX_DATA_DIR, path);

module.exports = {
  client: 'pg',
  connection: process.env.PG_CONNECTION,
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    schemaName: null,
    tableName: 'knex_migrations',
    directory: resolver('dal/migrations'),
    stub: resolver('dal/migrations/migration.stub'),
  },
  seeds: {
    directory: resolver('dal/seeds'),
    stub: resolver('dal/seeds/seed.stub'),
  },
};
