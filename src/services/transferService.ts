import { getDb } from "../database";
import type { Transfer } from "../types";

async function rollbackQuietly(db: Awaited<ReturnType<typeof getDb>>) {
  try {
    await db.execute("ROLLBACK");
  } catch {
    // Ignore rollback errors because the original error is more useful.
  }
}

export async function getTransfers() {
  const db = await getDb();

  return db.select<Transfer[]>(`
    SELECT
      transfers.*,
      from_account.name AS from_account_name,
      to_account.name AS to_account_name
    FROM transfers
    JOIN accounts AS from_account
      ON transfers.from_account_id = from_account.id
    JOIN accounts AS to_account
      ON transfers.to_account_id = to_account.id
    ORDER BY transfers.date DESC, transfers.id DESC
  `);
}

export async function createTransfer(
  fromAccountId: number,
  toAccountId: number,
  date: string,
  amount: number,
  notes: string,
) {
  const db = await getDb();

  await db.execute("BEGIN IMMEDIATE");

  try {
    await db.execute(
      `
      INSERT INTO transfers
        (from_account_id, to_account_id, date, amount, notes)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [fromAccountId, toAccountId, date, amount, notes.trim()],
    );

    const debit = await db.execute(
      `
      UPDATE accounts
      SET balance = balance - $1
      WHERE id = $2
      `,
      [amount, fromAccountId],
    );

    const credit = await db.execute(
      `
      UPDATE accounts
      SET balance = balance + $1
      WHERE id = $2
      `,
      [amount, toAccountId],
    );

    if (debit.rowsAffected === 0 || credit.rowsAffected === 0) {
      throw new Error("One of the selected accounts no longer exists.");
    }

    await db.execute("COMMIT");
  } catch (error) {
    await rollbackQuietly(db);
    throw error;
  }
}

export async function deleteTransferById(transfer: Transfer) {
  const db = await getDb();

  await db.execute("BEGIN IMMEDIATE");

  try {
    const deleted = await db.execute("DELETE FROM transfers WHERE id = $1", [
      transfer.id,
    ]);

    if (deleted.rowsAffected === 0) {
      throw new Error("The selected transfer no longer exists.");
    }

    await db.execute(
      `
      UPDATE accounts
      SET balance = balance + $1
      WHERE id = $2
      `,
      [transfer.amount, transfer.from_account_id],
    );

    await db.execute(
      `
      UPDATE accounts
      SET balance = balance - $1
      WHERE id = $2
      `,
      [transfer.amount, transfer.to_account_id],
    );

    await db.execute("COMMIT");
  } catch (error) {
    await rollbackQuietly(db);
    throw error;
  }
}

export async function updateTransferById(
  transferId: number,
  fromAccountId: number,
  toAccountId: number,
  date: string,
  amount: number,
  notes: string,
) {
  const db = await getDb();

  await db.execute("BEGIN IMMEDIATE");

  try {
    const oldRows = await db.select<Transfer[]>(
      "SELECT * FROM transfers WHERE id = $1",
      [transferId],
    );

    const oldTransfer = oldRows[0];

    if (!oldTransfer) {
      throw new Error("The selected transfer no longer exists.");
    }

    await db.execute(
      `
      UPDATE accounts
      SET balance = balance + $1
      WHERE id = $2
      `,
      [oldTransfer.amount, oldTransfer.from_account_id],
    );

    await db.execute(
      `
      UPDATE accounts
      SET balance = balance - $1
      WHERE id = $2
      `,
      [oldTransfer.amount, oldTransfer.to_account_id],
    );

    const updated = await db.execute(
      `
      UPDATE transfers
      SET from_account_id = $1,
          to_account_id = $2,
          date = $3,
          amount = $4,
          notes = $5
      WHERE id = $6
      `,
      [fromAccountId, toAccountId, date, amount, notes.trim(), transferId],
    );

    if (updated.rowsAffected === 0) {
      throw new Error("The selected transfer no longer exists.");
    }

    const debit = await db.execute(
      `
      UPDATE accounts
      SET balance = balance - $1
      WHERE id = $2
      `,
      [amount, fromAccountId],
    );

    const credit = await db.execute(
      `
      UPDATE accounts
      SET balance = balance + $1
      WHERE id = $2
      `,
      [amount, toAccountId],
    );

    if (debit.rowsAffected === 0 || credit.rowsAffected === 0) {
      throw new Error("One of the selected accounts no longer exists.");
    }

    await db.execute("COMMIT");
  } catch (error) {
    await rollbackQuietly(db);
    throw error;
  }
}
