import { getDb } from "../database";
import type { Account } from "../types";

export async function getAccounts() {
  const db = await getDb();

  return db.select<Account[]>(`
    SELECT *
    FROM accounts
    ORDER BY id DESC
  `);
}

export async function createAccount(
  name: string,
  accountType: string,
  balance: number,
) {
  const db = await getDb();

  return db.execute(
    `
    INSERT INTO accounts
      (name, account_type, balance)
    VALUES ($1, $2, $3)
    `,
    [name.trim(), accountType, balance],
  );
}

export async function updateAccountById(
  id: number,
  name: string,
  accountType: string,
  balance: number,
) {
  const db = await getDb();

  const result = await db.execute(
    `
    UPDATE accounts
    SET name = $1,
        account_type = $2,
        balance = $3
    WHERE id = $4
    `,
    [name.trim(), accountType, balance, id],
  );

  if (result.rowsAffected === 0) {
    throw new Error("The selected account no longer exists.");
  }

  return result;
}

export async function deleteAccountById(id: number) {
  const db = await getDb();

  const result = await db.execute("DELETE FROM accounts WHERE id = $1", [id]);

  if (result.rowsAffected === 0) {
    throw new Error("The selected account no longer exists.");
  }

  return result;
}
