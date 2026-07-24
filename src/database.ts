import Database from "@tauri-apps/plugin-sql";

export async function getDb() {
  const db = await Database.load("sqlite:local-ledger.db");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      account_type TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    ALTER TABLE accounts ADD COLUMN balance REAL NOT NULL DEFAULT 0
  `).catch(() => {});

  await db.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      merchant TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id)
    )
  `);
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      budget_month TEXT NOT NULL,
      category TEXT NOT NULL,
      monthly_limit REAL NOT NULL,
      UNIQUE(budget_month, category)
    )
  `);

  await db.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_budgets_month_category
    ON budgets (budget_month, category)
  `).catch(() => {});

  await db.execute(`
    UPDATE budgets
    SET budget_month = strftime('%Y-%m', 'now')
    WHERE budget_month IS NULL OR budget_month = ''
  `).catch(() => {});

  await db.execute(`
    CREATE TABLE IF NOT EXISTS transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_account_id INTEGER NOT NULL,
      to_account_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_account_id) REFERENCES accounts(id),
      FOREIGN KEY (to_account_id) REFERENCES accounts(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL NOT NULL DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    ALTER TABLE goals ADD COLUMN linked_account_id INTEGER
  `).catch(() => {});

  await db.execute(`
    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      merchant TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      frequency TEXT NOT NULL,
      next_due_date TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS import_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      imported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      transaction_count INTEGER NOT NULL DEFAULT 0
    )
  `);
  
  await db.execute(`
    ALTER TABLE transactions
    ADD COLUMN import_batch_id INTEGER
  `).catch(() => {});

  await db.execute(`
  CREATE TABLE IF NOT EXISTS funds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    target_amount REAL,
    current_amount REAL NOT NULL DEFAULT 0,
    linked_account_id INTEGER,
    monthly_contribution REAL,
    due_date TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (linked_account_id) REFERENCES accounts(id)
  )
`);

await db.execute(`
  CREATE TABLE IF NOT EXISTS debts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    original_balance REAL NOT NULL,
    current_balance REAL NOT NULL,
    interest_rate REAL NOT NULL DEFAULT 0,
    minimum_payment REAL NOT NULL DEFAULT 0,
    extra_payment REAL NOT NULL DEFAULT 0,
    due_date TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

await db.execute(`
  CREATE TABLE IF NOT EXISTS budget_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    budget_month TEXT NOT NULL,
    name TEXT NOT NULL,
    group_type TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  )
`);

await db.execute(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_budget_groups_month_name
  ON budget_groups (budget_month, name)
`).catch(() => {});

await db.execute(`
  CREATE TABLE IF NOT EXISTS budget_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    budget_month TEXT NOT NULL,
    name TEXT NOT NULL,
    expected_amount REAL NOT NULL DEFAULT 0,
    actual_amount REAL NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (group_id) REFERENCES budget_groups(id)
  )
`);


await db.execute(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_budget_items_month_group_name
  ON budget_items (budget_month, group_id, name)
`).catch(() => {});

await db.execute(`
  ALTER TABLE recurring_transactions
  ADD COLUMN autopay INTEGER NOT NULL DEFAULT 0
`).catch(() => {});

await db.execute(`
  ALTER TABLE recurring_transactions
  ADD COLUMN auto_generate INTEGER NOT NULL DEFAULT 1
`).catch(() => {});

  return db;
}