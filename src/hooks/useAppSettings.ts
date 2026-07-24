import { useEffect, useState } from "react";

const DEFAULT_SPENDING_ACCOUNT_KEY = "projectFMJ.defaultSpendingAccountId";
const DEFAULT_INCOME_ACCOUNT_KEY = "projectFMJ.defaultIncomeAccountId";

const LEGACY_SPENDING_ACCOUNT_KEY = "localLedger.defaultSpendingAccountId";
const LEGACY_INCOME_ACCOUNT_KEY = "localLedger.defaultIncomeAccountId";

function readStoredValue(primaryKey: string, legacyKey: string) {
  try {
    const primaryValue = localStorage.getItem(primaryKey);

    if (primaryValue !== null) {
      return primaryValue;
    }

    const legacyValue = localStorage.getItem(legacyKey);

    if (legacyValue !== null) {
      localStorage.setItem(primaryKey, legacyValue);
      localStorage.removeItem(legacyKey);
      return legacyValue;
    }
  } catch (error) {
    console.error("Unable to read application settings:", error);
  }

  return "";
}

function writeStoredValue(key: string, value: string) {
  try {
    if (value) {
      localStorage.setItem(key, value);
    } else {
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.error("Unable to save application setting:", error);
  }
}

export function useAppSettings() {
  const [defaultSpendingAccountId, setDefaultSpendingAccountIdState] =
    useState("");
  const [defaultIncomeAccountId, setDefaultIncomeAccountIdState] = useState("");

  useEffect(() => {
    setDefaultSpendingAccountIdState(
      readStoredValue(
        DEFAULT_SPENDING_ACCOUNT_KEY,
        LEGACY_SPENDING_ACCOUNT_KEY,
      ),
    );

    setDefaultIncomeAccountIdState(
      readStoredValue(DEFAULT_INCOME_ACCOUNT_KEY, LEGACY_INCOME_ACCOUNT_KEY),
    );
  }, []);

  function setDefaultSpendingAccountId(value: string) {
    setDefaultSpendingAccountIdState(value);
    writeStoredValue(DEFAULT_SPENDING_ACCOUNT_KEY, value);
  }

  function setDefaultIncomeAccountId(value: string) {
    setDefaultIncomeAccountIdState(value);
    writeStoredValue(DEFAULT_INCOME_ACCOUNT_KEY, value);
  }

  return {
    defaultSpendingAccountId,
    setDefaultSpendingAccountId,

    defaultIncomeAccountId,
    setDefaultIncomeAccountId,
  };
}
