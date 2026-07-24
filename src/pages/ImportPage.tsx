import Papa from "papaparse";
import type { Account } from "../types";

type CsvRow = Record<string, string>;

type Props = {
  accounts: Account[];

  importAccountId: string;
  setImportAccountId: (value: string) => void;

  csvRows: CsvRow[];
  setCsvRows: (rows: CsvRow[]) => void;

  dateColumn: string;
  setDateColumn: (value: string) => void;

  merchantColumn: string;
  setMerchantColumn: (value: string) => void;

  amountColumn: string;
  setAmountColumn: (value: string) => void;

  importCsvTransactions: () => void;
};

export function ImportPage({
  accounts,
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
  importCsvTransactions,
}: Props) {
  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setCsvRows(result.data);

        const firstRow = result.data[0];
        if (firstRow) {
          const columns = Object.keys(firstRow);

          const date =
            columns.find((c) => c.toLowerCase().includes("date")) || "";

          const merchant =
            columns.find((c) => c.toLowerCase().includes("description")) || "";

          const amount =
            columns.find((c) => c.toLowerCase().includes("amount")) || "";

          setDateColumn(date);
          setMerchantColumn(merchant);
          setAmountColumn(amount);
        }
      },
    });
  }

  const columns = csvRows.length > 0 ? Object.keys(csvRows[0]) : [];

  return (
    <>
      <h2>Import CSV</h2>

      <div className="panel">
        <h3>Upload CSV</h3>

        <select
          value={importAccountId}
          onChange={(e) => setImportAccountId(e.target.value)}
        >
          <option value="">Select Account</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>

        <br />
        <br />

        <input type="file" accept=".csv" onChange={handleFileUpload} />
      </div>

      {csvRows.length > 0 && (
        <>
          <div className="panel">
            <h3>Map Columns</h3>

            <label>Date Column</label>
            <select
              value={dateColumn}
              onChange={(e) => setDateColumn(e.target.value)}
            >
              {columns.map((column) => (
                <option key={column}>{column}</option>
              ))}
            </select>

            <br />
            <br />

            <label>Merchant Column</label>
            <select
              value={merchantColumn}
              onChange={(e) => setMerchantColumn(e.target.value)}
            >
              {columns.map((column) => (
                <option key={column}>{column}</option>
              ))}
            </select>

            <br />
            <br />

            <label>Amount Column</label>
            <select
              value={amountColumn}
              onChange={(e) => setAmountColumn(e.target.value)}
            >
              {columns.map((column) => (
                <option key={column}>{column}</option>
              ))}
            </select>

            <br />
            <br />

            <button onClick={importCsvTransactions}>Import Transactions</button>
          </div>

          <div className="panel">
            <h3>Preview</h3>

            <p>Rows found: {csvRows.length}</p>
            <p>Columns: {columns.join(", ")}</p>

            {csvRows.slice(0, 5).map((row, index) => (
              <div
                key={index}
                style={{
                  padding: "12px",
                  marginTop: "10px",
                  background: "#202637",
                  borderRadius: "10px",
                }}
              >
                <strong>Date:</strong> {row[dateColumn]}
                <br />
                <strong>Merchant:</strong> {row[merchantColumn]}
                <br />
                <strong>Amount:</strong> {row[amountColumn]}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
