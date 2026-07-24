import { useState } from "react";

import type { Account } from "../types";

import {
  getAccounts,
  createAccount,
  updateAccountById,
  deleteAccountById,
} from "../services/accountService";

import { useToast } from "../components/toast/ToastContext";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function useAccounts() {
  const toast = useToast();

  const [accounts, setAccounts] = useState<Account[]>([]);

  const [accountName, setAccountName] = useState("");

  const [accountType, setAccountType] = useState("Checking");

  const [accountBalance, setAccountBalance] = useState("");

  const [editingAccountId, setEditingAccountId] = useState<number | null>(null);

  const [isSavingAccount, setIsSavingAccount] = useState(false);

  const [deletingAccountId, setDeletingAccountId] = useState<number | null>(
    null,
  );

  function resetAccountForm() {
    setEditingAccountId(null);
    setAccountName("");
    setAccountType("Checking");
    setAccountBalance("");
  }

  async function loadAccounts() {
    try {
      const result = await getAccounts();
      setAccounts(result);
    } catch (error) {
      console.error("Load accounts failed:", error);

      toast.error("Unable to load accounts", getErrorMessage(error));
    }
  }

  function validateAccount() {
    if (!accountName.trim()) {
      toast.warning("Account name required", "Enter a name for the account.");

      return false;
    }

    const numericBalance = Number(accountBalance || 0);

    if (!Number.isFinite(numericBalance)) {
      toast.warning("Invalid balance", "Enter a valid account balance.");

      return false;
    }

    return true;
  }

  async function addAccount(afterSave?: () => Promise<void>) {
    if (isSavingAccount) {
      return;
    }

    if (!validateAccount()) {
      return;
    }

    const savedAccountName = accountName.trim();
    const loadingToastId = toast.loading(
      "Adding account",
      `Creating ${savedAccountName}…`,
    );

    try {
      setIsSavingAccount(true);

      await createAccount(
        savedAccountName,
        accountType,
        Number(accountBalance) || 0,
      );

      await loadAccounts();

      if (typeof afterSave === "function") {
        await afterSave();
      }

      resetAccountForm();

      toast.updateToast(loadingToastId, {
        type: "success",
        title: "Account added",
        message: `${savedAccountName} was created.`,
        duration: 3500,
      });
    } catch (error) {
      console.error("Add account failed:", error);

      toast.updateToast(loadingToastId, {
        type: "error",
        title: "Unable to add account",
        message: getErrorMessage(error),
        duration: 6000,
      });
    } finally {
      setIsSavingAccount(false);
    }
  }

  async function updateAccount(afterSave?: () => Promise<void>) {
    if (isSavingAccount) {
      return;
    }

    if (!editingAccountId) {
      toast.warning("No account selected", "Choose an account to edit.");

      return;
    }

    if (!validateAccount()) {
      return;
    }

    const savedAccountName = accountName.trim();

    const loadingToastId = toast.loading(
      "Updating account",
      `Saving changes to ${savedAccountName}…`,
    );

    try {
      setIsSavingAccount(true);

      await updateAccountById(
        editingAccountId,
        savedAccountName,
        accountType,
        Number(accountBalance) || 0,
      );

      await loadAccounts();

      if (typeof afterSave === "function") {
        await afterSave();
      }

      resetAccountForm();

      toast.updateToast(loadingToastId, {
        type: "success",
        title: "Account updated",
        message: `${savedAccountName} was updated.`,
        duration: 3500,
      });
    } catch (error) {
      console.error("Update account failed:", error);

      toast.updateToast(loadingToastId, {
        type: "error",
        title: "Unable to update account",
        message: getErrorMessage(error),
        duration: 6000,
      });
    } finally {
      setIsSavingAccount(false);
    }
  }

  async function deleteAccount(id: number, afterSave?: () => Promise<void>) {
    if (deletingAccountId === id) {
      return;
    }

    const account = accounts.find((item) => item.id === id);

    const loadingToastId = toast.loading(
      "Deleting account",
      account ? `Removing ${account.name}…` : "Removing account…",
    );

    try {
      setDeletingAccountId(id);

      await deleteAccountById(id);
      await loadAccounts();

      if (typeof afterSave === "function") {
        await afterSave();
      }

      resetAccountForm();

      toast.updateToast(loadingToastId, {
        type: "success",
        title: "Account deleted",
        message: account
          ? `${account.name} was removed.`
          : "The account was removed.",
        duration: 3500,
      });
    } catch (error) {
      console.error("Delete account failed:", error);

      toast.updateToast(loadingToastId, {
        type: "error",
        title: "Unable to delete account",
        message:
          "This account may still be linked to transactions, transfers, goals, funds, bills, debt, or recurring items.",
        duration: 6500,
      });
    } finally {
      setDeletingAccountId(null);
    }
  }

  return {
    accounts,
    setAccounts,

    accountName,
    setAccountName,

    accountType,
    setAccountType,

    accountBalance,
    setAccountBalance,

    editingAccountId,
    setEditingAccountId,

    isSavingAccount,
    deletingAccountId,

    resetAccountForm,
    loadAccounts,
    addAccount,
    updateAccount,
    deleteAccount,
  };
}
