import type { Debt } from "../../types";

type Props = {
  debts: Debt[];
};

export function DebtSummaryCard({ debts }: Props) {
  const totalDebt = debts.reduce((sum, debt) => sum + debt.current_balance, 0);

  const monthlyPayments = debts.reduce(
    (sum, debt) => sum + debt.minimum_payment + debt.extra_payment,
    0,
  );

  return (
    <div className="panel">
      <h3>Debt</h3>

      {debts.length === 0 ? (
        <p>No debts yet.</p>
      ) : (
        <>
          <div className="summary-row">
            <span>Total Debt</span>
            <strong className="negative">${totalDebt.toFixed(2)}</strong>
          </div>

          <div className="summary-row">
            <span>Monthly Payments</span>
            <strong>${monthlyPayments.toFixed(2)}</strong>
          </div>

          {debts.slice(0, 3).map((debt) => (
            <div key={debt.id} className="goal-card">
              <strong>{debt.name}</strong>
              <p>${debt.current_balance.toFixed(2)}</p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
