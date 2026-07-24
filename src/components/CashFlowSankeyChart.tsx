import { ResponsiveContainer, Sankey, Tooltip } from "recharts";

import type {
  CashFlowSankeyData,
  SankeyNodeData,
} from "../utils/cashFlowSankey";

type Props = {
  data: CashFlowSankeyData;
};

type SankeyNodeRenderProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  payload?: SankeyNodeData;
};

type TooltipProps = {
  active?: boolean;
  payload?: Array<{
    value?: number;
    payload?: {
      source?: {
        name?: string;
      };
      target?: {
        name?: string;
      };
    };
  }>;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function getNodeColor(type?: SankeyNodeData["type"]) {
  switch (type) {
    case "income-source":
      return "#4f7cff";

    case "income-total":
      return "#34d399";

    case "group":
      return "#facc15";

    case "category":
      return "#a78bfa";

    case "remainder":
      return "#22c55e";

    case "unfunded":
      return "#ef4444";

    default:
      return "#94a3b8";
  }
}

function CustomSankeyNode({
  x = 0,
  y = 0,
  width = 10,
  height = 10,
  payload,
}: SankeyNodeRenderProps) {
  const nodeName = payload?.name ?? "";
  const nodeType = payload?.type;

  const isLeftSide = nodeType === "income-source" || nodeType === "unfunded";

  const labelX = isLeftSide ? x - 10 : x + width + 10;

  const textAnchor = isLeftSide ? "end" : "start";

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={Math.max(width, 8)}
        height={Math.max(height, 8)}
        rx={4}
        fill={getNodeColor(nodeType)}
        fillOpacity={0.95}
      />

      <text
        x={labelX}
        y={y + Math.max(height, 8) / 2}
        dy="0.35em"
        textAnchor={textAnchor}
        className="cash-flow-sankey-node-label"
      >
        {nodeName}
      </text>
    </g>
  );
}

function CustomSankeyTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0];
  const value = Number(item.value ?? 0);

  const sourceName = item.payload?.source?.name ?? "Source";

  const targetName = item.payload?.target?.name ?? "Destination";

  return (
    <div className="cash-flow-tooltip">
      <strong>
        {sourceName} → {targetName}
      </strong>

      <span>{formatCurrency(value)}</span>
    </div>
  );
}

export function CashFlowSankeyChart({ data }: Props) {
  if (data.nodes.length === 0 || data.links.length === 0) {
    return (
      <div className="cash-flow-sankey-empty">
        <div>
          <h3>No cash-flow data</h3>

          <p>
            Add income and expense transactions for this period to generate the
            flow report.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="cash-flow-sankey-container">
      <ResponsiveContainer width="100%" height="100%">
        <Sankey
          data={data}
          node={<CustomSankeyNode />}
          nodePadding={38}
          nodeWidth={11}
          margin={{
            top: 30,
            right: 150,
            bottom: 30,
            left: 150,
          }}
          linkCurvature={0.55}
          iterations={48}
        >
          <Tooltip content={<CustomSankeyTooltip />} />
        </Sankey>
      </ResponsiveContainer>
    </div>
  );
}
