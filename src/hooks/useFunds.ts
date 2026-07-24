import { useState } from "react";
import type { Fund } from "../types";

import {
  createFund,
  deleteFundById,
  getFunds,
  updateFundById,
} from "../services/fundService";

import { useToast } from "../components/toast/ToastContext";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function useFunds() {
  const toast = useToast();

  const [funds, setFunds] = useState<Fund[]>([]);
  const [fundName, setFundName] = useState("");
  const [fundTargetAmount, setFundTargetAmount] = useState("");
  const [fundCurrentAmount, setFundCurrentAmount] = useState("");
  const [fundLinkedAccountId, setFundLinkedAccountId] = useState("");
  const [fundMonthlyContribution, setFundMonthlyContribution] = useState("");
  const [fundDueDate, setFundDueDate] = useState("");
  const [fundNotes, setFundNotes] = useState("");

  const [editingFundId, setEditingFundId] = useState<number | null>(null);
  const [isSavingFund, setIsSavingFund] = useState(false);
  const [deletingFundId, setDeletingFundId] = useState<number | null>(null);

  function resetFundForm() {
    setEditingFundId(null);
    setFundName("");
    setFundTargetAmount("");
    setFundCurrentAmount("");
    setFundLinkedAccountId("");
    setFundMonthlyContribution("");
    setFundDueDate("");
    setFundNotes("");
  }

  async function loadFunds(showErrorToast = true) {
    try {
      const result = await getFunds();
      setFunds(result);
      return result;
    } catch (error) {
      console.error("Load funds failed:", error);

      if (showErrorToast) {
        toast.error("Unable to load funds", getErrorMessage(error));
      }

      throw error;
    }
  }

  function getFormValues() {
    const linkedAccountId = fundLinkedAccountId
      ? Number(fundLinkedAccountId)
      : null;

    return {
      name: fundName.trim(),
      targetAmount: fundTargetAmount.trim() ? Number(fundTargetAmount) : null,
      currentAmount:
        linkedAccountId !== null
          ? 0
          : fundCurrentAmount.trim()
            ? Number(fundCurrentAmount)
            : 0,
      linkedAccountId,
      monthlyContribution: fundMonthlyContribution.trim()
        ? Number(fundMonthlyContribution)
        : null,
      dueDate: fundDueDate || null,
      notes: fundNotes.trim(),
    };
  }

  function validateFund() {
    const values = getFormValues();

    if (!values.name) {
      toast.warning("Fund name required", "Enter a name for the fund.");
      return false;
    }

    if (
      values.targetAmount !== null &&
      (!Number.isFinite(values.targetAmount) || values.targetAmount <= 0)
    ) {
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
      values.monthlyContribution !== null &&
      (!Number.isFinite(values.monthlyContribution) ||
        values.monthlyContribution < 0)
    ) {
      toast.warning(
        "Invalid monthly contribution",
        "Monthly contribution cannot be negative.",
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
      values.targetAmount !== null &&
      values.currentAmount > values.targetAmount
    ) {
      toast.warning(
        "Current amount exceeds target",
        "Current amount cannot be greater than the target amount.",
      );
      return false;
    }

    const duplicate = funds.some(
      (fund) =>
        fund.id !== editingFundId &&
        fund.name.trim().toLowerCase() === values.name.toLowerCase(),
    );

    if (duplicate) {
      toast.warning("Duplicate fund", "A fund with this name already exists.");
      return false;
    }

    return true;
  }

  async function addFund(afterSave?: () => Promise<void>) {
    if (isSavingFund || deletingFundId !== null || !validateFund()) {
      return;
    }

    const values = getFormValues();
    const toastId = toast.loading("Adding fund", `Creating ${values.name}…`);

    try {
      setIsSavingFund(true);

      await createFund(
        values.name,
        values.targetAmount,
        values.currentAmount,
        values.linkedAccountId,
        values.monthlyContribution,
        values.dueDate,
        values.notes,
      );
      await loadFunds(false);

      if (typeof afterSave === "function") await afterSave();

      resetFundForm();

      toast.updateToast(toastId, {
        type: "success",
        title: "Fund added",
        message: `${values.name} was created.`,
        duration: 3500,
      });
    } catch (error) {
      toast.updateToast(toastId, {
        type: "error",
        title: "Unable to add fund",
        message: getErrorMessage(error),
        duration: 6000,
      });
    } finally {
      setIsSavingFund(false);
    }
  }

  async function updateFund(afterSave?: () => Promise<void>) {
    if (isSavingFund || deletingFundId !== null) return;

    if (!editingFundId) {
      toast.warning("No fund selected", "Choose a fund to edit.");
      return;
    }

    if (!validateFund()) return;

    const savedId = editingFundId;
    const values = getFormValues();
    const toastId = toast.loading(
      "Updating fund",
      `Saving changes to ${values.name}…`,
    );

    try {
      setIsSavingFund(true);

      await updateFundById(
        savedId,
        values.name,
        values.targetAmount,
        values.currentAmount,
        values.linkedAccountId,
        values.monthlyContribution,
        values.dueDate,
        values.notes,
      );
      await loadFunds(false);

      if (typeof afterSave === "function") await afterSave();

      resetFundForm();

      toast.updateToast(toastId, {
        type: "success",
        title: "Fund updated",
        message: `${values.name} was updated.`,
        duration: 3500,
      });
    } catch (error) {
      toast.updateToast(toastId, {
        type: "error",
        title: "Unable to update fund",
        message: getErrorMessage(error),
        duration: 6000,
      });
    } finally {
      setIsSavingFund(false);
    }
  }

  async function deleteFund(id: number, afterSave?: () => Promise<void>) {
    if (deletingFundId === id || isSavingFund) return;

    const fund = funds.find((item) => item.id === id);
    const toastId = toast.loading(
      "Deleting fund",
      fund ? `Removing ${fund.name}…` : "Removing fund…",
    );

    try {
      setDeletingFundId(id);

      await deleteFundById(id);
      await loadFunds(false);

      if (typeof afterSave === "function") await afterSave();

      if (editingFundId === id) {
        resetFundForm();
      }

      toast.updateToast(toastId, {
        type: "success",
        title: "Fund deleted",
        message: fund ? `${fund.name} was removed.` : "The fund was removed.",
        duration: 3500,
      });
    } catch (error) {
      toast.updateToast(toastId, {
        type: "error",
        title: "Unable to delete fund",
        message: getErrorMessage(error),
        duration: 6000,
      });
    } finally {
      setDeletingFundId(null);
    }
  }

  return {
    funds,
    setFunds,

    fundName,
    setFundName,

    fundTargetAmount,
    setFundTargetAmount,

    fundCurrentAmount,
    setFundCurrentAmount,

    fundLinkedAccountId,
    setFundLinkedAccountId,

    fundMonthlyContribution,
    setFundMonthlyContribution,

    fundDueDate,
    setFundDueDate,

    fundNotes,
    setFundNotes,

    editingFundId,
    setEditingFundId,

    isSavingFund,
    deletingFundId,

    resetFundForm,
    loadFunds,
    addFund,
    updateFund,
    deleteFund,
  };
}
