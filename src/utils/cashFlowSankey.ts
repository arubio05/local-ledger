import type {
  BudgetGroup,
  BudgetItem,
  Transaction,
} from "../types";

export type CashFlowViewMode =
  | "categories"
  | "groups"
  | "both";

export type SankeyNodeData = {
  name: string;
  type:
    | "income-source"
    | "income-total"
    | "group"
    | "category"
    | "remainder"
    | "unfunded";
};

export type SankeyLinkData = {
  source: number;
  target: number;
  value: number;
};

export type CashFlowSankeyData = {
  nodes: SankeyNodeData[];
  links: SankeyLinkData[];
};

export type CashFlowBreakdownItem = {
  name: string;
  amount: number;
  percentage: number;
};

export type CashFlowReportData = {
  income: number;
  expenses: number;
  savings: number;
  totalOutflow: number;
  netCashFlow: number;
  savingsRate: number;

  incomeBreakdown: CashFlowBreakdownItem[];
  expenseBreakdown: CashFlowBreakdownItem[];

  sankey: CashFlowSankeyData;
};

type NamedAmount = {
  name: string;
  amount: number;
};

const INCOME_TOTAL_NAME = "Total Income";
const UNALLOCATED_NAME = "Unallocated";
const UNFUNDED_NAME = "Unfunded";

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

function addAmount(
  map: Map<string, number>,
  name: string,
  amount: number,
) {
  const cleanedName = name.trim() || "Uncategorized";

  map.set(
    cleanedName,
    (map.get(cleanedName) ?? 0) + amount,
  );
}

function mapToSortedAmounts(
  map: Map<string, number>,
): NamedAmount[] {
  return [...map.entries()]
    .map(([name, amount]) => ({
      name,
      amount,
    }))
    .filter((item) => item.amount > 0)
    .sort((first, second) => second.amount - first.amount);
}

function findBudgetGroupForCategory(
  category: string,
  budgetItems: BudgetItem[],
  budgetGroups: BudgetGroup[],
) {
  const normalizedCategory = normalizeName(category);

  const matchingItem = budgetItems.find(
    (item) =>
      normalizeName(item.name) === normalizedCategory,
  );

  if (!matchingItem) {
    return "Other";
  }

  const matchingGroup = budgetGroups.find(
    (group) => group.id === matchingItem.group_id,
  );

  return matchingGroup?.name ?? "Other";
}

function isSavingsGroup(groupName: string) {
  return normalizeName(groupName).includes("saving");
}

function createBreakdown(
  values: NamedAmount[],
  total: number,
): CashFlowBreakdownItem[] {
  return values.map((item) => ({
    name: item.name,
    amount: item.amount,
    percentage:
      total > 0 ? (item.amount / total) * 100 : 0,
  }));
}

