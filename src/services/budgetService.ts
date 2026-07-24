import { getDb } from "../database";
import type { Budget } from "../types";

export async function getBudgets() {
  const db = await getDb();

  return db.select<Budget[]>(`
    SELECT *
    FROM budgets
    ORDER BY budget_month DESC, category COLLATE NOCASE, id
  `);
}

export async function createBudget(
  budgetMonth: string,
  category: string,
  monthlyLimit: number,
) {
  const db = await getDb();

  return db.execute(
    `
    INSERT INTO budgets
      (budget_month, category, monthly_limit)
    VALUES ($1, $2, $3)
    `,
    [budgetMonth, category.trim(), monthlyLimit],
  );
}

export async function updateBudgetById(
  id: number,
  budgetMonth: string,
  category: string,
  monthlyLimit: number,
) {
  const db = await getDb();

  const result = await db.execute(
    `
    UPDATE budgets
    SET budget_month = $1,
        category = $2,
        monthly_limit = $3
    WHERE id = $4
    `,
    [budgetMonth, category.trim(), monthlyLimit, id],
  );

  if (result.rowsAffected === 0) {
    throw new Error("The selected budget no longer exists.");
  }

  return result;
}

export async function deleteBudgetById(id: number) {
  const db = await getDb();

  const result = await db.execute("DELETE FROM budgets WHERE id = $1", [id]);

  if (result.rowsAffected === 0) {
    throw new Error("The selected budget no longer exists.");
  }

  return result;
}
