import type { Fund } from "../../types";

type Props = {
  funds: Fund[];
};

export function FundsSummaryCard({ funds }: Props) {
  const totalAllocated = funds.reduce((sum, fund) => {
    const currentAmount = fund.linked_account_balance ?? fund.current_amount;
    return sum + currentAmount;
  }, 0);

  return (
    <div className="panel">
      <h3>Funds</h3>

      <p>Total Allocated: ${totalAllocated.toFixed(2)}</p>

      {funds.length === 0 ? (
        <p>No funds yet.</p>
      ) : (
        funds.slice(0, 5).map((fund) => {
          const currentAmount =
            fund.linked_account_balance ?? fund.current_amount;

          const percent =
            fund.target_amount && fund.target_amount > 0
              ? Math.min((currentAmount / fund.target_amount) * 100, 100)
              : 0;

          return (
            <div key={fund.id} className="goal-card">
              <strong>{fund.name}</strong>

              <p>
                ${currentAmount.toFixed(2)}
                {fund.target_amount
                  ? ` / $${fund.target_amount.toFixed(2)}`
                  : ""}
              </p>

              {fund.target_amount && fund.target_amount > 0 && (
                <div className="progress-track">
                  <div
                    className="progress-fill blue"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
