import { useMemo, useState } from "react";
import {
  CalendarDays,
  CreditCard,
  DollarSign,
  Edit3,
  Gauge,
  Landmark,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  TrendingDown,
  WalletCards,
  X,
  HandCoins,
} from "lucide-react";

import type { Debt } from "../types";
import type { Account } from "../types";
import { MasterDetailLayout } from "../components/layout/MasterDetailLayout";
import { useModal } from "../components/modal/ModalContext";
import { DebtPaymentDialog } from "../components/debt/DebtPaymentDialog";

type Props = {
  debts: Debt[];

  debtName: string;
  setDebtName: (value: string) => void;

  debtOriginalBalance: string;
  setDebtOriginalBalance: (value: string) => void;

  debtCurrentBalance: string;
  setDebtCurrentBalance: (value: string) => void;

  debtInterestRate: string;
  setDebtInterestRate: (value: string) => void;

  debtMinimumPayment: string;
  setDebtMinimumPayment: (value: string) => void;

  debtExtraPayment: string;
  setDebtExtraPayment: (value: string) => void;

  debtDueDate: string;
  setDebtDueDate: (value: string) => void;

  debtNotes: string;
  setDebtNotes: (value: string) => void;

  editingDebtId: number | null;
  setEditingDebtId: (value: number | null) => void;

  addDebt: () => void;
  updateDebt: () => void;
  deleteDebt: (id: number) => void;
  resetDebtForm: () => void;

  isSavingDebt?: boolean;
  deletingDebtId?: number | null;

  accounts: Account[];

  paymentAccountId: string;
  setPaymentAccountId: (value: string) => void;

  paymentAmount: string;
  setPaymentAmount: (value: string) => void;

  paymentDate: string;
  setPaymentDate: (value: string) => void;

  paymentNotes: string;
  setPaymentNotes: (value: string) => void;

  isRecordingPayment: boolean;

  recordDebtPayment: () => Promise<void>;

  paymentDebtId: number | null;
  openDebtPayment: (debt: Debt) => void;
  closeDebtPayment: () => void;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "No due date";

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getPayoffProgress(debt: Debt) {
  if (debt.original_balance <= 0) return 0;

  const paid = debt.original_balance - debt.current_balance;

  return Math.max(0, Math.min((paid / debt.original_balance) * 100, 100));
}

export function DebtPage({
  debts,
  debtName,
  setDebtName,
  debtOriginalBalance,
  setDebtOriginalBalance,
  debtCurrentBalance,
  setDebtCurrentBalance,
  debtInterestRate,
  setDebtInterestRate,
  debtMinimumPayment,
  setDebtMinimumPayment,
  debtExtraPayment,
  setDebtExtraPayment,
  debtDueDate,
  setDebtDueDate,
  debtNotes,
  setDebtNotes,
  editingDebtId,
  setEditingDebtId,
  addDebt,
  updateDebt,
  deleteDebt,
  resetDebtForm,
  isSavingDebt = false,
  deletingDebtId = null,

  accounts,

  paymentAccountId,
  setPaymentAccountId,

  paymentAmount,
  setPaymentAmount,

  paymentDate,
  setPaymentDate,

  paymentNotes,
  setPaymentNotes,

  isRecordingPayment,

  recordDebtPayment,

  paymentDebtId,
  openDebtPayment,
  closeDebtPayment,
}: Props) {
  const { openConfirm } = useModal();
  const [search, setSearch] = useState("");

  const totalDebt = useMemo(
    () => debts.reduce((sum, debt) => sum + debt.current_balance, 0),
    [debts],
  );

  const monthlyPayments = useMemo(
    () =>
      debts.reduce(
        (sum, debt) => sum + debt.minimum_payment + debt.extra_payment,
        0,
      ),
    [debts],
  );

  const totalInterestWeighted = useMemo(() => {
    if (totalDebt <= 0) return 0;

    return (
      debts.reduce(
        (sum, debt) => sum + debt.current_balance * debt.interest_rate,
        0,
      ) / totalDebt
    );
  }, [debts, totalDebt]);

  const totalPaid = useMemo(
    () =>
      debts.reduce(
        (sum, debt) =>
          sum + Math.max(debt.original_balance - debt.current_balance, 0),
        0,
      ),
    [debts],
  );

  const filteredDebts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return debts;

    return debts.filter((debt) =>
      [debt.name, debt.notes, String(debt.interest_rate)]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [debts, search]);

  function beginEdit(debt: Debt) {
    setEditingDebtId(debt.id);
    setDebtName(debt.name);
    setDebtOriginalBalance(String(debt.original_balance));
    setDebtCurrentBalance(String(debt.current_balance));
    setDebtInterestRate(String(debt.interest_rate));
    setDebtMinimumPayment(String(debt.minimum_payment));
    setDebtExtraPayment(String(debt.extra_payment));
    setDebtDueDate(debt.due_date || "");
    setDebtNotes(debt.notes || "");
  }

  return (
    <>
      <MasterDetailLayout
        title="Debt"
        left={
          <section className="finance-editor">
            <header className="finance-editor-header">
              <div className="finance-editor-icon debt">
                {editingDebtId ? <Edit3 size={20} /> : <Plus size={20} />}
              </div>

              <div>
                <h3>{editingDebtId ? "Edit debt" : "Add a debt"}</h3>
                <p>Track balances, rates, and your payoff plan.</p>
              </div>
            </header>

            <div className="finance-form">
              <label className="finance-field finance-field-wide">
                <span>Debt name</span>
                <div className="finance-input-icon">
                  <Landmark size={16} />
                  <input
                    type="text"
                    placeholder="Personal loan"
                    value={debtName}
                    onChange={(event) => setDebtName(event.target.value)}
                  />
                </div>
              </label>

              <label className="finance-field">
                <span>Original balance</span>
                <div className="finance-input-icon">
                  <DollarSign size={16} />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="25000"
                    value={debtOriginalBalance}
                    onChange={(event) =>
                      setDebtOriginalBalance(event.target.value)
                    }
                  />
                </div>
              </label>

              <label className="finance-field">
                <span>Current balance</span>
                <div className="finance-input-icon">
                  <WalletCards size={16} />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="25000"
                    value={debtCurrentBalance}
                    onChange={(event) =>
                      setDebtCurrentBalance(event.target.value)
                    }
                  />
                </div>
              </label>

              <label className="finance-field">
                <span>APR</span>
                <div className="finance-input-icon">
                  <Gauge size={16} />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="11.75"
                    value={debtInterestRate}
                    onChange={(event) =>
                      setDebtInterestRate(event.target.value)
                    }
                  />
                </div>
              </label>

              <label className="finance-field">
                <span>Minimum payment</span>
                <div className="finance-input-icon">
                  <CreditCard size={16} />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="565"
                    value={debtMinimumPayment}
                    onChange={(event) =>
                      setDebtMinimumPayment(event.target.value)
                    }
                  />
                </div>
              </label>

              <label className="finance-field">
                <span>Extra payment</span>
                <div className="finance-input-icon">
                  <TrendingDown size={16} />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="200"
                    value={debtExtraPayment}
                    onChange={(event) =>
                      setDebtExtraPayment(event.target.value)
                    }
                  />
                </div>
              </label>

              <label className="finance-field">
                <span>Next due date</span>
                <div className="finance-input-icon">
                  <CalendarDays size={16} />
                  <input
                    type="date"
                    value={debtDueDate}
                    onChange={(event) => setDebtDueDate(event.target.value)}
                  />
                </div>
              </label>

              <label className="finance-field finance-field-wide">
                <span>Notes</span>
                <textarea
                  rows={3}
                  placeholder="Optional notes about this debt"
                  value={debtNotes}
                  onChange={(event) => setDebtNotes(event.target.value)}
                />
              </label>
            </div>

            <div className="finance-form-actions">
              <button
                type="button"
                disabled={isSavingDebt}
                onClick={() => {
                  if (editingDebtId) {
                    updateDebt();
                  } else {
                    addDebt();
                  }
                }}
              >
                {editingDebtId ? <Edit3 size={16} /> : <Plus size={16} />}
                {isSavingDebt
                  ? "Saving…"
                  : editingDebtId
                    ? "Save changes"
                    : "Add debt"}
              </button>

              {editingDebtId && (
                <button
                  type="button"
                  className="secondary-button"
                  disabled={isSavingDebt}
                  onClick={resetDebtForm}
                >
                  <X size={16} />
                  Cancel
                </button>
              )}
            </div>
          </section>
        }
        right={
          <section className="finance-overview">
            <div className="finance-summary-grid">
              <article className="finance-summary-card danger">
                <div className="finance-summary-icon">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <span>Total debt</span>
                  <strong>{formatMoney(totalDebt)}</strong>
                  <small>
                    Across {debts.length} account
                    {debts.length === 1 ? "" : "s"}
                  </small>
                </div>
              </article>

              <article className="finance-summary-card">
                <div className="finance-summary-icon">
                  <CreditCard size={20} />
                </div>
                <div>
                  <span>Monthly payments</span>
                  <strong>{formatMoney(monthlyPayments)}</strong>
                  <small>Minimum plus extra</small>
                </div>
              </article>

              <article className="finance-summary-card">
                <div className="finance-summary-icon">
                  <Gauge size={20} />
                </div>
                <div>
                  <span>Weighted APR</span>
                  <strong>{totalInterestWeighted.toFixed(2)}%</strong>
                  <small>Based on current balances</small>
                </div>
              </article>

              <article className="finance-summary-card success">
                <div className="finance-summary-icon">
                  <TrendingDown size={20} />
                </div>
                <div>
                  <span>Principal paid</span>
                  <strong>{formatMoney(totalPaid)}</strong>
                  <small>Progress so far</small>
                </div>
              </article>
            </div>

            <div className="finance-list-toolbar">
              <div>
                <h3>Your debts</h3>
                <p>Review balances and payoff progress.</p>
              </div>

              <div className="finance-search">
                <Search size={16} />
                <input
                  type="search"
                  placeholder="Search debts"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>

            {filteredDebts.length === 0 ? (
              <div className="finance-empty-state">
                <ShieldAlert size={28} />
                <h3>
                  {debts.length === 0 ? "No debts yet" : "No matching debts"}
                </h3>
                <p>
                  {debts.length === 0
                    ? "Add your first debt to start tracking your payoff."
                    : "Try a different search term."}
                </p>
              </div>
            ) : (
              <div className="finance-card-list">
                {filteredDebts.map((debt) => {
                  const progress = getPayoffProgress(debt);
                  const payment = debt.minimum_payment + debt.extra_payment;
                  const isDeleting = deletingDebtId === debt.id;

                  return (
                    <article key={debt.id} className="finance-item-card debt">
                      <header className="finance-item-header">
                        <div className="finance-item-title">
                          <div className="finance-item-icon">
                            <Landmark size={18} />
                          </div>

                          <div>
                            <h4>{debt.name}</h4>
                            <span>{debt.interest_rate.toFixed(2)}% APR</span>
                          </div>
                        </div>

                        <div className="finance-item-actions">
                          <button
                            type="button"
                            className="icon-button"
                            aria-label={`Edit ${debt.name}`}
                            onClick={() => beginEdit(debt)}
                          >
                            <Edit3 size={16} />
                          </button>

                          <button
                            type="button"
                            className="icon-button success"
                            aria-label={`Record payment for ${debt.name}`}
                            title="Record Payment"
                            onClick={() => openDebtPayment(debt)}
                          >
                            <HandCoins size={16} />
                          </button>

                          <button
                            type="button"
                            className="icon-button danger"
                            aria-label={`Delete ${debt.name}`}
                            disabled={isDeleting}
                            onClick={() =>
                              openConfirm({
                                title: "Delete Debt",
                                message: `Delete debt "${debt.name}"?`,
                                confirmText: "Delete",
                                danger: true,
                                onConfirm: () => deleteDebt(debt.id),
                              })
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </header>

                      <div className="finance-item-primary">
                        <div>
                          <span>Current balance</span>
                          <strong>{formatMoney(debt.current_balance)}</strong>
                        </div>

                        <div>
                          <span>Monthly payment</span>
                          <strong>{formatMoney(payment)}</strong>
                        </div>

                        <div>
                          <span>Due</span>
                          <strong>{formatDate(debt.due_date)}</strong>
                        </div>
                      </div>

                      <div className="finance-progress-block">
                        <div className="finance-progress-label">
                          <span>{progress.toFixed(1)}% paid off</span>
                          <span>
                            {formatMoney(
                              Math.max(
                                debt.original_balance - debt.current_balance,
                                0,
                              ),
                            )}{" "}
                            paid
                          </span>
                        </div>

                        <div className="finance-progress-track">
                          <div
                            className="finance-progress-fill debt"
                            style={{
                              width: `${progress}%`,
                            }}
                          />
                        </div>

                        <div className="finance-progress-meta">
                          <span>
                            Original {formatMoney(debt.original_balance)}
                          </span>
                          <span>
                            Remaining {formatMoney(debt.current_balance)}
                          </span>
                        </div>
                      </div>

                      {debt.notes && (
                        <p className="finance-item-notes">{debt.notes}</p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        }
      />
      <DebtPaymentDialog
        isOpen={paymentDebtId !== null}
        debt={debts.find((debt) => debt.id === paymentDebtId) ?? null}
        accounts={accounts}
        paymentAccountId={paymentAccountId}
        setPaymentAccountId={setPaymentAccountId}
        paymentAmount={paymentAmount}
        setPaymentAmount={setPaymentAmount}
        paymentDate={paymentDate}
        setPaymentDate={setPaymentDate}
        paymentNotes={paymentNotes}
        setPaymentNotes={setPaymentNotes}
        isRecordingPayment={isRecordingPayment}
        onClose={closeDebtPayment}
        onSubmit={recordDebtPayment}
      />
    </>
  );
}
