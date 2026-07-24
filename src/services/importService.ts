import { getDb } from "../database";
import type { ImportBatch } from "../types";

export async function getImportBatches() {
  const db = await getDb();

  return await db.select<ImportBatch[]>(
    `
    SELECT *
    FROM import_batches
    ORDER BY id DESC
    `
  );
}

export async function createImportBatch() {
  const db = await getDb();

  await db.execute(`
    INSERT INTO import_batches (transaction_count)
    VALUES (0)
  `);

  const result = await db.select<{ id: number }[]>(
    `
    SELECT last_insert_rowid() AS id
    `
  );

  return result[0].id;
}

export async function updateImportBatchCount(
  batchId: number,
  count: number
) {
  const db = await getDb();

  await db.execute(
    `
    UPDATE import_batches
    SET transaction_count = $1
    WHERE id = $2
    `,
    [count, batchId]
  );
}

export async function undoImportBatch(batchId: number) {
  const db = await getDb();

  const transactions = await db.select<any[]>(
    `
    SELECT *
    FROM transactions
    WHERE import_batch_id = $1
    `,
    [batchId]
  );

  for (const transaction of transactions) {
    await db.execute(
      `
      UPDATE accounts
      SET balance = balance - $1
      WHERE id = $2
      `,
      [transaction.amount, transaction.account_id]
    );
  }

  await db.execute(
    `
    DELETE FROM transactions
    WHERE import_batch_id = $1
    `,
    [batchId]
  );

  await db.execute(
    `
    DELETE FROM import_batches
    WHERE id = $1
    `,
    [batchId]
  );
}