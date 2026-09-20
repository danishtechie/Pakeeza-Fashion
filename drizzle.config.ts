import { defineConfig } from "drizzle-kit";
import path from "path";

const DB_PATH = process.env.DATABASE_URL?.replace(/^file:/, "") ?? "./dev.db";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso", // libsql — local file for dev, or Turso in production (see README)
  dbCredentials: process.env.TURSO_DATABASE_URL
    ? { url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN }
    : { url: `file:${path.isAbsolute(DB_PATH) ? DB_PATH : path.join(process.cwd(), DB_PATH)}` },
});
