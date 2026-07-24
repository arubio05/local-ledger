import { DashboardPage } from "../../pages/DashboardPage";
import { AccountsPage } from "../../pages/AccountsPage";
import { TransactionsPage } from "../../pages/TransactionsPage";
import { TransfersPage } from "../../pages/TransfersPage";
import { BudgetPage } from "../../pages/BudgetPage";
import { GoalsPage } from "../../pages/GoalsPage";
import { FundsPage } from "../../pages/FundsPage";
import { RecurringPage } from "../../pages/RecurringPage";
import { DebtPage } from "../../pages/DebtPage";
import { ReportsPage } from "../../pages/ReportsPage";
import { ImportPage } from "../../pages/ImportPage";
import { SettingsPage } from "../../pages/SettingsPage";
import { OnboardingPage } from "../../pages/OnboardingPage";

import type { Page } from "../../types/navigation";

type Props = {
  page: Page;
  app: any;
};

export function AppRouter({ page, app }: Props) {
  if (app.showOnboarding) {
    return (
      <section className="content onboarding-content">
        <OnboardingPage
          hasAccount={app.hasOnboardingAccount}
          hasTransaction={app.hasOnboardingTransaction}
          hasBudget={app.hasOnboardingBudget}
          goToAccounts={app.openOnboardingAccounts}
          goToTransactions={app.openOnboardingTransactions}
          goToBudget={app.openOnboardingBudget}
          createDemoData={app.seedApplicationDemoData}
          dismissOnboarding={app.dismissOnboarding}
          isCreatingDemoData={app.isSeedingDemoData}
        />
      </section>
    );
  }
  return (
    <section className="content">
      {page === "dashboard" && (
        <DashboardPage
          selectedMonth={app.selectedMonth}
          setSelectedMonth={app.setSelectedMonth}
          setPage={app.setPage}
          netWorth={app.dashboard.netWorth}
          cashTotal={app.dashboard.cashTotal}
          recentTransactions={app.dashboard.recentTransactions}
          categorySummary={app.dashboard.categorySummary}
          budgetProgress={app.dashboard.budgetProgress}
          transactions={app.transactionsHook.transactions}
          goals={app.goalsHook.goals}
          accounts={app.accountsHook.accounts}
          report={app.dashboardReport}
          funds={app.fundsHook.funds}
          debts={app.debtsHook.debts}
          recurringTransactions={app.recurringHook.recurringTransactions}
        />
      )}

      {page === "accounts" && (
        <AccountsPage
          accounts={app.accountsHook.accounts}
          accountName={app.accountsHook.accountName}
          setAccountName={app.accountsHook.setAccountName}
          accountType={app.accountsHook.accountType}
          setAccountType={app.accountsHook.setAccountType}
          accountBalance={app.accountsHook.accountBalance}
          setAccountBalance={app.accountsHook.setAccountBalance}
          editingAccountId={app.accountsHook.editingAccountId}
          setEditingAccountId={app.accountsHook.setEditingAccountId}
          addAccount={() =>
            app.accountsHook.addAccount(app.reloadAccountRelatedData)
          }
          updateAccount={() =>
            app.accountsHook.updateAccount(app.reloadAccountRelatedData)
          }
          deleteAccount={(id: number) =>
            app.accountsHook.deleteAccount(id, app.reloadAccountRelatedData)
          }
          resetAccountForm={app.accountsHook.resetAccountForm}
        />
      )}

      {page === "transactions" && (
        <TransactionsPage
          accounts={app.accountsHook.accounts}
          transactions={app.transactionsHook.transactions}
          transactionAccountId={app.transactionsHook.transactionAccountId}
          setTransactionAccountId={app.transactionsHook.setTransactionAccountId}
          transactionDate={app.transactionsHook.transactionDate}
          setTransactionDate={app.transactionsHook.setTransactionDate}
          merchant={app.transactionsHook.merchant}
          setMerchant={app.transactionsHook.setMerchant}
          category={app.transactionsHook.category}
          setCategory={app.transactionsHook.setCategory}
          amount={app.transactionsHook.amount}
          setAmount={app.transactionsHook.setAmount}
          notes={app.transactionsHook.notes}
          setNotes={app.transactionsHook.setNotes}
          transactionType={app.transactionsHook.transactionType}
          setTransactionType={app.transactionsHook.setTransactionType}
          editingTransactionId={app.transactionsHook.editingTransactionId}
          setEditingTransactionId={app.transactionsHook.setEditingTransactionId}
          addTransaction={() =>
            app.transactionsHook.addTransaction(
              app.reloadAfterTransactionChange,
            )
          }
          updateTransaction={() =>
            app.transactionsHook.updateTransaction(
              app.reloadAfterTransactionChange,
            )
          }
          deleteTransaction={(transaction) =>
            app.transactionsHook.deleteTransaction(
              transaction,
              app.reloadAfterTransactionChange,
            )
          }
          resetTransactionForm={app.transactionsHook.resetTransactionForm}
          categories={app.transactionCategories}
          transactionSearch={app.transactionsHook.transactionSearch}
          setTransactionSearch={app.transactionsHook.setTransactionSearch}
          transactionFilterMonth={app.transactionsHook.transactionFilterMonth}
          setTransactionFilterMonth={
            app.transactionsHook.setTransactionFilterMonth
          }
          transactionFilterAccountId={
            app.transactionsHook.transactionFilterAccountId
          }
          setTransactionFilterAccountId={
            app.transactionsHook.setTransactionFilterAccountId
          }
          transactionFilterCategory={
            app.transactionsHook.transactionFilterCategory
          }
          setTransactionFilterCategory={
            app.transactionsHook.setTransactionFilterCategory
          }
          clearTransactionFilters={app.transactionsHook.clearTransactionFilters}
        />
      )}

      {page === "transfers" && (
        <TransfersPage
          accounts={app.accountsHook.accounts}
          transfers={app.transfersHook.transfers}
          fromAccountId={app.transfersHook.fromAccountId}
          setFromAccountId={app.transfersHook.setFromAccountId}
          toAccountId={app.transfersHook.toAccountId}
          setToAccountId={app.transfersHook.setToAccountId}
          transferDate={app.transfersHook.transferDate}
          setTransferDate={app.transfersHook.setTransferDate}
          transferAmount={app.transfersHook.transferAmount}
          setTransferAmount={app.transfersHook.setTransferAmount}
          transferNotes={app.transfersHook.transferNotes}
          setTransferNotes={app.transfersHook.setTransferNotes}
          addTransfer={() =>
            app.transfersHook.addTransfer(app.reloadAfterTransferChange)
          }
          editingTransferId={app.transfersHook.editingTransferId}
          setEditingTransferId={app.transfersHook.setEditingTransferId}
          updateTransfer={() =>
            app.transfersHook.updateTransfer(app.reloadAfterTransferChange)
          }
          deleteTransfer={(transfer) =>
            app.transfersHook.deleteTransfer(
              transfer,
              app.reloadAfterTransferChange,
            )
          }
          resetTransferForm={app.transfersHook.resetTransferForm}
          isSavingTransfer={app.transfersHook.isSavingTransfer}
          deletingTransferId={app.transfersHook.deletingTransferId}
        />
      )}

      {page === "budget" && (
        <BudgetPage
          budgetGroups={app.zeroBudgetHook.budgetGroups}
          budgetItems={app.zeroBudgetHook.budgetItems}
          zeroBudgetMonth={app.zeroBudgetHook.zeroBudgetMonth}
          setZeroBudgetMonth={app.zeroBudgetHook.setZeroBudgetMonth}
          budgetItemGroupId={app.zeroBudgetHook.budgetItemGroupId}
          setBudgetItemGroupId={app.zeroBudgetHook.setBudgetItemGroupId}
          budgetItemName={app.zeroBudgetHook.budgetItemName}
          setBudgetItemName={app.zeroBudgetHook.setBudgetItemName}
          budgetItemExpected={app.zeroBudgetHook.budgetItemExpected}
          setBudgetItemExpected={app.zeroBudgetHook.setBudgetItemExpected}
          budgetItemActual={app.zeroBudgetHook.budgetItemActual}
          setBudgetItemActual={app.zeroBudgetHook.setBudgetItemActual}
          editingBudgetItemId={app.zeroBudgetHook.editingBudgetItemId}
          setEditingBudgetItemId={app.zeroBudgetHook.setEditingBudgetItemId}
          addBudgetItem={app.zeroBudgetHook.addBudgetItem}
          updateBudgetItem={app.zeroBudgetHook.updateBudgetItem}
          deleteBudgetItem={app.zeroBudgetHook.deleteBudgetItem}
          resetBudgetItemForm={app.zeroBudgetHook.resetBudgetItemForm}
          loadZeroBudget={app.zeroBudgetHook.loadZeroBudget}
          copyCurrentBudgetToNextMonth={
            app.zeroBudgetHook.copyCurrentBudgetToNextMonth
          }
          copyPreviousBudgetIntoCurrentMonth={
            app.zeroBudgetHook.copyPreviousBudgetIntoCurrentMonth
          }
          startTransactionFromBudget={app.startTransactionFromBudget}
        />
      )}

      {page === "goals" && (
        <GoalsPage
          goals={app.goalsHook.goals}
          goalName={app.goalsHook.goalName}
          setGoalName={app.goalsHook.setGoalName}
          goalTargetAmount={app.goalsHook.goalTargetAmount}
          setGoalTargetAmount={app.goalsHook.setGoalTargetAmount}
          goalCurrentAmount={app.goalsHook.goalCurrentAmount}
          setGoalCurrentAmount={app.goalsHook.setGoalCurrentAmount}
          goalNotes={app.goalsHook.goalNotes}
          setGoalNotes={app.goalsHook.setGoalNotes}
          editingGoalId={app.goalsHook.editingGoalId}
          setEditingGoalId={app.goalsHook.setEditingGoalId}
          addGoal={app.goalsHook.addGoal}
          updateGoal={app.goalsHook.updateGoal}
          deleteGoal={app.goalsHook.deleteGoal}
          resetGoalForm={app.goalsHook.resetGoalForm}
          accounts={app.accountsHook.accounts}
          goalLinkedAccountId={app.goalsHook.goalLinkedAccountId}
          setGoalLinkedAccountId={app.goalsHook.setGoalLinkedAccountId}
          isSavingGoal={app.goalsHook.isSavingGoal}
          deletingGoalId={app.goalsHook.deletingGoalId}
        />
      )}

      {page === "funds" && (
        <FundsPage
          accounts={app.accountsHook.accounts}
          funds={app.fundsHook.funds}
          fundName={app.fundsHook.fundName}
          setFundName={app.fundsHook.setFundName}
          fundTargetAmount={app.fundsHook.fundTargetAmount}
          setFundTargetAmount={app.fundsHook.setFundTargetAmount}
          fundCurrentAmount={app.fundsHook.fundCurrentAmount}
          setFundCurrentAmount={app.fundsHook.setFundCurrentAmount}
          fundLinkedAccountId={app.fundsHook.fundLinkedAccountId}
          setFundLinkedAccountId={app.fundsHook.setFundLinkedAccountId}
          fundMonthlyContribution={app.fundsHook.fundMonthlyContribution}
          setFundMonthlyContribution={app.fundsHook.setFundMonthlyContribution}
          fundDueDate={app.fundsHook.fundDueDate}
          setFundDueDate={app.fundsHook.setFundDueDate}
          fundNotes={app.fundsHook.fundNotes}
          setFundNotes={app.fundsHook.setFundNotes}
          editingFundId={app.fundsHook.editingFundId}
          setEditingFundId={app.fundsHook.setEditingFundId}
          addFund={app.fundsHook.addFund}
          updateFund={app.fundsHook.updateFund}
          deleteFund={app.fundsHook.deleteFund}
          resetFundForm={app.fundsHook.resetFundForm}
          isSavingFund={app.fundsHook.isSavingFund}
          deletingFundId={app.fundsHook.deletingFundId}
        />
      )}

      {page === "recurring" && (
        <RecurringPage
          accounts={app.accountsHook.accounts}
          recurringTransactions={app.recurringHook.recurringTransactions}
          recurringAccountId={app.recurringHook.recurringAccountId}
          setRecurringAccountId={app.recurringHook.setRecurringAccountId}
          recurringMerchant={app.recurringHook.recurringMerchant}
          setRecurringMerchant={app.recurringHook.setRecurringMerchant}
          recurringCategory={app.recurringHook.recurringCategory}
          setRecurringCategory={app.recurringHook.setRecurringCategory}
          recurringAmount={app.recurringHook.recurringAmount}
          setRecurringAmount={app.recurringHook.setRecurringAmount}
          recurringFrequency={app.recurringHook.recurringFrequency}
          setRecurringFrequency={app.recurringHook.setRecurringFrequency}
          recurringNextDueDate={app.recurringHook.recurringNextDueDate}
          setRecurringNextDueDate={app.recurringHook.setRecurringNextDueDate}
          recurringNotes={app.recurringHook.recurringNotes}
          setRecurringNotes={app.recurringHook.setRecurringNotes}
          addRecurringTransaction={app.recurringHook.addRecurringTransaction}
          generateRecurringTransactions={() =>
            app.recurringHook.generateRecurringTransactions(
              app.reloadAfterRecurringGeneration,
            )
          }
          editingRecurringId={app.recurringHook.editingRecurringId}
          setEditingRecurringId={app.recurringHook.setEditingRecurringId}
          updateRecurringTransaction={
            app.recurringHook.updateRecurringTransaction
          }
          deleteRecurringTransaction={
            app.recurringHook.deleteRecurringTransaction
          }
          resetRecurringForm={app.recurringHook.resetRecurringForm}
          categories={app.transactionCategories}
          recurringAutopay={app.recurringHook.recurringAutopay}
          setRecurringAutopay={app.recurringHook.setRecurringAutopay}
          recurringAutoGenerate={app.recurringHook.recurringAutoGenerate}
          setRecurringAutoGenerate={app.recurringHook.setRecurringAutoGenerate}
        />
      )}

      {page === "debt" && (
        <DebtPage
          debts={app.debtsHook.debts}
          debtName={app.debtsHook.debtName}
          setDebtName={app.debtsHook.setDebtName}
          debtOriginalBalance={app.debtsHook.originalBalance}
          setDebtOriginalBalance={app.debtsHook.setOriginalBalance}
          debtCurrentBalance={app.debtsHook.currentBalance}
          setDebtCurrentBalance={app.debtsHook.setCurrentBalance}
          debtInterestRate={app.debtsHook.interestRate}
          setDebtInterestRate={app.debtsHook.setInterestRate}
          debtMinimumPayment={app.debtsHook.minimumPayment}
          setDebtMinimumPayment={app.debtsHook.setMinimumPayment}
          debtExtraPayment={app.debtsHook.extraPayment}
          setDebtExtraPayment={app.debtsHook.setExtraPayment}
          debtDueDate={app.debtsHook.debtDueDate}
          setDebtDueDate={app.debtsHook.setDebtDueDate}
          debtNotes={app.debtsHook.debtNotes}
          setDebtNotes={app.debtsHook.setDebtNotes}
          editingDebtId={app.debtsHook.editingDebtId}
          setEditingDebtId={app.debtsHook.setEditingDebtId}
          addDebt={() => app.debtsHook.addDebt()}
          updateDebt={() => app.debtsHook.updateDebt()}
          deleteDebt={(id) => app.debtsHook.deleteDebt(id)}
          resetDebtForm={app.debtsHook.resetDebtForm}
          isSavingDebt={app.debtsHook.isSavingDebt}
          deletingDebtId={app.debtsHook.deletingDebtId}
        />
      )}

      {page === "reports" && (
        <ReportsPage
          transactions={app.transactionsHook.transactions}
          budgetItems={app.zeroBudgetHook.budgetItems}
          budgetGroups={app.zeroBudgetHook.budgetGroups}
          selectedMonth={app.selectedMonth}
          setSelectedMonth={app.setSelectedMonth}
        />
      )}

      {page === "import" && (
        <ImportPage
          accounts={app.accountsHook.accounts}
          importAccountId={app.importHook.importAccountId}
          setImportAccountId={app.importHook.setImportAccountId}
          csvRows={app.importHook.csvRows}
          setCsvRows={app.importHook.setCsvRows}
          dateColumn={app.importHook.dateColumn}
          setDateColumn={app.importHook.setDateColumn}
          merchantColumn={app.importHook.merchantColumn}
          setMerchantColumn={app.importHook.setMerchantColumn}
          amountColumn={app.importHook.amountColumn}
          setAmountColumn={app.importHook.setAmountColumn}
          importCsvTransactions={() =>
            app.importHook.importCsvTransactions(
              app.reloadAfterTransactionChange,
            )
          }
        />
      )}

      {page === "settings" && (
        <SettingsPage
          accounts={app.accountsHook.accounts}
          defaultSpendingAccountId={app.settingsHook.defaultSpendingAccountId}
          setDefaultSpendingAccountId={
            app.settingsHook.setDefaultSpendingAccountId
          }
          defaultIncomeAccountId={app.settingsHook.defaultIncomeAccountId}
          setDefaultIncomeAccountId={app.settingsHook.setDefaultIncomeAccountId}
          resetApplicationData={app.resetApplicationData}
          seedApplicationDemoData={app.seedApplicationDemoData}
          automaticBackupStatus={app.automaticBackupHook.automaticBackupStatus}
          isCreatingAutomaticBackup={
            app.automaticBackupHook.isCreatingAutomaticBackup
          }
          createAutomaticBackupNow={
            app.automaticBackupHook.createAutomaticBackupNow
          }
        />
      )}
    </section>
  );
}
