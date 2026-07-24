import {
  ArrowRight,
  Check,
  CircleDollarSign,
  Database,
  Landmark,
  LayoutDashboard,
  ListChecks,
  Sparkles,
  WalletCards,
} from "lucide-react";

type Props = {
  hasAccount: boolean;
  hasTransaction: boolean;
  hasBudget: boolean;

  goToAccounts: () => void;
  goToTransactions: () => void;
  goToBudget: () => void;

  createDemoData: () => void | Promise<void>;
  dismissOnboarding: () => void;

  isCreatingDemoData?: boolean;
};

type StepCardProps = {
  number: number;
  title: string;
  description: string;
  completed: boolean;
  disabled?: boolean;
  buttonText: string;
  onClick: () => void;
  icon: React.ReactNode;
};

function StepCard({
  number,
  title,
  description,
  completed,
  disabled = false,
  buttonText,
  onClick,
  icon,
}: StepCardProps) {
  return (
    <article className={`onboarding-step-card ${completed ? "completed" : ""}`}>
      <div className="onboarding-step-top">
        <div className="onboarding-step-icon">
          {completed ? <Check size={20} /> : icon}
        </div>

        <span className="onboarding-step-number">Step {number}</span>
      </div>

      <div className="onboarding-step-content">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <button
        type="button"
        className={
          completed
            ? "secondary-button onboarding-step-button"
            : "onboarding-step-button"
        }
        disabled={disabled}
        onClick={onClick}
      >
        {completed ? "Review" : buttonText}
        <ArrowRight size={16} />
      </button>
    </article>
  );
}

export function OnboardingPage({
  hasAccount,
  hasTransaction,
  hasBudget,
  goToAccounts,
  goToTransactions,
  goToBudget,
  createDemoData,
  dismissOnboarding,
  isCreatingDemoData = false,
}: Props) {
  const completedCount = [hasAccount, hasTransaction, hasBudget].filter(
    Boolean,
  ).length;

  const completionPercent = (completedCount / 3) * 100;

  return (
    <main className="onboarding-page">
      <section className="onboarding-hero">
        <div className="onboarding-brand-icon">
          <CircleDollarSign size={30} />
        </div>

        <span className="onboarding-eyebrow">Welcome to Project FMJ</span>

        <h1>Let’s set up your financial workspace.</h1>

        <p>
          Complete these three steps to start tracking your money, planning your
          budget, and measuring your progress.
        </p>

        <div className="onboarding-progress">
          <div className="onboarding-progress-header">
            <span>Setup progress</span>

            <strong>{completedCount} of 3 completed</strong>
          </div>

          <div className="onboarding-progress-track">
            <div
              className="onboarding-progress-fill"
              style={{
                width: `${completionPercent}%`,
              }}
            />
          </div>
        </div>
      </section>

      <section className="onboarding-steps">
        <StepCard
          number={1}
          title="Add your first account"
          description="Create a checking, savings, credit, cash, or investment account."
          completed={hasAccount}
          buttonText="Add account"
          onClick={goToAccounts}
          icon={<Landmark size={20} />}
        />

        <StepCard
          number={2}
          title="Record your first transaction"
          description={
            hasAccount
              ? "Add income or an expense so Project FMJ can begin building your reports."
              : "Create an account first, then record your first income or expense."
          }
          completed={hasTransaction}
          disabled={!hasAccount}
          buttonText="Add transaction"
          onClick={goToTransactions}
          icon={<WalletCards size={20} />}
        />

        <StepCard
          number={3}
          title="Create your first budget"
          description="Assign expected income, expenses, debt payments, and savings."
          completed={hasBudget}
          buttonText="Create budget"
          onClick={goToBudget}
          icon={<ListChecks size={20} />}
        />
      </section>

      <section className="onboarding-demo-panel">
        <div className="onboarding-demo-icon">
          <Database size={22} />
        </div>

        <div className="onboarding-demo-copy">
          <h3>Explore Project FMJ with demo data</h3>

          <p>
            Add sample accounts, transactions, budgets, goals, funds, debt, and
            recurring items.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button onboarding-demo-button"
          disabled={isCreatingDemoData}
          onClick={() => void createDemoData()}
        >
          <Sparkles size={16} />

          {isCreatingDemoData ? "Creating demo data…" : "Create demo data"}
        </button>
      </section>

      <footer className="onboarding-footer">
        <button
          type="button"
          className="onboarding-skip-button"
          onClick={dismissOnboarding}
        >
          Skip for now
        </button>

        <div>
          <LayoutDashboard size={15} />
          You can continue setup from any page later.
        </div>
      </footer>
    </main>
  );
}
