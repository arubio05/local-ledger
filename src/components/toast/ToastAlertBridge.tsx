import { useEffect } from "react";

import { useToast } from "./ToastContext";

export function ToastAlertBridge() {
  const toast = useToast();

  useEffect(() => {
    const originalAlert = window.alert;

    window.alert = (message?: unknown) => {
      const text =
        typeof message === "string"
          ? message
          : message === undefined
            ? ""
            : String(message);

      const normalizedText = text.toLowerCase();

      const isError =
        normalizedText.includes("unable") ||
        normalizedText.includes("failed") ||
        normalizedText.includes("error") ||
        normalizedText.includes("cannot") ||
        normalizedText.includes("could not");

      const isWarning =
        normalizedText.includes("please") ||
        normalizedText.includes("required") ||
        normalizedText.includes("must") ||
        normalizedText.includes("invalid") ||
        normalizedText.includes("cannot");

      if (isError) {
        toast.error("Action failed", text);
        return;
      }

      if (isWarning) {
        toast.warning("Check your information", text);
        return;
      }

      toast.info("Project FMJ", text);
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [toast]);

  return null;
}
