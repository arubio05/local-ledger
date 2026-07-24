import type { Transaction } from "../../types";

type Props = {
  recentTransactions: Transaction[];
};

export function RecentTransactionsTable({ recentTransactions }: Props) {
  return (
    <div className="panel">
      <h3>Recent Transactions</h3>

      {recentTransactions.length === 0 ? (
        <p>No transactions yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Merchant</th>
              <th>Category</th>
              <th>Amount</th>
            </tr>
          </thead>

          <tbody>
            {recentTransactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>{transaction.date}</td>
                <td>{transaction.merchant}</td>
                <td>{transaction.category}</td>
                <td
                  className={transaction.amount < 0 ? "negative" : "positive"}
                >
                  ${transaction.amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
