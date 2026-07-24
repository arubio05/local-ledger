import { useMemo, useState } from "react";

import {
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  PiggyBank,
  Wallet,
} from "lucide-react";

import type { BudgetGroup, BudgetItem, Transaction } from "../types";

import { CashFlowSankeyChart } from "../components/CashFlowSankeyChart";

import {
  buildCashFlowReport,
  type CashFlowViewMode,
} from "../utils/cashFlowSankey";

type Props = {
  transactions: Transaction[];
  budgetItems: BudgetItem[];
  budgetGroups: BudgetGroup[];

  selectedMonth: string;
  setSelectedMonth: (value: string) => void;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatMonth(value: string) {
  if (!value) {
    return "Selected Month";
  }

  const [year, month] = value.split("-").map(Number);

  if (!year || !month) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

export function ReportsPage({
  transactions,
  budgetItems,
  budgetGroups,
  selectedMonth,
  setSelectedMonth,
}: Props) {
  const [viewMode, setViewMode] = useState<CashFlowViewMode>("both");

  const report = useMemo(
    () =>
      buildCashFlowReport(
        transactions,
        budgetItems,
        budgetGroups,
        selectedMonth,
        viewMode,
      ),
    [transactions, budgetItems, budgetGroups, selectedMonth, viewMode],
  );

  return (
    <>
      <header className="reports-page-header">
        <div>
          <h2>Reports</h2>

          <p className="page-subtitle">
            Follow how income moves through your financial plan.
          </p>
        </div>

        <input
          className="month-picker"
          type="month"
          value={selectedMonth}
          onChange={(event) => setSelectedMonth(event.target.value)}
        />
      </header>

      <section className="reports-summary-grid">
        <article className="reports-summary-card">
          <div className="reports-summary-icon reports-income-icon">
            <ArrowUpRight size={20} />
          </div>

          <div>
            <p>Total Income</p>
            <h3>{formatCurrency(report.income)}</h3>
            <span>{formatMonth(selectedMonth)}</span>
          </div>
        </article>

        <article className="reports-summary-card">
          <div className="reports-summary-icon reports-expense-icon">
            <ArrowDownRight size={20} />
          </div>

          <div>
            <p>Total Expenses</p>
            <h3>{formatCurrency(report.expenses)}</h3>
            <span>Excludes savings allocations</span>
          </div>
        </article>

        <article className="reports-summary-card">
          <div className="reports-summary-icon reports-cash-flow-icon">
            <Wallet size={20} />
          </div>

          <div>
            <p>Net Cash Flow</p>

            <h3 className={report.netCashFlow >= 0 ? "positive" : "negative"}>
              {formatCurrency(report.netCashFlow)}
            </h3>

            <span>Income minus all outflow</span>
          </div>
        </article>

        <article className="reports-summary-card">
          <div className="reports-summary-icon reports-savings-icon">
            <PiggyBank size={20} />
          </div>

          <div>
            <p>Savings Rate</p>
            <h3>{report.savingsRate.toFixed(1)}%</h3>
            <span>{formatCurrency(report.savings)} allocated</span>
          </div>
        </article>
      </section>

      <section className="cash-flow-report-panel">
        <header className="cash-flow-report-header">
          <div>
            <span className="cash-flow-report-eyebrow">
              <CircleDollarSign size={16} />
              Cash Flow
            </span>

            <h3>{formatMonth(selectedMonth)}</h3>

            <p>
              Flow thickness represents the amount moving between income,
              groups, and categories.
            </p>
          </div>

          <div
            className="cash-flow-view-toggle"
            role="group"
            aria-label="Cash flow view"
          >
            <button
              type="button"
              className={viewMode === "categories" ? "active" : ""}
              onClick={() => setViewMode("categories")}
            >
              Categories
            </button>

            <button
              type="button"
              className={viewMode === "groups" ? "active" : ""}
              onClick={() => setViewMode("groups")}
            >
              Groups
            </button>

            <button
              type="button"
              className={viewMode === "both" ? "active" : ""}
              onClick={() => setViewMode("both")}
            >
              Both
            </button>
          </div>
        </header>

        <CashFlowSankeyChart data={report.sankey} />

        <footer className="cash-flow-report-footer">
          <span>
            Income: <strong>{formatCurrency(report.income)}</strong>
          </span>

          <span>
            Total outflow:{" "}
            <strong>{formatCurrency(report.totalOutflow)}</strong>
          </span>

          <span>
            Difference:{" "}
            <strong
              className={report.netCashFlow >= 0 ? "positive" : "negative"}
            >
              {formatCurrency(report.netCashFlow)}
            </strong>
          </span>
        </footer>
      </section>

      <section className="reports-breakdown-grid">
        <article className="panel reports-breakdown-panel">
          <header className="reports-breakdown-header">
            <div>
              <h3>Income Breakdown</h3>
              <p>Where this month’s money came from</p>
            </div>

            <strong>{formatCurrency(report.income)}</strong>
          </header>

          {report.incomeBreakdown.length === 0 ? (
            <div className="reports-breakdown-empty">
              No income transactions for this month.
            </div>
          ) : (
            <div className="reports-breakdown-list">
              {report.incomeBreakdown.map((item) => (
                <div className="reports-breakdown-row" key={item.name}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.percentage.toFixed(1)}% of income</span>
                  </div>

                  <strong className="positive">
                    {formatCurrency(item.amount)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="panel reports-breakdown-panel">
          <header className="reports-breakdown-header">
            <div>
              <h3>Outflow Breakdown</h3>
              <p>Where this month’s money went</p>
            </div>

            <strong>{formatCurrency(report.totalOutflow)}</strong>
          </header>

          {report.expenseBreakdown.length === 0 ? (
            <div className="reports-breakdown-empty">
              No outflow transactions for this month.
            </div>
          ) : (
            <div className="reports-breakdown-list">
              {report.expenseBreakdown.map((item) => (
                <div className="reports-breakdown-row" key={item.name}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.percentage.toFixed(1)}% of outflow</span>
                  </div>

                  <strong className="negative">
                    {formatCurrency(item.amount)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </>
  );
}
