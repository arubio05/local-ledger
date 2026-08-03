import { useState } from "react";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

type Props = {
  isAuthConfigured: boolean;
  isProcessingAuth: boolean;

  createPassword: (
    password: string,
    confirmPassword: string,
  ) => Promise<boolean>;

  login: (password: string) => Promise<boolean>;
};

export function LoginPage({
  isAuthConfigured,
  isProcessingAuth,
  createPassword,
  login,
}: Props) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isAuthConfigured) {
      const success = await login(password);

      if (success) {
        setPassword("");
      }

      return;
    }

    const success = await createPassword(password, confirmPassword);

    if (success) {
      setPassword("");
      setConfirmPassword("");
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <WalletCards size={30} />
          </div>

          <div>
            <span>PROJECT FMJ</span>
            <strong>Personal Finance Manager</strong>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card-icon">
            {isAuthConfigured ? (
              <LockKeyhole size={28} />
            ) : (
              <ShieldCheck size={28} />
            )}
          </div>

          <header className="auth-card-header">
            <h1>
              {isAuthConfigured
                ? "Welcome back"
                : "Protect your financial data"}
            </h1>

            <p>
              {isAuthConfigured
                ? "Enter your local password to open Project FMJ."
                : "Create a local password before using Project FMJ."}
            </p>
          </header>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span>Password</span>

              <div className="auth-password-input">
                <LockKeyhole size={17} />

                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    isAuthConfigured ? "current-password" : "new-password"
                  }
                  placeholder={
                    isAuthConfigured
                      ? "Enter your password"
                      : "Create at least 6 characters"
                  }
                  value={password}
                  disabled={isProcessingAuth}
                  autoFocus
                  onChange={(event) => setPassword(event.target.value)}
                />

                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                  disabled={isProcessingAuth}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            {!isAuthConfigured && (
              <label className="auth-field">
                <span>Confirm password</span>

                <div className="auth-password-input">
                  <ShieldCheck size={17} />

                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Enter the password again"
                    value={confirmPassword}
                    disabled={isProcessingAuth}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </div>
              </label>
            )}

            <button
              type="submit"
              className="auth-submit-button"
              disabled={isProcessingAuth}
            >
              {isProcessingAuth
                ? isAuthConfigured
                  ? "Signing in…"
                  : "Creating password…"
                : isAuthConfigured
                  ? "Open Project FMJ"
                  : "Create password"}
            </button>
          </form>

          <p className="auth-security-note">
            Your password is stored locally as a salted cryptographic hash.
          </p>
        </div>
      </section>
    </main>
  );
}
