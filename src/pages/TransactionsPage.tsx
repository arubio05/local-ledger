import { useMemo, useState } from "react";

import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  CreditCard,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";

import type { Account, Transaction } from "../types";

import { MasterDetailLayout } from "../components/layout/MasterDetailLayout";
import { useModal } from "../components/modal/ModalContext";

type TransactionSort = "newest" | "oldest" | "amount-high" | "amount-low";

type Props = {
  accounts: Account[];
  transactions: Transaction[];

  transactionAccountId: string;
  setTransactionAccountId: (value: string) => void;

  transactionDate: string;
  setTransactionDate: (value: string) => void;

  merchant: string;
  setMerchant: (value: string) => void;

  category: string;
  setCategory: (value: string) => void;

  amount: string;
  setAmount: (value: string) => void;

  notes: string;
  setNotes: (value: string) => void;

  transactionType: string;
  setTransactionType: (value: string) => void;

  editingTransactionId: number | null;
  setEditingTransactionId: (value: number | null) => void;

  addTransaction: () => void | Promise<void>;
  updateTransaction: () => void | Promise<void>;
  deleteTransaction: (transaction: Transaction) => void | Promise<void>;

  resetTransactionForm: () => void;

  categories: string[];

  transactionSearch: string;
  setTransactionSearch: (value: string) => void;

  transactionFilterMonth: string;
  setTransactionFilterMonth: (value: string) => void;

  transactionFilterAccountId: string;
  setTransactionFilterAccountId: (value: string) => void;

  transactionFilterCategory: string;
  setTransactionFilterCategory: (value: string) => void;

  clearTransactionFilters: () => void;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatTransactionDate(value: string) {
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
    year: "numeric",
  }).format(date);
}

