import { useState } from "react";
import type { Budget } from "../types";

import {
  createBudget,
  deleteBudgetById,
  getBudgets,
  updateBudgetById,
} from "../services/budgetService";

import { useToast } from "../components/toast/ToastContext";

type ResetBudgetFormOptions = {
  preserveMonth?: boolean;
};

function getCurrentMonth() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function isValidMonth(value: string) {
  if (!/^\d{4}-\d{2}$/.test(value)) return false;

  const [, month] = value.split("-").map(Number);

  return month >= 1 && month <= 12;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function useBudgets() {
  const toast = useToast();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetCategory, setBudgetCategory] = useState("Groceries");
  const [budgetLimit, setBudgetLimit] = useState("");
  const [editingBudgetId, setEditingBudgetId] = useState<number | null>(null);
  const [budgetMonth, setBudgetMonth] = useState(getCurrentMonth);

  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [deletingBudgetId, setDeletingBudgetId] = useState<number | null>(null);

  function resetBudgetForm(options: ResetBudgetFormOptions = {}) {
    setEditingBudgetId(null);
    setBudgetCategory("Groceries");
    setBudgetLimit("");

    if (!options.preserveMonth) {
      setBudgetMonth(getCurrentMonth());
    }
  }

  async function loadBudgets(showErrorToast = true) {
    try {
      const result = await getBudgets();
      setBudgets(result);
      return result;
    } catch (error) {
      console.error("Load budgets failed:", error);

      if (showErrorToast) {
        toast.error("Unable to load budgets", getErrorMessage(error));
      }

      throw error;
    }
  }

  function validateBudget() {
    const category = budgetCategory.trim();
    const limit = Number(budgetLimit);

    if (!isValidMonth(budgetMonth)) {
      toast.warning("Invalid budget month", "Select a valid month.");
      return false;
    }

    if (!category) {
      toast.warning("Category required", "Enter or select a budget category.");
      return false;
    }

    if (!budgetLimit.trim()) {
      toast.warning("Budget limit required", "Enter a monthly budget limit.");
      return false;
    }

    if (!Number.isFinite(limit) || limit < 0) {
      toast.warning(
        "Invalid budget limit",
        "The monthly limit must be zero or greater.",
      );
      return false;
    }

    const duplicate = budgets.some(
      (budget) =>
        budget.id !== editingBudgetId &&
        budget.budget_month === budgetMonth &&
        budget.category.trim().toLowerCase() === category.toLowerCase(),
    );

    if (duplicate) {
      toast.warning(
        "Duplicate budget",
        `${category} already has a budget for ${budgetMonth}.`,
      );
      return false;
    }

    return true;
  }

  async function addBudget() {
    if (isSavingBudget || deletingBudgetId !== null || !validateBudget()) {
      return;
    }

    const savedCategory = budgetCategory.trim();
    const savedMonth = budgetMonth;
    const savedLimit = Number(budgetLimit);

    const toastId = toast.loading(
      "Adding budget",
      `Creating ${savedCategory}…`,
    );

    try {
      setIsSavingBudget(true);

      await createBudget(savedMonth, savedCategory, savedLimit);
      await loadBudgets(false);

      resetBudgetForm({ preserveMonth: true });

      toast.updateToast(toastId, {
        type: "success",
        title: "Budget added",
        message: `${savedCategory} was added for ${savedMonth}.`,
        duration: 3500,
      });
    } catch (error) {
      toast.updateToast(toastId, {
        type: "error",
        title: "Unable to add budget",
        message: getErrorMessage(error),
        duration: 6000,
      });
    } finally {
      setIsSavingBudget(false);
    }
  }

  async function updateBudget() {
    if (isSavingBudget || deletingBudgetId !== null) return;

    if (!editingBudgetId) {
      toast.warning("No budget selected", "Choose a budget to edit.");
      return;
    }

    if (!validateBudget()) return;

    const savedId = editingBudgetId;
    const savedCategory = budgetCategory.trim();
    const savedMonth = budgetMonth;
    const savedLimit = Number(budgetLimit);

    const toastId = toast.loading(
      "Updating budget",
      `Saving changes to ${savedCategory}…`,
    );

    try {
      setIsSavingBudget(true);

      await updateBudgetById(savedId, savedMonth, savedCategory, savedLimit);
      await loadBudgets(false);

      resetBudgetForm({ preserveMonth: true });

      toast.updateToast(toastId, {
        type: "success",
        title: "Budget updated",
        message: `${savedCategory} was updated.`,
        duration: 3500,
      });
    } catch (error) {
      toast.updateToast(toastId, {
        type: "error",
        title: "Unable to update budget",
        message: getErrorMessage(error),
        duration: 6000,
      });
    } finally {
      setIsSavingBudget(false);
    }
  }

  async function deleteBudget(id: number) {
    if (deletingBudgetId === id || isSavingBudget) {
      return;
    }

    const budget = budgets.find((item) => item.id === id);
    const toastId = toast.loading(
      "Deleting budget",
      budget ? `Removing ${budget.category}…` : "Removing budget…",
    );

    try {
      setDeletingBudgetId(id);

      await deleteBudgetById(id);
      await loadBudgets(false);

      if (editingBudgetId === id) {
        resetBudgetForm({ preserveMonth: true });
      }

      toast.updateToast(toastId, {
        type: "success",
        title: "Budget deleted",
        message: budget
          ? `${budget.category} was removed.`
          : "The budget was removed.",
        duration: 3500,
      });
    } catch (error) {
      toast.updateToast(toastId, {
        type: "error",
        title: "Unable to delete budget",
        message: getErrorMessage(error),
        duration: 6000,
      });
    } finally {
      setDeletingBudgetId(null);
    }
  }

  return {
    budgets,
    setBudgets,

    budgetCategory,
    setBudgetCategory,

    budgetLimit,
    setBudgetLimit,

    editingBudgetId,
    setEditingBudgetId,

    budgetMonth,
    setBudgetMonth,

    isSavingBudget,
    deletingBudgetId,

    resetBudgetForm,
    loadBudgets,
    addBudget,
    updateBudget,
    deleteBudget,
  };
}
