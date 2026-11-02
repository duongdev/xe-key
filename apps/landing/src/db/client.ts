import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "./schema";

let db: ReturnType<typeof create> | undefined;
let migrated: Promise<void> | undefined;

function create(url: string) {
  return drizzle(postgres(url, { max: 5 }), { schema });
}

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  db ??= create(url);
  return db;
}

/** Applies pending SQL migrations once; a failure is retried on the next call (ADR 0009). */
export function migrateOnce(): Promise<void> {
  migrated ??= migrate(getDb(), {
    migrationsFolder: path.join(process.cwd(), "drizzle"),
  }).catch((e) => {
    migrated = undefined;
    throw e;
  });
  return migrated;
}

/** The DB, migrated. Lazy, so pages and builds never need `DATABASE_URL`. */
export async function database() {
  await migrateOnce();
  return getDb();
}
