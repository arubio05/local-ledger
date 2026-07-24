import { getDb } from "../database";
import type { Goal } from "../types";

export async function getGoals() {
  const db = await getDb();

  return db.select<Goal[]>(`
    SELECT
      goals.*,
      accounts.name AS linked_account_name,
      accounts.balance AS linked_account_balance
    FROM goals
    LEFT JOIN accounts
      ON goals.linked_account_id = accounts.id
    ORDER BY goals.id DESC
  `);
}

export async function createGoal(
  name: string,
  targetAmount: number,
  currentAmount: number,
  linkedAccountId: number | null,
  notes: string,
) {
  const db = await getDb();

  const storedCurrentAmount = linkedAccountId === null ? currentAmount : 0;

  return db.execute(
    `
    INSERT INTO goals
      (
        name,
        target_amount,
        current_amount,
        linked_account_id,
        notes
      )
    VALUES ($1, $2, $3, $4, $5)
    `,
    [
      name.trim(),
      targetAmount,
      storedCurrentAmount,
      linkedAccountId,
      notes.trim(),
    ],
  );
}

export async function updateGoalById(
  id: number,
  name: string,
  targetAmount: number,
  currentAmount: number,
  linkedAccountId: number | null,
  notes: string,
) {
  const db = await getDb();

  const storedCurrentAmount = linkedAccountId === null ? currentAmount : 0;

  const result = await db.execute(
    `
    UPDATE goals
    SET name = $1,
        target_amount = $2,
        current_amount = $3,
        linked_account_id = $4,
        notes = $5
    WHERE id = $6
    `,
    [
      name.trim(),
      targetAmount,
      storedCurrentAmount,
      linkedAccountId,
      notes.trim(),
      id,
    ],
  );

  if (result.rowsAffected === 0) {
    throw new Error("The selected goal no longer exists.");
  }

  return result;
}

export async function deleteGoalById(id: number) {
  const db = await getDb();

  const result = await db.execute("DELETE FROM goals WHERE id = $1", [id]);

  if (result.rowsAffected === 0) {
    throw new Error("The selected goal no longer exists.");
  }

  return result;
}
