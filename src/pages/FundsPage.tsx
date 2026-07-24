import { useMemo, useState } from "react";
import {
  CalendarDays,
  Edit3,
  Landmark,
  Link2,
  PiggyBank,
  Plus,
  Search,
  Target,
  Trash2,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";

import type { Account, Fund } from "../types";
import { MasterDetailLayout } from "../components/layout/MasterDetailLayout";
import { useModal } from "../components/modal/ModalContext";

type Props = {
  accounts: Account[];
  funds: Fund[];

  fundName: string;
  setFundName: (value: string) => void;

  fundTargetAmount: string;
  setFundTargetAmount: (value: string) => void;

  fundCurrentAmount: string;
  setFundCurrentAmount: (value: string) => void;

  fundLinkedAccountId: string;
  setFundLinkedAccountId: (value: string) => void;

  fundMonthlyContribution: string;
  setFundMonthlyContribution: (value: string) => void;

  fundDueDate: string;
  setFundDueDate: (value: string) => void;

  fundNotes: string;
  setFundNotes: (value: string) => void;

  editingFundId: number | null;
  setEditingFundId: (value: number | null) => void;

  addFund: () => void;
  updateFund: () => void;
  deleteFund: (id: number) => void;
  resetFundForm: () => void;

  isSavingFund?: boolean;
  deletingFundId?: number | null;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "No target date";

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getFundCurrentAmount(fund: Fund) {
  return fund.linked_account_id !== null
    ? (fund.linked_account_balance ?? 0)
    : fund.current_amount;
}

export function FundsPage({
  accounts,
  funds,
  fundName,
  setFundName,
  fundTargetAmount,
  setFundTargetAmount,
  fundCurrentAmount,
  setFundCurrentAmount,
  fundLinkedAccountId,
  setFundLinkedAccountId,
  fundMonthlyContribution,
  setFundMonthlyContribution,
  fundDueDate,
  setFundDueDate,
  fundNotes,
  setFundNotes,
  editingFundId,
  setEditingFundId,
  addFund,
  updateFund,
  deleteFund,
  resetFundForm,
  isSavingFund = false,
  deletingFundId = null,
}: Props) {
  const { openConfirm } = useModal();
  const [search, setSearch] = useState("");

  const totalSaved = useMemo(
    () => funds.reduce((sum, fund) => sum + getFundCurrentAmount(fund), 0),
    [funds],
  );

  const totalTargets = useMemo(
    () => funds.reduce((sum, fund) => sum + (fund.target_amount ?? 0), 0),
    [funds],
  );

  const monthlyContributions = useMemo(
    () =>
      funds.reduce((sum, fund) => sum + (fund.monthly_contribution ?? 0), 0),
    [funds],
  );

  const linkedFunds = useMemo(
    () => funds.filter((fund) => fund.linked_account_id !== null).length,
    [funds],
  );

  const filteredFunds = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return funds;

    return funds.filter((fund) =>
      [fund.name, fund.notes, fund.linked_account_name]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [funds, search]);

  function handleLinkedAccountChange(value: string) {
    setFundLinkedAccountId(value);

    if (value) {
      setFundCurrentAmount("");
    }
  }

  function beginEdit(fund: Fund) {
    setEditingFundId(fund.id);
    setFundName(fund.name);
    setFundTargetAmount(
      fund.target_amount !== null ? String(fund.target_amount) : "",
    );
    setFundCurrentAmount(
      fund.linked_account_id === null ? String(fund.current_amount) : "",
    );
    setFundLinkedAccountId(
      fund.linked_account_id !== null ? String(fund.linked_account_id) : "",
    );
    setFundMonthlyContribution(
      fund.monthly_contribution !== null
        ? String(fund.monthly_contribution)
        : "",
    );
    setFundDueDate(fund.due_date || "");
    setFundNotes(fund.notes || "");
  }

  return (
    <MasterDetailLayout
      title="Funds"
      left={
        <section className="finance-editor">
          <header className="finance-editor-header">
            <div className="finance-editor-icon fund">
              {editingFundId ? <Edit3 size={20} /> : <Plus size={20} />}
            </div>

            <div>
              <h3>{editingFundId ? "Edit fund" : "Add a fund"}</h3>
              <p>Build emergency savings and sinking funds.</p>
            </div>
          </header>

          <div className="finance-form">
            <label className="finance-field finance-field-wide">
              <span>Fund name</span>
              <div className="finance-input-icon">
                <PiggyBank size={16} />
                <input
                  type="text"
                  placeholder="Emergency fund"
                  value={fundName}
                  onChange={(event) => setFundName(event.target.value)}
                />
              </div>
            </label>

            <label className="finance-field">
              <span>Target amount</span>
              <div className="finance-input-icon">
                <Target size={16} />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="15000"
                  value={fundTargetAmount}
                  onChange={(event) => setFundTargetAmount(event.target.value)}
                />
              </div>
              <small>Optional</small>
            </label>

            <label className="finance-field">
              <span>Current amount</span>
              <div className="finance-input-icon">
                <Wallet size={16} />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={fundCurrentAmount}
                  disabled={Boolean(fundLinkedAccountId)}
                  onChange={(event) => setFundCurrentAmount(event.target.value)}
                />
              </div>
              <small>
                {fundLinkedAccountId
                  ? "Uses linked account balance"
                  : "Manual balance"}
              </small>
            </label>

            <label className="finance-field finance-field-wide">
              <span>Linked account</span>
              <div className="finance-input-icon">
                <Link2 size={16} />
                <select
                  value={fundLinkedAccountId}
                  onChange={(event) =>
                    handleLinkedAccountChange(event.target.value)
                  }
                >
                  <option value="">No linked account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <label className="finance-field">
              <span>Monthly contribution</span>
              <div className="finance-input-icon">
                <TrendingUp size={16} />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="500"
                  value={fundMonthlyContribution}
                  onChange={(event) =>
                    setFundMonthlyContribution(event.target.value)
                  }
                />
              </div>
              <small>Optional</small>
            </label>

            <label className="finance-field">
              <span>Target date</span>
              <div className="finance-input-icon">
                <CalendarDays size={16} />
                <input
                  type="date"
                  value={fundDueDate}
                  onChange={(event) => setFundDueDate(event.target.value)}
                />
              </div>
            </label>

            <label className="finance-field finance-field-wide">
              <span>Notes</span>
              <textarea
                rows={3}
                placeholder="Optional notes about this fund"
                value={fundNotes}
                onChange={(event) => setFundNotes(event.target.value)}
              />
            </label>
          </div>

          <div className="finance-form-actions">
            <button
              type="button"
              disabled={isSavingFund}
              onClick={editingFundId ? updateFund : addFund}
            >
              {editingFundId ? <Edit3 size={16} /> : <Plus size={16} />}
              {isSavingFund
                ? "Saving…"
                : editingFundId
                  ? "Save changes"
                  : "Add fund"}
            </button>

            {editingFundId && (
              <button
                type="button"
                className="secondary-button"
                disabled={isSavingFund}
                onClick={resetFundForm}
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
            <article className="finance-summary-card success">
              <div className="finance-summary-icon">
                <PiggyBank size={20} />
              </div>
              <div>
                <span>Total saved</span>
                <strong>{formatMoney(totalSaved)}</strong>
                <small>
                  Across {funds.length} fund
                  {funds.length === 1 ? "" : "s"}
                </small>
              </div>
            </article>

            <article className="finance-summary-card">
              <div className="finance-summary-icon">
                <Target size={20} />
              </div>
              <div>
                <span>Total targets</span>
                <strong>{formatMoney(totalTargets)}</strong>
                <small>Combined funding goals</small>
              </div>
            </article>

            <article className="finance-summary-card">
              <div className="finance-summary-icon">
                <TrendingUp size={20} />
              </div>
              <div>
                <span>Monthly contributions</span>
                <strong>{formatMoney(monthlyContributions)}</strong>
                <small>Planned each month</small>
              </div>
            </article>

            <article className="finance-summary-card">
              <div className="finance-summary-icon">
                <Landmark size={20} />
              </div>
              <div>
                <span>Linked funds</span>
                <strong>{linkedFunds}</strong>
                <small>Synced to account balances</small>
              </div>
            </article>
          </div>

          <div className="finance-list-toolbar">
            <div>
              <h3>Your funds</h3>
              <p>Track savings progress and upcoming targets.</p>
            </div>

            <div className="finance-search">
              <Search size={16} />
              <input
                type="search"
                placeholder="Search funds"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          {filteredFunds.length === 0 ? (
            <div className="finance-empty-state">
              <PiggyBank size={28} />
              <h3>
                {funds.length === 0 ? "No funds yet" : "No matching funds"}
              </h3>
              <p>
                {funds.length === 0
                  ? "Create your first fund to start building savings."
                  : "Try a different search term."}
              </p>
            </div>
          ) : (
            <div className="finance-card-list">
              {filteredFunds.map((fund) => {
                const currentAmount = getFundCurrentAmount(fund);

                const progress =
                  fund.target_amount && fund.target_amount > 0
                    ? Math.max(
                        0,
                        Math.min(
                          (currentAmount / fund.target_amount) * 100,
                          100,
                        ),
                      )
                    : null;

                const remaining =
                  fund.target_amount !== null
                    ? Math.max(fund.target_amount - currentAmount, 0)
                    : null;

                const isDeleting = deletingFundId === fund.id;

                return (
                  <article key={fund.id} className="finance-item-card fund">
                    <header className="finance-item-header">
                      <div className="finance-item-title">
                        <div className="finance-item-icon">
                          <PiggyBank size={18} />
                        </div>

                        <div>
                          <h4>{fund.name}</h4>
                          <span>
                            {fund.linked_account_name
                              ? `Linked to ${fund.linked_account_name}`
                              : "Manual balance"}
                          </span>
                        </div>
                      </div>

                      <div className="finance-item-actions">
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={`Edit ${fund.name}`}
                          onClick={() => beginEdit(fund)}
                        >
                          <Edit3 size={16} />
                        </button>

                        <button
                          type="button"
                          className="icon-button danger"
                          aria-label={`Delete ${fund.name}`}
                          disabled={isDeleting}
                          onClick={() =>
                            openConfirm({
                              title: "Delete Fund",
                              message: `Delete fund "${fund.name}"?`,
                              confirmText: "Delete",
                              danger: true,
                              onConfirm: () => deleteFund(fund.id),
                            })
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </header>

                    <div className="finance-item-primary">
                      <div>
                        <span>Current</span>
                        <strong>{formatMoney(currentAmount)}</strong>
                      </div>

                      <div>
                        <span>Monthly</span>
                        <strong>
                          {formatMoney(fund.monthly_contribution ?? 0)}
                        </strong>
                      </div>

                      <div>
                        <span>Target date</span>
                        <strong>{formatDate(fund.due_date)}</strong>
                      </div>
                    </div>

                    {progress !== null && fund.target_amount !== null && (
                      <div className="finance-progress-block">
                        <div className="finance-progress-label">
                          <span>{progress.toFixed(1)}% funded</span>
                          <span>{formatMoney(remaining ?? 0)} remaining</span>
                        </div>

                        <div className="finance-progress-track">
                          <div
                            className="finance-progress-fill fund"
                            style={{
                              width: `${progress}%`,
                            }}
                          />
                        </div>

                        <div className="finance-progress-meta">
                          <span>Saved {formatMoney(currentAmount)}</span>
                          <span>Goal {formatMoney(fund.target_amount)}</span>
                        </div>
                      </div>
                    )}

                    {fund.notes && (
                      <p className="finance-item-notes">{fund.notes}</p>
                    )}
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
