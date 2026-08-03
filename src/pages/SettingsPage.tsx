import { useState } from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  RefreshCw,
  RotateCcw,
  Settings,
  ShieldCheck,
  Upload,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
} from "lucide-react";

import type { Account } from "../types";

import { useModal } from "../components/modal/ModalContext";
import { useToast } from "../components/toast/ToastContext";

import {
  chooseDatabaseBackup,
  exportDatabaseBackup,
  restoreDatabaseBackup,
} from "../services/backupService";

import type { AutomaticBackupStatus } from "../services/backupService";

type Props = {
  accounts: Account[];

  defaultSpendingAccountId: string;
  setDefaultSpendingAccountId: (value: string) => void;

  defaultIncomeAccountId: string;
  setDefaultIncomeAccountId: (value: string) => void;

  resetApplicationData: () => void | Promise<void>;
  seedApplicationDemoData: () => void | Promise<void>;
  automaticBackupStatus: AutomaticBackupStatus | null;

  isCreatingAutomaticBackup: boolean;

  createAutomaticBackupNow: () => Promise<string | null>;

  changePassword: (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ) => Promise<boolean>;
};

type BackupStatus = {
  type: "success" | "error";
  message: string;
} | null;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function SettingsPage({
  accounts,

  defaultSpendingAccountId,
  setDefaultSpendingAccountId,

  defaultIncomeAccountId,
  setDefaultIncomeAccountId,

  resetApplicationData,
  seedApplicationDemoData,
  automaticBackupStatus,
  isCreatingAutomaticBackup,
  createAutomaticBackupNow,
  changePassword,
}: Props) {
  const { openConfirm } = useModal();
  const toast = useToast();

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupStatus, setBackupStatus] = useState<BackupStatus>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);

  const [isChangingPassword, setIsChangingPassword] = useState(false);

  async function handleBackup() {
    if (isBackingUp) return;

    try {
      setIsBackingUp(true);
      setBackupStatus(null);

      const backupPath = await exportDatabaseBackup();

      if (!backupPath) {
        return;
      }

      const message = `Backup created successfully: ${backupPath}`;

      setBackupStatus({
        type: "success",
        message,
      });

      toast.success("Backup created", backupPath, 5000);
    } catch (error) {
      console.error("Backup failed:", error);

      const message = getErrorMessage(error);

      setBackupStatus({
        type: "error",
        message: `Unable to create backup: ${message}`,
      });

      toast.error("Unable to create backup", message);
    } finally {
      setIsBackingUp(false);
    }
  }

  async function handleChooseRestore() {
    if (isRestoring) return;

    try {
      setBackupStatus(null);

      const sourcePath = await chooseDatabaseBackup();

      if (!sourcePath) {
        return;
      }

      openConfirm({
        title: "Restore Project FMJ Backup",
        message:
          "Restoring will replace all current Project FMJ data. A safety copy of the current database will be kept automatically. The app will restart after restoring.",
        confirmText: "Restore Backup",
        cancelText: "Cancel",
        danger: true,
        onConfirm: async () => {
          try {
            setIsRestoring(true);

            await restoreDatabaseBackup(sourcePath);
          } catch (error) {
            console.error("Restore failed:", error);

            const message = getErrorMessage(error);

            setBackupStatus({
              type: "error",
              message: `Unable to restore backup: ${message}`,
            });

            toast.error("Unable to restore backup", message);
            setIsRestoring(false);
          }
        },
      });
    } catch (error) {
      console.error("Choose restore file failed:", error);

      const message = getErrorMessage(error);

      setBackupStatus({
        type: "error",
        message: `Unable to select backup: ${message}`,
      });

      toast.error("Unable to select backup", message);
    }
  }

  function handleResetData() {
    openConfirm({
      title: "Reset All Project FMJ Data",
      message:
        "This permanently deletes all current application data. Create a backup first.",
      confirmText: "Reset Everything",
      cancelText: "Cancel",
      danger: true,
      onConfirm: async () => {
        await resetApplicationData();
      },
    });
  }

  function handleSeedDemoData() {
    openConfirm({
      title: "Create Demo Data",
      message:
        "This adds sample accounts, transactions, budgets, goals, funds, debts, and recurring items.",
      confirmText: "Create Demo Data",
      cancelText: "Cancel",
      danger: false,
      onConfirm: async () => {
        await seedApplicationDemoData();
      },
    });
  }

  async function handleChangePassword() {
    if (isChangingPassword) {
      return;
    }

    try {
      setIsChangingPassword(true);

      const success = await changePassword(
        currentPassword,
        newPassword,
        confirmPassword,
      );

      if (!success) {
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
    } finally {
      setIsChangingPassword(false);
    }
  }
  return (
    <>
      <header className="page-header settings-page-header">
        <div>
          <h2>Settings</h2>

          <p className="page-subtitle">
            Configure Project FMJ and protect your financial data.
          </p>
        </div>

        <div className="settings-header-icon">
          <Settings size={22} />
        </div>
      </header>

      <section className="panel settings-section">
        <header className="settings-section-header">
          <div className="settings-section-icon security">
            <ShieldCheck size={20} />
          </div>

          <div>
            <h3>Security</h3>
            <p>Change the local password used to unlock Project FMJ.</p>
          </div>
        </header>

        <form
          className="settings-security-form"
          onSubmit={(event) => {
            event.preventDefault();
            void handleChangePassword();
          }}
        >
          <label className="settings-security-field">
            <span>Current password</span>

            <div className="settings-password-input">
              <LockKeyhole size={17} />

              <input
                type={showCurrentPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your current password"
                value={currentPassword}
                disabled={isChangingPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />

              <button
                type="button"
                aria-label={
                  showCurrentPassword
                    ? "Hide current password"
                    : "Show current password"
                }
                disabled={isChangingPassword}
                onClick={() => setShowCurrentPassword((current) => !current)}
              >
                {showCurrentPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>

          <div className="settings-security-row">
            <label className="settings-security-field">
              <span>New password</span>

              <div className="settings-password-input">
                <KeyRound size={17} />

                <input
                  type={showNewPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  disabled={isChangingPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />

                <button
                  type="button"
                  aria-label={
                    showNewPassword ? "Hide new password" : "Show new password"
                  }
                  disabled={isChangingPassword}
                  onClick={() => setShowNewPassword((current) => !current)}
                >
                  {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            <label className="settings-security-field">
              <span>Confirm new password</span>

              <div className="settings-password-input">
                <KeyRound size={17} />

                <input
                  type={showNewPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Enter it again"
                  value={confirmPassword}
                  disabled={isChangingPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
            </label>
          </div>

          <div className="settings-security-actions">
            <button type="submit" disabled={isChangingPassword}>
              <KeyRound size={16} />

              {isChangingPassword ? "Changing password…" : "Change password"}
            </button>
          </div>
        </form>
      </section>

      <section className="panel settings-section">
        <header className="settings-section-header">
          <div className="settings-section-icon">
            <Database size={20} />
          </div>

          <div>
            <h3>Default Accounts</h3>
            <p>
              Choose the accounts Project FMJ should preselect for common
              transactions.
            </p>
          </div>
        </header>

        <div className="settings-form-grid">
          <label className="form-field">
            <span className="form-label">Default Spending Account</span>

            <select
              value={defaultSpendingAccountId}
              onChange={(event) =>
                setDefaultSpendingAccountId(event.target.value)
              }
            >
              <option value="">No default account</option>

              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span className="form-label">Default Income Account</span>

            <select
              value={defaultIncomeAccountId}
              onChange={(event) =>
                setDefaultIncomeAccountId(event.target.value)
              }
            >
              <option value="">No default account</option>

              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="panel settings-section">
        <header className="settings-section-header">
          <div className="settings-section-icon settings-backup-icon">
            <ShieldCheck size={20} />
          </div>

          <div>
            <h3>Backup and Restore</h3>

            <p>
              Keep an external copy of your financial database in a safe
              location.
            </p>
          </div>
        </header>

        <div className="settings-backup-grid">
          <article className="settings-action-card">
            <div className="settings-action-card-icon">
              <Download size={22} />
            </div>

            <div>
              <h3>Create Backup</h3>

              <p>
                Export a complete copy of accounts, transactions, budgets,
                reports, goals, funds, debt, and recurring items.
              </p>
            </div>

            <button
              type="button"
              disabled={isBackingUp || isRestoring}
              onClick={() => void handleBackup()}
            >
              {isBackingUp ? (
                <>
                  <RefreshCw size={16} className="settings-spin-icon" />
                  Creating…
                </>
              ) : (
                <>
                  <Download size={16} />
                  Create Backup
                </>
              )}
            </button>
          </article>

          <article className="settings-action-card">
            <div className="settings-action-card-icon settings-restore-icon">
              <Upload size={22} />
            </div>

            <div>
              <h3>Restore Backup</h3>

              <p>
                Replace current data with a previously exported Project FMJ
                database.
              </p>
            </div>

            <button
              type="button"
              className="secondary-button"
              disabled={isBackingUp || isRestoring}
              onClick={() => void handleChooseRestore()}
            >
              {isRestoring ? (
                <>
                  <RefreshCw size={16} className="settings-spin-icon" />
                  Restoring…
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Restore Backup
                </>
              )}
            </button>
          </article>
        </div>

        <div className="automatic-backup-panel">
          <div className="automatic-backup-header">
            <div>
              <h3>Automatic Backups</h3>

              <p>
                Project FMJ creates one backup every 24 hours and keeps the
                newest 20.
              </p>
            </div>

            <span className="automatic-backup-badge">Enabled</span>
          </div>

          <div className="automatic-backup-details">
            <div>
              <span>Last backup</span>

              <strong>
                {automaticBackupStatus?.latestBackupTimestamp
                  ? new Date(
                      automaticBackupStatus.latestBackupTimestamp * 1000,
                    ).toLocaleString()
                  : "No automatic backup yet"}
              </strong>
            </div>

            <div>
              <span>Saved backups</span>

              <strong>{automaticBackupStatus?.backupCount ?? 0} / 20</strong>
            </div>

            <div>
              <span>Backup folder</span>

              <strong
                className="automatic-backup-path"
                title={automaticBackupStatus?.backupDirectory ?? ""}
              >
                {automaticBackupStatus?.backupDirectory ?? "Loading…"}
              </strong>
            </div>
          </div>

          <button
            type="button"
            className="secondary-button automatic-backup-button"
            disabled={isCreatingAutomaticBackup || isBackingUp || isRestoring}
            onClick={() => void createAutomaticBackupNow()}
          >
            {isCreatingAutomaticBackup ? (
              <>
                <RefreshCw size={16} className="settings-spin-icon" />
                Creating backup…
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                Back Up Now
              </>
            )}
          </button>
        </div>

        {backupStatus && (
          <div
            className={`settings-backup-status settings-backup-${backupStatus.type}`}
          >
            {backupStatus.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertTriangle size={18} />
            )}

            <span>{backupStatus.message}</span>
          </div>
        )}

        <div className="settings-backup-note">
          <ShieldCheck size={16} />

          <p>
            Store backups somewhere outside the app data folder, such as an
            external drive, OneDrive, Google Drive, or Dropbox.
          </p>
        </div>
      </section>

      <section className="panel settings-section">
        <header className="settings-section-header">
          <div className="settings-section-icon">
            <Database size={20} />
          </div>

          <div>
            <h3>Demo Data</h3>

            <p>Populate Project FMJ with sample data for testing.</p>
          </div>
        </header>

        <button
          type="button"
          className="secondary-button settings-inline-button"
          onClick={handleSeedDemoData}
        >
          <Database size={16} />
          Create Demo Data
        </button>
      </section>

      <section className="panel settings-section danger-panel">
        <header className="settings-section-header">
          <div className="settings-section-icon settings-danger-icon">
            <AlertTriangle size={20} />
          </div>

          <div>
            <h3>Danger Zone</h3>

            <p>Permanently remove all Project FMJ data and start over.</p>
          </div>
        </header>

        <button
          type="button"
          className="danger-button settings-inline-button"
          onClick={handleResetData}
        >
          <RotateCcw size={16} />
          Reset All Data
        </button>
      </section>
    </>
  );
}
