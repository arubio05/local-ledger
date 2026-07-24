import { useCallback, useEffect, useRef, useState } from "react";

import {
  createAutomaticBackup,
  getAutomaticBackupStatus,
  type AutomaticBackupStatus,
} from "../services/backupService";

import { useToast } from "../components/toast/ToastContext";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function useAutomaticBackup() {
  const toast = useToast();

  const [automaticBackupStatus, setAutomaticBackupStatus] =
    useState<AutomaticBackupStatus | null>(null);

  const [isCreatingAutomaticBackup, setIsCreatingAutomaticBackup] =
    useState(false);

  const backupInProgressRef = useRef(false);
  const initialCheckStartedRef = useRef(false);

  const loadAutomaticBackupStatus = useCallback(async () => {
    try {
      const status = await getAutomaticBackupStatus();
      setAutomaticBackupStatus(status);
      return status;
    } catch (error) {
      console.error("Load automatic backup status failed:", error);
      throw error;
    }
  }, []);

  const runAutomaticBackup = useCallback(
    async (force = false, showResultToast = false): Promise<string | null> => {
      if (backupInProgressRef.current) {
        return null;
      }

      backupInProgressRef.current = true;
      setIsCreatingAutomaticBackup(true);

      try {
        const backupPath = await createAutomaticBackup(force);
        await loadAutomaticBackupStatus();

        if (showResultToast && backupPath) {
          toast.success(
            "Backup created",
            "Project FMJ created a new automatic backup.",
          );
        } else if (showResultToast && !backupPath) {
          toast.info(
            "Backup already current",
            "An automatic backup was created within the last 24 hours.",
          );
        }

        return backupPath;
      } catch (error) {
        console.error("Automatic backup failed:", error);

        if (showResultToast) {
          toast.error("Automatic backup failed", getErrorMessage(error));
        }

        return null;
      } finally {
        backupInProgressRef.current = false;
        setIsCreatingAutomaticBackup(false);
      }
    },
    [loadAutomaticBackupStatus, toast],
  );

  useEffect(() => {
    if (initialCheckStartedRef.current) {
      return;
    }

    initialCheckStartedRef.current = true;
    void runAutomaticBackup(false, false);
  }, [runAutomaticBackup]);

  return {
    automaticBackupStatus,
    isCreatingAutomaticBackup,
    loadAutomaticBackupStatus,
    createAutomaticBackupNow: () => runAutomaticBackup(true, true),
  };
}
