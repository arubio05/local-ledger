import { createContext, useContext, useState } from "react";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
};

type ModalContextValue = {
  openConfirm: (options: ConfirmOptions) => void;
};

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(
    null,
  );

  function openConfirm(options: ConfirmOptions) {
    setConfirmOptions(options);
  }

  function closeConfirm() {
    setConfirmOptions(null);
  }

  async function handleConfirm() {
    if (!confirmOptions) return;

    await confirmOptions.onConfirm();
    closeConfirm();
  }

  return (
    <ModalContext.Provider value={{ openConfirm }}>
      {children}

      {confirmOptions && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>{confirmOptions.title}</h3>
            <p>{confirmOptions.message}</p>

            <div className="modal-actions">
              <button className="secondary-button" onClick={closeConfirm}>
                {confirmOptions.cancelText || "Cancel"}
              </button>

              <button
                className={confirmOptions.danger ? "danger-button" : ""}
                onClick={handleConfirm}
              >
                {confirmOptions.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);

  if (!context) {
    throw new Error("useModal must be used inside ModalProvider");
  }

  return context;
}
