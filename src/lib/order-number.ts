/**
 * Generates order numbers like PF-2026-000123. The numeric part is derived
 * from a DB-backed counter (see getNextOrderSequence) so it's gap-free and
 * safe under concurrent writes within a single sqlite/postgres transaction.
 */
export function formatOrderNumber(year: number, sequence: number): string {
  return `PF-${year}-${String(sequence).padStart(6, "0")}`;
}