export function TransactionsPage({
  accounts,
  transactions,

  transactionAccountId,
  setTransactionAccountId,

  transactionDate,
  setTransactionDate,

  merchant,
  setMerchant,

  category,
  setCategory,

  amount,
  setAmount,

  notes,
  setNotes,

  transactionType,
  setTransactionType,

  editingTransactionId,
  setEditingTransactionId,

  addTransaction,
  updateTransaction,
  deleteTransaction,

  resetTransactionForm,

  categories,

  transactionSearch,
  setTransactionSearch,

  transactionFilterMonth,
  setTransactionFilterMonth,

  transactionFilterAccountId,
  setTransactionFilterAccountId,

  transactionFilterCategory,
  setTransactionFilterCategory,

  clearTransactionFilters,
}: Props) {
  const { openConfirm } = useModal();

  const [transactionSort, setTransactionSort] =
    useState<TransactionSort>("newest");

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = transactionSearch.trim().toLowerCase();

    const filtered = transactions.filter((transaction) => {
      const matchesMonth =
        !transactionFilterMonth ||
        transaction.date.startsWith(transactionFilterMonth);

      const matchesAccount =
        !transactionFilterAccountId ||
        transaction.account_id === Number(transactionFilterAccountId);

      const matchesCategory =
        !transactionFilterCategory ||
        transaction.category === transactionFilterCategory;

      const searchableText = [
        transaction.merchant,
        transaction.category,
        transaction.account_name ?? "",
        transaction.notes ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      return matchesMonth && matchesAccount && matchesCategory && matchesSearch;
    });

    return [...filtered].sort((first, second) => {
      if (transactionSort === "oldest") {
        return new Date(first.date).getTime() - new Date(second.date).getTime();
      }

      if (transactionSort === "amount-high") {
        return Math.abs(second.amount) - Math.abs(first.amount);
      }

      if (transactionSort === "amount-low") {
        return Math.abs(first.amount) - Math.abs(second.amount);
      }

      return new Date(second.date).getTime() - new Date(first.date).getTime();
    });
  }, [
    transactions,
    transactionSearch,
    transactionFilterMonth,
    transactionFilterAccountId,
    transactionFilterCategory,
    transactionSort,
  ]);

  const filteredIncome = filteredTransactions
    .filter((transaction) => transaction.amount > 0)
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const filteredExpenses = filteredTransactions
    .filter((transaction) => transaction.amount < 0)
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

  const filteredNet = filteredIncome - filteredExpenses;

  const hasActiveFilters =
    Boolean(transactionSearch.trim()) ||
    Boolean(transactionFilterAccountId) ||
    Boolean(transactionFilterCategory);

  function beginEditing(transaction: Transaction) {
    setEditingTransactionId(transaction.id);
    setTransactionAccountId(String(transaction.account_id));
    setTransactionDate(transaction.date);
    setMerchant(transaction.merchant);
    setCategory(transaction.category);

    setTransactionType(transaction.amount < 0 ? "Expense" : "Income");

    setAmount(String(Math.abs(transaction.amount)));
    setNotes(transaction.notes || "");
  }

  function handleDelete(transaction: Transaction) {
    openConfirm({
      title: "Delete Transaction",
      message: `Delete the transaction "${transaction.merchant}" for ${formatCurrency(
        Math.abs(transaction.amount),
      )}? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      danger: true,
      onConfirm: async () => {
        await deleteTransaction(transaction);
      },
    });
  }

  return (
    <MasterDetailLayout
      title="Transactions"
      left={
        <section className="transaction-form-section">
          <div className="transaction-form-heading">
            <div>
              <h3>
                {editingTransactionId ? "Edit Transaction" : "Add Transaction"}
              </h3>

              <p>
                {editingTransactionId
                  ? "Update the selected transaction."
                  : "Record new income or spending."}
              </p>
            </div>

            <div
              className={`transaction-form-icon ${
                transactionType === "Income"
                  ? "transaction-form-icon-income"
                  : "transaction-form-icon-expense"
              }`}
            >
              {transactionType === "Income" ? (
                <ArrowUpRight size={20} />
              ) : (
                <ArrowDownLeft size={20} />
              )}
            </div>
          </div>

          <div className="transaction-type-toggle">
            <button
              type="button"
              className={transactionType === "Expense" ? "active expense" : ""}
              onClick={() => setTransactionType("Expense")}
            >
              <ArrowDownLeft size={16} />
              Expense
            </button>

            <button
              type="button"
              className={transactionType === "Income" ? "active income" : ""}
              onClick={() => setTransactionType("Income")}
            >
              <ArrowUpRight size={16} />
              Income
            </button>
          </div>

          <div className="form-grid transaction-form-grid">
            <label className="form-field">
              <span className="form-label">Account</span>

              <select
                value={transactionAccountId}
                onChange={(event) =>
                  setTransactionAccountId(event.target.value)
                }
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
              <span className="form-label">Date</span>

              <input
                type="date"
                value={transactionDate}
                onChange={(event) => setTransactionDate(event.target.value)}
              />
            </label>

            <label className="form-field">
              <span className="form-label">
                {transactionType === "Income" ? "Income source" : "Merchant"}
              </span>

              <input
                type="text"
                placeholder={
                  transactionType === "Income"
                    ? "Example: Employer"
                    : "Example: Costco"
                }
                value={merchant}
                onChange={(event) => setMerchant(event.target.value)}
              />
            </label>

            <label className="form-field">
              <span className="form-label">Category</span>

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="">Select a category</option>

                {categories.map((categoryOption) => (
                  <option key={categoryOption} value={categoryOption}>
                    {categoryOption}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span className="form-label">Amount</span>

              <div className="transaction-amount-input">
                <span>$</span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </div>
            </label>

            <label className="form-field">
              <span className="form-label">Notes</span>

              <textarea
                placeholder="Optional notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>

            <div className="form-actions transaction-form-actions">
              <button
                type="button"
                className="transaction-save-button"
                onClick={() => {
                  if (editingTransactionId) {
                    void updateTransaction();
                  } else {
                    void addTransaction();
                  }
                }}
              >
                {editingTransactionId ? (
                  <>
                    <Pencil size={16} />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Add Transaction
                  </>
                )}
              </button>

              {editingTransactionId && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => resetTransactionForm()}
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
        <section className="transaction-list-section">
          <header className="transaction-list-header">
            <div>
              <h3>Transaction History</h3>

              <p>
                {filteredTransactions.length} transaction
                {filteredTransactions.length === 1 ? "" : "s"} shown
              </p>
            </div>

            <div className="transaction-header-icon">
              <ReceiptText size={20} />
            </div>
          </header>

          <section className="transaction-summary-strip">
            <article>
              <span>Income</span>
              <strong className="positive">
                {formatCurrency(filteredIncome)}
              </strong>
            </article>

            <article>
              <span>Expenses</span>
              <strong className="negative">
                {formatCurrency(filteredExpenses)}
              </strong>
            </article>

            <article>
              <span>Net</span>
              <strong className={filteredNet >= 0 ? "positive" : "negative"}>
                {formatCurrency(filteredNet)}
              </strong>
            </article>
          </section>

          <section className="transaction-filter-panel">
            <div className="transaction-search-field">
              <Search size={17} />

              <input
                type="search"
                placeholder="Search merchant, category, account, or notes"
                value={transactionSearch}
                onChange={(event) => setTransactionSearch(event.target.value)}
              />

              {transactionSearch && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setTransactionSearch("")}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="transaction-filter-grid">
              <label>
                <span>
                  <CalendarDays size={14} />
                  Month
                </span>

                <input
                  type="month"
                  value={transactionFilterMonth}
                  onChange={(event) =>
                    setTransactionFilterMonth(event.target.value)
                  }
                />
              </label>

              <label>
                <span>
                  <CreditCard size={14} />
                  Account
                </span>

                <select
                  value={transactionFilterAccountId}
                  onChange={(event) =>
                    setTransactionFilterAccountId(event.target.value)
                  }
                >
                  <option value="">All accounts</option>

                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>
                  <ReceiptText size={14} />
                  Category
                </span>

                <select
                  value={transactionFilterCategory}
                  onChange={(event) =>
                    setTransactionFilterCategory(event.target.value)
                  }
                >
                  <option value="">All categories</option>

                  {categories.map((categoryOption) => (
                    <option key={categoryOption} value={categoryOption}>
                      {categoryOption}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>
                  <SlidersHorizontal size={14} />
                  Sort
                </span>

                <select
                  value={transactionSort}
                  onChange={(event) =>
                    setTransactionSort(event.target.value as TransactionSort)
                  }
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="amount-high">Highest amount</option>
                  <option value="amount-low">Lowest amount</option>
                </select>
              </label>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                className="transaction-clear-filters"
                onClick={clearTransactionFilters}
              >
                <X size={15} />
                Clear filters
              </button>
            )}
          </section>

          {filteredTransactions.length === 0 ? (
            <div className="transaction-empty-state">
              <div className="transaction-empty-icon">
                <ReceiptText size={28} />
              </div>

              <h3>No transactions found</h3>

              <p>
                {transactions.length === 0
                  ? "Add your first transaction using the form."
                  : "Try changing or clearing the current filters."}
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={clearTransactionFilters}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="transaction-card-list">
              {filteredTransactions.map((transaction) => {
                const isIncome = transaction.amount >= 0;

                return (
                  <article
                    className="transaction-history-card"
                    key={transaction.id}
                  >
                    <div
                      className={`transaction-history-icon ${
                        isIncome
                          ? "transaction-history-income"
                          : "transaction-history-expense"
                      }`}
                    >
                      {isIncome ? (
                        <ArrowUpRight size={19} />
                      ) : (
                        <ArrowDownLeft size={19} />
                      )}
                    </div>

                    <div className="transaction-history-details">
                      <strong>{transaction.merchant}</strong>

                      <div className="transaction-history-meta">
                        <span>{transaction.category}</span>
                        <span>•</span>
                        <span>
                          {transaction.account_name ?? "Unknown account"}
                        </span>
                      </div>

                      {transaction.notes && <p>{transaction.notes}</p>}
                    </div>

                    <div className="transaction-history-value">
                      <strong className={isIncome ? "positive" : "negative"}>
                        {isIncome ? "+" : "-"}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </strong>

                      <span>{formatTransactionDate(transaction.date)}</span>
                    </div>

                    <div className="transaction-history-actions">
                      <button
                        type="button"
                        className="transaction-edit-button"
                        aria-label={`Edit ${transaction.merchant}`}
                        title="Edit transaction"
                        onClick={() => beginEditing(transaction)}
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        type="button"
                        className="transaction-delete-button"
                        aria-label={`Delete ${transaction.merchant}`}
                        title="Delete transaction"
                        onClick={() => handleDelete(transaction)}
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
