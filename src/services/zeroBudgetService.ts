import { getDb } from "../database";
import type { BudgetGroup, BudgetItem } from "../types";

function isValidMonth(value: string) {
  if (!/^\d{4}-\d{2}$/.test(value)) return false;

  const [, month] = value.split("-").map(Number);

  return month >= 1 && month <= 12;
}

function getPreviousMonth(value: string) {
  const [year, month] = value.split("-").map(Number);
  const date = new Date(year, month - 2, 1);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

export async function getBudgetGroups(month: string) {
  const db = await getDb();

  return db.select<BudgetGroup[]>(
    `
    SELECT *
    FROM budget_groups
    WHERE budget_month = $1
    ORDER BY sort_order, id
    `,
    [month],
  );
}

export async function getBudgetItems(month: string) {
  const db = await getDb();

  return db.select<BudgetItem[]>(
    `
    SELECT
      budget_items.*,
      budget_groups.name AS group_name,
      budget_groups.group_type AS group_type,
      CASE
        WHEN budget_groups.group_type = 'income' THEN
          COALESCE((
            SELECT SUM(transactions.amount)
            FROM transactions
            WHERE transactions.category = budget_items.name
              AND transactions.date LIKE $1 || '%'
              AND transactions.amount > 0
          ), 0)
        ELSE
          COALESCE((
            SELECT SUM(ABS(transactions.amount))
            FROM transactions
            WHERE transactions.category = budget_items.name
              AND transactions.date LIKE $1 || '%'
              AND transactions.amount < 0
          ), 0)
      END AS actual_amount
    FROM budget_items
    JOIN budget_groups
      ON budget_items.group_id = budget_groups.id
    WHERE budget_items.budget_month = $1
    ORDER BY
      budget_groups.sort_order,
      budget_items.sort_order,
      budget_items.id
    `,
    [month],
  );
}

export async function createDefaultBudgetGroups(month: string) {
  if (!isValidMonth(month)) {
    throw new Error("Invalid budget month.");
  }

  const db = await getDb();

  const groups: Array<[string, BudgetGroup["group_type"], number]> = [
    ["Income", "income", 1],
    ["Fixed Expenses", "expense", 2],
    ["Variable Expenses", "expense", 3],
    ["Debt", "debt", 4],
    ["Savings", "savings", 5],
  ];

  for (const [name, groupType, sortOrder] of groups) {
    await db.execute(
      `
      INSERT OR IGNORE INTO budget_groups
        (budget_month, name, group_type, sort_order)
      VALUES ($1, $2, $3, $4)
      `,
      [month, name, groupType, sortOrder],
    );
  }
}

export async function createBudgetItem(
  groupId: number,
  month: string,
  name: string,
  expectedAmount: number,
) {
  const db = await getDb();

  const result = await db.execute(
    `
    INSERT INTO budget_items
      (
        group_id,
        budget_month,
        name,
        expected_amount,
        actual_amount
      )
    VALUES ($1, $2, $3, $4, 0)
    `,
    [groupId, month, name.trim(), expectedAmount],
  );

  if (result.rowsAffected === 0) {
    throw new Error("The budget item was not created.");
  }

  return result;
}

export async function updateBudgetItemById(
  id: number,
  groupId: number,
  name: string,
  expectedAmount: number,
  _actualAmount: number,
) {
  const db = await getDb();

  const result = await db.execute(
    `
    UPDATE budget_items
    SET group_id = $1,
        name = $2,
        expected_amount = $3
    WHERE id = $4
    `,
    [groupId, name.trim(), expectedAmount, id],
  );

  if (result.rowsAffected === 0) {
    throw new Error("The selected budget item no longer exists.");
  }

  return result;
}

export async function deleteBudgetItemById(id: number) {
  const db = await getDb();

  const result = await db.execute("DELETE FROM budget_items WHERE id = $1", [
    id,
  ]);

  if (result.rowsAffected === 0) {
    throw new Error("The selected budget item no longer exists.");
  }

  return result;
}

async function copyBudgetItems(sourceMonth: string, destinationMonth: string) {
  const db = await getDb();

  await createDefaultBudgetGroups(destinationMonth);

  const sourceItems = await db.select<
    Array<{
      name: string;
      expected_amount: number;
      group_name: string;
    }>
  >(
    `
    SELECT
      budget_items.name,
      budget_items.expected_amount,
      budget_groups.name AS group_name
    FROM budget_items
    JOIN budget_groups
      ON budget_items.group_id = budget_groups.id
    WHERE budget_items.budget_month = $1
    `,
    [sourceMonth],
  );

  if (sourceItems.length === 0) return 0;

  const destinationGroups = await getBudgetGroups(destinationMonth);
  let copiedCount = 0;

  for (const item of sourceItems) {
    const matchingGroup = destinationGroups.find(
      (group) => group.name === item.group_name,
    );

    if (!matchingGroup) continue;

    const result = await db.execute(
      `
      INSERT OR IGNORE INTO budget_items
        (
          group_id,
          budget_month,
          name,
          expected_amount,
          actual_amount
        )
      VALUES ($1, $2, $3, $4, 0)
      `,
      [matchingGroup.id, destinationMonth, item.name, item.expected_amount],
    );

    copiedCount += result.rowsAffected;
  }

  return copiedCount;
}

export async function copyBudgetToNextMonth(
  currentMonth: string,
  nextMonth: string,
) {
  if (!isValidMonth(currentMonth) || !isValidMonth(nextMonth)) {
    throw new Error("Invalid budget month.");
  }

  return copyBudgetItems(currentMonth, nextMonth);
}

export async function copyBudgetFromPreviousMonth(currentMonth: string) {
  if (!isValidMonth(currentMonth)) {
    throw new Error("Invalid current budget month.");
  }

  return copyBudgetItems(getPreviousMonth(currentMonth), currentMonth);
}
