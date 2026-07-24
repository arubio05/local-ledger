import { Fragment, useMemo, useState } from "react";

import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowRightLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Copy,
  CreditCard,
  Pencil,
  PiggyBank,
  Plus,
  ReceiptText,
  Save,
  Trash2,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";

import type { BudgetGroup, BudgetItem } from "../types";

import { useModal } from "../components/modal/ModalContext";

type Props = {
  budgetGroups: BudgetGroup[];
  budgetItems: BudgetItem[];

  zeroBudgetMonth: string;
  setZeroBudgetMonth: (value: string) => void;

  budgetItemGroupId: string;
  setBudgetItemGroupId: (value: string) => void;

  budgetItemName: string;
  setBudgetItemName: (value: string) => void;

  budgetItemExpected: string;
  setBudgetItemExpected: (value: string) => void;

  budgetItemActual: string;
  setBudgetItemActual: (value: string) => void;

  editingBudgetItemId: number | null;
  setEditingBudgetItemId: (value: number | null) => void;

  addBudgetItem: () => void | Promise<void>;
  updateBudgetItem: () => void | Promise<void>;
  deleteBudgetItem: (id: number) => void | Promise<void>;

  resetBudgetItemForm: () => void;

  loadZeroBudget: (month?: string) => void | Promise<void>;

  startTransactionFromBudget: (
    category: string,
    groupType?: string,
    suggestedAmount?: number,
  ) => void;

  copyCurrentBudgetToNextMonth: () => void | Promise<void>;
  copyPreviousBudgetIntoCurrentMonth: () => void | Promise<void>;
};

