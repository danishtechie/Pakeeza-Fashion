import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import path from "path";

/**
 * Local dev / self-hosted: DATABASE_URL="file:./dev.db" (default).
 * Hosted on serverless (Vercel etc.): set TURSO_DATABASE_URL (libsql://...)
 * and TURSO_AUTH_TOKEN instead — serverless platforms have no persistent
 * writable disk, so a local SQLite file won't survive between requests
 * there. Turso's free tier speaks the same libsql protocol this app
 * already uses, so no other code changes are needed. See README "Deploying
 * for free".
 */
function resolveConnection() {
  if (process.env.TURSO_DATABASE_URL) {
    return {
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    };
  }
  const DB_PATH = process.env.DATABASE_URL?.replace(/^file:/, "") ?? "./dev.db";
  const resolvedPath = path.isAbsolute(DB_PATH) ? DB_PATH : path.join(process.cwd(), DB_PATH);
  return { url: `file:${resolvedPath}` };
}

declare global {
  // eslint-disable-next-line no-var
  var __pakeezaLibsql: ReturnType<typeof createClient> | undefined;
}

const client = global.__pakeezaLibsql ?? createClient(resolveConnection());

if (process.env.NODE_ENV !== "production") {
  global.__pakeezaLibsql = client;
}

export const db = drizzle(client, { schema });
