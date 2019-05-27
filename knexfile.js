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
    directory: './migrations',
    stub: './migrations/migration.stub',
  },
  seeds: {
    directory: './seeds',
    stub: './seeds/seed.stub',
  },
};
