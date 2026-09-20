import { db } from "@/db/client";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getSettings() {
  const row = await db.query.settings.findFirst({ where: eq(settings.id, "singleton") });
  if (!row) {
    throw new Error(
      "Settings row missing — run the seed script (npm run seed) to initialize the store."
    );
  }
  return row;
}
