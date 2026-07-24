import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type Props = {
  categorySummary: Record<string, number>;
};

export function SpendingCategoryChart({ categorySummary }: Props) {
  const data = Object.entries(categorySummary).map(([category, amount]) => ({
    category,
    amount,
  }));

  if (data.length === 0) {
    return <p>No spending data yet.</p>;
  }

  return (
    <div className="panel">
      {" "}
      <h3>Spending by Category</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="category" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip
            contentStyle={{
              background: "#111827",
              border: "1px solid #374151",
              color: "white",
            }}
          />
          <Bar dataKey="amount" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
