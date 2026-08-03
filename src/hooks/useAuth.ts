import { useState } from "react";

import {
  createLocalPassword,
  isLocalAuthConfigured,
  verifyLocalPassword,
  changeLocalPassword,
} from "../services/authService";

import { useToast } from "../components/toast/ToastContext";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function useAuth() {
  const toast = useToast();

  const [isAuthConfigured, setIsAuthConfigured] = useState(
    isLocalAuthConfigured,
  );

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [isProcessingAuth, setIsProcessingAuth] = useState(false);

  async function createPassword(
    password: string,
    confirmPassword: string,
  ): Promise<boolean> {
    if (isProcessingAuth) {
      return false;
    }

    if (password !== confirmPassword) {
      toast.warning(
        "Passwords do not match",
        "Enter the same password in both fields.",
      );

      return false;
    }

    try {
      setIsProcessingAuth(true);

      await createLocalPassword(password);

      setIsAuthConfigured(true);
      setIsAuthenticated(true);

      toast.success(
        "Password created",
        "Project FMJ is now protected by your local password.",
      );

      return true;
    } catch (error) {
      console.error("Create local password failed:", error);

      toast.error("Unable to create password", getErrorMessage(error));

      return false;
    } finally {
      setIsProcessingAuth(false);
    }
  }

  async function login(password: string): Promise<boolean> {
    if (isProcessingAuth) {
      return false;
    }

    if (!password.trim()) {
      toast.warning("Password required", "Enter your Project FMJ password.");

      return false;
    }

    try {
      setIsProcessingAuth(true);

      const isValid = await verifyLocalPassword(password);

      if (!isValid) {
        toast.error(
          "Incorrect password",
          "The password you entered is not correct.",
        );

        return false;
      }

      setIsAuthenticated(true);

      return true;
    } catch (error) {
      console.error("Local login failed:", error);

      toast.error("Unable to log in", getErrorMessage(error));

      return false;
    } finally {
      setIsProcessingAuth(false);
    }
  }

  function logout(): void {
    setIsAuthenticated(false);
  }

  async function changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<boolean> {
    if (isProcessingAuth) {
      return false;
    }

    if (!currentPassword.trim()) {
      toast.warning(
        "Current password required",
        "Enter your current password.",
      );
      return false;
    }

    if (newPassword !== confirmPassword) {
      toast.warning(
        "Passwords do not match",
        "Enter the same new password in both fields.",
      );
      return false;
    }

    try {
      setIsProcessingAuth(true);

      await changeLocalPassword(currentPassword, newPassword);

      toast.success(
        "Password changed",
        "Your Project FMJ password was updated.",
      );

      return true;
    } catch (error) {
      console.error("Change password failed:", error);

      toast.error("Unable to change password", getErrorMessage(error));

      return false;
    } finally {
      setIsProcessingAuth(false);
    }
  }

  function lock(): void {
    setIsAuthenticated(false);
  }

  return {
    isAuthConfigured,
    isAuthenticated,
    isProcessingAuth,

    createPassword,
    login,
    logout,
    lock,
    changePassword,
  };
}
