import { useEffect, useState } from "react";

import { getMonthlyReport } from "../utils/reports";
import { useDashboard } from "./useDashboard";
import { useAccounts } from "./useAccounts";
import { useTransactions } from "./useTransactions";
import { useTransfers } from "./useTransfers";
import { useGoals } from "./useGoals";
import { useFunds } from "./useFunds";
import { useDebts } from "./useDebts";
import { useRecurringTransactions } from "./useRecurringTransactions";
import { useCsvImport } from "./useCsvImport";
import { useZeroBudget } from "./useZeroBudget";
import { useAppSettings } from "./useAppSettings";

import { resetAllData } from "../services/resetService";
import { seedDemoData } from "../services/demoDataService";

import { useToast } from "../components/toast/ToastContext";
import { useToastAction } from "./useToastAction";

import { useAutomaticBackup } from "./useAutomaticBackup";

import type { Page } from "../types/navigation";

function getLocalMonth() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getLocalDate() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(now.getDate()).padStart(2, "0")}`;
}

const ONBOARDING_DISMISSED_KEY = "projectFMJ.onboardingDismissed";

function readOnboardingDismissed() {
  try {
    return localStorage.getItem(ONBOARDING_DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
}

export function useApp() {
  const toast = useToast();
  const { runWithToast, isRunning } = useToastAction();

  const [page, setPage] = useState<Page>("dashboard");

  const accountsHook = useAccounts();
  const transactionsHook = useTransactions();
  const transfersHook = useTransfers();
  const goalsHook = useGoals();
  const fundsHook = useFunds();
  const debtsHook = useDebts();
  const recurringHook = useRecurringTransactions();
  const importHook = useCsvImport();
  const zeroBudgetHook = useZeroBudget();
  const settingsHook = useAppSettings();

  const [selectedMonth, setSelectedMonth] = useState(getLocalMonth);

  const [reportMonth, setReportMonth] = useState(getLocalMonth);

  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);

  const [onboardingDismissed, setOnboardingDismissed] = useState(
    readOnboardingDismissed,
  );

  const [onboardingTemporarilyHidden, setOnboardingTemporarilyHidden] =
    useState(false);

  const dashboard = useDashboard(
    accountsHook.accounts,
    transactionsHook.transactions,
    zeroBudgetHook.budgetItems,
    selectedMonth,
  );

  const report = getMonthlyReport(transactionsHook.transactions, reportMonth);

  const dashboardReport = getMonthlyReport(
    transactionsHook.transactions,
    selectedMonth,
  );

  const fallbackCategories = [
    "Groceries",
    "Dining",
    "Gas",
    "Baby",
    "Travel",
    "Subscriptions",
    "Savings",
    "Income",
    "Other",
  ];

  const budgetCategories = Array.from(
    new Set(zeroBudgetHook.budgetItems.map((item) => item.name)),
  );

  const transactionCategories =
    budgetCategories.length > 0 ? budgetCategories : fallbackCategories;

  const automaticBackupHook = useAutomaticBackup();

  const hasOnboardingAccount = accountsHook.accounts.length > 0;

  const hasOnboardingTransaction = transactionsHook.transactions.length > 0;

  const hasOnboardingBudget = zeroBudgetHook.budgetItems.length > 0;

  const onboardingCompleted =
    hasOnboardingAccount && hasOnboardingTransaction && hasOnboardingBudget;

  const showOnboarding =
    isInitialDataLoaded &&
    !onboardingDismissed &&
    !onboardingTemporarilyHidden &&
    !onboardingCompleted;

  async function reloadAccountRelatedData() {
    await Promise.all([
      accountsHook.loadAccounts(),
      goalsHook.loadGoals(),
      fundsHook.loadFunds(),
    ]);
  }

  async function reloadAfterTransactionChange() {
    await Promise.all([
      reloadAccountRelatedData(),
      transactionsHook.loadTransactions(),
      zeroBudgetHook.loadZeroBudget(),
    ]);
  }

  async function reloadAfterTransferChange() {
    await Promise.all([
      reloadAccountRelatedData(),
      transfersHook.loadTransfers(),
    ]);
  }

  async function reloadAfterRecurringGeneration() {
    await Promise.all([
      reloadAfterTransactionChange(),
      recurringHook.loadRecurringTransactions(),
    ]);
  }

  async function reloadAllApplicationData() {
    await Promise.all([
      accountsHook.loadAccounts(),
      transactionsHook.loadTransactions(),
      transfersHook.loadTransfers(),
      goalsHook.loadGoals(),
      fundsHook.loadFunds(),
      debtsHook.loadDebts(),
      recurringHook.loadRecurringTransactions(),
      zeroBudgetHook.loadZeroBudget(),
    ]);
  }

  function startTransactionFromBudget(
    category: string,
    groupType?: string,
    suggestedAmount?: number,
  ) {
    const isIncome = groupType === "income";

    transactionsHook.resetTransactionForm();

    transactionsHook.setTransactionAccountId(
      isIncome
        ? settingsHook.defaultIncomeAccountId
        : settingsHook.defaultSpendingAccountId,
    );

    transactionsHook.setTransactionDate(getLocalDate());

    transactionsHook.setMerchant(category);
    transactionsHook.setCategory(category);

    transactionsHook.setAmount(
      suggestedAmount && suggestedAmount > 0 ? String(suggestedAmount) : "",
    );

    transactionsHook.setTransactionType(isIncome ? "Income" : "Expense");

    setPage("transactions");
  }

  async function resetApplicationData() {
    return runWithToast(
      "reset-application-data",
      async () => {
        await resetAllData();
        await reloadAllApplicationData();
      },
      {
        loadingTitle: "Resetting Project FMJ",
        loadingMessage: "Removing all application data…",
        successTitle: "Project FMJ reset",
        successMessage: "All application data was removed.",
        errorTitle: "Unable to reset Project FMJ",
      },
    );
  }

  async function seedApplicationDemoData() {
    return runWithToast(
      "seed-demo-data",
      async () => {
        await seedDemoData();
        await reloadAllApplicationData();
      },
      {
        loadingTitle: "Creating demo data",
        loadingMessage: "Adding sample financial records…",
        successTitle: "Demo data created",
        successMessage:
          "Sample accounts, transactions, budgets, goals, funds, debt, and recurring items were added.",
        errorTitle: "Unable to create demo data",
      },
    );
  }

  function dismissOnboarding() {
    setOnboardingDismissed(true);

    try {
      localStorage.setItem(ONBOARDING_DISMISSED_KEY, "true");
    } catch (error) {
      console.error("Unable to save onboarding preference:", error);
    }
  }

  function openOnboardingAccounts() {
    setOnboardingTemporarilyHidden(true);
    accountsHook.resetAccountForm();
    setPage("accounts");
  }

  function openOnboardingTransactions() {
    setOnboardingTemporarilyHidden(true);
    transactionsHook.resetTransactionForm();

    if (accountsHook.accounts.length === 1) {
      transactionsHook.setTransactionAccountId(
        String(accountsHook.accounts[0].id),
      );
    }

    const now = new Date();

    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(now.getDate()).padStart(2, "0")}`;

    transactionsHook.setTransactionDate(today);
    setPage("transactions");
  }

  function openOnboardingBudget() {
    setOnboardingTemporarilyHidden(true);
    zeroBudgetHook.resetBudgetItemForm();
    setPage("budget");
  }

  useEffect(() => {
    async function loadInitialData() {
      try {
        await reloadAllApplicationData();
      } catch (error) {
        console.error("Initial application load failed:", error);

        toast.error(
          "Unable to load Project FMJ",
          error instanceof Error ? error.message : String(error),
        );
      } finally {
        setIsInitialDataLoaded(true);
      }
    }

    void loadInitialData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    page,
    setPage,

    selectedMonth,
    setSelectedMonth,

    reportMonth,
    setReportMonth,

    dashboard,
    dashboardReport,
    report,

    accountsHook,
    transactionsHook,
    transfersHook,
    goalsHook,
    fundsHook,
    debtsHook,
    recurringHook,
    importHook,
    zeroBudgetHook,
    settingsHook,
    transactionCategories,

    reloadAccountRelatedData,
    reloadAfterTransactionChange,
    reloadAfterTransferChange,
    reloadAfterRecurringGeneration,

    startTransactionFromBudget,

    resetApplicationData,
    seedApplicationDemoData,

    isResettingApplication: isRunning("reset-application-data"),

    isSeedingDemoData: isRunning("seed-demo-data"),

    automaticBackupHook,

    isInitialDataLoaded,

    showOnboarding,
    onboardingCompleted,

    hasOnboardingAccount,
    hasOnboardingTransaction,
    hasOnboardingBudget,

    dismissOnboarding,

    openOnboardingAccounts,
    openOnboardingTransactions,
    openOnboardingBudget,
  };
}
