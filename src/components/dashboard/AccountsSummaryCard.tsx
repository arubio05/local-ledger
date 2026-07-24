import type { Account } from "../../types";

type Props = {
  accounts: Account[];
};

export function AccountsSummaryCard({ accounts }: Props) {
  return (
    <div className="panel">
      <h3>Accounts</h3>

      {accounts.length === 0 ? (
        <p>No accounts yet.</p>
      ) : (
        accounts.slice(0, 5).map((account) => (
          <div key={account.id} className="mini-row">
            <div>
              <strong>{account.name}</strong>
              <p>{account.account_type}</p>
            </div>

            <strong className={account.balance < 0 ? "negative" : "positive"}>
              ${account.balance.toFixed(2)}
            </strong>
          </div>
        ))
      )}
    </div>
  );
}
