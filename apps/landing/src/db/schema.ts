import { sql } from "drizzle-orm";
import { check, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const signups = pgTable(
  "signups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Trimmed and lowercased before insert; one row per email. */
    email: text("email").notNull().unique(),
    platform: text("platform").notNull(),
    language: text("language").notNull(),
    car: text("car"),
    features: text("features").array().notNull().default(sql`'{}'::text[]`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    surveyAt: timestamp("survey_at", { withTimezone: true }),
  },
  (t) => [
    check("signups_platform", sql`${t.platform} in ('ios', 'android')`),
    check("signups_language", sql`${t.language} in ('vi', 'en')`),
  ],
);
