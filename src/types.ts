export type Account = {
    id: number;
    name: string;
    account_type: string;
    balance: number;
  };
  
  export type Transaction = {
    id: number;
    account_id: number;
    date: string;
    merchant: string;
    category: string;
    amount: number;
    notes: string;
    account_name?: string;
    import_batch_id?: number | null;
    imported_at?: string;
  };
  
  export type Budget = {
    id: number;
    budget_month: string;
    category: string;
    monthly_limit: number;
  };

  export type Transfer = {
    id: number;
    from_account_id: number;
    to_account_id: number;
    date: string;
    amount: number;
    notes: string;
    from_account_name?: string;
    to_account_name?: string;
  };

  export type Goal = {
    id: number;
    name: string;
    target_amount: number;
    current_amount: number;
    linked_account_id: number | null;
    linked_account_name?: string;
    linked_account_balance?: number;
    notes: string;
  };

  export type RecurringTransaction = {
  id: number;
  account_id: number;
  account_name?: string;
  merchant: string;
  category: string;
  amount: number;
  frequency: string;
  next_due_date: string;
  notes: string;
  autopay: number;
  auto_generate: number;
};

  export type ReportSummary = {
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
  netCashFlow: number;
  categorySummary: Record<string, number>;
  
  };


  export type ImportBatch = {
  id: number;
  imported_at: string;
  transaction_count: number;
  };

export type Fund = {
  id: number;
  name: string;
  target_amount: number | null;
  current_amount: number;
  linked_account_id: number | null;
  linked_account_name?: string;
  linked_account_balance?: number;
  monthly_contribution: number | null;
  due_date: string | null;
  notes: string;
};

export type Debt = {
  id: number;
  name: string;
  original_balance: number;
  current_balance: number;
  interest_rate: number;
  minimum_payment: number;
  extra_payment: number;
  due_date: string | null;
  notes: string;
};

export type BudgetGroup = {
  id: number;
  budget_month: string;
  name: string;
  group_type: "income" | "expense" | "debt" | "savings";
  sort_order: number;
};

export type BudgetItem = {
  id: number;
  group_id: number;
  budget_month: string;
  group_name?: string;
  group_type?: string;
  name: string;
  expected_amount: number;
  actual_amount: number;
  sort_order: number;
};

export type Bill = {
  id: number;
  name: string;
  amount: number;
  due_date: string;
  frequency: string;
  category: string;
  account_id: number | null;
  account_name?: string;
  autopay: number;
  is_paid: number;
  notes: string;
};