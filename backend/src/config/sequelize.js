import { Sequelize } from 'sequelize';
import { env } from './env.js';

export const sequelize = new Sequelize(
  env.db.database,
  env.db.user,
  env.db.password,
  {
    host: env.db.host,
    port: env.db.port,
    dialect: 'mysql',
    logging: false,
    define: {
      timestamps: false,
      freezeTableName: true,
    },
  }
);

export async function testSequelize() {
  await sequelize.authenticate();
}
