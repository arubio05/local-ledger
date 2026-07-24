import { getDb } from "../database";
import type { Bill } from "../types";

export async function getBills() {
  const db = await getDb();

  return db.select<Bill[]>(`
    SELECT
      bills.*,
      accounts.name AS account_name
    FROM bills
    LEFT JOIN accounts
      ON bills.account_id = accounts.id
    ORDER BY due_date ASC, bills.id ASC
  `);
}

export async function createBill(
  name: string,
  amount: number,
  dueDate: string,
  frequency: string,
  category: string,
  accountId: number | null,
  autopay: boolean,
  notes: string,
) {
  const db = await getDb();

  return db.execute(
    `
    INSERT INTO bills
      (
        name,
        amount,
        due_date,
        frequency,
        category,
        account_id,
        autopay,
        is_paid,
        notes
      )
    VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8)
    `,
    [
      name.trim(),
      amount,
      dueDate,
      frequency,
      category.trim(),
      accountId,
      autopay ? 1 : 0,
      notes.trim(),
    ],
  );
}

export async function updateBillById(
  id: number,
  name: string,
  amount: number,
  dueDate: string,
  frequency: string,
  category: string,
  accountId: number | null,
  autopay: boolean,
  isPaid: boolean,
  notes: string,
) {
  const db = await getDb();

  const result = await db.execute(
    `
    UPDATE bills
    SET name = $1,
        amount = $2,
        due_date = $3,
        frequency = $4,
        category = $5,
        account_id = $6,
        autopay = $7,
        is_paid = $8,
        notes = $9
    WHERE id = $10
    `,
    [
      name.trim(),
      amount,
      dueDate,
      frequency,
      category.trim(),
      accountId,
      autopay ? 1 : 0,
      isPaid ? 1 : 0,
      notes.trim(),
      id,
    ],
  );

  if (result.rowsAffected === 0) {
    throw new Error("The selected bill no longer exists.");
  }

  return result;
}

export async function deleteBillById(id: number) {
  const db = await getDb();

  const result = await db.execute("DELETE FROM bills WHERE id = $1", [id]);

  if (result.rowsAffected === 0) {
    throw new Error("The selected bill no longer exists.");
  }

  return result;
}
