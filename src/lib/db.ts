import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required for database access.");
}

const client = postgres(connectionString);

export const db = drizzle(client, { schema });

/** Close the pool so short-lived worker processes can exit. */
export async function closeDb(): Promise<void> {
  await client.end({ timeout: 5 });
}
