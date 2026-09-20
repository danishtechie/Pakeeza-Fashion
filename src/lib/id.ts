import { randomBytes } from "crypto";

/**
 * Lightweight cuid-like id generator: URL-safe, sortable-ish, collision-safe
 * enough for this scale. Avoids pulling in an extra dependency.
 */
export function createId(): string {
  const time = Date.now().toString(36);
  const rand = randomBytes(9).toString("base64url");
  return `c${time}${rand}`;
}
