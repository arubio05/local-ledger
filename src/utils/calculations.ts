import type { Account, Budget, Transaction } from "../types";

export function calculateCashTotal(accounts: Account[]) {
  return accounts
    .filter(
      (a) =>
        a.account_type === "Checking" ||
        a.account_type === "Savings" ||
        a.account_type === "Cash"
    )
    .reduce((sum, a) => sum + a.balance, 0);
}

export function calculateCreditTotal(accounts: Account[]) {
  return accounts
    .filter((a) => a.account_type === "Credit Card")
    .reduce((sum, a) => sum + a.balance, 0);
}

export function calculateMonthlySpending(transactions: Transaction[]) {
  return transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

export function getRecentTransactions(transactions: Transaction[]) {
  return transactions.slice(0, 5);
}

export function calculateCategorySummary(transactions: Transaction[]) {
  return transactions
    .filter((t) => t.amount < 0)
    .reduce((summary: Record<string, number>, transaction) => {
      summary[transaction.category] =
        (summary[transaction.category] || 0) + Math.abs(transaction.amount);

      return summary;
    }, {});
}

export function calculateBudgetProgress(
  budgets: Budget[],
  categorySummary: Record<string, number>
) {
  return budgets.map((budget) => {
    const spent = categorySummary[budget.category] || 0;

    const percent =
      budget.monthly_limit > 0
        ? Math.min((spent / budget.monthly_limit) * 100, 100)
        : 0;

    return {
      ...budget,
      spent,
      percent,
    };
  });
}