import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import type { Transaction } from "../types";

type Props = {
  transactions: Transaction[];
};

export function MonthlySpendingTrendChart({ transactions }: Props) {
  const monthlyTotals = transactions
    .filter((t) => t.amount < 0)
    .reduce((summary: Record<string, number>, transaction) => {
      const month = transaction.date.slice(0, 7);
      summary[month] = (summary[month] || 0) + Math.abs(transaction.amount);
      return summary;
    }, {});

  const data = Object.entries(monthlyTotals)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, spending]) => ({
      month,
      spending,
    }));

  if (data.length === 0) {
    return (
      <div className="panel">
        <h3>Monthly Spending Trend</h3>
        <p>No spending data yet.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h3>Monthly Spending Trend</h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="month" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip
            contentStyle={{
              background: "#111827",
              border: "1px solid #374151",
              color: "white",
            }}
          />
          <Line
            type="monotone"
            dataKey="spending"
            stroke="#3b82f6"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
