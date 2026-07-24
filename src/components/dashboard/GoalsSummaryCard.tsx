import type { Goal } from "../../types";

type Props = {
  goals: Goal[];
};

export function GoalsSummaryCard({ goals }: Props) {
  return (
    <div className="panel">
      <h3>Goals</h3>

      {goals.length === 0 ? (
        <p>No goals yet.</p>
      ) : (
        goals.slice(0, 4).map((goal) => {
          const currentAmount =
            goal.linked_account_balance ?? goal.current_amount;

          const percent =
            goal.target_amount > 0
              ? Math.min((currentAmount / goal.target_amount) * 100, 100)
              : 0;

          return (
            <div key={goal.id} className="goal-card">
              <strong>{goal.name}</strong>
              <p>
                ${currentAmount.toFixed(2)} / ${goal.target_amount.toFixed(2)}
              </p>

              <div className="progress-track">
                <div
                  className="progress-fill green"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
