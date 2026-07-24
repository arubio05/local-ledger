type Props = {
  netWorth: number;
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
};

export function DashboardKpiCards({
  netWorth,
  income,
  expenses,
  savings,
  savingsRate,
}: Props) {
  return (
    <div className="cards">
      <div className="card">
        <p>Net Worth</p>
        <h3>${netWorth.toFixed(2)}</h3>
      </div>

      <div className="card">
        <p>Income</p>
        <h3 className="positive">${income.toFixed(2)}</h3>
      </div>

      <div className="card">
        <p>Expenses</p>
        <h3 className="negative">${expenses.toFixed(2)}</h3>
      </div>

      <div className="card">
        <p>Savings Rate</p>
        <h3 className={savingsRate >= 0 ? "positive" : "negative"}>
          {savingsRate.toFixed(1)}%
        </h3>
        <p>${savings.toFixed(2)} saved</p>
      </div>
    </div>
  );
}
