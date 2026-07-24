import { useState } from "react";
import type { Goal } from "../types";

import {
  createGoal,
  deleteGoalById,
  getGoals,
  updateGoalById,
} from "../services/goalService";

import { useToast } from "../components/toast/ToastContext";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function useGoals() {
  const toast = useToast();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalName, setGoalName] = useState("");
  const [goalTargetAmount, setGoalTargetAmount] = useState("");
  const [goalCurrentAmount, setGoalCurrentAmount] = useState("");
  const [goalLinkedAccountId, setGoalLinkedAccountId] = useState("");
  const [goalNotes, setGoalNotes] = useState("");

  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [deletingGoalId, setDeletingGoalId] = useState<number | null>(null);

  function resetGoalForm() {
    setEditingGoalId(null);
    setGoalName("");
    setGoalTargetAmount("");
    setGoalCurrentAmount("");
    setGoalLinkedAccountId("");
    setGoalNotes("");
  }

  async function loadGoals(showErrorToast = true) {
    try {
      const result = await getGoals();
      setGoals(result);
      return result;
    } catch (error) {
      console.error("Load goals failed:", error);

      if (showErrorToast) {
        toast.error("Unable to load goals", getErrorMessage(error));
      }

      throw error;
    }
  }

  function getFormValues() {
    const linkedAccountId = goalLinkedAccountId
      ? Number(goalLinkedAccountId)
      : null;

    return {
      name: goalName.trim(),
      targetAmount: Number(goalTargetAmount),
      currentAmount:
        linkedAccountId !== null ? 0 : Number(goalCurrentAmount || 0),
      linkedAccountId,
      notes: goalNotes.trim(),
    };
  }

  function validateGoal() {
    const values = getFormValues();

    if (!values.name) {
      toast.warning("Goal name required", "Enter a name for the goal.");
      return false;
    }

    if (!Number.isFinite(values.targetAmount) || values.targetAmount <= 0) {
      toast.warning(
        "Invalid target amount",
        "Target amount must be greater than zero.",
      );
      return false;
    }

    if (!Number.isFinite(values.currentAmount) || values.currentAmount < 0) {
      toast.warning(
        "Invalid current amount",
        "Current amount cannot be negative.",
      );
      return false;
    }

    if (
      values.linkedAccountId !== null &&
      (!Number.isInteger(values.linkedAccountId) || values.linkedAccountId <= 0)
    ) {
      toast.warning("Invalid linked account", "Select a valid linked account.");
      return false;
    }

    if (
      values.linkedAccountId === null &&
      values.currentAmount > values.targetAmount
    ) {
      toast.warning(
        "Current amount exceeds target",
        "Current amount cannot be greater than the target amount.",
      );
      return false;
    }

    const duplicate = goals.some(
      (goal) =>
        goal.id !== editingGoalId &&
        goal.name.trim().toLowerCase() === values.name.toLowerCase(),
    );

    if (duplicate) {
      toast.warning("Duplicate goal", "A goal with this name already exists.");
      return false;
    }

    return true;
  }

  async function addGoal(afterSave?: () => Promise<void>) {
    if (isSavingGoal || deletingGoalId !== null || !validateGoal()) {
      return;
    }

    const values = getFormValues();
    const toastId = toast.loading("Adding goal", `Creating ${values.name}…`);

    try {
      setIsSavingGoal(true);

      await createGoal(
        values.name,
        values.targetAmount,
        values.currentAmount,
        values.linkedAccountId,
        values.notes,
      );
      await loadGoals(false);

      if (typeof afterSave === "function") await afterSave();

      resetGoalForm();

      toast.updateToast(toastId, {
        type: "success",
        title: "Goal added",
        message: `${values.name} was created.`,
        duration: 3500,
      });
    } catch (error) {
      toast.updateToast(toastId, {
        type: "error",
        title: "Unable to add goal",
        message: getErrorMessage(error),
        duration: 6000,
      });
    } finally {
      setIsSavingGoal(false);
    }
  }

  async function updateGoal(afterSave?: () => Promise<void>) {
    if (isSavingGoal || deletingGoalId !== null) return;

    if (!editingGoalId) {
      toast.warning("No goal selected", "Choose a goal to edit.");
      return;
    }

    if (!validateGoal()) return;

    const savedId = editingGoalId;
    const values = getFormValues();
    const toastId = toast.loading(
      "Updating goal",
      `Saving changes to ${values.name}…`,
    );

    try {
      setIsSavingGoal(true);

      await updateGoalById(
        savedId,
        values.name,
        values.targetAmount,
        values.currentAmount,
        values.linkedAccountId,
        values.notes,
      );
      await loadGoals(false);

      if (typeof afterSave === "function") await afterSave();

      resetGoalForm();

      toast.updateToast(toastId, {
        type: "success",
        title: "Goal updated",
        message: `${values.name} was updated.`,
        duration: 3500,
      });
    } catch (error) {
      toast.updateToast(toastId, {
        type: "error",
        title: "Unable to update goal",
        message: getErrorMessage(error),
        duration: 6000,
      });
    } finally {
      setIsSavingGoal(false);
    }
  }

  async function deleteGoal(id: number, afterSave?: () => Promise<void>) {
    if (deletingGoalId === id || isSavingGoal) return;

    const goal = goals.find((item) => item.id === id);
    const toastId = toast.loading(
      "Deleting goal",
      goal ? `Removing ${goal.name}…` : "Removing goal…",
    );

    try {
      setDeletingGoalId(id);

      await deleteGoalById(id);
      await loadGoals(false);

      if (typeof afterSave === "function") await afterSave();

      if (editingGoalId === id) {
        resetGoalForm();
      }

      toast.updateToast(toastId, {
        type: "success",
        title: "Goal deleted",
        message: goal ? `${goal.name} was removed.` : "The goal was removed.",
        duration: 3500,
      });
    } catch (error) {
      toast.updateToast(toastId, {
        type: "error",
        title: "Unable to delete goal",
        message: getErrorMessage(error),
        duration: 6000,
      });
    } finally {
      setDeletingGoalId(null);
    }
  }

  return {
    goals,
    setGoals,

    goalName,
    setGoalName,

    goalTargetAmount,
    setGoalTargetAmount,

    goalCurrentAmount,
    setGoalCurrentAmount,

    goalLinkedAccountId,
    setGoalLinkedAccountId,

    goalNotes,
    setGoalNotes,

    editingGoalId,
    setEditingGoalId,

    isSavingGoal,
    deletingGoalId,

    resetGoalForm,
    loadGoals,
    addGoal,
    updateGoal,
    deleteGoal,
  };
}
