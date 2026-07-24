import { useState } from "react";

import { createTransaction } from "../services/transactionService";

export function useCsvImport() {
  const [importAccountId, setImportAccountId] = useState("");
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [dateColumn, setDateColumn] = useState("");
  const [merchantColumn, setMerchantColumn] = useState("");
  const [amountColumn, setAmountColumn] = useState("");

  function resetImportForm() {
    setCsvRows([]);
    setImportAccountId("");
    setDateColumn("");
    setMerchantColumn("");
    setAmountColumn("");
  }

  async function importCsvTransactions(afterImport?: () => Promise<void>) {
    if (!importAccountId || !dateColumn || !merchantColumn || !amountColumn) {
      alert("Please select account and map all columns.");
      return;
    }

    for (const row of csvRows) {
      if (!row[dateColumn] || !row[merchantColumn] || !row[amountColumn]) {
        continue;
      }

      const rawAmount = row[amountColumn];

      const cleanAmount = Number(
        rawAmount
          .replace(/\$/g, "")
          .replace(/,/g, "")
          .replace(/\(/g, "-")
          .replace(/\)/g, "")
          .trim()
      );

      if (Number.isNaN(cleanAmount)) continue;

      const signedAmount = -Math.abs(cleanAmount);

      await createTransaction(
        Number(importAccountId),
        row[dateColumn],
        row[merchantColumn],
        "Other",
        signedAmount,
        "Imported from CSV"
      );
    }

    resetImportForm();

    if (afterImport) await afterImport();

    alert("CSV import complete.");
  }

  return {
    importAccountId,
    setImportAccountId,

    csvRows,
    setCsvRows,

    dateColumn,
    setDateColumn,

    merchantColumn,
    setMerchantColumn,

    amountColumn,
    setAmountColumn,

    resetImportForm,
    importCsvTransactions,
  };
}
