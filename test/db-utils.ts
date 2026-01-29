import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/lib/schema';

let testClient: postgres.Sql | null = null;
let testDb: ReturnType<typeof drizzle> | null = null;

export function getTestDb() {
  if (!testDb) {
    testClient = postgres(process.env.DATABASE_URL!, { max: 1 });
    testDb = drizzle(testClient, { schema });
  }
  return testDb;
}

export async function cleanDatabase() {
  const db = getTestDb();

  // Delete all data in reverse dependency order
  await db.delete(schema.notificationQueue);
  await db.delete(schema.notificationSubscriptions);
  await db.delete(schema.residentSessions);
  await db.delete(schema.accessTokens);
  await db.delete(schema.config);
  await db.delete(schema.announcements);
  await db.delete(schema.events);
  await db.delete(schema.maintenance);
  await db.delete(schema.issues);
  await db.delete(schema.systemStatus);
  await db.delete(schema.properties);

  // Reset the properties ID sequence so next property gets id=1
  const client = (db as any)._.session.client;
  await client`ALTER SEQUENCE properties_id_seq RESTART WITH 1`;

  // Reset the property counter
  propertyCounter = 0;
}

export async function closeTestDb() {
  if (testClient) {
    await testClient.end();
    testClient = null;
    testDb = null;
  }
}

let propertyCounter = 0;

export async function createTestProperty() {
  const db = getTestDb();
  propertyCounter++;
  const [property] = await db.insert(schema.properties).values({
    propertyId: `test-property-${propertyCounter}`,
    hash: `test-hash-${propertyCounter}`,
    name: `Test Building ${propertyCounter}`,
    requireAuthForContacts: false,
  }).returning();
  return property;
}
