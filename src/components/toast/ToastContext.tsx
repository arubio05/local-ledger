import {
  CheckCircle2,
  CircleAlert,
  CircleX,
  Info,
  LoaderCircle,
  X,
} from "lucide-react";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastType = "success" | "error" | "warning" | "info" | "loading";

type Toast = {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
};

type ToastInput = {
  type?: ToastType;
  title: string;
  message?: string;
  duration?: number;
};

type ToastUpdate = {
  type?: ToastType;
  title?: string;
  message?: string;
  duration?: number;
};

type ToastContextValue = {
  showToast: (toast: ToastInput) => number;

  success: (title: string, message?: string, duration?: number) => number;

  error: (title: string, message?: string, duration?: number) => number;

  warning: (title: string, message?: string, duration?: number) => number;

  info: (title: string, message?: string, duration?: number) => number;

  loading: (title: string, message?: string) => number;

  updateToast: (id: number, update: ToastUpdate) => void;

  dismissToast: (id: number) => void;
  dismissAll: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4000;
const ERROR_DURATION = 6000;
const MAX_VISIBLE_TOASTS = 5;

function getToastIcon(type: ToastType) {
  switch (type) {
    case "success":
      return <CheckCircle2 size={19} />;

    case "error":
      return <CircleX size={19} />;

    case "warning":
      return <CircleAlert size={19} />;

    case "loading":
      return <LoaderCircle size={19} className="toast-loading-icon" />;

    case "info":
    default:
      return <Info size={19} />;
  }
}

type ProviderProps = {
  children: ReactNode;
};

export function ToastProvider({ children }: ProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextIdRef = useRef(1);

  const timeoutIdsRef = useRef(
    new Map<number, ReturnType<typeof setTimeout>>(),
  );

  const clearToastTimer = useCallback((id: number) => {
    const timeoutId = timeoutIdsRef.current.get(id);

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutIdsRef.current.delete(id);
    }
  }, []);

  const dismissToast = useCallback(
    (id: number) => {
      clearToastTimer(id);

      setToasts((current) => current.filter((toast) => toast.id !== id));
    },
    [clearToastTimer],
  );

  const scheduleDismiss = useCallback(
    (id: number, duration: number) => {
      clearToastTimer(id);

      if (duration <= 0) {
        return;
      }

      const timeoutId = setTimeout(() => {
        timeoutIdsRef.current.delete(id);

        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, duration);

      timeoutIdsRef.current.set(id, timeoutId);
    },
    [clearToastTimer],
  );

  const showToast = useCallback(
    ({ type = "info", title, message, duration }: ToastInput) => {
      const id = nextIdRef.current++;

      const resolvedDuration =
        type === "loading"
          ? 0
          : (duration ??
            (type === "error" ? ERROR_DURATION : DEFAULT_DURATION));

      const toast: Toast = {
        id,
        type,
        title,
        message,
        duration: resolvedDuration,
      };

      setToasts((current) => {
        const next = [...current, toast];

        if (next.length <= MAX_VISIBLE_TOASTS) {
          return next;
        }

        const removed = next.slice(0, next.length - MAX_VISIBLE_TOASTS);

        for (const removedToast of removed) {
          clearToastTimer(removedToast.id);
        }

        return next.slice(-MAX_VISIBLE_TOASTS);
      });

      scheduleDismiss(id, resolvedDuration);

      return id;
    },
    [clearToastTimer, scheduleDismiss],
  );

  const updateToast = useCallback(
    (id: number, update: ToastUpdate) => {
      setToasts((current) => {
        const existingToast = current.find((toast) => toast.id === id);

        if (!existingToast) {
          return current;
        }
        const nextType = update.type ?? existingToast.type;

        const nextDuration =
          nextType === "loading"
            ? 0
            : (update.duration ??
              (existingToast.type === "loading"
                ? nextType === "error"
                  ? ERROR_DURATION
                  : DEFAULT_DURATION
                : existingToast.duration));

        // Cancel the previous timer
        clearToastTimer(id);

        // Schedule the new one immediately
        if (nextDuration > 0) {
          const timeoutId = setTimeout(() => {
            timeoutIdsRef.current.delete(id);

            setToasts((current) => current.filter((toast) => toast.id !== id));
          }, nextDuration);

          timeoutIdsRef.current.set(id, timeoutId);
        }

        return current.map((toast) =>
          toast.id === id
            ? {
                ...toast,
                ...update,
                type: nextType,
                duration: nextDuration,
              }
            : toast,
        );
      });
    },
    [clearToastTimer],
  );

  const dismissAll = useCallback(() => {
    for (const timeoutId of timeoutIdsRef.current.values()) {
      clearTimeout(timeoutId);
    }

    timeoutIdsRef.current.clear();
    setToasts([]);
  }, []);

  useEffect(() => {
    return () => {
      for (const timeoutId of timeoutIdsRef.current.values()) {
        clearTimeout(timeoutId);
      }

      timeoutIdsRef.current.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,

      success: (title, message, duration) =>
        showToast({
          type: "success",
          title,
          message,
          duration,
        }),

      error: (title, message, duration) =>
        showToast({
          type: "error",
          title,
          message,
          duration,
        }),

      warning: (title, message, duration) =>
        showToast({
          type: "warning",
          title,
          message,
          duration,
        }),

      info: (title, message, duration) =>
        showToast({
          type: "info",
          title,
          message,
          duration,
        }),

      loading: (title, message) =>
        showToast({
          type: "loading",
          title,
          message,
          duration: 0,
        }),

      updateToast,
      dismissToast,
      dismissAll,
    }),
    [dismissAll, dismissToast, showToast, updateToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        className="toast-viewport"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <article
            key={toast.id}
            className={`toast-card toast-${toast.type}`}
            role={toast.type === "error" ? "alert" : "status"}
          >
            <div className="toast-icon">{getToastIcon(toast.type)}</div>

            <div className="toast-content">
              <strong>{toast.title}</strong>

              {toast.message && <p>{toast.message}</p>}
            </div>

            <button
              type="button"
              className="toast-close-button"
              aria-label="Dismiss notification"
              onClick={() => dismissToast(toast.id)}
            >
              <X size={15} />
            </button>
          </article>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }

  return context;
}
