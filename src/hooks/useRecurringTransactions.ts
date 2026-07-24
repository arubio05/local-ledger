import { useState } from "react";
import type { RecurringTransaction } from "../types";

import {
  createRecurringTransaction,
  deleteRecurringTransactionById,
  generateDueTransactions,
  getRecurringTransactions,
  updateRecurringTransactionById,
} from "../services/recurringTransactionService";

import { useToast } from "../components/toast/ToastContext";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function isIncomeCategory(category: string) {
  const normalized = category.trim().toLowerCase();

  return (
    normalized === "income" ||
    normalized.includes("paycheck") ||
    normalized.includes("salary") ||
    normalized.includes("income")
  );
}

export function useRecurringTransactions() {
  const toast = useToast();

  const [recurringTransactions, setRecurringTransactions] = useState<
    RecurringTransaction[]
  >([]);
  const [recurringAccountId, setRecurringAccountId] = useState("");
  const [recurringMerchant, setRecurringMerchant] = useState("");
  const [recurringCategory, setRecurringCategory] = useState("");
  const [recurringAmount, setRecurringAmount] = useState("");
  const [recurringFrequency, setRecurringFrequency] = useState("Monthly");
  const [recurringNextDueDate, setRecurringNextDueDate] = useState("");
  const [recurringNotes, setRecurringNotes] = useState("");
  const [editingRecurringId, setEditingRecurringId] = useState<number | null>(
    null,
  );
  const [recurringAutopay, setRecurringAutopay] = useState(false);
  const [recurringAutoGenerate, setRecurringAutoGenerate] = useState(true);

  const [isSavingRecurring, setIsSavingRecurring] = useState(false);
  const [isGeneratingRecurring, setIsGeneratingRecurring] = useState(false);
  const [deletingRecurringId, setDeletingRecurringId] = useState<number | null>(
    null,
  );

  function resetRecurringForm() {
    setEditingRecurringId(null);
    setRecurringAccountId("");
    setRecurringMerchant("");
    setRecurringCategory("");
    setRecurringAmount("");
    setRecurringFrequency("Monthly");
    setRecurringNextDueDate("");
    setRecurringNotes("");
    setRecurringAutopay(false);
    setRecurringAutoGenerate(true);
  }

  async function loadRecurringTransactions(showErrorToast = true) {
    try {
      const result = await getRecurringTransactions();
      setRecurringTransactions(result);
      return result;
    } catch (error) {
      console.error("Load recurring transactions failed:", error);

      if (showErrorToast) {
        toast.error(
          "Unable to load recurring transactions",
          getErrorMessage(error),
        );
      }

      throw error;
    }
  }

  function validateRecurringTransaction() {
    const accountId = Number(recurringAccountId);
    const amount = Number(recurringAmount);

    if (!Number.isInteger(accountId) || accountId <= 0) {
      toast.warning(
        "Account required",
        "Select a valid account for this recurring item.",
      );
      return false;
    }

    if (!recurringMerchant.trim()) {
      toast.warning("Merchant required", "Enter a merchant or income source.");
      return false;
    }

    if (!recurringCategory.trim()) {
      toast.warning("Category required", "Select a category.");
      return false;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.warning(
        "Invalid amount",
        "Recurring amount must be greater than zero.",
      );
      return false;
    }

    if (!recurringNextDueDate) {
      toast.warning("Due date required", "Select the next due date.");
      return false;
    }

    if (
      !["Weekly", "Biweekly", "Monthly", "Yearly"].includes(recurringFrequency)
    ) {
      toast.warning(
        "Invalid frequency",
        "Select a supported recurring frequency.",
      );
      return false;
    }

    return true;
  }

  function getSavedValues() {
    const amount = Math.abs(Number(recurringAmount));

    return {
      accountId: Number(recurringAccountId),
      merchant: recurringMerchant.trim(),
      category: recurringCategory.trim(),
      amount: isIncomeCategory(recurringCategory) ? amount : -amount,
      frequency: recurringFrequency,
      nextDueDate: recurringNextDueDate,
      notes: recurringNotes.trim(),
      autopay: recurringAutopay,
      autoGenerate: recurringAutoGenerate,
    };
  }

  async function addRecurringTransaction() {
    if (
      isSavingRecurring ||
      isGeneratingRecurring ||
      deletingRecurringId !== null ||
      !validateRecurringTransaction()
    ) {
      return;
    }

    const values = getSavedValues();
    const toastId = toast.loading(
      "Adding recurring item",
      `Scheduling ${values.merchant}…`,
    );

    try {
      setIsSavingRecurring(true);

      await createRecurringTransaction(
        values.accountId,
        values.merchant,
        values.category,
        values.amount,
        values.frequency,
        values.nextDueDate,
        values.notes,
        values.autopay,
        values.autoGenerate,
      );
      await loadRecurringTransactions(false);

      resetRecurringForm();

      toast.updateToast(toastId, {
        type: "success",
        title: "Recurring item added",
        message: `${values.merchant} was scheduled.`,
        duration: 3500,
      });
    } catch (error) {
      toast.updateToast(toastId, {
        type: "error",
        title: "Unable to add recurring item",
        message: getErrorMessage(error),
        duration: 6000,
      });
    } finally {
      setIsSavingRecurring(false);
    }
  }

  async function generateRecurringTransactions(
    afterGenerate?: () => Promise<void>,
  ) {
    if (
      isGeneratingRecurring ||
      isSavingRecurring ||
      deletingRecurringId !== null
    ) {
      return;
    }

    const toastId = toast.loading(
      "Checking recurring transactions",
      "Processing all due auto-generated items…",
    );

    try {
      setIsGeneratingRecurring(true);

      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
        2,
        "0",
      )}-${String(now.getDate()).padStart(2, "0")}`;

      await generateDueTransactions(today);
      await loadRecurringTransactions(false);

      if (typeof afterGenerate === "function") await afterGenerate();

      toast.updateToast(toastId, {
        type: "success",
        title: "Recurring transactions checked",
        message: "All currently due items were processed.",
        duration: 4000,
      });
    } catch (error) {
      toast.updateToast(toastId, {
        type: "error",
        title: "Unable to generate recurring transactions",
        message: getErrorMessage(error),
        duration: 6000,
      });

      throw error;
    } finally {
      setIsGeneratingRecurring(false);
    }
  }

  async function updateRecurringTransaction() {
    if (
      isSavingRecurring ||
      isGeneratingRecurring ||
      deletingRecurringId !== null
    ) {
      return;
    }

    if (!editingRecurringId) {
      toast.warning(
        "No recurring item selected",
        "Choose a recurring item to edit.",
      );
      return;
    }

    if (!validateRecurringTransaction()) return;

    const savedId = editingRecurringId;
    const values = getSavedValues();
    const toastId = toast.loading(
      "Updating recurring item",
      `Saving changes to ${values.merchant}…`,
    );

    try {
      setIsSavingRecurring(true);

      await updateRecurringTransactionById(
        savedId,
        values.accountId,
        values.merchant,
        values.category,
        values.amount,
        values.frequency,
        values.nextDueDate,
        values.notes,
        values.autopay,
        values.autoGenerate,
      );
      await loadRecurringTransactions(false);

      resetRecurringForm();

      toast.updateToast(toastId, {
        type: "success",
        title: "Recurring item updated",
        message: `${values.merchant} was updated.`,
        duration: 3500,
      });
    } catch (error) {
      toast.updateToast(toastId, {
        type: "error",
        title: "Unable to update recurring item",
        message: getErrorMessage(error),
        duration: 6000,
      });
    } finally {
      setIsSavingRecurring(false);
    }
  }

  async function deleteRecurringTransaction(id: number) {
    if (
      deletingRecurringId === id ||
      isSavingRecurring ||
      isGeneratingRecurring
    ) {
      return;
    }

    const item = recurringTransactions.find((entry) => entry.id === id);
    const toastId = toast.loading(
      "Deleting recurring item",
      item ? `Removing ${item.merchant}…` : "Removing recurring item…",
    );

    try {
      setDeletingRecurringId(id);

      await deleteRecurringTransactionById(id);
      await loadRecurringTransactions(false);

      if (editingRecurringId === id) {
        resetRecurringForm();
      }

      toast.updateToast(toastId, {
        type: "success",
        title: "Recurring item deleted",
        message: item
          ? `${item.merchant} was removed.`
          : "The recurring item was removed.",
        duration: 3500,
      });
    } catch (error) {
      toast.updateToast(toastId, {
        type: "error",
        title: "Unable to delete recurring item",
        message: getErrorMessage(error),
        duration: 6000,
      });
    } finally {
      setDeletingRecurringId(null);
    }
  }

  return {
    recurringTransactions,
    setRecurringTransactions,

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

    editingRecurringId,
    setEditingRecurringId,

    isSavingRecurring,
    isGeneratingRecurring,
    deletingRecurringId,

    resetRecurringForm,
    loadRecurringTransactions,
    addRecurringTransaction,
    generateRecurringTransactions,
    updateRecurringTransaction,
    deleteRecurringTransaction,
  };
}
