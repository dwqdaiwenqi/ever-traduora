import { DataSource, DataSourceOptions } from 'typeorm';
import { DbType } from '../utils/database-type-helper';
import { config } from '../config';

/**
 * Retrieves the connection options for TypeORM DataSource or TypeORMModule.
 *
 * @returns The connection options for TypeORM DataSource or TypeORMModule.
 */
export const dataSourceOptions = (): DataSourceOptions => {
  // Use the database type from config (which reads from environment variables)
  const dbType = config.db.default.type as DbType;

  // Validate that the provided DB type is supported
  if (!Object.values(DbType).includes(dbType)) {
    throw new Error(`Unsupported database type: ${dbType}. Supported types are: ${Object.values(DbType).join(', ')}`);
  }

  // Common options for all database types
  const commonOptions = {
    synchronize: false,
    logging: false,
    entities: [`${__dirname}/../entity/*.entity.{js,ts}`],
    migrations: [`${__dirname}/../migrations/*.{js,ts}`],
  };

  // Handle MySQL or PostgreSQL configuration
  // Use configuration from config.ts (cast to any to access the properties)
  const configDb = config.db.default as any;
  const options: DataSourceOptions = {
    ...commonOptions,
    type: dbType,
    host: configDb.host,
    port: configDb.port,
    username: configDb.username,
    password: configDb.password,
    database: configDb.database,
    charset: dbType === DbType.MYSQL ? configDb.charset : undefined,
    namingStrategy: configDb.namingStrategy,
  };

  return options;
};

/**
 * Creates and initializes a TypeORM DataSource instance with the provided configuration options.
 *
 * @returns Initialized TypeORM DataSource instance.
 */
let dataSource: DataSource;
export const getDataSourceConnection = async (): Promise<DataSource> => {
  if (!dataSource) {
    dataSource = new DataSource(dataSourceOptions());
  }

  try {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
      console.log(`Successfully connected to ${dataSource.options.type} database`);
    }
  } catch (error) {
    console.error(`Error initializing database connection: ${error?.message}`);
    throw error; // Re-throw to allow proper error handling upstream
  }

  return dataSource;
};
