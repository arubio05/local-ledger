import { useMemo } from "react";
import {
  CalendarDays,
  CircleDollarSign,
  FileText,
  Landmark,
  WalletCards,
  X,
} from "lucide-react";

import type { Account, Debt } from "../../types";

type Props = {
  isOpen: boolean;
  debt: Debt | null;
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

  onClose: () => void;
  onSubmit: () => void | Promise<void>;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function getAccountTypeLabel(accountType: string) {
  return accountType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character: string) => character.toUpperCase());
}

export function DebtPaymentDialog({
  isOpen,
  debt,
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

  onClose,
  onSubmit,
}: Props) {
  const selectedAccount = useMemo(
    () =>
      accounts.find((account) => account.id === Number(paymentAccountId)) ??
      null,
    [accounts, paymentAccountId],
  );

  if (!isOpen || !debt) {
    return null;
  }

  const numericPaymentAmount = Number(paymentAmount);

  const remainingAfterPayment =
    Number.isFinite(numericPaymentAmount) && numericPaymentAmount > 0
      ? Math.max(debt.current_balance - numericPaymentAmount, 0)
      : debt.current_balance;

  const paymentExceedsBalance =
    Number.isFinite(numericPaymentAmount) &&
    numericPaymentAmount > debt.current_balance;

  const insufficientAccountBalance =
    selectedAccount !== null &&
    Number.isFinite(numericPaymentAmount) &&
    numericPaymentAmount > 0 &&
    numericPaymentAmount > selectedAccount.balance;

  const canSubmit =
    Boolean(paymentAccountId) &&
    Boolean(paymentDate) &&
    Number.isFinite(numericPaymentAmount) &&
    numericPaymentAmount > 0 &&
    !paymentExceedsBalance &&
    !insufficientAccountBalance &&
    !isRecordingPayment;

  function handleClose() {
    if (isRecordingPayment) {
      return;
    }

    onClose();
  }

  function handleBackdropClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      handleClose();
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    void onSubmit();
  }

  return (
    <div
      className="debt-payment-backdrop"
      role="presentation"
      onMouseDown={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <section
        className="debt-payment-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="debt-payment-dialog-title"
      >
        <header className="debt-payment-dialog-header">
          <div className="debt-payment-dialog-heading">
            <div className="debt-payment-dialog-icon">
              <CircleDollarSign size={22} />
            </div>

            <div>
              <h2 id="debt-payment-dialog-title">Record Payment</h2>

              <p>
                Apply a payment to {debt.name} and record the matching
                transaction.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="debt-payment-close-button"
            aria-label="Close payment dialog"
            title="Close"
            disabled={isRecordingPayment}
            onClick={handleClose}
          >
            <X size={19} />
          </button>
        </header>

        <div className="debt-payment-summary">
          <div className="debt-payment-summary-icon">
            <Landmark size={20} />
          </div>

          <div className="debt-payment-summary-name">
            <span>Debt</span>
            <strong>{debt.name}</strong>
          </div>

          <div className="debt-payment-summary-balance">
            <span>Current balance</span>
            <strong>{formatMoney(debt.current_balance)}</strong>
          </div>
        </div>

        <form className="debt-payment-form" onSubmit={handleSubmit}>
          <label className="form-field debt-payment-full-width">
            <span className="form-label">
              <WalletCards size={15} />
              Payment account
            </span>

            <select
              value={paymentAccountId}
              disabled={isRecordingPayment}
              onChange={(event) => setPaymentAccountId(event.target.value)}
            >
              <option value="">Select an account</option>

              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} · {getAccountTypeLabel(account.account_type)} ·{" "}
                  {formatMoney(account.balance)}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span className="form-label">
              <CalendarDays size={15} />
              Payment date
            </span>

            <input
              type="date"
              value={paymentDate}
              disabled={isRecordingPayment}
              onChange={(event) => setPaymentDate(event.target.value)}
            />
          </label>

          <label className="form-field">
            <span className="form-label">
              <CircleDollarSign size={15} />
              Payment amount
            </span>

            <div className="debt-payment-amount-input">
              <span>$</span>

              <input
                type="number"
                min="0.01"
                max={debt.current_balance}
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                value={paymentAmount}
                disabled={isRecordingPayment}
                onChange={(event) => setPaymentAmount(event.target.value)}
              />
            </div>
          </label>

          <label className="form-field debt-payment-full-width">
            <span className="form-label">
              <FileText size={15} />
              Notes
            </span>

            <textarea
              rows={3}
              placeholder="Optional payment notes"
              value={paymentNotes}
              disabled={isRecordingPayment}
              onChange={(event) => setPaymentNotes(event.target.value)}
            />
          </label>

          {paymentExceedsBalance && (
            <p className="debt-payment-validation-error" role="alert">
              The payment cannot exceed the remaining debt balance of{" "}
              {formatMoney(debt.current_balance)}.
            </p>
          )}

          {insufficientAccountBalance && selectedAccount && (
            <p className="debt-payment-validation-error" role="alert">
              {selectedAccount.name} only has{" "}
              {formatMoney(selectedAccount.balance)} available.
            </p>
          )}

          <div className="debt-payment-preview">
            <div>
              <span>Payment</span>
              <strong>
                {formatMoney(
                  Number.isFinite(numericPaymentAmount)
                    ? Math.max(numericPaymentAmount, 0)
                    : 0,
                )}
              </strong>
            </div>

            <div>
              <span>Balance after payment</span>
              <strong>{formatMoney(remainingAfterPayment)}</strong>
            </div>
          </div>

          <footer className="debt-payment-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={isRecordingPayment}
              onClick={handleClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="debt-payment-submit-button"
              disabled={!canSubmit}
            >
              {isRecordingPayment ? "Recording Payment…" : "Record Payment"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
