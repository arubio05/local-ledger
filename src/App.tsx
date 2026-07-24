import "./App.css";

import { Sidebar } from "./components/layout/Sidebar";
import { AppRouter } from "./components/layout/AppRouter";
import { ModalProvider } from "./components/modal/ModalContext";
import { useApp } from "./hooks/useApp";

function App() {
  const app = useApp();

  return (
    <ModalProvider>
      <main className="app">
        <Sidebar page={app.page} setPage={app.setPage} />
        <AppRouter page={app.page} app={app} />
      </main>
    </ModalProvider>
  );
}

export default App;
