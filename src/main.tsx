import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import { ModalProvider } from "./components/modal/ModalContext";
import { ToastProvider } from "./components/toast/ToastContext";
import { ToastAlertBridge } from "./components/toast/ToastAlertBridge";

import "./App.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ToastProvider>
      <ToastAlertBridge />

      <ModalProvider>
        <App />
      </ModalProvider>
    </ToastProvider>
  </React.StrictMode>,
);
