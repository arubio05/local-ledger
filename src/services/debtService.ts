import { getDb } from "../database";
import type { Debt } from "../types";

export async function getDebts() {
  const db = await getDb();

  return db.select<Debt[]>(`
    SELECT *
    FROM debts
    ORDER BY current_balance DESC, name COLLATE NOCASE, id
  `);
}

export async function createDebt(
  name: string,
  originalBalance: number,
  currentBalance: number,
  interestRate: number,
  minimumPayment: number,
  extraPayment: number,
  dueDate: string | null,
  notes: string,
) {
  const db = await getDb();

  return db.execute(
    `
    INSERT INTO debts
      (
        name,
        original_balance,
        current_balance,
        interest_rate,
        minimum_payment,
        extra_payment,
        due_date,
        notes
      )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      name.trim(),
      originalBalance,
      currentBalance,
      interestRate,
      minimumPayment,
      extraPayment,
      dueDate,
      notes.trim(),
    ],
  );
}

export async function updateDebtById(
  id: number,
  name: string,
  originalBalance: number,
  currentBalance: number,
  interestRate: number,
  minimumPayment: number,
  extraPayment: number,
  dueDate: string | null,
  notes: string,
) {
  const db = await getDb();

  const result = await db.execute(
    `
    UPDATE debts
    SET name = $1,
        original_balance = $2,
        current_balance = $3,
        interest_rate = $4,
        minimum_payment = $5,
        extra_payment = $6,
        due_date = $7,
        notes = $8
    WHERE id = $9
    `,
    [
      name.trim(),
      originalBalance,
      currentBalance,
      interestRate,
      minimumPayment,
      extraPayment,
      dueDate,
      notes.trim(),
      id,
    ],
  );

  if (result.rowsAffected === 0) {
    throw new Error("The selected debt no longer exists.");
  }

  return result;
}

export async function deleteDebtById(id: number) {
  const db = await getDb();

  const result = await db.execute("DELETE FROM debts WHERE id = $1", [id]);

  if (result.rowsAffected === 0) {
    throw new Error("The selected debt no longer exists.");
  }

  return result;
}
