import { useMemo, useState } from "react";

import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  Clock3,
  CreditCard,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Repeat2,
  Search,
  Trash2,
  X,
  Zap,
} from "lucide-react";

import type { Account, RecurringTransaction } from "../types";

import { MasterDetailLayout } from "../components/layout/MasterDetailLayout";
import { useModal } from "../components/modal/ModalContext";

type RecurringFilter = "all" | "upcoming" | "overdue" | "autopay";

type Props = {
  accounts: Account[];
  recurringTransactions: RecurringTransaction[];
  categories: string[];

  recurringAccountId: string;
  setRecurringAccountId: (value: string) => void;

  recurringMerchant: string;
  setRecurringMerchant: (value: string) => void;

  recurringCategory: string;
  setRecurringCategory: (value: string) => void;

  recurringAmount: string;
  setRecurringAmount: (value: string) => void;

  recurringFrequency: string;
  setRecurringFrequency: (value: string) => void;

  recurringNextDueDate: string;
  setRecurringNextDueDate: (value: string) => void;

  recurringNotes: string;
  setRecurringNotes: (value: string) => void;

  recurringAutopay: boolean;
  setRecurringAutopay: (value: boolean) => void;

  recurringAutoGenerate: boolean;
  setRecurringAutoGenerate: (value: boolean) => void;

  addRecurringTransaction: () => void | Promise<void>;
  generateRecurringTransactions: () => void | Promise<void>;

  editingRecurringId: number | null;
  setEditingRecurringId: (value: number | null) => void;

  updateRecurringTransaction: () => void | Promise<void>;
  deleteRecurringTransaction: (id: number) => void | Promise<void>;

  resetRecurringForm: () => void;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatDate(value: string) {
  if (!value) {
    return "No due date";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getDaysUntil(dateValue: string) {
  if (!dateValue) {
    return Number.POSITIVE_INFINITY;
  }

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

function getDueText(dateValue: string) {
  const days = getDaysUntil(dateValue);

  if (!Number.isFinite(days)) {
    return "No valid due date";
  }

  if (days < 0) {
    const overdueDays = Math.abs(days);

    return `${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue`;
  }

  if (days === 0) {
    return "Due today";
  }

  if (days === 1) {
    return "Due tomorrow";
  }

  return `Due in ${days} days`;
}

function getAccountName(
  accounts: Account[],
  accountId: number,
  savedName?: string,
) {
  if (savedName) {
    return savedName;
  }

  return (
    accounts.find((account) => account.id === accountId)?.name ??
    "Unknown account"
  );
}

export function RecurringPage({
  accounts,
  recurringTransactions,
  categories,

  recurringAccountId,
  setRecurringAccountId,

  recurringMerchant,
  setRecurringMerchant,

  recurringCategory,
  setRecurringCategory,

  recurringAmount,
  setRecurringAmount,

  recurringFrequency,
  setRecurringFrequency,

  recurringNextDueDate,
  setRecurringNextDueDate,

  recurringNotes,
  setRecurringNotes,

  recurringAutopay,
  setRecurringAutopay,

  recurringAutoGenerate,
  setRecurringAutoGenerate,

  addRecurringTransaction,
  generateRecurringTransactions,

  editingRecurringId,
  setEditingRecurringId,

  updateRecurringTransaction,
  deleteRecurringTransaction,

  resetRecurringForm,
}: Props) {
  const { openConfirm } = useModal();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RecurringFilter>("all");
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredRecurring = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...recurringTransactions]
      .filter((item) => {
        const daysUntil = getDaysUntil(item.next_due_date);

        const matchesSearch =
          !normalizedSearch ||
          [
            item.merchant,
            item.category,
            item.frequency,
            item.notes ?? "",
            item.account_name ?? "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch);

        const matchesFilter =
          filter === "all" ||
          (filter === "upcoming" &&
            Number.isFinite(daysUntil) &&
            daysUntil >= 0 &&
            daysUntil <= 30) ||
          (filter === "overdue" &&
            Number.isFinite(daysUntil) &&
            daysUntil < 0) ||
          (filter === "autopay" && item.autopay === 1);

        return matchesSearch && matchesFilter;
      })
      .sort((first, second) => {
        const firstDate = new Date(`${first.next_due_date}T00:00:00`).getTime();

        const secondDate = new Date(
          `${second.next_due_date}T00:00:00`,
        ).getTime();

        if (Number.isNaN(firstDate)) return 1;
        if (Number.isNaN(secondDate)) return -1;

        return firstDate - secondDate;
      });
  }, [recurringTransactions, search, filter]);

  const monthlyExpenses = recurringTransactions
    .filter(
      (item) => item.amount < 0 && item.frequency.toLowerCase() === "monthly",
    )
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);

  const monthlyIncome = recurringTransactions
    .filter(
      (item) => item.amount > 0 && item.frequency.toLowerCase() === "monthly",
    )
    .reduce((sum, item) => sum + item.amount, 0);

  const autopayCount = recurringTransactions.filter(
    (item) => item.autopay === 1,
  ).length;

  const dueSoonCount = recurringTransactions.filter((item) => {
    const daysUntil = getDaysUntil(item.next_due_date);

    return Number.isFinite(daysUntil) && daysUntil >= 0 && daysUntil <= 7;
  }).length;

  function beginEditing(item: RecurringTransaction) {
    setEditingRecurringId(item.id);
    setRecurringAccountId(String(item.account_id));
    setRecurringMerchant(item.merchant);
    setRecurringCategory(item.category);
    setRecurringAmount(String(Math.abs(item.amount)));
    setRecurringFrequency(item.frequency);
    setRecurringNextDueDate(item.next_due_date);
    setRecurringNotes(item.notes || "");
    setRecurringAutopay(item.autopay === 1);
    setRecurringAutoGenerate(item.auto_generate === 1);
  }

  function handleDelete(item: RecurringTransaction) {
    openConfirm({
      title: "Delete Recurring Transaction",
      message: `Delete "${item.merchant}" from your recurring transactions? Existing generated transactions will not be removed.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      danger: true,
      onConfirm: async () => {
        await deleteRecurringTransaction(item.id);
      },
    });
  }

  async function handleGenerateDueTransactions() {
    if (isGenerating) {
      return;
    }

    try {
      setIsGenerating(true);
      await generateRecurringTransactions();
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <MasterDetailLayout
      title="Recurring Transactions"
      left={
        <section className="recurring-form-section">
          <header className="recurring-form-header">
            <div>
              <h3>
                {editingRecurringId
                  ? "Edit Recurring Item"
                  : "Add Recurring Item"}
              </h3>

              <p>
                {editingRecurringId
                  ? "Update this recurring schedule."
                  : "Schedule income, bills, and subscriptions."}
              </p>
            </div>

            <div className="recurring-form-header-icon">
              <Repeat2 size={20} />
            </div>
          </header>

          <button
            type="button"
            className="recurring-generate-button"
            disabled={isGenerating}
            onClick={() => void handleGenerateDueTransactions()}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={17} className="recurring-spin-icon" />
                Generating…
              </>
            ) : (
              <>
                <Play size={17} />
                Generate Due Transactions
              </>
            )}
          </button>

          <p className="recurring-generate-help">
            Creates transactions for due items with auto-generation enabled.
          </p>

          <div className="form-grid recurring-form-grid">
            <label className="form-field">
              <span className="form-label">Account</span>

              <select
                value={recurringAccountId}
                onChange={(event) => setRecurringAccountId(event.target.value)}
              >
                <option value="">Select an account</option>

                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span className="form-label">Merchant or Source</span>

              <input
                type="text"
                placeholder="Example: Netflix or Employer"
                value={recurringMerchant}
                onChange={(event) => setRecurringMerchant(event.target.value)}
              />
            </label>

            <label className="form-field">
              <span className="form-label">Category</span>

              <select
                value={recurringCategory}
                onChange={(event) => setRecurringCategory(event.target.value)}
              >
                <option value="">Select a category</option>

                {categories.map((categoryOption) => (
                  <option key={categoryOption} value={categoryOption}>
                    {categoryOption}
                  </option>
                ))}
              </select>

              <small className="form-help">
                Income categories create positive amounts. Other categories
                create expenses.
              </small>
            </label>

            <label className="form-field">
              <span className="form-label">Amount</span>

              <div className="recurring-money-input">
                <span>$</span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={recurringAmount}
                  onChange={(event) => setRecurringAmount(event.target.value)}
                />
              </div>
            </label>

            <label className="form-field">
              <span className="form-label">Frequency</span>

              <select
                value={recurringFrequency}
                onChange={(event) => setRecurringFrequency(event.target.value)}
              >
                <option value="Weekly">Weekly</option>
                <option value="Biweekly">Biweekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </label>

            <label className="form-field">
              <span className="form-label">Next Due Date</span>

              <input
                type="date"
                value={recurringNextDueDate}
                onChange={(event) =>
                  setRecurringNextDueDate(event.target.value)
                }
              />
            </label>

            <div className="recurring-setting-grid">
              <label
                className={`recurring-setting-card ${
                  recurringAutopay ? "active" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={recurringAutopay}
                  onChange={(event) =>
                    setRecurringAutopay(event.target.checked)
                  }
                />

                <div className="recurring-setting-icon">
                  <CreditCard size={18} />
                </div>

                <div>
                  <strong>Autopay</strong>
                  <span>Marked as automatically paid</span>
                </div>

                <div className="recurring-switch">
                  <span />
                </div>
              </label>

              <label
                className={`recurring-setting-card ${
                  recurringAutoGenerate ? "active" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={recurringAutoGenerate}
                  onChange={(event) =>
                    setRecurringAutoGenerate(event.target.checked)
                  }
                />

                <div className="recurring-setting-icon">
                  <Zap size={18} />
                </div>

                <div>
                  <strong>Auto Generate</strong>
                  <span>Create transactions when due</span>
                </div>

                <div className="recurring-switch">
                  <span />
                </div>
              </label>
            </div>

            <label className="form-field">
              <span className="form-label">Notes</span>

              <textarea
                placeholder="Optional notes"
                value={recurringNotes}
                onChange={(event) => setRecurringNotes(event.target.value)}
              />
            </label>

            <div className="form-actions recurring-form-actions">
              <button
                type="button"
                className="recurring-save-button"
                onClick={() => {
                  if (editingRecurringId) {
                    void updateRecurringTransaction();
                  } else {
                    void addRecurringTransaction();
                  }
                }}
              >
                {editingRecurringId ? (
                  <>
                    <Pencil size={16} />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Add Recurring Item
                  </>
                )}
              </button>

              {editingRecurringId && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={resetRecurringForm}
                >
                  <X size={16} />
                  Cancel
                </button>
              )}
            </div>
          </div>
        </section>
      }
      right={
        <section className="recurring-list-section">
          <header className="recurring-list-header">
            <div>
              <h3>Recurring Schedule</h3>

              <p>
                {recurringTransactions.length} recurring item
                {recurringTransactions.length === 1 ? "" : "s"} tracked
              </p>
            </div>

            <div className="recurring-list-header-icon">
              <CalendarClock size={20} />
            </div>
          </header>

          <section className="recurring-summary-grid">
            <article>
              <span>Monthly Income</span>
              <strong className="positive">
                {formatCurrency(monthlyIncome)}
              </strong>
            </article>

            <article>
              <span>Monthly Expenses</span>
              <strong className="negative">
                {formatCurrency(monthlyExpenses)}
              </strong>
            </article>

            <article>
              <span>Due This Week</span>
              <strong>{dueSoonCount}</strong>
            </article>

            <article>
              <span>Autopay</span>
              <strong>{autopayCount}</strong>
            </article>
          </section>

          <section className="recurring-filter-panel">
            <div className="recurring-search-field">
              <Search size={17} />

              <input
                type="search"
                placeholder="Search merchant, category, account, or notes"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              {search && (
                <button
                  type="button"
                  aria-label="Clear recurring search"
                  onClick={() => setSearch("")}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="recurring-filter-buttons">
              <button
                type="button"
                className={filter === "all" ? "active" : ""}
                onClick={() => setFilter("all")}
              >
                All
              </button>

              <button
                type="button"
                className={filter === "upcoming" ? "active" : ""}
                onClick={() => setFilter("upcoming")}
              >
                Upcoming
              </button>

              <button
                type="button"
                className={filter === "overdue" ? "active" : ""}
                onClick={() => setFilter("overdue")}
              >
                Overdue
              </button>

              <button
                type="button"
                className={filter === "autopay" ? "active" : ""}
                onClick={() => setFilter("autopay")}
              >
                Autopay
              </button>
            </div>
          </section>

          {filteredRecurring.length === 0 ? (
            <div className="recurring-empty-state">
              <div className="recurring-empty-icon">
                <Repeat2 size={28} />
              </div>

              <h3>No recurring items found</h3>

              <p>
                {recurringTransactions.length === 0
                  ? "Create your first recurring income, bill, or subscription."
                  : "Try changing the current search or filter."}
              </p>

              {(search || filter !== "all") && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setSearch("");
                    setFilter("all");
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="recurring-card-list">
              {filteredRecurring.map((item) => {
                const isIncome = item.amount >= 0;
                const daysUntil = getDaysUntil(item.next_due_date);
                const isOverdue = Number.isFinite(daysUntil) && daysUntil < 0;
                const isDueSoon =
                  Number.isFinite(daysUntil) &&
                  daysUntil >= 0 &&
                  daysUntil <= 7;

                return (
                  <article className="recurring-card" key={item.id}>
                    <div
                      className={`recurring-card-icon ${
                        isIncome
                          ? "recurring-card-income"
                          : "recurring-card-expense"
                      }`}
                    >
                      {isIncome ? (
                        <ArrowUpRight size={20} />
                      ) : (
                        <ArrowDownLeft size={20} />
                      )}
                    </div>

                    <div className="recurring-card-main">
                      <div className="recurring-card-heading">
                        <div>
                          <h3>{item.merchant}</h3>

                          <p>
                            {item.category} ·{" "}
                            {getAccountName(
                              accounts,
                              item.account_id,
                              item.account_name,
                            )}
                          </p>
                        </div>

                        <strong className={isIncome ? "positive" : "negative"}>
                          {isIncome ? "+" : "-"}
                          {formatCurrency(Math.abs(item.amount))}
                        </strong>
                      </div>

                      <div className="recurring-card-details">
                        <span>
                          <RefreshCw size={13} />
                          {item.frequency}
                        </span>

                        <span
                          className={
                            isOverdue
                              ? "recurring-due-overdue"
                              : isDueSoon
                                ? "recurring-due-soon"
                                : ""
                          }
                        >
                          {isOverdue ? (
                            <AlertTriangle size={13} />
                          ) : (
                            <Clock3 size={13} />
                          )}

                          {formatDate(item.next_due_date)}
                        </span>
                      </div>

                      <div className="recurring-card-status-row">
                        <span
                          className={`status-badge ${
                            isOverdue
                              ? "status-danger"
                              : isDueSoon
                                ? "status-warning"
                                : "status-neutral"
                          }`}
                        >
                          {getDueText(item.next_due_date)}
                        </span>

                        {item.autopay === 1 && (
                          <span className="status-badge status-success">
                            <CreditCard size={12} />
                            Autopay
                          </span>
                        )}

                        {item.auto_generate === 1 && (
                          <span className="status-badge recurring-auto-badge">
                            <Zap size={12} />
                            Auto Generate
                          </span>
                        )}
                      </div>

                      {item.notes && (
                        <p className="recurring-card-notes">{item.notes}</p>
                      )}
                    </div>

                    <div className="recurring-card-actions">
                      <button
                        type="button"
                        className="recurring-edit-button"
                        title="Edit recurring item"
                        aria-label={`Edit ${item.merchant}`}
                        onClick={() => beginEditing(item)}
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        type="button"
                        className="recurring-delete-button"
                        title="Delete recurring item"
                        aria-label={`Delete ${item.merchant}`}
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      }
    />
  );
}
