import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Edit3,
  Landmark,
  Repeat2,
  Search,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";

import type { Account, Transfer } from "../types";
import { MasterDetailLayout } from "../components/layout/MasterDetailLayout";
import { useModal } from "../components/modal/ModalContext";

type Props = {
  accounts: Account[];
  transfers: Transfer[];

  fromAccountId: string;
  setFromAccountId: (value: string) => void;

  toAccountId: string;
  setToAccountId: (value: string) => void;

  transferDate: string;
  setTransferDate: (value: string) => void;

  transferAmount: string;
  setTransferAmount: (value: string) => void;

  transferNotes: string;
  setTransferNotes: (value: string) => void;

  addTransfer: () => void;

  editingTransferId: number | null;
  setEditingTransferId: (value: number | null) => void;

  updateTransfer: () => void;
  deleteTransfer: (transfer: Transfer) => void;
  resetTransferForm: () => void;

  isSavingTransfer?: boolean;
  deletingTransferId?: number | null;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getCurrentMonth() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function TransfersPage({
  accounts,
  transfers,

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

  addTransfer,

  editingTransferId,
  setEditingTransferId,

  updateTransfer,
  deleteTransfer,
  resetTransferForm,

  isSavingTransfer = false,
  deletingTransferId = null,
}: Props) {
  const { openConfirm } = useModal();

  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState(getCurrentMonth);

  const selectedFromAccount = accounts.find(
    (account) => String(account.id) === fromAccountId,
  );

  const selectedToAccount = accounts.find(
    (account) => String(account.id) === toAccountId,
  );

  const totalTransferred = useMemo(
    () =>
      transfers.reduce((sum, transfer) => sum + Math.abs(transfer.amount), 0),
    [transfers],
  );

  const thisMonthTransferred = useMemo(
    () =>
      transfers
        .filter((transfer) => transfer.date.startsWith(getCurrentMonth()))
        .reduce((sum, transfer) => sum + Math.abs(transfer.amount), 0),
    [transfers],
  );

  const accountCount = useMemo(() => {
    const accountIds = new Set<number>();

    for (const transfer of transfers) {
      accountIds.add(transfer.from_account_id);

      accountIds.add(transfer.to_account_id);
    }

    return accountIds.size;
  }, [transfers]);

  const filteredTransfers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return transfers.filter((transfer) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          transfer.from_account_name,
          transfer.to_account_name,
          transfer.notes,
          transfer.date,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesMonth =
        !filterMonth || transfer.date.startsWith(filterMonth);

      return matchesSearch && matchesMonth;
    });
  }, [filterMonth, search, transfers]);

  function beginEdit(transfer: Transfer) {
    setEditingTransferId(transfer.id);

    setFromAccountId(String(transfer.from_account_id));

    setToAccountId(String(transfer.to_account_id));

    setTransferDate(transfer.date);
    setTransferAmount(String(transfer.amount));

    setTransferNotes(transfer.notes || "");
  }

  function swapAccounts() {
    const previousFromAccount = fromAccountId;

    setFromAccountId(toAccountId);
    setToAccountId(previousFromAccount);
  }

  function clearFilters() {
    setSearch("");
    setFilterMonth("");
  }

  return (
    <MasterDetailLayout
      title="Transfers"
      left={
        <section className="transfer-editor">
          <header className="transfer-editor-header">
            <div className="transfer-editor-icon">
              {editingTransferId ? <Edit3 size={20} /> : <Repeat2 size={20} />}
            </div>

            <div>
              <h3>{editingTransferId ? "Edit transfer" : "Move money"}</h3>

              <p>
                Transfer money between your accounts without counting it as
                income or spending.
              </p>
            </div>
          </header>

          <div className="transfer-route-card">
            <div className="transfer-route-account">
              <span>From</span>

              <strong>{selectedFromAccount?.name ?? "Select account"}</strong>

              <small>
                {selectedFromAccount
                  ? formatMoney(selectedFromAccount.balance)
                  : "Money leaves this account"}
              </small>
            </div>

            <button
              type="button"
              className="transfer-swap-button"
              aria-label="Swap transfer accounts"
              disabled={isSavingTransfer || (!fromAccountId && !toAccountId)}
              onClick={swapAccounts}
            >
              <Repeat2 size={17} />
            </button>

            <div className="transfer-route-account destination">
              <span>To</span>

              <strong>{selectedToAccount?.name ?? "Select account"}</strong>

              <small>
                {selectedToAccount
                  ? formatMoney(selectedToAccount.balance)
                  : "Money enters this account"}
              </small>
            </div>
          </div>

          <div className="transfer-form">
            <label className="transfer-field">
              <span>From account</span>

              <div className="transfer-input-icon">
                <ArrowUpRight size={16} />

                <select
                  value={fromAccountId}
                  onChange={(event) => setFromAccountId(event.target.value)}
                >
                  <option value="">Select sending account</option>

                  {accounts.map((account) => (
                    <option
                      key={account.id}
                      value={account.id}
                      disabled={String(account.id) === toAccountId}
                    >
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <label className="transfer-field">
              <span>To account</span>

              <div className="transfer-input-icon">
                <ArrowDownLeft size={16} />

                <select
                  value={toAccountId}
                  onChange={(event) => setToAccountId(event.target.value)}
                >
                  <option value="">Select receiving account</option>

                  {accounts.map((account) => (
                    <option
                      key={account.id}
                      value={account.id}
                      disabled={String(account.id) === fromAccountId}
                    >
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <label className="transfer-field">
              <span>Transfer date</span>

              <div className="transfer-input-icon">
                <CalendarDays size={16} />

                <input
                  type="date"
                  value={transferDate}
                  onChange={(event) => setTransferDate(event.target.value)}
                />
              </div>
            </label>

            <label className="transfer-field">
              <span>Amount</span>

              <div className="transfer-input-icon">
                <WalletCards size={16} />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(event) => setTransferAmount(event.target.value)}
                />
              </div>
            </label>

            <label className="transfer-field transfer-field-wide">
              <span>Notes</span>

              <textarea
                rows={3}
                placeholder="Optional note about this transfer"
                value={transferNotes}
                onChange={(event) => setTransferNotes(event.target.value)}
              />
            </label>
          </div>

          <div className="transfer-form-actions">
            <button
              type="button"
              disabled={isSavingTransfer}
              onClick={editingTransferId ? updateTransfer : addTransfer}
            >
              {editingTransferId ? (
                <Edit3 size={16} />
              ) : (
                <ArrowRight size={16} />
              )}

              {isSavingTransfer
                ? "Saving…"
                : editingTransferId
                  ? "Save changes"
                  : "Complete transfer"}
            </button>

            {editingTransferId && (
              <button
                type="button"
                className="secondary-button"
                disabled={isSavingTransfer}
                onClick={resetTransferForm}
              >
                <X size={16} />
                Cancel
              </button>
            )}
          </div>
        </section>
      }
      right={
        <section className="transfer-overview">
          <div className="transfer-summary-grid">
            <article className="transfer-summary-card">
              <div className="transfer-summary-icon">
                <Repeat2 size={20} />
              </div>

              <div>
                <span>Total transferred</span>

                <strong>{formatMoney(totalTransferred)}</strong>

                <small>
                  Across {transfers.length} transfer
                  {transfers.length === 1 ? "" : "s"}
                </small>
              </div>
            </article>

            <article className="transfer-summary-card">
              <div className="transfer-summary-icon current">
                <CalendarDays size={20} />
              </div>

              <div>
                <span>This month</span>

                <strong>{formatMoney(thisMonthTransferred)}</strong>

                <small>Current calendar month</small>
              </div>
            </article>

            <article className="transfer-summary-card">
              <div className="transfer-summary-icon accounts">
                <Landmark size={20} />
              </div>

              <div>
                <span>Accounts used</span>

                <strong>{accountCount}</strong>

                <small>Accounts involved in transfers</small>
              </div>
            </article>
          </div>

          <div className="transfer-list-toolbar">
            <div>
              <h3>Transfer history</h3>

              <p>Review money moved between your accounts.</p>
            </div>

            <div className="transfer-filter-row">
              <div className="transfer-search">
                <Search size={16} />

                <input
                  type="search"
                  placeholder="Search transfers"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <input
                className="transfer-month-filter"
                type="month"
                value={filterMonth}
                onChange={(event) => setFilterMonth(event.target.value)}
              />

              {(search || filterMonth) && (
                <button
                  type="button"
                  className="secondary-button transfer-clear-filter"
                  onClick={clearFilters}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {filteredTransfers.length === 0 ? (
            <div className="transfer-empty-state">
              <Repeat2 size={30} />

              <h3>
                {transfers.length === 0
                  ? "No transfers yet"
                  : "No matching transfers"}
              </h3>

              <p>
                {transfers.length === 0
                  ? "Move money between two accounts and it will appear here."
                  : "Try changing your search or month filter."}
              </p>
            </div>
          ) : (
            <div className="transfer-card-list">
              {filteredTransfers.map((transfer) => {
                const isDeleting = deletingTransferId === transfer.id;

                return (
                  <article key={transfer.id} className="transfer-history-card">
                    <div className="transfer-history-date">
                      <CalendarDays size={16} />

                      <span>{formatDate(transfer.date)}</span>
                    </div>

                    <div className="transfer-history-route">
                      <div className="transfer-account-chip from">
                        <ArrowUpRight size={15} />

                        <div>
                          <span>From</span>

                          <strong>{transfer.from_account_name}</strong>
                        </div>
                      </div>

                      <div className="transfer-route-line">
                        <ArrowRight size={16} />
                      </div>

                      <div className="transfer-account-chip to">
                        <ArrowDownLeft size={15} />

                        <div>
                          <span>To</span>

                          <strong>{transfer.to_account_name}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="transfer-history-amount">
                      <span>Amount</span>

                      <strong>{formatMoney(Math.abs(transfer.amount))}</strong>
                    </div>

                    {transfer.notes && (
                      <p className="transfer-history-notes">{transfer.notes}</p>
                    )}

                    <div className="transfer-history-actions">
                      <button
                        type="button"
                        className="icon-button"
                        aria-label="Edit transfer"
                        disabled={isDeleting}
                        onClick={() => beginEdit(transfer)}
                      >
                        <Edit3 size={16} />
                      </button>

                      <button
                        type="button"
                        className="icon-button danger"
                        aria-label="Delete transfer"
                        disabled={isDeleting}
                        onClick={() =>
                          openConfirm({
                            title: "Delete Transfer",

                            message: `Delete the ${formatMoney(
                              Math.abs(transfer.amount),
                            )} transfer from ${transfer.from_account_name} to ${
                              transfer.to_account_name
                            }?`,

                            confirmText: "Delete",

                            danger: true,

                            onConfirm: () => deleteTransfer(transfer),
                          })
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      }
    />
  );
}
