type BudgetProgress = {
  id: number;
  category: string;
  monthly_limit: number;
  spent: number;
  percent: number;
};

type Props = {
  budgetProgress: BudgetProgress[];
};

export function BudgetOverviewTable({ budgetProgress }: Props) {
  return (
    <div className="panel">
      <h3>Budget Overview</h3>

      {budgetProgress.length === 0 ? (
        <p>No budgets yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Budget</th>
              <th>Tracked</th>
              <th>%</th>
              <th>Remaining</th>
            </tr>
          </thead>

          <tbody>
            {budgetProgress.map((budget) => {
              const remaining = budget.monthly_limit - budget.spent;

              return (
                <tr key={budget.id}>
                  <td>{budget.category}</td>
                  <td>${budget.monthly_limit.toFixed(2)}</td>
                  <td>${budget.spent.toFixed(2)}</td>
                  <td>{budget.percent.toFixed(0)}%</td>
                  <td className={remaining >= 0 ? "positive" : "negative"}>
                    ${remaining.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
