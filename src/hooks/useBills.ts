import { useState } from "react";
import type { Bill } from "../types";

import {
  getBills,
  createBill,
  updateBillById,
  deleteBillById,
} from "../services/billService";

export function useBills() {
  const [bills, setBills] = useState<Bill[]>([]);

  const [billName, setBillName] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [billDueDate, setBillDueDate] = useState("");
  const [billFrequency, setBillFrequency] = useState("Monthly");
  const [billCategory, setBillCategory] = useState("");
  const [billAccountId, setBillAccountId] = useState("");
  const [billAutopay, setBillAutopay] = useState(false);
  const [billIsPaid, setBillIsPaid] = useState(false);
  const [billNotes, setBillNotes] = useState("");
  const [editingBillId, setEditingBillId] = useState<number | null>(null);

  function resetBillForm() {
    setEditingBillId(null);
    setBillName("");
    setBillAmount("");
    setBillDueDate("");
    setBillFrequency("Monthly");
    setBillCategory("");
    setBillAccountId("");
    setBillAutopay(false);
    setBillIsPaid(false);
    setBillNotes("");
  }

  async function loadBills() {
    const result = await getBills();
    setBills(result);
  }

  async function addBill() {
    if (!billName.trim() || !billAmount || !billDueDate || !billCategory)
      return;

    await createBill(
      billName,
      Number(billAmount),
      billDueDate,
      billFrequency,
      billCategory,
      billAccountId ? Number(billAccountId) : null,
      billAutopay,
      billNotes,
    );

    resetBillForm();
    await loadBills();
  }

  async function updateBill() {
    if (!editingBillId) return;
    if (!billName.trim() || !billAmount || !billDueDate || !billCategory)
      return;

    await updateBillById(
      editingBillId,
      billName,
      Number(billAmount),
      billDueDate,
      billFrequency,
      billCategory,
      billAccountId ? Number(billAccountId) : null,
      billAutopay,
      billIsPaid,
      billNotes,
    );

    resetBillForm();
    await loadBills();
  }

  async function deleteBill(id: number) {
    await deleteBillById(id);
    await loadBills();
  }

  return {
    bills,

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

    resetBillForm,
    loadBills,
    addBill,
    updateBill,
    deleteBill,
  };
}
