import type { Account, Transaction, BudgetItem } from "../types";

import {
  calculateCashTotal,
  calculateCreditTotal,
  calculateMonthlySpending,
  getRecentTransactions,
  calculateCategorySummary,
} from "../utils/calculations";

export function useDashboard(
  accounts: Account[],
  transactions: Transaction[],
  budgetItems: BudgetItem[],
  selectedMonth: string
) {
  const cashTotal = calculateCashTotal(accounts);
  const creditTotal = calculateCreditTotal(accounts);
  const netWorth = cashTotal + creditTotal;

  const selectedMonthTransactions = transactions.filter((transaction) =>
    transaction.date.startsWith(selectedMonth)
  );

  const selectedMonthBudgetItems = budgetItems.filter((item) =>
    item.budget_month.startsWith(selectedMonth)
  );

  const monthlySpending = calculateMonthlySpending(selectedMonthTransactions);
  const recentTransactions = getRecentTransactions(selectedMonthTransactions);
  const categorySummary = calculateCategorySummary(selectedMonthTransactions);

  const budgetProgress = selectedMonthBudgetItems.map((item) => {
    const spent = item.actual_amount || 0;
    const expected = item.expected_amount || 0;

    const percent = expected > 0 ? Math.min((spent / expected) * 100, 100) : 0;

    return {
      id: item.id,
      category: item.name,
      budget_month: item.budget_month,
      monthly_limit: expected,
      spent,
      percent,
    };
  });

  return {
    cashTotal,
    creditTotal,
    netWorth,
    monthlySpending,
    recentTransactions,
    categorySummary,
    budgetProgress,
  };
}