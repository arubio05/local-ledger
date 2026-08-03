import "./App.css";

import { Sidebar } from "./components/layout/Sidebar";
import { AppRouter } from "./components/layout/AppRouter";
import { ModalProvider } from "./components/modal/ModalContext";

import { LoginPage } from "./pages/LoginPage";

import { useApp } from "./hooks/useApp";
import { useAuth } from "./hooks/useAuth";
import { useAutoLock } from "./hooks/useAutoLock";

type AuthenticatedAppProps = {
  logout: () => void;
  changePassword: (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ) => Promise<boolean>;
};

function AuthenticatedApp({ logout, changePassword }: AuthenticatedAppProps) {
  const app = useApp();

  return (
    <main className="app">
      <Sidebar page={app.page} setPage={app.setPage} logout={logout} />

      <AppRouter page={app.page} app={app} changePassword={changePassword} />
    </main>
  );
}

function App() {
  const auth = useAuth();
  useAutoLock({
    enabled: auth.isAuthenticated,
    onLock: auth.lock,
    timeoutMinutes: 10,
  });

  return (
    <ModalProvider>
      {!auth.isAuthenticated ? (
        <LoginPage
          isAuthConfigured={auth.isAuthConfigured}
          isProcessingAuth={auth.isProcessingAuth}
          createPassword={auth.createPassword}
          login={auth.login}
        />
      ) : (
        <AuthenticatedApp
          logout={auth.logout}
          changePassword={auth.changePassword}
        />
      )}
    </ModalProvider>
  );
}

export default App;
