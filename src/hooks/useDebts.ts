import { useState } from "react";
import type { Debt } from "../types";

import {
  createDebt,
  deleteDebtById,
  getDebts,
  updateDebtById,
} from "../services/debtService";

import { useToast } from "../components/toast/ToastContext";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getLocalDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function useDebts() {
  const toast = useToast();

  const [debts, setDebts] = useState<Debt[]>([]);

  const [debtName, setDebtName] = useState("");
  const [originalBalance, setOriginalBalance] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [minimumPayment, setMinimumPayment] = useState("");
  const [extraPayment, setExtraPayment] = useState("");
  const [debtDueDate, setDebtDueDate] = useState("");
  const [debtNotes, setDebtNotes] = useState("");

  const [editingDebtId, setEditingDebtId] = useState<number | null>(null);
  const [isSavingDebt, setIsSavingDebt] = useState(false);
  const [deletingDebtId, setDeletingDebtId] = useState<number | null>(null);

  const [paymentDebtId, setPaymentDebtId] = useState<number | null>(null);
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(getLocalDate());
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  function resetDebtForm() {
    setEditingDebtId(null);
    setDebtName("");
    setOriginalBalance("");
    setCurrentBalance("");
    setInterestRate("");
    setMinimumPayment("");
    setExtraPayment("");
    setDebtDueDate("");
    setDebtNotes("");
  }

  function resetDebtPaymentForm() {
    setPaymentDebtId(null);
    setPaymentAccountId("");
    setPaymentAmount("");
    setPaymentDate(getLocalDate());
    setPaymentNotes("");
  }

  function openDebtPayment(debt: Debt) {
    setPaymentDebtId(debt.id);
    setPaymentAccountId("");

    const suggestedPayment = debt.minimum_payment + debt.extra_payment;

    setPaymentAmount(
      suggestedPayment > 0
        ? String(Math.min(suggestedPayment, debt.current_balance))
        : "",
    );

    setPaymentDate(getLocalDate());
    setPaymentNotes("");
  }

  function closeDebtPayment() {
    if (isRecordingPayment) return;

    resetDebtPaymentForm();
  }

  async function loadDebts(showErrorToast = true) {
    try {
      const result = await getDebts();
      setDebts(result);
      return result;
    } catch (error) {
      console.error("Load debts failed:", error);

      if (showErrorToast) {
        toast.error("Unable to load debts", getErrorMessage(error));
      }

      throw error;
    }
  }

  function validateDebt() {
    const name = debtName.trim();
    const original = Number(originalBalance);
    const current = Number(currentBalance);
    const rate = Number(interestRate || 0);
    const minimum = Number(minimumPayment || 0);
    const extra = Number(extraPayment || 0);

    if (!name) {
      toast.warning("Debt name required", "Enter a name for the debt.");
      return false;
    }

    if (!Number.isFinite(original) || original <= 0) {
      toast.warning(
        "Invalid original balance",
        "Original balance must be greater than zero.",
      );
      return false;
    }

    if (!Number.isFinite(current) || current < 0) {
      toast.warning(
        "Invalid current balance",
        "Current balance cannot be negative.",
      );
      return false;
    }

    if (current > original) {
      toast.warning(
        "Current balance is too high",
        "Current balance cannot exceed the original balance.",
      );
      return false;
    }

    if (!Number.isFinite(rate) || rate < 0) {
      toast.warning(
        "Invalid interest rate",
        "Interest rate cannot be negative.",
      );
      return false;
    }

    if (!Number.isFinite(minimum) || minimum < 0) {
      toast.warning(
        "Invalid minimum payment",
        "Minimum payment cannot be negative.",
      );
      return false;
    }

    if (!Number.isFinite(extra) || extra < 0) {
      toast.warning(
        "Invalid extra payment",
        "Extra payment cannot be negative.",
      );
      return false;
    }

    const duplicate = debts.some(
      (debt) =>
        debt.id !== editingDebtId &&
        debt.name.trim().toLowerCase() === name.toLowerCase(),
    );

    if (duplicate) {
      toast.warning("Duplicate debt", "A debt with this name already exists.");
      return false;
    }

    return true;
  }

  async function addDebt(afterSave?: () => Promise<void>) {
    if (isSavingDebt || deletingDebtId !== null || !validateDebt()) {
      return;
    }

    const savedName = debtName.trim();

    const values = {
      original: Number(originalBalance),
      current: Number(currentBalance),
      rate: Number(interestRate || 0),
      minimum: Number(minimumPayment || 0),
      extra: Number(extraPayment || 0),
      dueDate: debtDueDate || null,
      notes: debtNotes.trim(),
    };

    const toastId = toast.loading("Adding debt", `Creating ${savedName}…`);

    try {
      setIsSavingDebt(true);

      await createDebt(
        savedName,
        values.original,
        values.current,
        values.rate,
        values.minimum,
        values.extra,
        values.dueDate,
        values.notes,
      );

      await loadDebts(false);

      if (typeof afterSave === "function") {
        await afterSave();
      }

      resetDebtForm();

      toast.updateToast(toastId, {
        type: "success",
        title: "Debt added",
        message: `${savedName} was added successfully.`,
        duration: 3500,
      });
    } catch (error) {
      toast.updateToast(toastId, {
        type: "error",
        title: "Unable to add debt",
        message: getErrorMessage(error),
        duration: 6000,
      });
    } finally {
      setIsSavingDebt(false);
    }
  }

  async function updateDebt(afterSave?: () => Promise<void>) {
    if (isSavingDebt || deletingDebtId !== null) return;

    if (!editingDebtId) {
      toast.warning("No debt selected", "Choose a debt to edit.");
      return;
    }

    if (!validateDebt()) return;

    const savedId = editingDebtId;
    const savedName = debtName.trim();

    const values = {
      original: Number(originalBalance),
      current: Number(currentBalance),
      rate: Number(interestRate || 0),
      minimum: Number(minimumPayment || 0),
      extra: Number(extraPayment || 0),
      dueDate: debtDueDate || null,
      notes: debtNotes.trim(),
    };

    const toastId = toast.loading(
      "Updating debt",
      `Saving changes to ${savedName}…`,
    );

    try {
      setIsSavingDebt(true);

      await updateDebtById(
        savedId,
        savedName,
        values.original,
        values.current,
        values.rate,
        values.minimum,
        values.extra,
        values.dueDate,
        values.notes,
      );

      await loadDebts(false);

      if (typeof afterSave === "function") {
        await afterSave();
      }

      resetDebtForm();

      toast.updateToast(toastId, {
        type: "success",
        title: "Debt updated",
        message: `${savedName} was updated.`,
        duration: 3500,
      });
    } catch (error) {
      toast.updateToast(toastId, {
        type: "error",
        title: "Unable to update debt",
        message: getErrorMessage(error),
        duration: 6000,
      });
    } finally {
      setIsSavingDebt(false);
    }
  }

  async function deleteDebt(id: number, afterSave?: () => Promise<void>) {
    if (deletingDebtId === id || isSavingDebt || isRecordingPayment) {
      return;
    }

    const debt = debts.find((item) => item.id === id);

    const toastId = toast.loading(
      "Deleting debt",
      debt ? `Removing ${debt.name}…` : "Removing debt…",
    );

    try {
      setDeletingDebtId(id);

      await deleteDebtById(id);
      await loadDebts(false);

      if (typeof afterSave === "function") {
        await afterSave();
      }

      if (editingDebtId === id) {
        resetDebtForm();
      }

      if (paymentDebtId === id) {
        resetDebtPaymentForm();
      }

      toast.updateToast(toastId, {
        type: "success",
        title: "Debt deleted",
        message: debt ? `${debt.name} was removed.` : "The debt was removed.",
        duration: 3500,
      });
    } catch (error) {
      toast.updateToast(toastId, {
        type: "error",
        title: "Unable to delete debt",
        message: getErrorMessage(error),
        duration: 6000,
      });
    } finally {
      setDeletingDebtId(null);
    }
  }

  return {
    debts,
    setDebts,

    debtName,
    setDebtName,

    originalBalance,
    setOriginalBalance,

    currentBalance,
    setCurrentBalance,

    interestRate,
    setInterestRate,

    minimumPayment,
    setMinimumPayment,

    extraPayment,
    setExtraPayment,

    debtDueDate,
    setDebtDueDate,

    debtNotes,
    setDebtNotes,

    editingDebtId,
    setEditingDebtId,

    isSavingDebt,
    deletingDebtId,

    paymentDebtId,
    setPaymentDebtId,

    paymentAccountId,
    setPaymentAccountId,

    paymentAmount,
    setPaymentAmount,

    paymentDate,
    setPaymentDate,

    paymentNotes,
    setPaymentNotes,

    isRecordingPayment,
    setIsRecordingPayment,

    resetDebtForm,
    resetDebtPaymentForm,

    openDebtPayment,
    closeDebtPayment,

    loadDebts,
    addDebt,
    updateDebt,
    deleteDebt,
  };
}
