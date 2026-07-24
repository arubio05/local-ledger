import { createAccount, getAccounts } from "./accountService";
import { createTransaction } from "./transactionService";
import { createFund } from "./fundService";
import { createGoal } from "./goalService";
import { createDebt } from "./debtService";
import { createRecurringTransaction } from "./recurringTransactionService";

import {
  createDefaultBudgetGroups,
  getBudgetGroups,
  createBudgetItem,
} from "./zeroBudgetService";

export async function seedDemoData() {
  const month = new Date().toISOString().slice(0, 7);
  const today = new Date().toISOString().slice(0, 10);

  await createAccount("Chase Checking", "Checking", 4200);
  await createAccount("HYSA", "Savings", 10000);
  await createAccount("Bilt Card", "Credit Card", -760.71);
  await createAccount("Cash Wallet", "Cash", 120);

  const accounts = await getAccounts();

  const checking = accounts.find((account) => account.name === "Chase Checking");
  const hysa = accounts.find((account) => account.name === "HYSA");
  const card = accounts.find((account) => account.name === "Bilt Card");

  if (!checking || !hysa || !card) {
    throw new Error("Demo accounts were not created correctly.");
  }

  await createDefaultBudgetGroups(month);

  const groups = await getBudgetGroups(month);

  const incomeGroup = groups.find((group) => group.group_type === "income");
  const fixedGroup = groups.find((group) => group.name === "Fixed Expenses");
  const variableGroup = groups.find(
    (group) => group.name === "Variable Expenses"
  );
  const debtGroup = groups.find((group) => group.group_type === "debt");
  const savingsGroup = groups.find((group) => group.group_type === "savings");

  if (
    !incomeGroup ||
    !fixedGroup ||
    !variableGroup ||
    !debtGroup ||
    !savingsGroup
  ) {
    throw new Error("Demo budget groups were not created correctly.");
  }

  await createBudgetItem(incomeGroup.id, month, "Paycheck 1", 2500);
  await createBudgetItem(incomeGroup.id, month, "Paycheck 2", 2500);

  await createBudgetItem(fixedGroup.id, month, "Rent", 1800);
  await createBudgetItem(fixedGroup.id, month, "Internet", 80);
  await createBudgetItem(fixedGroup.id, month, "Subscriptions", 60);

  await createBudgetItem(variableGroup.id, month, "Groceries", 600);
  await createBudgetItem(variableGroup.id, month, "Gas", 250);
  await createBudgetItem(variableGroup.id, month, "Baby", 300);

  await createBudgetItem(debtGroup.id, month, "Personal Loan", 565);

  await createBudgetItem(savingsGroup.id, month, "Emergency Fund", 500);
  await createBudgetItem(savingsGroup.id, month, "Vacation", 200);

  await createTransaction(
    checking.id,
    today,
    "Paycheck 1",
    "Paycheck 1",
    2500,
    "Demo income"
  );

  await createTransaction(
    checking.id,
    today,
    "Rent",
    "Rent",
    -1800,
    "Demo rent"
  );

  await createTransaction(
    checking.id,
    today,
    "Costco",
    "Groceries",
    -145.22,
    "Demo groceries"
  );

  await createTransaction(
    checking.id,
    today,
    "Shell",
    "Gas",
    -62.5,
    "Demo gas"
  );

  await createTransaction(
    hysa.id,
    today,
    "Emergency Fund Transfer",
    "Emergency Fund",
    -500,
    "Demo savings"
  );

  await createTransaction(
    card.id,
    today,
    "Netflix",
    "Subscriptions",
    -22.99,
    "Demo subscription"
  );

  await createFund(
    "Emergency Fund",
    15000,
    10000,
    hysa.id,
    500,
    null,
    "Demo emergency savings"
  );

  await createFund(
    "Vacation",
    3000,
    600,
    null,
    200,
    null,
    "Demo sinking fund"
  );

  await createGoal(
    "Reach $100k Net Worth",
    100000,
    13559.29,
    null,
    "Demo long-term goal"
  );

  await createDebt(
    "Personal Loan",
    25000,
    25000,
    11.75,
    565,
    200,
    today,
    "Demo debt"
  );

  await createRecurringTransaction(
    checking.id,
    "Paycheck 1",
    "Paycheck 1",
    2500,
    "Biweekly",
    today,
    "Demo recurring income",
    false,
    true
  );

  await createRecurringTransaction(
    checking.id,
    "Rent",
    "Rent",
    -1800,
    "Monthly",
    today,
    "Demo recurring rent",
    true,
    true
  );

  await createRecurringTransaction(
    card.id,
    "Netflix",
    "Subscriptions",
    -22.99,
    "Monthly",
    today,
    "Demo subscription",
    true,
    true
  );
}