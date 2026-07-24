import { useState } from "react";
import type { Transfer } from "../types";

import {
  createTransfer,
  deleteTransferById,
  getTransfers,
  updateTransferById,
} from "../services/transferService";

import { useToast } from "../components/toast/ToastContext";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function useTransfers() {
  const toast = useToast();

  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [transferDate, setTransferDate] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNotes, setTransferNotes] = useState("");
  const [editingTransferId, setEditingTransferId] = useState<number | null>(
    null,
  );

  const [isSavingTransfer, setIsSavingTransfer] = useState(false);
  const [deletingTransferId, setDeletingTransferId] = useState<number | null>(
    null,
  );

  function resetTransferForm() {
    setEditingTransferId(null);
    setFromAccountId("");
    setToAccountId("");
    setTransferDate("");
    setTransferAmount("");
    setTransferNotes("");
  }

  async function loadTransfers(showErrorToast = true) {
    try {
      const result = await getTransfers();
      setTransfers(result);
      return result;
    } catch (error) {
      console.error("Load transfers failed:", error);

      if (showErrorToast) {
        toast.error("Unable to load transfers", getErrorMessage(error));
      }

      throw error;
    }
  }

  function validateTransfer() {
    const fromId = Number(fromAccountId);
    const toId = Number(toAccountId);
    const amount = Number(transferAmount);

    if (!Number.isInteger(fromId) || fromId <= 0) {
      toast.warning(
        "Sending account required",
        "Select the account money is leaving.",
      );
      return false;
    }

    if (!Number.isInteger(toId) || toId <= 0) {
      toast.warning(
        "Receiving account required",
        "Select the account receiving the money.",
      );
      return false;
    }

    if (fromId === toId) {
      toast.warning(
        "Invalid transfer",
        "The sending and receiving accounts must be different.",
      );
      return false;
    }

    if (!transferDate) {
      toast.warning(
        "Transfer date required",
        "Select a date for the transfer.",
      );
      return false;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.warning(
        "Invalid transfer amount",
        "The amount must be greater than zero.",
      );
      return false;
    }

    return true;
  }

  function getSavedValues() {
    return {
      fromId: Number(fromAccountId),
      toId: Number(toAccountId),
      date: transferDate,
      amount: Number(transferAmount),
      notes: transferNotes.trim(),
    };
  }

  async function addTransfer(afterSave?: () => Promise<void>) {
    if (
      isSavingTransfer ||
      deletingTransferId !== null ||
      !validateTransfer()
    ) {
      return;
    }

    const values = getSavedValues();
    const toastId = toast.loading(
      "Creating transfer",
      "Updating both account balances…",
    );

    try {
      setIsSavingTransfer(true);

      await createTransfer(
        values.fromId,
        values.toId,
        values.date,
        values.amount,
        values.notes,
      );
      await loadTransfers(false);

      if (typeof afterSave === "function") await afterSave();

      resetTransferForm();

      toast.updateToast(toastId, {
        type: "success",
        title: "Transfer completed",
        message: "Both account balances were updated.",
        duration: 3500,
      });
    } catch (error) {
      toast.updateToast(toastId, {
        type: "error",
        title: "Unable to create transfer",
        message: getErrorMessage(error),
        duration: 6000,
      });
    } finally {
      setIsSavingTransfer(false);
    }
  }

  async function updateTransfer(afterSave?: () => Promise<void>) {
    if (isSavingTransfer || deletingTransferId !== null) return;

    if (!editingTransferId) {
      toast.warning("No transfer selected", "Choose a transfer to edit.");
      return;
    }

    if (!validateTransfer()) return;

    const savedId = editingTransferId;
    const values = getSavedValues();
    const toastId = toast.loading(
      "Updating transfer",
      "Recalculating both account balances…",
    );

    try {
      setIsSavingTransfer(true);

      await updateTransferById(
        savedId,
        values.fromId,
        values.toId,
        values.date,
        values.amount,
        values.notes,
      );
      await loadTransfers(false);

      if (typeof afterSave === "function") await afterSave();

      resetTransferForm();

      toast.updateToast(toastId, {
        type: "success",
        title: "Transfer updated",
        message: "The transfer and balances were updated.",
        duration: 3500,
      });
    } catch (error) {
      toast.updateToast(toastId, {
        type: "error",
        title: "Unable to update transfer",
        message: getErrorMessage(error),
        duration: 6000,
      });
    } finally {
      setIsSavingTransfer(false);
    }
  }

  async function deleteTransfer(
    transfer: Transfer,
    afterSave?: () => Promise<void>,
  ) {
    if (deletingTransferId === transfer.id || isSavingTransfer) {
      return;
    }

    const toastId = toast.loading(
      "Deleting transfer",
      "Restoring the previous account balances…",
    );

    try {
      setDeletingTransferId(transfer.id);

      await deleteTransferById(transfer);
      await loadTransfers(false);

      if (typeof afterSave === "function") await afterSave();

      if (editingTransferId === transfer.id) {
        resetTransferForm();
      }

      toast.updateToast(toastId, {
        type: "success",
        title: "Transfer deleted",
        message: "The transfer was removed and balances were restored.",
        duration: 3500,
      });
    } catch (error) {
      toast.updateToast(toastId, {
        type: "error",
        title: "Unable to delete transfer",
        message: getErrorMessage(error),
        duration: 6000,
      });
    } finally {
      setDeletingTransferId(null);
    }
  }

  return {
    transfers,
    setTransfers,

    fromAccountId,
    setFromAccountId,

    toAccountId,
    setToAccountId,

    transferDate,
    setTransferDate,

    transferAmount,
    setTransferAmount,

    transferNotes,
    setTransferNotes,

    editingTransferId,
    setEditingTransferId,

    isSavingTransfer,
    deletingTransferId,

    resetTransferForm,
    loadTransfers,
    addTransfer,
    updateTransfer,
    deleteTransfer,
  };
}
