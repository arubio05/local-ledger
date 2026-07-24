import {
  AlertTriangle,
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  CalendarClock,
  CircleDollarSign,
  CreditCard,
  Landmark,
  Lightbulb,
  PiggyBank,
  Plus,
  ReceiptText,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";

import type {
  Account,
  Budget,
  Debt,
  Fund,
  Goal,
  RecurringTransaction,
  ReportSummary,
  Transaction,
} from "../types";

import type { Page } from "../types/navigation";

import { ExpenseDonutChart } from "../components/ExpenseDonutChart";
import { BudgetVsActualChart } from "../components/BudgetVsActualChart";
import { MonthlySpendingTrendChart } from "../components/MonthlySpendingTrendChart";

type DashboardBudgetProgress = {
  id: number;
  budget_month?: string;

  name?: string;
  category?: string;

  expected_amount?: number;
  monthly_limit?: number;

  actual_amount?: number;
  spent?: number;

  percent: number;
};

type ChartBudgetProgress = Budget & {
  spent: number;
  percent: number;
};

type FinancialInsight = {
  id: string;
  title: string;
  message: string;
  type: "positive" | "warning" | "neutral";
};

type Props = {
  selectedMonth: string;
  setSelectedMonth: (value: string) => void;
  setPage: (page: Page) => void;

  netWorth: number;
  cashTotal: number;

  recentTransactions: Transaction[];
  categorySummary: Record<string, number>;
  budgetProgress: DashboardBudgetProgress[];

  transactions: Transaction[];
  goals: Goal[];
  funds: Fund[];
  debts: Debt[];
  accounts: Account[];
  recurringTransactions: RecurringTransaction[];

  report: ReportSummary;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatShortDate(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function getDaysUntil(dateValue: string) {
  const today = new Date();
  const dueDate = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(dueDate.getTime())) {
    return Number.POSITIVE_INFINITY;
  }

  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  return Math.ceil(
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
}

function getDueLabel(dateValue: string) {
  const days = getDaysUntil(dateValue);

  if (!Number.isFinite(days)) {
    return "No valid date";
  }

  if (days < 0) {
    const overdueDays = Math.abs(days);

    return `${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue`;
  }

  if (days === 0) {
    return "Today";
  }

  if (days === 1) {
    return "Tomorrow";
  }

  return `In ${days} days`;
}

function getPreviousMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);

  if (!year || !monthNumber) {
    return "";
  }

  const date = new Date(year, monthNumber - 2, 1);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

function getTransactionIcon(transaction: Transaction) {
  if (transaction.amount >= 0) {
    return <ArrowUpRight size={18} strokeWidth={2} />;
  }

  return <ReceiptText size={18} strokeWidth={2} />;
}

export function DashboardPage({
  selectedMonth,
  setSelectedMonth,
  setPage,
  netWorth,
  cashTotal,
  recentTransactions,
  categorySummary,
  budgetProgress,
  transactions,
  goals,
  funds,
  debts,
  accounts,
  recurringTransactions,
  report,
}: Props) {
  const totalDebt = debts.reduce(
    (sum, debt) => sum + Math.max(debt.current_balance, 0),
    0,
  );

  const totalFundBalance = funds.reduce((sum, fund) => {
    const currentAmount =
      fund.linked_account_balance ?? fund.current_amount ?? 0;

    return sum + Math.max(currentAmount, 0);
  }, 0);

  const totalAccountBalance = accounts.reduce(
    (sum, account) => sum + account.balance,
    0,
  );

  const selectedMonthTransactions = transactions.filter((transaction) =>
    transaction.date.startsWith(selectedMonth),
  );

  const previousMonth = getPreviousMonth(selectedMonth);

  const previousMonthTransactions = transactions.filter((transaction) =>
    transaction.date.startsWith(previousMonth),
  );

  const previousMonthExpenses = previousMonthTransactions
    .filter((transaction) => transaction.amount < 0)
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

  const expenseDifference =
    previousMonthExpenses > 0
      ? ((report.expenses - previousMonthExpenses) / previousMonthExpenses) *
        100
      : 0;

  const upcomingRecurring = [...recurringTransactions]
    .filter((item) => item.next_due_date)
    .filter((item) => {
      const daysUntil = getDaysUntil(item.next_due_date);

      return Number.isFinite(daysUntil) && daysUntil >= -7;
    })
    .sort((first, second) => {
      const firstDate = new Date(`${first.next_due_date}T00:00:00`).getTime();

      const secondDate = new Date(`${second.next_due_date}T00:00:00`).getTime();

      return firstDate - secondDate;
    })
    .slice(0, 5);

  const chartBudgetProgress: ChartBudgetProgress[] = budgetProgress.map(
    (budget) => {
      const monthlyLimit = budget.expected_amount ?? budget.monthly_limit ?? 0;

      const spentAmount = budget.actual_amount ?? budget.spent ?? 0;

      const calculatedPercent =
        monthlyLimit > 0 ? (Math.abs(spentAmount) / monthlyLimit) * 100 : 0;

      return {
        id: budget.id,
        budget_month: budget.budget_month ?? selectedMonth,
        category: budget.name ?? budget.category ?? "Uncategorized",
        monthly_limit: monthlyLimit,
        spent: Math.abs(spentAmount),
        percent:
          Number.isFinite(budget.percent) && budget.percent >= 0
            ? budget.percent
            : calculatedPercent,
      };
    },
  );

  const budgetAlerts = chartBudgetProgress
    .filter((budget) => budget.percent >= 80)
    .sort((first, second) => second.percent - first.percent)
    .slice(0, 5);

  const highestExpenseCategory = Object.entries(categorySummary)
    .filter(([, value]) => value > 0)
    .sort((first, second) => second[1] - first[1])[0];

  const strongestGoal = [...goals]
    .filter((goal) => goal.target_amount > 0)
    .sort((first, second) => {
      const firstCurrent =
        first.linked_account_balance ?? first.current_amount ?? 0;

      const secondCurrent =
        second.linked_account_balance ?? second.current_amount ?? 0;

      return (
        secondCurrent / second.target_amount -
        firstCurrent / first.target_amount
      );
    })[0];

  const financialInsights: FinancialInsight[] = [];

  if (previousMonthExpenses > 0) {
    if (expenseDifference < 0) {
      financialInsights.push({
        id: "spending-change",
        title: "Spending improved",
        message: `You spent ${Math.abs(expenseDifference).toFixed(
          0,
        )}% less than last month.`,
        type: "positive",
      });
    } else if (expenseDifference > 0) {
      financialInsights.push({
        id: "spending-change",
        title: "Spending increased",
        message: `You spent ${expenseDifference.toFixed(
          0,
        )}% more than last month.`,
        type: "warning",
      });
    }
  }

  if (highestExpenseCategory) {
    const [category, value] = highestExpenseCategory;

    const percentage =
      report.expenses > 0 ? (value / report.expenses) * 100 : 0;

    financialInsights.push({
      id: "largest-category",
      title: "Largest expense category",
      message: `${category} represents ${percentage.toFixed(
        0,
      )}% of this month's expenses.`,
      type: percentage >= 50 ? "warning" : "neutral",
    });
  }

  if (strongestGoal) {
    const currentAmount =
      strongestGoal.linked_account_balance ?? strongestGoal.current_amount ?? 0;

    const percentage =
      strongestGoal.target_amount > 0
        ? Math.min((currentAmount / strongestGoal.target_amount) * 100, 100)
        : 0;

    financialInsights.push({
      id: "goal-progress",
      title: "Goal progress",
      message: `${strongestGoal.name} is ${percentage.toFixed(0)}% complete.`,
      type: "positive",
    });
  }

  if (upcomingRecurring.length > 0) {
    const nextItem = upcomingRecurring[0];

    financialInsights.push({
      id: "next-recurring",
      title: "Coming up",
      message: `${nextItem.merchant} is ${getDueLabel(
        nextItem.next_due_date,
      ).toLowerCase()} for ${formatCurrency(Math.abs(nextItem.amount))}.`,
      type: "neutral",
    });
  }

  if (report.savingsRate < 0) {
    financialInsights.push({
      id: "negative-savings",
      title: "Negative cash flow",
      message: "Expenses are currently higher than income for this month.",
      type: "warning",
    });
  }

  const displayedInsights = financialInsights.slice(0, 4);
  const activeGoals = goals.slice(0, 4);
  const activeFunds = funds.slice(0, 4);

  const savingsRate = Number.isFinite(report.savingsRate)
    ? report.savingsRate
    : 0;

  const netCashFlow = Number.isFinite(report.netCashFlow)
    ? report.netCashFlow
    : report.income - report.expenses;

  return (
    <>
      <header className="dashboard-header">
        <div>
          <h2>Dashboard</h2>

          <p className="page-subtitle">
            Your financial overview for {selectedMonth}
          </p>
        </div>

        <input
          className="month-picker"
          type="month"
          value={selectedMonth}
          onChange={(event) => setSelectedMonth(event.target.value)}
        />
      </header>

      <section className="dashboard-summary-grid">
        <article className="dashboard-summary-card">
          <div className="dashboard-summary-icon dashboard-icon-blue">
            <Landmark size={20} />
          </div>

          <div>
            <p>Net Worth</p>
            <h3>{formatCurrency(netWorth)}</h3>
            <span>Total assets minus liabilities</span>
          </div>
        </article>

        <article className="dashboard-summary-card">
          <div className="dashboard-summary-icon dashboard-icon-green">
            <Wallet size={20} />
          </div>

          <div>
            <p>Cash Available</p>
            <h3>{formatCurrency(cashTotal)}</h3>
            <span>{accounts.length} active accounts</span>
          </div>
        </article>

        <article className="dashboard-summary-card">
          <div className="dashboard-summary-icon dashboard-icon-red">
            <CreditCard size={20} />
          </div>

          <div>
            <p>Debt Remaining</p>
            <h3>{formatCurrency(totalDebt)}</h3>
            <span>{debts.length} tracked debts</span>
          </div>
        </article>

        <article className="dashboard-summary-card">
          <div className="dashboard-summary-icon dashboard-icon-purple">
            <PiggyBank size={20} />
          </div>

          <div>
            <p>Savings Rate</p>
            <h3>{savingsRate.toFixed(1)}%</h3>
            <span>{formatCurrency(report.savings)} saved this month</span>
          </div>
        </article>
      </section>

      <section className="dashboard-quick-actions">
        <button onClick={() => setPage("transactions")}>
          <Plus size={17} />
          Transaction
        </button>

        <button onClick={() => setPage("transfers")}>
          <ArrowLeftRight size={17} />
          Transfer
        </button>

        <button onClick={() => setPage("budget")}>
          <CircleDollarSign size={17} />
          Budget Item
        </button>

        <button onClick={() => setPage("goals")}>
          <Target size={17} />
          Goal
        </button>

        <button onClick={() => setPage("funds")}>
          <PiggyBank size={17} />
          Fund
        </button>

        <button onClick={() => setPage("debt")}>
          <CreditCard size={17} />
          Debt
        </button>
      </section>

      <section className="dashboard-cash-flow-strip">
        <article>
          <div className="cash-flow-label">
            <ArrowUpRight size={18} />
            <span>Income</span>
          </div>

          <strong className="positive">{formatCurrency(report.income)}</strong>
        </article>

        <article>
          <div className="cash-flow-label">
            <ArrowDownRight size={18} />
            <span>Expenses</span>
          </div>

          <strong className="negative">
            {formatCurrency(report.expenses)}
          </strong>
        </article>

        <article>
          <div className="cash-flow-label">
            <PiggyBank size={18} />
            <span>Savings</span>
          </div>

          <strong className={report.savings >= 0 ? "positive" : "negative"}>
            {formatCurrency(report.savings)}
          </strong>
        </article>

        <article>
          <div className="cash-flow-label">
            <Wallet size={18} />
            <span>Net Cash Flow</span>
          </div>

          <strong className={netCashFlow >= 0 ? "positive" : "negative"}>
            {formatCurrency(netCashFlow)}
          </strong>
        </article>
      </section>

      {displayedInsights.length > 0 && (
        <section className="dashboard-insights-panel">
          <div className="dashboard-insights-heading">
            <div className="dashboard-insights-icon">
              <Lightbulb size={20} />
            </div>

            <div>
              <h3>Financial Insights</h3>
              <p>Highlights based on your current data</p>
            </div>
          </div>

          <div className="dashboard-insights-grid">
            {displayedInsights.map((insight) => (
              <article
                key={insight.id}
                className={`dashboard-insight-card dashboard-insight-${insight.type}`}
              >
                <div className="dashboard-insight-icon">
                  {insight.type === "positive" ? (
                    <TrendingUp size={18} />
                  ) : insight.type === "warning" ? (
                    <AlertTriangle size={18} />
                  ) : (
                    <Lightbulb size={18} />
                  )}
                </div>

                <div>
                  <strong>{insight.title}</strong>
                  <p>{insight.message}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="dashboard-main-grid">
        <BudgetVsActualChart budgetProgress={chartBudgetProgress} />
        <ExpenseDonutChart categorySummary={categorySummary} />
      </section>

      <section className="dashboard-smart-grid">
        <article className="panel dashboard-widget">
          <div className="dashboard-widget-header">
            <div>
              <h3>Upcoming Recurring</h3>
              <p>Bills, subscriptions, and recurring income</p>
            </div>

            <CalendarClock size={21} />
          </div>

          {upcomingRecurring.length === 0 ? (
            <div className="dashboard-widget-empty">
              <p>No upcoming recurring transactions.</p>
            </div>
          ) : (
            <div className="dashboard-recurring-list">
              {upcomingRecurring.map((item) => {
                const daysUntil = getDaysUntil(item.next_due_date);
                const isOverdue = daysUntil < 0;

                return (
                  <div className="dashboard-recurring-card" key={item.id}>
                    <div
                      className={`dashboard-recurring-icon ${
                        item.amount >= 0
                          ? "dashboard-recurring-income"
                          : "dashboard-recurring-expense"
                      }`}
                    >
                      {item.amount >= 0 ? (
                        <ArrowUpRight size={18} />
                      ) : (
                        <CalendarClock size={18} />
                      )}
                    </div>

                    <div className="dashboard-recurring-details">
                      <strong>{item.merchant}</strong>

                      <p>
                        {formatShortDate(item.next_due_date)} ·{" "}
                        <span className={isOverdue ? "negative" : ""}>
                          {getDueLabel(item.next_due_date)}
                        </span>
                      </p>
                    </div>

                    <div className="dashboard-recurring-value">
                      <strong
                        className={item.amount >= 0 ? "positive" : "negative"}
                      >
                        {item.amount >= 0 ? "+" : "-"}
                        {formatCurrency(Math.abs(item.amount))}
                      </strong>

                      <span>{item.frequency}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <article className="panel dashboard-widget">
          <div className="dashboard-widget-header">
            <div>
              <h3>Budget Alerts</h3>
              <p>Categories at or above 80%</p>
            </div>

            <AlertTriangle size={21} />
          </div>

          {budgetAlerts.length === 0 ? (
            <div className="dashboard-widget-empty">
              <p>No budget categories need attention.</p>
            </div>
          ) : (
            <div className="dashboard-widget-list">
              {budgetAlerts.map((budget) => {
                const progressWidth = Math.min(
                  Math.max(budget.percent, 0),
                  100,
                );

                const remaining = budget.monthly_limit - budget.spent;

                const isOverBudget = remaining < 0;

                return (
                  <div className="dashboard-budget-alert" key={budget.id}>
                    <div className="dashboard-budget-alert-heading">
                      <div>
                        <strong>{budget.category}</strong>
                        <p>{formatCurrency(budget.spent)} spent</p>
                      </div>

                      <span
                        className={
                          isOverBudget
                            ? "status-badge status-danger"
                            : "status-badge status-warning"
                        }
                      >
                        {budget.percent.toFixed(0)}%
                      </span>
                    </div>

                    <div className="dashboard-budget-numbers">
                      <span>
                        Budget
                        <strong>{formatCurrency(budget.monthly_limit)}</strong>
                      </span>

                      <span>
                        Spent
                        <strong>{formatCurrency(budget.spent)}</strong>
                      </span>

                      <span>
                        Remaining
                        <strong
                          className={remaining >= 0 ? "positive" : "negative"}
                        >
                          {formatCurrency(remaining)}
                        </strong>
                      </span>
                    </div>

                    <div className="dashboard-progress-track">
                      <div
                        className={
                          isOverBudget
                            ? "dashboard-progress-fill dashboard-progress-danger"
                            : "dashboard-progress-fill dashboard-progress-warning"
                        }
                        style={{ width: `${progressWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </section>

      <section className="dashboard-content-grid">
        <article className="panel dashboard-recent-panel">
          <div className="dashboard-widget-header">
            <div>
              <h3>Recent Transactions</h3>
              <p>Latest activity for the selected month</p>
            </div>

            <button
              className="dashboard-view-all-button"
              onClick={() => setPage("transactions")}
            >
              View All
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="dashboard-widget-empty">
              <p>No transactions for this month.</p>
            </div>
          ) : (
            <div className="dashboard-transaction-list">
              {recentTransactions.slice(0, 8).map((transaction) => (
                <div
                  className="dashboard-transaction-card"
                  key={transaction.id}
                >
                  <div
                    className={`dashboard-transaction-icon ${
                      transaction.amount >= 0
                        ? "dashboard-transaction-income"
                        : "dashboard-transaction-expense"
                    }`}
                  >
                    {getTransactionIcon(transaction)}
                  </div>

                  <div className="dashboard-transaction-details">
                    <strong>{transaction.merchant}</strong>

                    <p>
                      {transaction.category} ·{" "}
                      {transaction.account_name ?? "Unknown"}
                    </p>
                  </div>

                  <div className="dashboard-transaction-meta">
                    <strong
                      className={
                        transaction.amount >= 0 ? "positive" : "negative"
                      }
                    >
                      {transaction.amount >= 0 ? "+" : "-"}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </strong>

                    <span>{formatShortDate(transaction.date)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="panel dashboard-widget">
          <div className="dashboard-widget-header">
            <div>
              <h3>Goals</h3>
              <p>Your savings goals</p>
            </div>

            <Target size={21} />
          </div>

          {activeGoals.length === 0 ? (
            <div className="dashboard-widget-empty">
              <p>No goals have been created.</p>
            </div>
          ) : (
            <div className="dashboard-widget-list">
              {activeGoals.map((goal) => {
                const currentAmount =
                  goal.linked_account_balance ?? goal.current_amount ?? 0;

                const progressPercent =
                  goal.target_amount > 0
                    ? Math.min(
                        Math.max((currentAmount / goal.target_amount) * 100, 0),
                        100,
                      )
                    : 0;

                return (
                  <div className="dashboard-progress-item" key={goal.id}>
                    <div className="dashboard-progress-heading">
                      <div>
                        <strong>{goal.name}</strong>

                        <p>
                          {formatCurrency(currentAmount)} of{" "}
                          {formatCurrency(goal.target_amount)}
                        </p>
                      </div>

                      <span>{progressPercent.toFixed(0)}%</span>
                    </div>

                    <div className="dashboard-progress-track">
                      <div
                        className="dashboard-progress-fill dashboard-progress-success"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </section>

      <section className="dashboard-content-grid">
        <article className="panel dashboard-widget">
          <div className="dashboard-widget-header">
            <div>
              <h3>Sinking Funds</h3>
              <p>{formatCurrency(totalFundBalance)} currently saved</p>
            </div>

            <PiggyBank size={21} />
          </div>

          {activeFunds.length === 0 ? (
            <div className="dashboard-widget-empty">
              <p>No sinking funds have been created.</p>
            </div>
          ) : (
            <div className="dashboard-widget-list">
              {activeFunds.map((fund) => {
                const currentAmount =
                  fund.linked_account_balance ?? fund.current_amount ?? 0;

                const targetAmount = fund.target_amount ?? 0;

                const progressPercent =
                  targetAmount > 0
                    ? Math.min(
                        Math.max((currentAmount / targetAmount) * 100, 0),
                        100,
                      )
                    : 0;

                return (
                  <div className="dashboard-progress-item" key={fund.id}>
                    <div className="dashboard-progress-heading">
                      <div>
                        <strong>{fund.name}</strong>

                        <p>
                          {formatCurrency(currentAmount)}
                          {targetAmount > 0
                            ? ` of ${formatCurrency(targetAmount)}`
                            : ""}
                        </p>
                      </div>

                      <span>
                        {targetAmount > 0
                          ? `${progressPercent.toFixed(0)}%`
                          : formatCurrency(currentAmount)}
                      </span>
                    </div>

                    {targetAmount > 0 && (
                      <div className="dashboard-progress-track">
                        <div
                          className="dashboard-progress-fill dashboard-progress-blue"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <MonthlySpendingTrendChart transactions={transactions} />
      </section>

      <footer className="dashboard-footer-summary">
        <span>
          Account balances:{" "}
          <strong>{formatCurrency(totalAccountBalance)}</strong>
        </span>

        <span>
          Transactions this month:{" "}
          <strong>{selectedMonthTransactions.length}</strong>
        </span>

        <span>
          Recurring items: <strong>{recurringTransactions.length}</strong>
        </span>
      </footer>
    </>
  );
}
