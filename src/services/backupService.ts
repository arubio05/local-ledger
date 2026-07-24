import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { relaunch } from "@tauri-apps/plugin-process";

import { getDb } from "../database";

export type AutomaticBackupStatus = {
  backupDirectory: string;
  latestBackupPath: string | null;
  latestBackupTimestamp: number | null;
  backupCount: number;
};

function buildBackupFilename() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");

  return `Project-FMJ-Backup-${year}-${month}-${day}-${hour}${minute}.db`;
}

function ensureDatabaseExtension(path: string) {
  return path.toLowerCase().endsWith(".db") ? path : `${path}.db`;
}

async function checkpointDatabase() {
  const db = await getDb();

  await db.execute("PRAGMA wal_checkpoint(TRUNCATE)");
}

export async function exportDatabaseBackup() {
  const selectedPath = await save({
    title: "Save Project FMJ Backup",
    defaultPath: buildBackupFilename(),
    filters: [
      {
        name: "Project FMJ Database Backup",
        extensions: ["db"],
      },
    ],
  });

  if (!selectedPath) {
    return null;
  }

  const destinationPath = ensureDatabaseExtension(selectedPath);

  await checkpointDatabase();

  return invoke<string>("create_database_backup", {
    destinationPath,
  });
}

export async function chooseDatabaseBackup() {
  const selectedPath = await open({
    title: "Choose Project FMJ Backup",
    multiple: false,
    directory: false,
    filters: [
      {
        name: "Project FMJ Database Backup",
        extensions: ["db"],
      },
    ],
  });

  if (!selectedPath || Array.isArray(selectedPath)) {
    return null;
  }

  return selectedPath;
}

export async function restoreDatabaseBackup(sourcePath: string) {
  await invoke("stage_database_restore", {
    sourcePath,
  });

  await relaunch();
}

export async function createAutomaticBackup(force = false) {
  await checkpointDatabase();

  return invoke<string | null>("create_automatic_backup", {
    force,
  });
}

export async function getAutomaticBackupStatus() {
  return invoke<AutomaticBackupStatus>("get_automatic_backup_status");
}