type BudgetInsight = {
  id: string;
  title: string;
  message: string;
  tone: "success" | "warning" | "danger" | "neutral";
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

function getGroupIcon(groupType: BudgetGroup["group_type"]) {
  switch (groupType) {
    case "income":
      return <TrendingUp size={18} />;

    case "expense":
      return <Wallet size={18} />;

    case "debt":
      return <CreditCard size={18} />;

    case "savings":
      return <PiggyBank size={18} />;

    default:
      return <CircleDollarSign size={18} />;
  }
}

function getGroupClass(groupType: BudgetGroup["group_type"]) {
  switch (groupType) {
    case "income":
      return "budget-group-income";

    case "expense":
      return "budget-group-expense";

    case "debt":
      return "budget-group-debt";

    case "savings":
      return "budget-group-savings";

    default:
      return "";
  }
}

function getBudgetStatus(
  percent: number,
  remaining: number,
  groupType?: string,
) {
  if (groupType === "income") {
    if (remaining >= 0) {
      return {
        label: "Received",
        badgeClass: "status-success",
        progressClass: "budget-progress-fill",
      };
    }

    return {
      label: "Pending",
      badgeClass: "status-warning",
      progressClass: "budget-progress-fill warning",
    };
  }

  if (remaining < 0) {
    return {
      label: "Over",
      badgeClass: "status-danger",
      progressClass: "budget-progress-fill over",
    };
  }

  if (percent >= 80) {
    return {
      label: "Close",
      badgeClass: "status-warning",
      progressClass: "budget-progress-fill warning",
    };
  }

  return {
    label: "On Track",
    badgeClass: "status-success",
    progressClass: "budget-progress-fill",
  };
}

export function BudgetPage({
  budgetGroups,
  budgetItems,

  zeroBudgetMonth,
  setZeroBudgetMonth,

  budgetItemGroupId,
  setBudgetItemGroupId,

  budgetItemName,
  setBudgetItemName,

  budgetItemExpected,
  setBudgetItemExpected,

  budgetItemActual,
  setBudgetItemActual,

  editingBudgetItemId,
  setEditingBudgetItemId,

  addBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,

  resetBudgetItemForm,
  loadZeroBudget,

  startTransactionFromBudget,

  copyCurrentBudgetToNextMonth,
  copyPreviousBudgetIntoCurrentMonth,
}: Props) {
  const { openConfirm } = useModal();

  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(
    new Set(),
  );

  const incomeAssigned = budgetItems
    .filter((item) => item.group_type === "income")
    .reduce((sum, item) => sum + item.expected_amount, 0);

  const outflowAssigned = budgetItems
    .filter((item) => item.group_type !== "income")
    .reduce((sum, item) => sum + item.expected_amount, 0);

  const incomeReceived = budgetItems
    .filter((item) => item.group_type === "income")
    .reduce((sum, item) => sum + item.actual_amount, 0);

  const outflowSpent = budgetItems
    .filter((item) => item.group_type !== "income")
    .reduce((sum, item) => sum + item.actual_amount, 0);

  const toBeBudgeted = incomeAssigned - outflowAssigned;
  const actualLeftOver = incomeReceived - outflowSpent;

  const savingsItems = budgetItems.filter(
    (item) => item.group_type === "savings",
  );

  const savingsAssigned = savingsItems.reduce(
    (sum, item) => sum + item.expected_amount,
    0,
  );

  const savingsActivity = savingsItems.reduce(
    (sum, item) => sum + item.actual_amount,
    0,
  );

  const savingsRate =
    incomeReceived > 0 ? (savingsActivity / incomeReceived) * 100 : 0;

  const itemsWithActivity = budgetItems.filter(
    (item) => item.actual_amount > 0,
  ).length;

  const budgetCompletion =
    budgetItems.length > 0 ? (itemsWithActivity / budgetItems.length) * 100 : 0;

  const budgetInsights = useMemo<BudgetInsight[]>(() => {
    const insights: BudgetInsight[] = [];

    if (toBeBudgeted === 0 && incomeAssigned > 0) {
      insights.push({
        id: "balanced",
        title: "Budget balanced",
        message: "Every assigned dollar has a job.",
        tone: "success",
      });
    } else if (toBeBudgeted > 0) {
      insights.push({
        id: "unassigned",
        title: "Money ready to assign",
        message: `${formatCurrency(toBeBudgeted)} is still available.`,
        tone: "neutral",
      });
    } else {
      insights.push({
        id: "over-assigned",
        title: "Budget over assigned",
        message: `Reduce assignments by ${formatCurrency(
          Math.abs(toBeBudgeted),
        )}.`,
        tone: "danger",
      });
    }

    const overBudgetItems = budgetItems
      .filter((item) => item.group_type !== "income")
      .map((item) => ({
        item,
        remaining: item.expected_amount - item.actual_amount,
      }))
      .filter(({ remaining }) => remaining < 0)
      .sort((first, second) => first.remaining - second.remaining);

    if (overBudgetItems.length > 0) {
      const largest = overBudgetItems[0];

      insights.push({
        id: "largest-over-budget",
        title: `${largest.item.name} is over budget`,
        message: `Over by ${formatCurrency(Math.abs(largest.remaining))}.`,
        tone: "danger",
      });
    }

    const nearLimitItems = budgetItems
      .filter(
        (item) =>
          item.group_type !== "income" &&
          item.expected_amount > 0 &&
          item.actual_amount <= item.expected_amount,
      )
      .map((item) => ({
        item,
        percent: (item.actual_amount / item.expected_amount) * 100,
      }))
      .filter(({ percent }) => percent >= 80)
      .sort((first, second) => second.percent - first.percent);

    if (nearLimitItems.length > 0) {
      const closest = nearLimitItems[0];

      insights.push({
        id: "near-limit",
        title: `${closest.item.name} is getting close`,
        message: `${closest.percent.toFixed(0)}% of its budget has been used.`,
        tone: "warning",
      });
    }

    if (savingsAssigned > 0) {
      const savingsProgress = (savingsActivity / savingsAssigned) * 100;

      insights.push({
        id: "savings-progress",
        title: "Savings progress",
        message: `${Math.min(savingsProgress, 100).toFixed(
          0,
        )}% of planned savings has been recorded.`,
        tone: savingsProgress >= 100 ? "success" : "neutral",
      });
    }

    return insights.slice(0, 4);
  }, [
    budgetItems,
    incomeAssigned,
    savingsActivity,
    savingsAssigned,
    toBeBudgeted,
  ]);

  function startAddItem(groupId: number) {
    resetBudgetItemForm();
    setBudgetItemGroupId(String(groupId));
  }

  function startEditItem(item: BudgetItem) {
    setEditingBudgetItemId(item.id);
    setBudgetItemGroupId(String(item.group_id));
    setBudgetItemName(item.name);
    setBudgetItemExpected(String(item.expected_amount));
    setBudgetItemActual(String(item.actual_amount));
  }

  function toggleGroup(groupId: number) {
    setCollapsedGroups((current) => {
      const updated = new Set(current);

      if (updated.has(groupId)) {
        updated.delete(groupId);
      } else {
        updated.add(groupId);
      }

      return updated;
    });
  }

  function handleDelete(item: BudgetItem) {
    openConfirm({
      title: "Delete Budget Item",
      message: `Delete "${item.name}" from the ${formatMonth(
        zeroBudgetMonth,
      )} budget?`,
      confirmText: "Delete",
      cancelText: "Cancel",
      danger: true,
      onConfirm: async () => {
        await deleteBudgetItem(item.id);
      },
    });
  }

  async function handleMonthChange(value: string) {
    setZeroBudgetMonth(value);
    await loadZeroBudget(value);
  }

  return (
    <>
      <header className="budget-modern-header">
        <div>
          <span className="budget-page-eyebrow">
            <CircleDollarSign size={16} />
            Monthly Plan
          </span>

          <h2>Zero-Based Budget</h2>

          <p className="page-subtitle">
            Give every dollar a job and track how your plan performs.
          </p>
        </div>

        <div className="budget-modern-controls">
          <label className="budget-month-control">
            <CalendarDays size={16} />

            <input
              type="month"
              value={zeroBudgetMonth}
              onChange={(event) => void handleMonthChange(event.target.value)}
            />
          </label>

          <button
            type="button"
            className="secondary-button budget-copy-button"
            onClick={() => void copyPreviousBudgetIntoCurrentMonth()}
          >
            <Copy size={16} />
            Copy Previous
          </button>

          <button
            type="button"
            className="secondary-button budget-copy-button"
            onClick={() => void copyCurrentBudgetToNextMonth()}
          >
            <ArrowRightLeft size={16} />
            Copy Forward
          </button>
        </div>
      </header>

      <section className="zero-budget-hero budget-modern-hero">
        <article
          className={`zero-budget-hero-card ${
            toBeBudgeted === 0
              ? "balanced"
              : toBeBudgeted > 0
                ? "positive-card"
                : "negative-card"
          }`}
        >
          <div className="budget-hero-main-heading">
            <div>
              <p>
                {toBeBudgeted === 0
                  ? "Budget Balanced"
                  : toBeBudgeted > 0
                    ? "Ready to Assign"
                    : "Over Assigned"}
              </p>

              <h1>{formatCurrency(toBeBudgeted)}</h1>
            </div>

            <div className="budget-hero-status-icon">
              {toBeBudgeted === 0 ? (
                <CheckCircle2 size={24} />
              ) : toBeBudgeted > 0 ? (
                <CircleDollarSign size={24} />
              ) : (
                <AlertTriangle size={24} />
              )}
            </div>
          </div>

          <small>
            {toBeBudgeted === 0
              ? "Every assigned dollar has a job."
              : toBeBudgeted > 0
                ? "Assign the remaining money to a category."
                : `Reduce assignments by ${formatCurrency(
                    Math.abs(toBeBudgeted),
                  )}.`}
          </small>
        </article>

        <article className="zero-budget-stat-card">
          <div className="budget-stat-heading">
            <span>Income Assigned</span>
            <TrendingUp size={17} />
          </div>

          <h3 className="positive">{formatCurrency(incomeAssigned)}</h3>

          <small>{formatCurrency(incomeReceived)} received</small>
        </article>

        <article className="zero-budget-stat-card">
          <div className="budget-stat-heading">
            <span>Outflow Assigned</span>
            <ArrowDownCircle size={17} />
          </div>

          <h3 className="negative">{formatCurrency(outflowAssigned)}</h3>

          <small>{formatCurrency(outflowSpent)} spent</small>
        </article>

        <article className="zero-budget-stat-card">
          <div className="budget-stat-heading">
            <span>Savings Rate</span>
            <PiggyBank size={17} />
          </div>

          <h3 className={savingsRate >= 0 ? "positive" : "negative"}>
            {savingsRate.toFixed(1)}%
          </h3>

          <small>{formatCurrency(savingsActivity)} recorded</small>
        </article>

        <article className="zero-budget-stat-card">
          <div className="budget-stat-heading">
            <span>Budget Activity</span>
            <ReceiptText size={17} />
          </div>

          <h3>{budgetCompletion.toFixed(0)}%</h3>

          <div className="budget-progress-track budget-stat-progress">
            <div
              className="budget-progress-fill"
              style={{
                width: `${Math.min(budgetCompletion, 100)}%`,
              }}
            />
          </div>

          <small>
            {itemsWithActivity} of {budgetItems.length} items active
          </small>
        </article>
      </section>

      {budgetInsights.length > 0 && (
        <section className="budget-insights-panel">
          <header className="budget-insights-header">
            <div className="budget-insights-icon">
              <CircleDollarSign size={19} />
            </div>

            <div>
              <h3>Budget Insights</h3>
              <p>Highlights for {formatMonth(zeroBudgetMonth)}</p>
            </div>
          </header>

          <div className="budget-insights-grid">
            {budgetInsights.map((insight) => (
              <article
                className={`budget-insight-card budget-insight-${insight.tone}`}
                key={insight.id}
              >
                <div className="budget-insight-status">
                  {insight.tone === "success" ? (
                    <CheckCircle2 size={17} />
                  ) : insight.tone === "warning" ? (
                    <AlertTriangle size={17} />
                  ) : insight.tone === "danger" ? (
                    <AlertTriangle size={17} />
                  ) : (
                    <CircleDollarSign size={17} />
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

      {(budgetItemGroupId || editingBudgetItemId) && (
        <section className="panel budget-modern-form">
          <header className="budget-modern-form-header">
            <div>
              <h3>
                {editingBudgetItemId ? "Edit Budget Item" : "Add Budget Item"}
              </h3>

              <p>
                {editingBudgetItemId
                  ? "Update the category assignment."
                  : "Add a new category to your monthly plan."}
              </p>
            </div>

            <button
              type="button"
              className="budget-form-close-button"
              aria-label="Close budget form"
              onClick={resetBudgetItemForm}
            >
              <X size={17} />
            </button>
          </header>

          <div className="budget-modern-form-grid">
            <label className="form-field">
              <span className="form-label">Budget Group</span>

              <select
                value={budgetItemGroupId}
                onChange={(event) => setBudgetItemGroupId(event.target.value)}
              >
                <option value="">Select a group</option>

                {budgetGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span className="form-label">Category Name</span>

              <input
                type="text"
                placeholder="Example: Groceries"
                value={budgetItemName}
                onChange={(event) => setBudgetItemName(event.target.value)}
              />
            </label>

            <label className="form-field">
              <span className="form-label">Assigned</span>

              <div className="budget-money-input">
                <span>$</span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={budgetItemExpected}
                  onChange={(event) =>
                    setBudgetItemExpected(event.target.value)
                  }
                />
              </div>
            </label>

            <label className="form-field">
              <span className="form-label">Activity</span>

              <div className="budget-money-input">
                <span>$</span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={budgetItemActual}
                  onChange={(event) => setBudgetItemActual(event.target.value)}
                />
              </div>

              <small className="form-help">
                Activity is normally calculated from transactions.
              </small>
            </label>
          </div>

          <div className="budget-modern-form-actions">
            <button
              type="button"
              onClick={() => {
                if (editingBudgetItemId) {
                  void updateBudgetItem();
                } else {
                  void addBudgetItem();
                }
              }}
            >
              {editingBudgetItemId ? (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Add Budget Item
                </>
              )}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={resetBudgetItemForm}
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </section>
      )}

      <section className="panel budget-app-panel budget-modern-table-panel">
        <header className="budget-table-header budget-modern-table-header">
          <div>
            <h3>Budget Plan</h3>

            <p>
              Income uses received activity. Expenses, debt, and savings use
              spending activity.
            </p>
          </div>

          <button
            type="button"
            className="budget-add-general-button"
            onClick={() => {
              resetBudgetItemForm();

              if (budgetGroups.length > 0) {
                setBudgetItemGroupId(String(budgetGroups[0].id));
              }
            }}
          >
            <Plus size={16} />
            Add Item
          </button>
        </header>

        {budgetGroups.length === 0 ? (
          <div className="budget-modern-empty-state">
            <CircleDollarSign size={30} />

            <h3>No budget groups found</h3>

            <p>Create or load budget groups before adding budget items.</p>
          </div>
        ) : (
          <div className="budget-table-scroll">
            <table className="table zero-budget-table budget-modern-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Assigned</th>
                  <th>Activity</th>
                  <th>Remaining / Variance</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>

              <tbody>
                {budgetGroups.map((group) => {
                  const groupItems = budgetItems.filter(
                    (item) => item.group_id === group.id,
                  );

                  const groupAssigned = groupItems.reduce(
                    (sum, item) => sum + item.expected_amount,
                    0,
                  );

                  const groupActivity = groupItems.reduce(
                    (sum, item) => sum + item.actual_amount,
                    0,
                  );

                  const groupRemaining =
                    group.group_type === "income"
                      ? groupActivity - groupAssigned
                      : groupAssigned - groupActivity;

                  const groupPercent =
                    groupAssigned > 0
                      ? Math.min(
                          (Math.abs(groupActivity) / Math.abs(groupAssigned)) *
                            100,
                          100,
                        )
                      : 0;

                  const isCollapsed = collapsedGroups.has(group.id);

                  return (
                    <Fragment key={group.id}>
                      <tr
                        className={`budget-group-row ${getGroupClass(
                          group.group_type,
                        )}`}
                      >
                        <td>
                          <button
                            type="button"
                            className="budget-group-toggle"
                            onClick={() => toggleGroup(group.id)}
                          >
                            {isCollapsed ? (
                              <ChevronRight size={17} />
                            ) : (
                              <ChevronDown size={17} />
                            )}

                            <span className="budget-group-icon">
                              {getGroupIcon(group.group_type)}
                            </span>

                            <span>
                              <strong>{group.name}</strong>

                              <small>
                                {groupItems.length} item
                                {groupItems.length === 1 ? "" : "s"}
                              </small>
                            </span>
                          </button>
                        </td>

                        <td>
                          <strong>{formatCurrency(groupAssigned)}</strong>
                        </td>

                        <td>
                          <strong>{formatCurrency(groupActivity)}</strong>
                        </td>

                        <td>
                          <strong
                            className={
                              groupRemaining >= 0 ? "positive" : "negative"
                            }
                          >
                            {formatCurrency(groupRemaining)}
                          </strong>
                        </td>

                        <td>
                          <div className="budget-group-progress">
                            <div className="budget-progress-track">
                              <div
                                className={
                                  groupRemaining < 0
                                    ? "budget-progress-fill over"
                                    : groupPercent >= 80
                                      ? "budget-progress-fill warning"
                                      : "budget-progress-fill"
                                }
                                style={{
                                  width: `${groupPercent}%`,
                                }}
                              />
                            </div>

                            <span>{groupPercent.toFixed(0)}%</span>
                          </div>
                        </td>

                        <td className="budget-actions">
                          <button
                            type="button"
                            className="budget-group-add-button"
                            onClick={() => startAddItem(group.id)}
                          >
                            <Plus size={15} />
                            Add
                          </button>
                        </td>
                      </tr>

                      {!isCollapsed && groupItems.length === 0 && (
                        <tr>
                          <td className="budget-empty-row" colSpan={6}>
                            <button
                              type="button"
                              onClick={() => startAddItem(group.id)}
                            >
                              <Plus size={15} />
                              Add your first {group.name} item
                            </button>
                          </td>
                        </tr>
                      )}

                      {!isCollapsed &&
                        groupItems.map((item) => {
                          const remaining =
                            item.group_type === "income"
                              ? item.actual_amount - item.expected_amount
                              : item.expected_amount - item.actual_amount;

                          const rawPercent =
                            item.expected_amount > 0
                              ? (Math.abs(item.actual_amount) /
                                  Math.abs(item.expected_amount)) *
                                100
                              : 0;

                          const progressPercent = Math.min(
                            Math.max(rawPercent, 0),
                            100,
                          );

                          const status = getBudgetStatus(
                            rawPercent,
                            remaining,
                            item.group_type,
                          );

                          return (
                            <tr key={item.id} className="budget-item-row">
                              <td className="budget-item-name">
                                <div className="budget-item-title-row">
                                  <span>{item.name}</span>

                                  <small>{item.group_name ?? group.name}</small>
                                </div>

                                <div className="budget-progress-track budget-item-progress-track">
                                  <div
                                    className={status.progressClass}
                                    style={{
                                      width: `${progressPercent}%`,
                                    }}
                                  />
                                </div>
                              </td>

                              <td>
                                <span className="budget-mobile-label">
                                  Assigned
                                </span>

                                <strong>
                                  {formatCurrency(item.expected_amount)}
                                </strong>
                              </td>

                              <td>
                                <span className="budget-mobile-label">
                                  Activity
                                </span>

                                <strong>
                                  {formatCurrency(item.actual_amount)}
                                </strong>
                              </td>

                              <td>
                                <span className="budget-mobile-label">
                                  Remaining
                                </span>

                                <strong
                                  className={
                                    remaining >= 0 ? "positive" : "negative"
                                  }
                                >
                                  {formatCurrency(remaining)}
                                </strong>
                              </td>

                              <td>
                                <span
                                  className={`status-badge ${status.badgeClass}`}
                                >
                                  {status.label}
                                </span>
                              </td>

                              <td className="budget-actions budget-row-actions">
                                <button
                                  type="button"
                                  className="budget-record-button"
                                  title="Record transaction"
                                  aria-label={`Record transaction for ${item.name}`}
                                  onClick={() =>
                                    startTransactionFromBudget(
                                      item.name,
                                      item.group_type,
                                      Math.max(remaining, 0),
                                    )
                                  }
                                >
                                  <ReceiptText size={15} />
                                </button>

                                <button
                                  type="button"
                                  className="budget-edit-button"
                                  title="Edit budget item"
                                  aria-label={`Edit ${item.name}`}
                                  onClick={() => startEditItem(item)}
                                >
                                  <Pencil size={15} />
                                </button>

                                <button
                                  type="button"
                                  className="budget-delete-button"
                                  title="Delete budget item"
                                  aria-label={`Delete ${item.name}`}
                                  onClick={() => handleDelete(item)}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </Fragment>
                  );
                })}

                <tr
                  className={`zero-budget-leftover ${
                    toBeBudgeted < 0 ? "negative-leftover" : ""
                  }`}
                >
                  <td>
                    <strong>Budget Summary</strong>
                    <small className="budget-summary-caption">
                      Assigned plan compared with actual activity
                    </small>
                  </td>

                  <td>
                    <strong>{formatCurrency(toBeBudgeted)}</strong>
                  </td>

                  <td>
                    <strong>{formatCurrency(actualLeftOver)}</strong>
                  </td>

                  <td>
                    <strong
                      className={actualLeftOver >= 0 ? "positive" : "negative"}
                    >
                      {formatCurrency(actualLeftOver)}
                    </strong>
                  </td>

                  <td colSpan={2}>
                    <span
                      className={`status-badge ${
                        toBeBudgeted === 0
                          ? "status-success"
                          : toBeBudgeted > 0
                            ? "status-neutral"
                            : "status-danger"
                      }`}
                    >
                      {toBeBudgeted === 0
                        ? "Balanced"
                        : toBeBudgeted > 0
                          ? "Needs Assignment"
                          : "Over Assigned"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
