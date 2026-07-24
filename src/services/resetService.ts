import type Database from "@tauri-apps/plugin-sql";

import { getDb } from "../database";

const TABLES_TO_CLEAR = [
  "import_batches",
  "recurring_transactions",
  "bills",
  "debts",
  "funds",
  "goals",
  "budget_items",
  "budget_groups",
  "budgets",
  "transfers",
  "transactions",
  "accounts",
];

async function tableExists(db: Database, tableName: string): Promise<boolean> {
  const rows = await db.select<Array<{ name: string }>>(
    `
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
      AND name = $1
    LIMIT 1
    `,
    [tableName],
  );

  return rows.length > 0;
}

export async function resetAllData() {
  const db = await getDb();

  await db.execute("BEGIN IMMEDIATE");

  try {
    const existingTables: string[] = [];

    for (const tableName of TABLES_TO_CLEAR) {
      if (await tableExists(db, tableName)) {
        existingTables.push(tableName);
      } else {
        console.warn(`Skipping missing table during reset: ${tableName}`);
      }
    }

    for (const tableName of existingTables) {
      await db.execute(`DELETE FROM ${tableName}`);
    }

    const sqliteSequenceExists = await tableExists(db, "sqlite_sequence");

    if (sqliteSequenceExists) {
      for (const tableName of existingTables) {
        await db.execute(
          `
          DELETE FROM sqlite_sequence
          WHERE name = $1
          `,
          [tableName],
        );
      }
    }

    await db.execute("COMMIT");
  } catch (error) {
    try {
      await db.execute("ROLLBACK");
    } catch (rollbackError) {
      console.error("Reset rollback failed:", rollbackError);
    }

    throw error;
  }
}
