import { useCallback, useRef, useState } from "react";

import { useToast } from "../components/toast/ToastContext";

type ResolvableText<T> = string | ((result: T) => string);

type OptionalResolvableText<T> = string | ((result: T) => string | undefined);

export type ToastActionMessages<T> = {
  loadingTitle: string;
  loadingMessage?: string;

  successTitle: ResolvableText<T>;
  successMessage?: OptionalResolvableText<T>;

  errorTitle: string | ((error: unknown) => string);

  errorMessage?: (error: unknown) => string;

  successDuration?: number;
  errorDuration?: number;
};

type RunToastActionOptions = {
  rethrow?: boolean;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function resolveText<T>(value: ResolvableText<T>, result: T) {
  return typeof value === "function" ? value(result) : value;
}

export function useToastAction() {
  const toast = useToast();

  /*
   * The ref blocks rapid double-clicks immediately.
   * State exists only so components can render loading states.
   */
  const activeActionKeysRef = useRef(new Set<string>());

  const [activeActions, setActiveActions] = useState<Set<string>>(new Set());

  const syncActiveActions = useCallback(() => {
    setActiveActions(new Set(activeActionKeysRef.current));
  }, []);

  const isRunning = useCallback(
    (actionKey: string) => activeActions.has(actionKey),
    [activeActions],
  );

  const runWithToast = useCallback(
    async <T>(
      actionKey: string,
      action: () => Promise<T>,
      messages: ToastActionMessages<T>,
      options: RunToastActionOptions = {},
    ): Promise<T | undefined> => {
      if (activeActionKeysRef.current.has(actionKey)) {
        return undefined;
      }

      activeActionKeysRef.current.add(actionKey);
      syncActiveActions();

      const toastId = toast.loading(
        messages.loadingTitle,
        messages.loadingMessage,
      );

      try {
        const result = await action();

        const successMessage =
          typeof messages.successMessage === "function"
            ? messages.successMessage(result)
            : messages.successMessage;

        toast.updateToast(toastId, {
          type: "success",
          title: resolveText(messages.successTitle, result),
          message: successMessage,
          duration: messages.successDuration ?? 3500,
        });

        return result;
      } catch (error) {
        console.error(`${actionKey} failed:`, error);

        const errorTitle =
          typeof messages.errorTitle === "function"
            ? messages.errorTitle(error)
            : messages.errorTitle;

        toast.updateToast(toastId, {
          type: "error",
          title: errorTitle,
          message: messages.errorMessage?.(error) ?? getErrorMessage(error),
          duration: messages.errorDuration ?? 6000,
        });

        if (options.rethrow) {
          throw error;
        }

        return undefined;
      } finally {
        activeActionKeysRef.current.delete(actionKey);
        syncActiveActions();
      }
    },
    [syncActiveActions, toast],
  );

  return {
    runWithToast,
    isRunning,
  };
}
