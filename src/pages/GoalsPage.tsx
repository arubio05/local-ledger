import { useMemo, useState } from "react";
import {
  Award,
  Edit3,
  Flag,
  Link2,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
  Wallet,
  X,
} from "lucide-react";

import type { Account, Goal } from "../types";
import { MasterDetailLayout } from "../components/layout/MasterDetailLayout";
import { useModal } from "../components/modal/ModalContext";

type Props = {
  goals: Goal[];
  goalName: string;
  setGoalName: (value: string) => void;
  goalTargetAmount: string;
  setGoalTargetAmount: (value: string) => void;
  goalCurrentAmount: string;
  setGoalCurrentAmount: (value: string) => void;
  goalNotes: string;
  setGoalNotes: (value: string) => void;
  editingGoalId: number | null;
  setEditingGoalId: (value: number | null) => void;
  addGoal: () => void;
  updateGoal: () => void;
  deleteGoal: (id: number) => void;
  resetGoalForm: () => void;
  accounts: Account[];
  goalLinkedAccountId: string;
  setGoalLinkedAccountId: (value: string) => void;

  isSavingGoal?: boolean;
  deletingGoalId?: number | null;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function getGoalCurrentAmount(goal: Goal) {
  return goal.linked_account_id !== null
    ? (goal.linked_account_balance ?? 0)
    : goal.current_amount;
}

export function GoalsPage({
  goals,
  goalName,
  setGoalName,
  goalTargetAmount,
  setGoalTargetAmount,
  goalCurrentAmount,
  setGoalCurrentAmount,
  goalNotes,
  setGoalNotes,
  editingGoalId,
  setEditingGoalId,
  addGoal,
  updateGoal,
  deleteGoal,
  resetGoalForm,
  accounts,
  goalLinkedAccountId,
  setGoalLinkedAccountId,
  isSavingGoal = false,
  deletingGoalId = null,
}: Props) {
  const { openConfirm } = useModal();
  const [search, setSearch] = useState("");

  const totalProgress = useMemo(
    () => goals.reduce((sum, goal) => sum + getGoalCurrentAmount(goal), 0),
    [goals],
  );

  const totalTargets = useMemo(
    () => goals.reduce((sum, goal) => sum + goal.target_amount, 0),
    [goals],
  );

  const completedGoals = useMemo(
    () =>
      goals.filter((goal) => getGoalCurrentAmount(goal) >= goal.target_amount)
        .length,
    [goals],
  );

  const overallPercent =
    totalTargets > 0 ? Math.min((totalProgress / totalTargets) * 100, 100) : 0;

  const filteredGoals = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return goals;

    return goals.filter((goal) =>
      [goal.name, goal.notes, goal.linked_account_name]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [goals, search]);

  function handleLinkedAccountChange(value: string) {
    setGoalLinkedAccountId(value);

    if (value) {
      setGoalCurrentAmount("");
    }
  }

  function beginEdit(goal: Goal) {
    setEditingGoalId(goal.id);
    setGoalName(goal.name);
    setGoalTargetAmount(String(goal.target_amount));
    setGoalCurrentAmount(
      goal.linked_account_id === null ? String(goal.current_amount) : "",
    );
    setGoalNotes(goal.notes || "");
    setGoalLinkedAccountId(
      goal.linked_account_id !== null ? String(goal.linked_account_id) : "",
    );
  }

  return (
    <MasterDetailLayout
      title="Goals"
      left={
        <section className="finance-editor">
          <header className="finance-editor-header">
            <div className="finance-editor-icon goal">
              {editingGoalId ? <Edit3 size={20} /> : <Plus size={20} />}
            </div>

            <div>
              <h3>{editingGoalId ? "Edit goal" : "Add a goal"}</h3>
              <p>Turn long-term plans into measurable progress.</p>
            </div>
          </header>

          <div className="finance-form">
            <label className="finance-field finance-field-wide">
              <span>Goal name</span>
              <div className="finance-input-icon">
                <Flag size={16} />
                <input
                  type="text"
                  placeholder="Reach $100k net worth"
                  value={goalName}
                  onChange={(event) => setGoalName(event.target.value)}
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
                  placeholder="100000"
                  value={goalTargetAmount}
                  onChange={(event) => setGoalTargetAmount(event.target.value)}
                />
              </div>
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
                  value={goalCurrentAmount}
                  disabled={Boolean(goalLinkedAccountId)}
                  onChange={(event) => setGoalCurrentAmount(event.target.value)}
                />
              </div>
              <small>
                {goalLinkedAccountId
                  ? "Uses linked account balance"
                  : "Manual progress amount"}
              </small>
            </label>

            <label className="finance-field finance-field-wide">
              <span>Linked account</span>
              <div className="finance-input-icon">
                <Link2 size={16} />
                <select
                  value={goalLinkedAccountId}
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

            <label className="finance-field finance-field-wide">
              <span>Notes</span>
              <textarea
                rows={3}
                placeholder="Why this goal matters or how you plan to reach it"
                value={goalNotes}
                onChange={(event) => setGoalNotes(event.target.value)}
              />
            </label>
          </div>

          <div className="finance-form-actions">
            <button
              type="button"
              disabled={isSavingGoal}
              onClick={editingGoalId ? updateGoal : addGoal}
            >
              {editingGoalId ? <Edit3 size={16} /> : <Plus size={16} />}
              {isSavingGoal
                ? "Saving…"
                : editingGoalId
                  ? "Save changes"
                  : "Add goal"}
            </button>

            {editingGoalId && (
              <button
                type="button"
                className="secondary-button"
                disabled={isSavingGoal}
                onClick={resetGoalForm}
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
            <article className="finance-summary-card goal">
              <div className="finance-summary-icon">
                <Trophy size={20} />
              </div>
              <div>
                <span>Total progress</span>
                <strong>{formatMoney(totalProgress)}</strong>
                <small>
                  Across {goals.length} goal
                  {goals.length === 1 ? "" : "s"}
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
                <small>Combined goal value</small>
              </div>
            </article>

            <article className="finance-summary-card success">
              <div className="finance-summary-icon">
                <Award size={20} />
              </div>
              <div>
                <span>Completed goals</span>
                <strong>{completedGoals}</strong>
                <small>Goals at or above target</small>
              </div>
            </article>

            <article className="finance-summary-card">
              <div className="finance-summary-icon">
                <TrendingUp size={20} />
              </div>
              <div>
                <span>Overall progress</span>
                <strong>{overallPercent.toFixed(1)}%</strong>
                <small>Across all goals</small>
              </div>
            </article>
          </div>

          <div className="finance-list-toolbar">
            <div>
              <h3>Your goals</h3>
              <p>Follow each milestone from start to finish.</p>
            </div>

            <div className="finance-search">
              <Search size={16} />
              <input
                type="search"
                placeholder="Search goals"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          {filteredGoals.length === 0 ? (
            <div className="finance-empty-state">
              <Sparkles size={28} />
              <h3>
                {goals.length === 0 ? "No goals yet" : "No matching goals"}
              </h3>
              <p>
                {goals.length === 0
                  ? "Create your first goal and start measuring progress."
                  : "Try a different search term."}
              </p>
            </div>
          ) : (
            <div className="finance-card-list">
              {filteredGoals.map((goal) => {
                const currentAmount = getGoalCurrentAmount(goal);

                const progress =
                  goal.target_amount > 0
                    ? Math.max(
                        0,
                        Math.min(
                          (currentAmount / goal.target_amount) * 100,
                          100,
                        ),
                      )
                    : 0;

                const remaining = Math.max(
                  goal.target_amount - currentAmount,
                  0,
                );

                const isComplete = currentAmount >= goal.target_amount;

                const isDeleting = deletingGoalId === goal.id;

                return (
                  <article key={goal.id} className="finance-item-card goal">
                    <header className="finance-item-header">
                      <div className="finance-item-title">
                        <div className="finance-item-icon">
                          {isComplete ? (
                            <Trophy size={18} />
                          ) : (
                            <Flag size={18} />
                          )}
                        </div>

                        <div>
                          <h4>{goal.name}</h4>
                          <span>
                            {isComplete
                              ? "Goal complete"
                              : goal.linked_account_name
                                ? `Linked to ${goal.linked_account_name}`
                                : "Manual progress"}
                          </span>
                        </div>
                      </div>

                      <div className="finance-item-actions">
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={`Edit ${goal.name}`}
                          onClick={() => beginEdit(goal)}
                        >
                          <Edit3 size={16} />
                        </button>

                        <button
                          type="button"
                          className="icon-button danger"
                          aria-label={`Delete ${goal.name}`}
                          disabled={isDeleting}
                          onClick={() =>
                            openConfirm({
                              title: "Delete Goal",
                              message: `Delete goal "${goal.name}"?`,
                              confirmText: "Delete",
                              danger: true,
                              onConfirm: () => deleteGoal(goal.id),
                            })
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </header>

                    <div className="finance-item-primary">
                      <div>
                        <span>Progress</span>
                        <strong>{formatMoney(currentAmount)}</strong>
                      </div>

                      <div>
                        <span>Target</span>
                        <strong>{formatMoney(goal.target_amount)}</strong>
                      </div>

                      <div>
                        <span>Remaining</span>
                        <strong>{formatMoney(remaining)}</strong>
                      </div>
                    </div>

                    <div className="finance-progress-block">
                      <div className="finance-progress-label">
                        <span>{progress.toFixed(1)}% complete</span>
                        <span>
                          {isComplete
                            ? "Completed"
                            : `${formatMoney(remaining)} to go`}
                        </span>
                      </div>

                      <div className="finance-progress-track">
                        <div
                          className="finance-progress-fill goal"
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>
                    </div>

                    {goal.notes && (
                      <p className="finance-item-notes">{goal.notes}</p>
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
