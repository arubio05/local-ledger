import { useState } from "react";
import type { BudgetGroup, BudgetItem } from "../types";

import {
  getBudgetGroups,
  getBudgetItems,
  createDefaultBudgetGroups,
  createBudgetItem,
  updateBudgetItemById,
  deleteBudgetItemById,
  copyBudgetToNextMonth,
  copyBudgetFromPreviousMonth,
} from "../services/zeroBudgetService";

import { useToast } from "../components/toast/ToastContext";

type LoadZeroBudgetOptions = {
  showErrorToast?: boolean;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function isValidBudgetMonth(value: string) {
  if (!/^\d{4}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month] = value.split("-").map(Number);

  return (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    year >= 1900 &&
    month >= 1 &&
    month <= 12
  );
}

function getNextBudgetMonth(value: string) {
  const [year, month] = value.split("-").map(Number);

  const nextDate = new Date(year, month, 1);

  return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

export function useZeroBudget() {
  const toast = useToast();

  const [budgetGroups, setBudgetGroups] = useState<BudgetGroup[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);

  const [zeroBudgetMonth, setZeroBudgetMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );

  const [budgetItemGroupId, setBudgetItemGroupId] = useState("");
  const [budgetItemName, setBudgetItemName] = useState("");
  const [budgetItemExpected, setBudgetItemExpected] = useState("");
  const [budgetItemActual, setBudgetItemActual] = useState("");

  const [editingBudgetItemId, setEditingBudgetItemId] = useState<number | null>(
    null,
  );

  const [isSavingBudgetItem, setIsSavingBudgetItem] = useState(false);

  const [deletingBudgetItemId, setDeletingBudgetItemId] = useState<
    number | null
  >(null);

  const [isCopyingBudget, setIsCopyingBudget] = useState(false);

  function resetBudgetItemForm() {
    setEditingBudgetItemId(null);
    setBudgetItemGroupId("");
    setBudgetItemName("");
    setBudgetItemExpected("");
    setBudgetItemActual("");
  }

  async function loadZeroBudget(
    month = zeroBudgetMonth,
    options: LoadZeroBudgetOptions = {},
  ) {
    const { showErrorToast = true } = options;

    if (!isValidBudgetMonth(month)) {
      const error = new Error("The selected budget month is invalid.");

      if (showErrorToast) {
        toast.error("Unable to load budget", error.message);
      }

      throw error;
    }

    try {
      await createDefaultBudgetGroups(month);

      const [groups, items] = await Promise.all([
        getBudgetGroups(month),
        getBudgetItems(month),
      ]);

      setBudgetGroups(groups);
      setBudgetItems(items);

      return {
        groups,
        items,
      };
    } catch (error) {
      console.error("Load zero budget failed:", error);

      if (showErrorToast) {
        toast.error("Unable to load budget", getErrorMessage(error));
      }

      throw error;
    }
  }

  function validateBudgetItem() {
    const name = budgetItemName.trim();
    const groupId = Number(budgetItemGroupId);
    const expectedAmount = Number(budgetItemExpected || 0);

    if (!isValidBudgetMonth(zeroBudgetMonth)) {
      toast.warning("Invalid budget month", "Select a valid budget month.");

      return false;
    }

    if (!budgetItemGroupId || !Number.isInteger(groupId) || groupId <= 0) {
      toast.warning("Budget group required", "Select a valid budget group.");

      return false;
    }

    const groupExists = budgetGroups.some((group) => group.id === groupId);

    if (!groupExists) {
      toast.warning(
        "Budget group not found",
        "The selected budget group is no longer available.",
      );

      return false;
    }

    if (!name) {
      toast.warning(
        "Category name required",
        "Enter a name for the budget item.",
      );

      return false;
    }

    if (
      budgetItemExpected.trim() !== "" &&
      (!Number.isFinite(expectedAmount) || expectedAmount < 0)
    ) {
      toast.warning(
        "Invalid assigned amount",
        "Assigned amount must be zero or greater.",
      );

      return false;
    }

    const duplicate = budgetItems.some(
      (item) =>
        item.id !== editingBudgetItemId &&
        item.group_id === groupId &&
        item.budget_month === zeroBudgetMonth &&
        item.name.trim().toLowerCase() === name.toLowerCase(),
    );

    if (duplicate) {
      toast.warning(
        "Duplicate budget item",
        "This budget item already exists in the selected group.",
      );

      return false;
    }

    return true;
  }

  async function addBudgetItem() {
    if (isSavingBudgetItem || !validateBudgetItem()) {
      return;
    }

    const savedGroupId = Number(budgetItemGroupId);
    const savedMonth = zeroBudgetMonth;
    const savedName = budgetItemName.trim();
    const savedExpectedAmount = Number(budgetItemExpected || 0);

    const loadingToastId = toast.loading(
      "Adding budget item",
      `Creating ${savedName}…`,
    );

    try {
      setIsSavingBudgetItem(true);

      await createBudgetItem(
        savedGroupId,
        savedMonth,
        savedName,
        savedExpectedAmount,
      );

      await loadZeroBudget(savedMonth, {
        showErrorToast: false,
      });

      resetBudgetItemForm();

      toast.updateToast(loadingToastId, {
        type: "success",
        title: "Budget item added",
        message: `${savedName} was added to the budget.`,
        duration: 3500,
      });
    } catch (error) {
      console.error("Add budget item failed:", error);

      toast.updateToast(loadingToastId, {
        type: "error",
        title: "Unable to add budget item",
        message: getErrorMessage(error),
        duration: 6000,
      });
    } finally {
      setIsSavingBudgetItem(false);
    }
  }

  async function updateBudgetItem() {
    if (isSavingBudgetItem) {
      return;
    }

    if (!editingBudgetItemId) {
      toast.warning("No budget item selected", "Choose a budget item to edit.");

      return;
    }

    if (!validateBudgetItem()) {
      return;
    }

    const actualAmount = Number(budgetItemActual || 0);

    if (!Number.isFinite(actualAmount) || actualAmount < 0) {
      toast.warning(
        "Invalid activity amount",
        "Activity amount must be zero or greater.",
      );

      return;
    }

    const savedId = editingBudgetItemId;
    const savedGroupId = Number(budgetItemGroupId);
    const savedMonth = zeroBudgetMonth;
    const savedName = budgetItemName.trim();
    const savedExpectedAmount = Number(budgetItemExpected || 0);

    const loadingToastId = toast.loading(
      "Updating budget item",
      `Saving changes to ${savedName}…`,
    );

    try {
      setIsSavingBudgetItem(true);

      await updateBudgetItemById(
        savedId,
        savedGroupId,
        savedName,
        savedExpectedAmount,
        actualAmount,
      );

      await loadZeroBudget(savedMonth, {
        showErrorToast: false,
      });

      resetBudgetItemForm();

      toast.updateToast(loadingToastId, {
        type: "success",
        title: "Budget item updated",
        message: `${savedName} was updated.`,
        duration: 3500,
      });
    } catch (error) {
      console.error("Update budget item failed:", error);

      toast.updateToast(loadingToastId, {
        type: "error",
        title: "Unable to update budget item",
        message: getErrorMessage(error),
        duration: 6000,
      });
    } finally {
      setIsSavingBudgetItem(false);
    }
  }

  async function deleteBudgetItem(id: number) {
    if (deletingBudgetItemId === id) {
      return;
    }

    const item = budgetItems.find((entry) => entry.id === id);
    const savedMonth = zeroBudgetMonth;

    const loadingToastId = toast.loading(
      "Deleting budget item",
      item ? `Removing ${item.name}…` : "Removing budget item…",
    );

    try {
      setDeletingBudgetItemId(id);

      await deleteBudgetItemById(id);

      await loadZeroBudget(savedMonth, {
        showErrorToast: false,
      });

      if (editingBudgetItemId === id) {
        resetBudgetItemForm();
      }

      toast.updateToast(loadingToastId, {
        type: "success",
        title: "Budget item deleted",
        message: item
          ? `${item.name} was removed.`
          : "The budget item was removed.",
        duration: 3500,
      });
    } catch (error) {
      console.error("Delete budget item failed:", error);

      toast.updateToast(loadingToastId, {
        type: "error",
        title: "Unable to delete budget item",
        message: getErrorMessage(error),
        duration: 6000,
      });
    } finally {
      setDeletingBudgetItemId(null);
    }
  }

  async function copyCurrentBudgetToNextMonth() {
    if (isCopyingBudget) {
      return;
    }

    if (!isValidBudgetMonth(zeroBudgetMonth)) {
      toast.warning(
        "Invalid budget month",
        "Select a valid budget month before copying.",
      );

      return;
    }

    if (budgetItems.length === 0) {
      toast.info(
        "Nothing to copy",
        "The current month does not contain any budget items.",
      );

      return;
    }

    const sourceMonth = zeroBudgetMonth;
    const nextMonth = getNextBudgetMonth(sourceMonth);

    const loadingToastId = toast.loading(
      "Copying budget forward",
      `Creating the ${nextMonth} budget…`,
    );

    try {
      setIsCopyingBudget(true);

      const copiedCount = await copyBudgetToNextMonth(sourceMonth, nextMonth);

      await loadZeroBudget(nextMonth, {
        showErrorToast: false,
      });

      if (copiedCount === 0) {
        toast.updateToast(loadingToastId, {
          type: "info",
          title: "Nothing new to copy",
          message:
            "The source month was empty or all items already exist in the next month.",
          duration: 4000,
        });

        return;
      }

      setZeroBudgetMonth(nextMonth);
      resetBudgetItemForm();

      toast.updateToast(loadingToastId, {
        type: "success",
        title: "Budget copied forward",
        message: `${copiedCount} budget item${
          copiedCount === 1 ? "" : "s"
        } copied to ${nextMonth}.`,
        duration: 4000,
      });
    } catch (error) {
      console.error("Copy budget forward failed:", error);

      toast.updateToast(loadingToastId, {
        type: "error",
        title: "Unable to copy budget forward",
        message: getErrorMessage(error),
        duration: 6000,
      });
    } finally {
      setIsCopyingBudget(false);
    }
  }

  async function copyPreviousBudgetIntoCurrentMonth() {
    if (isCopyingBudget) {
      return;
    }

    if (!isValidBudgetMonth(zeroBudgetMonth)) {
      toast.warning(
        "Invalid budget month",
        "Select a valid budget month before copying.",
      );

      return;
    }

    const destinationMonth = zeroBudgetMonth;

    const loadingToastId = toast.loading(
      "Copying previous budget",
      `Loading the previous month into ${destinationMonth}…`,
    );

    try {
      setIsCopyingBudget(true);

      const copiedCount = await copyBudgetFromPreviousMonth(destinationMonth);

      await loadZeroBudget(destinationMonth, {
        showErrorToast: false,
      });

      resetBudgetItemForm();

      if (copiedCount === 0) {
        toast.updateToast(loadingToastId, {
          type: "info",
          title: "Nothing to copy",
          message: "The previous month had no new budget items to copy.",
          duration: 4000,
        });

        return;
      }

      toast.updateToast(loadingToastId, {
        type: "success",
        title: "Budget copied",
        message: `${copiedCount} budget item${
          copiedCount === 1 ? "" : "s"
        } copied into ${destinationMonth}.`,
        duration: 4000,
      });
    } catch (error) {
      console.error("Copy previous budget failed:", error);

      toast.updateToast(loadingToastId, {
        type: "error",
        title: "Unable to copy previous budget",
        message: getErrorMessage(error),
        duration: 6000,
      });
    } finally {
      setIsCopyingBudget(false);
    }
  }

  return {
    budgetGroups,
    setBudgetGroups,

    budgetItems,
    setBudgetItems,

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

    isSavingBudgetItem,
    deletingBudgetItemId,
    isCopyingBudget,

    resetBudgetItemForm,
    loadZeroBudget,

    addBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,

    copyCurrentBudgetToNextMonth,
    copyPreviousBudgetIntoCurrentMonth,
  };
}
