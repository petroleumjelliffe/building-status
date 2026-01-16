import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Singleton pattern for database connection
// Prevents "too many clients" error during Next.js hot reloading
declare global {
  // eslint-disable-next-line no-var
  var postgresClient: postgres.Sql | undefined;
}

// Reuse connection in development (hot reload), create new in production
const client = global.postgresClient || postgres(process.env.DATABASE_URL, {
  max: 10, // Maximum number of connections in pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
});

if (process.env.NODE_ENV !== 'production') {
  global.postgresClient = client;
}

// Create Drizzle instance
export const db = drizzle(client, { schema });
