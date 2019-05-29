const path = require('path');

const KNEX_DATA_DIR = process.env.KNEX_CREATOR ? './src/dal' : './dist/dal';

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
    directory: path.join(KNEX_DATA_DIR, 'migrations'),
    stub: path.join(KNEX_DATA_DIR, 'migrations/migration.stub'),
  },
  seeds: {
    directory: path.join(KNEX_DATA_DIR, 'seeds'),
    stub: path.join(KNEX_DATA_DIR, 'seeds/seed.stub'),
  },
};
