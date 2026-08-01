import { getDb } from "../database";
import type { DebtPayment } from "../types";

export async function getDebtPayments(debtId: number) {
  const db = await getDb();

  return db.select<DebtPayment[]>(
    `
      SELECT
          debt_payments.*,
          debts.name AS debt_name,
          accounts.name AS account_name
      FROM debt_payments
      JOIN debts
          ON debt_payments.debt_id = debts.id
      JOIN accounts
          ON debt_payments.account_id = accounts.id
      WHERE debt_id = $1
      ORDER BY payment_date DESC,
               id DESC
  `,
    [debtId],
  );
}

export async function createDebtPayment(
  debtId: number,
  accountId: number,
  transactionId: number | null,
  paymentDate: string,
  paymentAmount: number,
  principal: number,
  interest: number,
  notes: string,
) {
  const db = await getDb();

  await db.execute(
    `
        INSERT INTO debt_payments
        (
            debt_id,
            account_id,
            transaction_id,
            payment_date,
            payment_amount,
            principal,
            interest,
            notes
        )

        VALUES
        (
            $1,$2,$3,$4,$5,$6,$7,$8
        )
    `,
    [
      debtId,
      accountId,
      transactionId,
      paymentDate,
      paymentAmount,
      principal,
      interest,
      notes,
    ],
  );
}
