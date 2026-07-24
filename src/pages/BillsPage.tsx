import type { Account, Bill } from "../types";
import { MasterDetailLayout } from "../components/layout/MasterDetailLayout";
import { useModal } from "../components/modal/ModalContext";

type Props = {
  accounts: Account[];
  bills: Bill[];
  categories: string[];

  billName: string;
  setBillName: (value: string) => void;

  billAmount: string;
  setBillAmount: (value: string) => void;

  billDueDate: string;
  setBillDueDate: (value: string) => void;

  billFrequency: string;
  setBillFrequency: (value: string) => void;

  billCategory: string;
  setBillCategory: (value: string) => void;

  billAccountId: string;
  setBillAccountId: (value: string) => void;

  billAutopay: boolean;
  setBillAutopay: (value: boolean) => void;

  billIsPaid: boolean;
  setBillIsPaid: (value: boolean) => void;

  billNotes: string;
  setBillNotes: (value: string) => void;

  editingBillId: number | null;
  setEditingBillId: (value: number | null) => void;

  addBill: () => void;
  updateBill: () => void;
  deleteBill: (id: number) => void;
  resetBillForm: () => void;
};

export function BillsPage({
  accounts,
  bills,
  categories,
  billName,
  setBillName,
  billAmount,
  setBillAmount,
  billDueDate,
  setBillDueDate,
  billFrequency,
  setBillFrequency,
  billCategory,
  setBillCategory,
  billAccountId,
  setBillAccountId,
  billAutopay,
  setBillAutopay,
  billIsPaid,
  setBillIsPaid,
  billNotes,
  setBillNotes,
  editingBillId,
  setEditingBillId,
  addBill,
  updateBill,
  deleteBill,
  resetBillForm,
}: Props) {
  const upcomingBills = bills.filter((bill) => bill.is_paid === 0);
  const paidBills = bills.filter((bill) => bill.is_paid === 1);
  const { openConfirm } = useModal();

  return (
    <MasterDetailLayout
      title="Bills & Subscriptions"
      left={
        <>
          <h3>{editingBillId ? "Edit Bill" : "Add Bill"}</h3>

          <div className="form-grid">
            <input
              type="text"
              placeholder="Bill Name"
              value={billName}
              onChange={(e) => setBillName(e.target.value)}
            />

            <input
              type="number"
              placeholder="Amount"
              value={billAmount}
              onChange={(e) => setBillAmount(e.target.value)}
            />

            <input
              type="date"
              value={billDueDate}
              onChange={(e) => setBillDueDate(e.target.value)}
            />

            <select
              value={billFrequency}
              onChange={(e) => setBillFrequency(e.target.value)}
            >
              <option>Monthly</option>
              <option>Weekly</option>
              <option>Biweekly</option>
              <option>Yearly</option>
              <option>One-Time</option>
            </select>

            <select
              value={billCategory}
              onChange={(e) => setBillCategory(e.target.value)}
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={billAccountId}
              onChange={(e) => setBillAccountId(e.target.value)}
            >
              <option value="">No Account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={billAutopay}
                onChange={(e) => setBillAutopay(e.target.checked)}
              />
              Autopay
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={billIsPaid}
                onChange={(e) => setBillIsPaid(e.target.checked)}
              />
              Paid
            </label>

            <input
              type="text"
              placeholder="Notes"
              value={billNotes}
              onChange={(e) => setBillNotes(e.target.value)}
            />

            <button onClick={editingBillId ? updateBill : addBill}>
              {editingBillId ? "Save Changes" : "Add Bill"}
            </button>

            {editingBillId && <button onClick={resetBillForm}>Cancel</button>}
          </div>
        </>
      }
      right={
        <>
          <h3>Upcoming Bills</h3>

          {upcomingBills.length === 0 ? (
            <p>No upcoming bills.</p>
          ) : (
            upcomingBills.map((bill) => (
              <div key={bill.id} className="item-card">
                <strong>{bill.name}</strong>
                <p>
                  ${bill.amount.toFixed(2)} due {bill.due_date}
                </p>
                <p>
                  {bill.frequency} • {bill.category}
                </p>
                {bill.account_name && <p>Account: {bill.account_name}</p>}
                {bill.autopay === 1 && <p>Autopay enabled</p>}
                {bill.notes && <p>{bill.notes}</p>}

                <br />

                <button
                  onClick={() => {
                    setEditingBillId(bill.id);
                    setBillName(bill.name);
                    setBillAmount(String(bill.amount));
                    setBillDueDate(bill.due_date);
                    setBillFrequency(bill.frequency);
                    setBillCategory(bill.category);
                    setBillAccountId(
                      bill.account_id ? String(bill.account_id) : "",
                    );
                    setBillAutopay(bill.autopay === 1);
                    setBillIsPaid(bill.is_paid === 1);
                    setBillNotes(bill.notes || "");
                  }}
                >
                  Edit
                </button>

                <button
                  onClick={() =>
                    openConfirm({
                      title: "Delete Bill",
                      message: `Delete bill "${bill.name}"?`,
                      confirmText: "Delete",
                      danger: true,
                      onConfirm: () => deleteBill(bill.id),
                    })
                  }
                >
                  Delete
                </button>
              </div>
            ))
          )}

          <br />

          <h3>Paid Bills</h3>

          {paidBills.length === 0 ? (
            <p>No paid bills yet.</p>
          ) : (
            paidBills.map((bill) => (
              <div key={bill.id} className="item-card">
                <strong>{bill.name}</strong>
                <p>${bill.amount.toFixed(2)} paid</p>
                <p>{bill.category}</p>
              </div>
            ))
          )}
        </>
      }
    />
  );
}
