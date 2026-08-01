import { getDb } from "../database";
import type { Transaction } from "../types";

export async function getTransactions() {
  const db = await getDb();

  return await db.select<Transaction[]>(`
    SELECT transactions.*, accounts.name AS account_name
    FROM transactions
    JOIN accounts ON transactions.account_id = accounts.id
    ORDER BY transactions.date DESC, transactions.id DESC
  `);
}

export async function createTransaction(
  accountId: number,
  date: string,
  merchant: string,
  category: string,
  amount: number,
  notes: string,
) {
  const db = await getDb();

  await db.execute(
    `INSERT INTO transactions 
    (account_id, date, merchant, category, amount, notes)
    VALUES ($1, $2, $3, $4, $5, $6)`,
    [accountId, date, merchant, category, amount, notes],
  );

  await db.execute("UPDATE accounts SET balance = balance + $1 WHERE id = $2", [
    amount,
    accountId,
  ]);
}

export async function createDebtPaymentTransaction(
  accountId: number,
  debtName: string,
  paymentDate: string,
  amount: number,
) {
  const db = await getDb();

  await db.execute(
    `
        INSERT INTO transactions
        (
            account_id,
            date,
            merchant,
            category,
            amount,
            notes
        )

        VALUES
        (
            $1,
            $2,
            $3,
            'Debt Payment',
            $4,
            ''
        )
        `,
    [accountId, paymentDate, debtName, -Math.abs(amount)],
  );

  await db.execute(
    `
        UPDATE accounts
        SET balance = balance - $1
        WHERE id = $2
        `,
    [amount, accountId],
  );

  const rows = await db.select<{ id: number }[]>(
    `
        SELECT id
        FROM transactions
        ORDER BY id DESC
        LIMIT 1
        `,
  );

  return rows[0].id;
}

export async function deleteTransactionById(transaction: Transaction) {
  const db = await getDb();

  await db.execute("DELETE FROM transactions WHERE id = $1", [transaction.id]);

  await db.execute("UPDATE accounts SET balance = balance - $1 WHERE id = $2", [
    transaction.amount,
    transaction.account_id,
  ]);
}

export async function updateTransactionById(
  transactionId: number,
  accountId: number,
  date: string,
  merchant: string,
  category: string,
  amount: number,
  notes: string,
) {
  const db = await getDb();

  const oldRows = await db.select<Transaction[]>(
    "SELECT * FROM transactions WHERE id = $1",
    [transactionId],
  );

  const oldTransaction = oldRows[0];

  await db.execute("UPDATE accounts SET balance = balance - $1 WHERE id = $2", [
    oldTransaction.amount,
    oldTransaction.account_id,
  ]);

  await db.execute(
    `UPDATE transactions
     SET account_id = $1,
         date = $2,
         merchant = $3,
         category = $4,
         amount = $5,
         notes = $6
     WHERE id = $7`,
    [accountId, date, merchant, category, amount, notes, transactionId],
  );

  await db.execute("UPDATE accounts SET balance = balance + $1 WHERE id = $2", [
    amount,
    accountId,
  ]);
}
