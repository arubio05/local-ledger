import {
  Banknote,
  CreditCard,
  Landmark,
  Pencil,
  Plus,
  Trash2,
  Wallet,
  X,
} from "lucide-react";

import type { Account } from "../types";

import { MasterDetailLayout } from "../components/layout/MasterDetailLayout";
import { useModal } from "../components/modal/ModalContext";

type Props = {
  accounts: Account[];

  accountName: string;
  setAccountName: (value: string) => void;

  accountType: string;
  setAccountType: (value: string) => void;

  accountBalance: string;
  setAccountBalance: (value: string) => void;

  editingAccountId: number | null;
  setEditingAccountId: (value: number | null) => void;

  addAccount: () => void | Promise<void>;
  updateAccount: () => void | Promise<void>;
  deleteAccount: (id: number) => void | Promise<void>;

  resetAccountForm?: () => void;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function getAccountIcon(accountType: string) {
  switch (accountType.toLowerCase()) {
    case "checking":
      return <Landmark size={20} strokeWidth={2} />;

    case "savings":
      return <Banknote size={20} strokeWidth={2} />;

    case "credit card":
      return <CreditCard size={20} strokeWidth={2} />;

    case "cash":
      return <Wallet size={20} strokeWidth={2} />;

    default:
      return <Landmark size={20} strokeWidth={2} />;
  }
}

function getAccountIconClass(accountType: string) {
  switch (accountType.toLowerCase()) {
    case "checking":
      return "account-icon-checking";

    case "savings":
      return "account-icon-savings";

    case "credit card":
      return "account-icon-credit";

    case "cash":
      return "account-icon-cash";

    default:
      return "account-icon-checking";
  }
}

export function AccountsPage({
  accounts,

  accountName,
  setAccountName,

  accountType,
  setAccountType,

  accountBalance,
  setAccountBalance,

  editingAccountId,
  setEditingAccountId,

  addAccount,
  updateAccount,
  deleteAccount,

  resetAccountForm,
}: Props) {
  const { openConfirm } = useModal();

  const cashAccounts = accounts.filter(
    (account) =>
      account.account_type === "Checking" ||
      account.account_type === "Savings" ||
      account.account_type === "Cash",
  );

  const creditAccounts = accounts.filter(
    (account) => account.account_type === "Credit Card",
  );

  const totalCash = cashAccounts.reduce(
    (sum, account) => sum + account.balance,
    0,
  );

  const totalCreditDebt = creditAccounts.reduce(
    (sum, account) => sum + Math.abs(Math.min(account.balance, 0)),
    0,
  );

  const totalNetBalance = accounts.reduce(
    (sum, account) => sum + account.balance,
    0,
  );

  function cancelEdit() {
    if (resetAccountForm) {
      resetAccountForm();
      return;
    }

    setEditingAccountId(null);
    setAccountName("");
    setAccountType("Checking");
    setAccountBalance("");
  }

  function beginEditing(account: Account) {
    setEditingAccountId(account.id);
    setAccountName(account.name);
    setAccountType(account.account_type);
    setAccountBalance(String(account.balance));
  }

  function handleDelete(account: Account) {
    openConfirm({
      title: "Delete Account",
      message: `Delete "${account.name}"? Accounts linked to transactions, transfers, goals, funds, or recurring items may not be removable.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      danger: true,
      onConfirm: async () => {
        await deleteAccount(account.id);
      },
    });
  }

  return (
    <MasterDetailLayout
      title="Accounts"
      left={
        <section className="account-form-section">
          <div className="account-form-heading">
            <div>
              <h3>{editingAccountId ? "Edit Account" : "Add Account"}</h3>

              <p>
                {editingAccountId
                  ? "Update the selected account."
                  : "Add a bank, credit, or cash account."}
              </p>
            </div>

            <div className="account-form-icon">
              {getAccountIcon(accountType)}
            </div>
          </div>

          <div className="form-grid account-form-grid">
            <label className="form-field">
              <span className="form-label">Account Name</span>

              <input
                type="text"
                placeholder="Example: Chase Checking"
                value={accountName}
                onChange={(event) => setAccountName(event.target.value)}
              />
            </label>

            <label className="form-field">
              <span className="form-label">Account Type</span>

              <select
                value={accountType}
                onChange={(event) => setAccountType(event.target.value)}
              >
                <option value="Checking">Checking</option>
                <option value="Savings">Savings</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Cash">Cash</option>
              </select>
            </label>

            <label className="form-field">
              <span className="form-label">Current Balance</span>

              <div className="account-balance-input">
                <span>$</span>

                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={accountBalance}
                  onChange={(event) => setAccountBalance(event.target.value)}
                />
              </div>

              <small className="form-help">
                For credit cards, enter the amount owed as a negative number.
              </small>
            </label>

            <div className="form-actions account-form-actions">
              <button
                type="button"
                className="account-save-button"
                onClick={() => {
                  if (editingAccountId) {
                    void updateAccount();
                  } else {
                    void addAccount();
                  }
                }}
              >
                {editingAccountId ? (
                  <>
                    <Pencil size={16} />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Add Account
                  </>
                )}
              </button>

              {editingAccountId && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={cancelEdit}
                >
                  <X size={16} />
                  Cancel
                </button>
              )}
            </div>
          </div>
        </section>
      }
      right={
        <section className="account-list-section">
          <header className="account-list-header">
            <div>
              <h3>Your Accounts</h3>

              <p>
                {accounts.length} account
                {accounts.length === 1 ? "" : "s"} tracked
              </p>
            </div>

            <div className="account-list-header-icon">
              <Landmark size={20} />
            </div>
          </header>

          <section className="account-summary-grid">
            <article>
              <span>Cash & Savings</span>
              <strong className="positive">{formatCurrency(totalCash)}</strong>
            </article>

            <article>
              <span>Credit Debt</span>
              <strong className={totalCreditDebt > 0 ? "negative" : ""}>
                {formatCurrency(totalCreditDebt)}
              </strong>
            </article>

            <article>
              <span>Net Balance</span>
              <strong
                className={totalNetBalance >= 0 ? "positive" : "negative"}
              >
                {formatCurrency(totalNetBalance)}
              </strong>
            </article>
          </section>

          {accounts.length === 0 ? (
            <div className="account-empty-state">
              <div className="account-empty-icon">
                <Landmark size={28} />
              </div>

              <h3>No accounts yet</h3>

              <p>
                Add your first checking, savings, credit card, or cash account.
              </p>
            </div>
          ) : (
            <div className="account-card-grid">
              {accounts.map((account) => {
                const isNegative = account.balance < 0;

                return (
                  <article className="account-card" key={account.id}>
                    <div className="account-card-top">
                      <div
                        className={`account-card-icon ${getAccountIconClass(
                          account.account_type,
                        )}`}
                      >
                        {getAccountIcon(account.account_type)}
                      </div>

                      <div className="account-card-actions">
                        <button
                          type="button"
                          className="account-edit-button"
                          title="Edit account"
                          aria-label={`Edit ${account.name}`}
                          onClick={() => beginEditing(account)}
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          type="button"
                          className="account-delete-button"
                          title="Delete account"
                          aria-label={`Delete ${account.name}`}
                          onClick={() => handleDelete(account)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="account-card-content">
                      <span className="account-type-label">
                        {account.account_type}
                      </span>

                      <h3>{account.name}</h3>

                      <p
                        className={
                          isNegative
                            ? "account-card-balance negative"
                            : "account-card-balance positive"
                        }
                      >
                        {formatCurrency(account.balance)}
                      </p>
                    </div>

                    <div className="account-card-footer">
                      <span>
                        {account.account_type === "Credit Card"
                          ? "Current owed balance"
                          : "Current available balance"}
                      </span>

                      <span
                        className={`status-badge ${
                          isNegative ? "status-danger" : "status-success"
                        }`}
                      >
                        {isNegative ? "Owed" : "Available"}
                      </span>
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
