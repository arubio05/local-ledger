import {
  LayoutDashboard,
  BarChart3,
  Wallet,
  Receipt,
  ArrowLeftRight,
  PiggyBank,
  Landmark,
  Target,
  Repeat,
  CreditCard,
  Settings,
  LogOut,
} from "lucide-react";

import type { Page } from "../../types/navigation";
import { useModal } from "../modal/ModalContext";

type Props = {
  page: Page;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
  logout: () => void;
};

export function Sidebar({ page, setPage, logout }: Props) {
  const { openConfirm } = useModal();
  return (
    <aside className="sidebar">
      {/* =======================
          Logo
      ======================== */}

      <button
        className="sidebar-brand-button"
        onClick={() => setPage("dashboard")}
      >
        <img
          src="/project-fmj-logo.png"
          className="sidebar-logo"
          alt="Project FMJ"
        />

        <div className="sidebar-brand-copy">
          <h1>Project FMJ</h1>
          <span>Personal Finance</span>
        </div>
      </button>

      {/* =======================
          OVERVIEW
      ======================== */}

      <div className="sidebar-section">
        <p>Overview</p>

        <button
          className={`sidebar-navigation-button ${
            page === "dashboard" ? "active" : ""
          }`}
          onClick={() => setPage("dashboard")}
        >
          <LayoutDashboard size={18} className="sidebar-navigation-icon" />
          Dashboard
        </button>

        <button
          className={`sidebar-navigation-button ${
            page === "reports" ? "active" : ""
          }`}
          onClick={() => setPage("reports")}
        >
          <BarChart3 size={18} className="sidebar-navigation-icon" />
          Reports
        </button>
      </div>

      {/* =======================
          MONEY
      ======================== */}

      <div className="sidebar-section">
        <p>Money</p>

        <button
          className={`sidebar-navigation-button ${
            page === "accounts" ? "active" : ""
          }`}
          onClick={() => setPage("accounts")}
        >
          <Wallet size={18} className="sidebar-navigation-icon" />
          Accounts
        </button>

        <button
          className={`sidebar-navigation-button ${
            page === "transactions" ? "active" : ""
          }`}
          onClick={() => setPage("transactions")}
        >
          <Receipt size={18} className="sidebar-navigation-icon" />
          Transactions
        </button>

        <button
          className={`sidebar-navigation-button ${
            page === "transfers" ? "active" : ""
          }`}
          onClick={() => setPage("transfers")}
        >
          <ArrowLeftRight size={18} className="sidebar-navigation-icon" />
          Transfers
        </button>

        <button
          className={`sidebar-navigation-button ${
            page === "budget" ? "active" : ""
          }`}
          onClick={() => setPage("budget")}
        >
          <PiggyBank size={18} className="sidebar-navigation-icon" />
          Budget
        </button>
      </div>

      {/* =======================
          PLANNING
      ======================== */}

      <div className="sidebar-section">
        <p>Planning</p>

        <button
          className={`sidebar-navigation-button ${
            page === "funds" ? "active" : ""
          }`}
          onClick={() => setPage("funds")}
        >
          <Landmark size={18} className="sidebar-navigation-icon" />
          Funds
        </button>

        <button
          className={`sidebar-navigation-button ${
            page === "goals" ? "active" : ""
          }`}
          onClick={() => setPage("goals")}
        >
          <Target size={18} className="sidebar-navigation-icon" />
          Goals
        </button>

        <button
          className={`sidebar-navigation-button ${
            page === "recurring" ? "active" : ""
          }`}
          onClick={() => setPage("recurring")}
        >
          <Repeat size={18} className="sidebar-navigation-icon" />
          Recurring
        </button>
      </div>

      {/* =======================
          LIABILITIES
      ======================== */}

      <div className="sidebar-section">
        <p>Liabilities</p>

        <button
          className={`sidebar-navigation-button ${
            page === "debt" ? "active" : ""
          }`}
          onClick={() => setPage("debt")}
        >
          <CreditCard size={18} className="sidebar-navigation-icon" />
          Debt
        </button>
      </div>

      {/* =======================
          TOOLS
      ======================== */}

      <div className="sidebar-section">
        <p>Tools</p>

        <button
          className={`sidebar-navigation-button ${
            page === "settings" ? "active" : ""
          }`}
          onClick={() => setPage("settings")}
        >
          <Settings size={18} className="sidebar-navigation-icon" />
          Settings
        </button>
      </div>

      {/* =======================
          Footer
      ======================== */}

      <div className="sidebar-footer">
        <div className="sidebar-footer-icon">❤️</div>

        <div>
          <strong>Project FMJ</strong>
          <span>Dedicated to Fe & MJ</span>
        </div>
      </div>

      <div className="sidebar-logout-container">
        <button
          type="button"
          className="sidebar-navigation-button sidebar-logout-button"
          onClick={() =>
            openConfirm({
              title: "Log out",
              message:
                "You will need to enter your password again to access Project FMJ.",
              confirmText: "Log out",
              danger: true,
              onConfirm: logout,
            })
          }
        >
          <LogOut size={18} className="sidebar-navigation-icon" />
          Log out
        </button>
      </div>
    </aside>
  );
}