export function buildCashFlowReport(
  transactions: Transaction[],
  budgetItems: BudgetItem[],
  budgetGroups: BudgetGroup[],
  selectedMonth: string,
  mode: CashFlowViewMode,
): CashFlowReportData {
  const selectedTransactions = transactions.filter(
    (transaction) =>
      transaction.date.startsWith(selectedMonth),
  );

  const incomeSourcesMap = new Map<string, number>();
  const expenseCategoriesMap = new Map<string, number>();
  const expenseGroupsMap = new Map<string, number>();
  const categoryToGroup = new Map<string, string>();

  let savings = 0;

  for (const transaction of selectedTransactions) {
    if (transaction.amount > 0) {
      const sourceName =
        transaction.category.trim() ||
        transaction.merchant.trim() ||
        "Income";

      addAmount(
        incomeSourcesMap,
        sourceName,
        transaction.amount,
      );

      continue;
    }

    if (transaction.amount >= 0) {
      continue;
    }

    const amount = Math.abs(transaction.amount);
    const category =
      transaction.category.trim() || "Uncategorized";

    const group = findBudgetGroupForCategory(
      category,
      budgetItems,
      budgetGroups,
    );

    addAmount(expenseCategoriesMap, category, amount);
    addAmount(expenseGroupsMap, group, amount);

    categoryToGroup.set(category, group);

    if (isSavingsGroup(group)) {
      savings += amount;
    }
  }

  const incomeSources = mapToSortedAmounts(incomeSourcesMap);
  const expenseCategories = mapToSortedAmounts(
    expenseCategoriesMap,
  );
  const expenseGroups = mapToSortedAmounts(expenseGroupsMap);

  const income = incomeSources.reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  const totalOutflow = expenseCategories.reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  const expenses = Math.max(totalOutflow - savings, 0);
  const netCashFlow = income - totalOutflow;

  const savingsRate =
    income > 0 ? (savings / income) * 100 : 0;

  const nodes: SankeyNodeData[] = [];
  const links: SankeyLinkData[] = [];

  const nodeIndexes = new Map<string, number>();

  function getNodeIndex(
    name: string,
    type: SankeyNodeData["type"],
  ) {
    const key = `${type}:${name}`;

    const existingIndex = nodeIndexes.get(key);

    if (existingIndex !== undefined) {
      return existingIndex;
    }

    const index = nodes.length;

    nodes.push({
      name,
      type,
    });

    nodeIndexes.set(key, index);

    return index;
  }

  const incomeTotalIndex = getNodeIndex(
    INCOME_TOTAL_NAME,
    "income-total",
  );

  for (const source of incomeSources) {
    const sourceIndex = getNodeIndex(
      source.name,
      "income-source",
    );

    links.push({
      source: sourceIndex,
      target: incomeTotalIndex,
      value: source.amount,
    });
  }

  if (totalOutflow > income) {
    const unfundedAmount = totalOutflow - income;

    const unfundedIndex = getNodeIndex(
      UNFUNDED_NAME,
      "unfunded",
    );

    links.push({
      source: unfundedIndex,
      target: incomeTotalIndex,
      value: unfundedAmount,
    });
  }

  if (mode === "categories") {
    for (const category of expenseCategories) {
      const categoryIndex = getNodeIndex(
        category.name,
        "category",
      );

      links.push({
        source: incomeTotalIndex,
        target: categoryIndex,
        value: category.amount,
      });
    }
  }

  if (mode === "groups") {
    for (const group of expenseGroups) {
      const groupIndex = getNodeIndex(
        group.name,
        "group",
      );

      links.push({
        source: incomeTotalIndex,
        target: groupIndex,
        value: group.amount,
      });
    }
  }

  if (mode === "both") {
    for (const group of expenseGroups) {
      const groupIndex = getNodeIndex(
        group.name,
        "group",
      );

      links.push({
        source: incomeTotalIndex,
        target: groupIndex,
        value: group.amount,
      });
    }

    for (const category of expenseCategories) {
      const groupName =
        categoryToGroup.get(category.name) ?? "Other";

      const groupIndex = getNodeIndex(
        groupName,
        "group",
      );

      const categoryIndex = getNodeIndex(
        category.name,
        "category",
      );

      links.push({
        source: groupIndex,
        target: categoryIndex,
        value: category.amount,
      });
    }
  }

  if (income > totalOutflow) {
    const unallocatedIndex = getNodeIndex(
      UNALLOCATED_NAME,
      "remainder",
    );

    links.push({
      source: incomeTotalIndex,
      target: unallocatedIndex,
      value: income - totalOutflow,
    });
  }

  /*
   * Recharts does not display a Sankey when there are no links.
   * Keep an empty node structure in that case.
   */
  const sankey =
    links.length > 0
      ? {
          nodes,
          links,
        }
      : {
          nodes: [],
          links: [],
        };

  return {
    income,
    expenses,
    savings,
    totalOutflow,
    netCashFlow,
    savingsRate,

    incomeBreakdown: createBreakdown(
      incomeSources,
      income,
    ),

    expenseBreakdown: createBreakdown(
      expenseCategories,
      totalOutflow,
    ),

    sankey,
  };
}