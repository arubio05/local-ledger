import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

type Props = {
  categorySummary: Record<string, number>;
};

const COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f97316",
  "#ec4899",
  "#a855f7",
  "#eab308",
  "#14b8a6",
];

export function ExpenseDonutChart({ categorySummary }: Props) {
  const data = Object.entries(categorySummary).map(([category, amount]) => ({
    name: category,
    value: amount,
  }));

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (data.length === 0) {
    return (
      <div className="panel">
        <h3>Expenses Categories</h3>
        <p>No expense data yet.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h3>Expenses Categories</h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              outerRadius={105}
              paddingAngle={2}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>

            <Tooltip
              contentStyle={{
                background: "#111827",
                border: "1px solid #374151",
                color: "white",
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div>
          {data.map((item, index) => (
            <div
              key={item.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10px",
                gap: "20px",
              }}
            >
              <span>
                <span
                  style={{
                    display: "inline-block",
                    width: "12px",
                    height: "12px",
                    background: COLORS[index % COLORS.length],
                    marginRight: "8px",
                  }}
                />
                {item.name}
              </span>

              <strong>${item.value.toFixed(2)}</strong>
            </div>
          ))}

          <hr />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "12px",
            }}
          >
            <strong>Total</strong>
            <strong>${total.toFixed(2)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
