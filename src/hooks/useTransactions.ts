import { useState } from "react";

import type { Transaction } from "../types";

import {
  getTransactions,
  createTransaction,
  updateTransactionById,
  deleteTransactionById,
} from "../services/transactionService";

import { useToast } from "../components/toast/ToastContext";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function useTransactions() {
  const toast = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [transactionAccountId, setTransactionAccountId] = useState("");

  const [transactionDate, setTransactionDate] = useState("");

  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const [transactionType, setTransactionType] = useState("Expense");

  const [editingTransactionId, setEditingTransactionId] = useState<
    number | null
  >(null);

  const [transactionSearch, setTransactionSearch] = useState("");

  const [transactionFilterMonth, setTransactionFilterMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );

  const [transactionFilterAccountId, setTransactionFilterAccountId] =
    useState("");

  const [transactionFilterCategory, setTransactionFilterCategory] =
    useState("");

  const [isSavingTransaction, setIsSavingTransaction] = useState(false);

  const [deletingTransactionId, setDeletingTransactionId] = useState<
    number | null
  >(null);

  function resetTransactionForm() {
    setEditingTransactionId(null);
    setTransactionAccountId("");
    setTransactionDate("");
    setMerchant("");
    setCategory("");
    setAmount("");
    setNotes("");
    setTransactionType("Expense");
  }

  async function loadTransactions() {
    try {
      const result = await getTransactions();
      setTransactions(result);
    } catch (error) {
      console.error("Load transactions failed:", error);

      toast.error("Unable to load transactions", getErrorMessage(error));
    }
  }

  function validateTransaction() {
    if (!transactionAccountId) {
      toast.warning("Account required", "Please select an account.");

      return false;
    }

    if (!transactionDate) {
      toast.warning("Date required", "Please select a transaction date.");

      return false;
    }

    if (!merchant.trim()) {
      toast.warning(
        "Description required",
        "Enter a merchant or income source.",
      );

      return false;
    }

    if (!category) {
      toast.warning("Category required", "Please select a category.");

      return false;
    }

    if (!amount.trim()) {
      toast.warning("Amount required", "Enter the transaction amount.");

      return false;
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.warning(
        "Invalid amount",
        "Transaction amount must be greater than zero.",
      );

      return false;
    }

    if (transactionType !== "Expense" && transactionType !== "Income") {
      toast.warning("Invalid transaction type", "Choose Expense or Income.");

      return false;
    }

    return true;
  }

  function getSignedAmount() {
    const numericAmount = Number(amount);

    return transactionType === "Expense"
      ? -Math.abs(numericAmount)
      : Math.abs(numericAmount);
  }

  async function addTransaction(afterSave?: () => Promise<void>) {
    if (isSavingTransaction) {
      return;
    }

    if (!validateTransaction()) {
      return;
    }

    const loadingToastId = toast.loading(
      "Adding transaction",
      `Saving ${merchant.trim()}…`,
    );

    try {
      setIsSavingTransaction(true);

      await createTransaction(
        Number(transactionAccountId),
        transactionDate,
        merchant.trim(),
        category,
        getSignedAmount(),
        notes.trim(),
      );

      await loadTransactions();

      if (typeof afterSave === "function") {
        await afterSave();
      }

      resetTransactionForm();

      toast.updateToast(loadingToastId, {
        type: "success",
        title: "Transaction added",
        message: `${merchant.trim()} was saved successfully.`,
        duration: 3500,
      });
    } catch (error) {
      console.error("Add transaction failed:", error);

      toast.updateToast(loadingToastId, {
        type: "error",
        title: "Unable to add transaction",
        message: getErrorMessage(error),
        duration: 6000,
      });
    } finally {
      setIsSavingTransaction(false);
    }
  }

  async function updateTransaction(afterSave?: () => Promise<void>) {
    if (isSavingTransaction) {
      return;
    }

    if (!editingTransactionId) {
      toast.warning("No transaction selected", "Choose a transaction to edit.");

      return;
    }

    if (!validateTransaction()) {
      return;
    }

    const loadingToastId = toast.loading(
      "Updating transaction",
      `Saving changes to ${merchant.trim()}…`,
    );

    try {
      setIsSavingTransaction(true);

      await updateTransactionById(
        editingTransactionId,
        Number(transactionAccountId),
        transactionDate,
        merchant.trim(),
        category,
        getSignedAmount(),
        notes.trim(),
      );

      await loadTransactions();

      if (typeof afterSave === "function") {
        await afterSave();
      }

      resetTransactionForm();

      toast.updateToast(loadingToastId, {
        type: "success",
        title: "Transaction updated",
        message: "Your changes were saved.",
        duration: 3500,
      });
    } catch (error) {
      console.error("Update transaction failed:", error);

      toast.updateToast(loadingToastId, {
        type: "error",
        title: "Unable to update transaction",
        message: getErrorMessage(error),
        duration: 6000,
      });
    } finally {
      setIsSavingTransaction(false);
    }
  }

  async function deleteTransaction(
    transaction: Transaction,
    afterSave?: () => Promise<void>,
  ) {
    if (deletingTransactionId === transaction.id) {
      return;
    }

    const loadingToastId = toast.loading(
      "Deleting transaction",
      `Removing ${transaction.merchant}…`,
    );

    try {
      setDeletingTransactionId(transaction.id);

      await deleteTransactionById(transaction);
      await loadTransactions();

      if (typeof afterSave === "function") {
        await afterSave();
      }

      resetTransactionForm();

      toast.updateToast(loadingToastId, {
        type: "success",
        title: "Transaction deleted",
        message: `${transaction.merchant} was removed.`,
        duration: 3500,
      });
    } catch (error) {
      console.error("Delete transaction failed:", error);

      toast.updateToast(loadingToastId, {
        type: "error",
        title: "Unable to delete transaction",
        message: getErrorMessage(error),
        duration: 6000,
      });
    } finally {
      setDeletingTransactionId(null);
    }
  }

  function clearTransactionFilters() {
    setTransactionSearch("");
    setTransactionFilterAccountId("");
    setTransactionFilterCategory("");
  }

  return {
    transactions,
    setTransactions,

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

    transactionSearch,
    setTransactionSearch,

    transactionFilterMonth,
    setTransactionFilterMonth,

    transactionFilterAccountId,
    setTransactionFilterAccountId,

    transactionFilterCategory,
    setTransactionFilterCategory,

    isSavingTransaction,
    deletingTransactionId,

    resetTransactionForm,
    clearTransactionFilters,

    loadTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
