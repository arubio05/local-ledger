import { getDb } from "../database";
import type { DebtPayment } from "../types";

type DebtPaymentRow = {
  id: number;
  debt_id: number;
  account_id: number;
  transaction_id: number | null;
  payment_date: string;
  payment_amount: number;
  principal: number;
  interest: number;
  notes: string | null;
  created_at: string;
  debt_name: string;
  account_name: string;
};

type DebtRow = {
  id: number;
  name: string;
  current_balance: number;
};

type AccountRow = {
  id: number;
  name: string;
  balance: number;
};

type InsertedIdRow = {
  id: number;
};

export type RecordDebtPaymentResult = {
  transactionId: number;
  previousDebtBalance: number;
  newDebtBalance: number;
  previousAccountBalance: number;
  newAccountBalance: number;
};

export async function getDebtPayments(debtId: number): Promise<DebtPayment[]> {
  const db = await getDb();

  const rows = await db.select<DebtPaymentRow[]>(
    `
      SELECT
        debt_payments.id,
        debt_payments.debt_id,
        debt_payments.account_id,
        debt_payments.transaction_id,
        debt_payments.payment_date,
        debt_payments.payment_amount,
        debt_payments.principal,
        debt_payments.interest,
        debt_payments.notes,
        debt_payments.created_at,
        debts.name AS debt_name,
        accounts.name AS account_name
      FROM debt_payments
      INNER JOIN debts
        ON debts.id = debt_payments.debt_id
      INNER JOIN accounts
        ON accounts.id = debt_payments.account_id
      WHERE debt_payments.debt_id = $1
      ORDER BY
        debt_payments.payment_date DESC,
        debt_payments.id DESC
    `,
    [debtId],
  );

  return rows.map((row) => ({
    ...row,
    notes: row.notes ?? "",
  }));
}

export async function recordDebtPaymentInDatabase(
  debtId: number,
  accountId: number,
  paymentDate: string,
  paymentAmount: number,
  notes: string,
): Promise<RecordDebtPaymentResult> {
  const db = await getDb();

  if (!Number.isInteger(debtId) || debtId <= 0) {
    throw new Error("Select a valid debt.");
  }

  if (!Number.isInteger(accountId) || accountId <= 0) {
    throw new Error("Select a valid payment account.");
  }

  if (!paymentDate) {
    throw new Error("Select a payment date.");
  }

  if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  await db.execute("BEGIN IMMEDIATE");

  try {
    const debts = await db.select<DebtRow[]>(
      `
        SELECT
          id,
          name,
          current_balance
        FROM debts
        WHERE id = $1
        LIMIT 1
      `,
      [debtId],
    );

    const debt = debts[0];

    if (!debt) {
      throw new Error("The selected debt no longer exists.");
    }

    if (debt.current_balance <= 0) {
      throw new Error("This debt has already been paid off.");
    }

    if (paymentAmount > debt.current_balance) {
      throw new Error(
        `Payment cannot exceed the remaining balance of $${debt.current_balance.toFixed(
          2,
        )}.`,
      );
    }

    const accounts = await db.select<AccountRow[]>(
      `
        SELECT
          id,
          name,
          balance
        FROM accounts
        WHERE id = $1
        LIMIT 1
      `,
      [accountId],
    );

    const account = accounts[0];

    if (!account) {
      throw new Error("The selected payment account no longer exists.");
    }

    if (paymentAmount > account.balance) {
      throw new Error(
        `${account.name} only has $${account.balance.toFixed(2)} available.`,
      );
    }

    const previousDebtBalance = debt.current_balance;
    const newDebtBalance = Math.max(previousDebtBalance - paymentAmount, 0);

    const previousAccountBalance = account.balance;
    const newAccountBalance = previousAccountBalance - paymentAmount;

    /*
     * Expenses are stored as negative transaction amounts.
     * We update the account directly inside this same database
     * transaction rather than calling createTransaction(), because
     * every debt-payment operation must succeed or fail together.
     */
    await db.execute(
      `
        INSERT INTO transactions (
          account_id,
          date,
          merchant,
          category,
          amount,
          notes
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        accountId,
        paymentDate,
        debt.name,
        "Debt Payment",
        -Math.abs(paymentAmount),
        notes.trim(),
      ],
    );

    const insertedRows = await db.select<InsertedIdRow[]>(
      `
        SELECT last_insert_rowid() AS id
      `,
    );

    const transactionId = insertedRows[0]?.id;

    if (!transactionId) {
      throw new Error("The payment transaction could not be created.");
    }

    const accountResult = await db.execute(
      `
        UPDATE accounts
        SET balance = $1
        WHERE id = $2
      `,
      [newAccountBalance, accountId],
    );

    if (accountResult.rowsAffected === 0) {
      throw new Error("The payment account balance could not be updated.");
    }

    const debtResult = await db.execute(
      `
        UPDATE debts
        SET current_balance = $1
        WHERE id = $2
      `,
      [newDebtBalance, debtId],
    );

    if (debtResult.rowsAffected === 0) {
      throw new Error("The debt balance could not be updated.");
    }

    /*
     * For this first version, the whole payment is recorded as
     * principal. We can add a principal/interest split later.
     */
    await db.execute(
      `
        INSERT INTO debt_payments (
          debt_id,
          account_id,
          transaction_id,
          payment_date,
          payment_amount,
          principal,
          interest,
          notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        debtId,
        accountId,
        transactionId,
        paymentDate,
        paymentAmount,
        paymentAmount,
        0,
        notes.trim(),
      ],
    );

    await db.execute("COMMIT");

    return {
      transactionId,
      previousDebtBalance,
      newDebtBalance,
      previousAccountBalance,
      newAccountBalance,
    };
  } catch (error) {
    try {
      await db.execute("ROLLBACK");
    } catch (rollbackError) {
      console.error("Debt payment rollback failed:", rollbackError);
    }

    throw error;
  }
}
