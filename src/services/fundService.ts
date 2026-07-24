import { getDb } from "../database";
import type { Fund } from "../types";

export async function getFunds() {
  const db = await getDb();

  return db.select<Fund[]>(`
    SELECT
      funds.*,
      accounts.name AS linked_account_name,
      accounts.balance AS linked_account_balance
    FROM funds
    LEFT JOIN accounts
      ON funds.linked_account_id = accounts.id
    ORDER BY funds.id DESC
  `);
}

export async function createFund(
  name: string,
  targetAmount: number | null,
  currentAmount: number,
  linkedAccountId: number | null,
  monthlyContribution: number | null,
  dueDate: string | null,
  notes: string,
) {
  const db = await getDb();

  const storedCurrentAmount = linkedAccountId === null ? currentAmount : 0;

  return db.execute(
    `
    INSERT INTO funds
      (
        name,
        target_amount,
        current_amount,
        linked_account_id,
        monthly_contribution,
        due_date,
        notes
      )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      name.trim(),
      targetAmount,
      storedCurrentAmount,
      linkedAccountId,
      monthlyContribution,
      dueDate,
      notes.trim(),
    ],
  );
}

export async function updateFundById(
  id: number,
  name: string,
  targetAmount: number | null,
  currentAmount: number,
  linkedAccountId: number | null,
  monthlyContribution: number | null,
  dueDate: string | null,
  notes: string,
) {
  const db = await getDb();

  const storedCurrentAmount = linkedAccountId === null ? currentAmount : 0;

  const result = await db.execute(
    `
    UPDATE funds
    SET name = $1,
        target_amount = $2,
        current_amount = $3,
        linked_account_id = $4,
        monthly_contribution = $5,
        due_date = $6,
        notes = $7
    WHERE id = $8
    `,
    [
      name.trim(),
      targetAmount,
      storedCurrentAmount,
      linkedAccountId,
      monthlyContribution,
      dueDate,
      notes.trim(),
      id,
    ],
  );

  if (result.rowsAffected === 0) {
    throw new Error("The selected fund no longer exists.");
  }

  return result;
}

export async function deleteFundById(id: number) {
  const db = await getDb();

  const result = await db.execute("DELETE FROM funds WHERE id = $1", [id]);

  if (result.rowsAffected === 0) {
    throw new Error("The selected fund no longer exists.");
  }

  return result;
}
