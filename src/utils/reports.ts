import type { Transaction, ReportSummary } from "../types";

export function getMonthlyReport(
  transactions: Transaction[],
  selectedMonth: string
): ReportSummary {
  const monthTransactions = transactions.filter((transaction) =>
    transaction.date.startsWith(selectedMonth)
  );

  const income = monthTransactions
    .filter((transaction) => transaction.amount > 0)
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const expenses = monthTransactions
    .filter((transaction) => transaction.amount < 0)
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

  const categorySummary = monthTransactions
    .filter((transaction) => transaction.amount < 0)
    .reduce((summary: Record<string, number>, transaction) => {
      summary[transaction.category] =
        (summary[transaction.category] || 0) + Math.abs(transaction.amount);

      return summary;
    }, {});

  const savings = income - expenses;

  const savingsRate =
    income > 0 ? (savings / income) * 100 : 0;

  return {
    income,
    expenses,
    savings,
    savingsRate,
    netCashFlow: savings,
    categorySummary,
  };
}