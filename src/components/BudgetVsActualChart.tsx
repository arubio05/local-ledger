import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

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

export function BudgetVsActualChart({ budgetProgress }: Props) {
  const data = budgetProgress.map((budget) => ({
    category: budget.category,
    Spent: budget.spent,
    Budget: budget.monthly_limit,
  }));

  if (data.length === 0) {
    return (
      <div className="panel">
        <h3>Budget vs Actual</h3>
        <p>No budget data yet.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h3>Budget vs Actual</h3>

      <ResponsiveContainer width="100%" height={320}>
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
          <Legend />
          <Bar dataKey="Budget" fill="#6b7280" />
          <Bar dataKey="Spent" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
