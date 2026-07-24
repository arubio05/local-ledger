use std::{
    fs::{self, File},
    io::Read,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};

use serde::Serialize;
use tauri::Manager;

const DATABASE_FILE_NAME: &str = "local-ledger.db";

const PENDING_RESTORE_FILE_NAME: &str =
    "project-fmj-pending-restore.db";

const PRE_RESTORE_FILE_NAME: &str =
    "project-fmj-pre-restore.db";

const AUTOMATIC_BACKUP_FOLDER_NAME: &str =
    "backups";

const AUTOMATIC_BACKUP_FILE_PREFIX: &str =
    "Project-FMJ-Auto-Backup";

const MAX_AUTOMATIC_BACKUPS: usize = 20;

const ONE_DAY_IN_SECONDS: u64 = 86_400;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct AutomaticBackupStatus {
    backup_directory: String,
    latest_backup_path: Option<String>,
    latest_backup_timestamp: Option<u64>,
    backup_count: usize,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!(
        "Hello, {name}! You've been greeted from Rust!"
    )
}

fn get_unix_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

fn get_modified_timestamp(path: &Path) -> u64 {
    fs::metadata(path)
        .and_then(|metadata| metadata.modified())
        .ok()
        .and_then(|modified| {
            modified
                .duration_since(UNIX_EPOCH)
                .ok()
        })
        .map(|duration| duration.as_secs())
        .unwrap_or(0)
}

fn get_app_data_directory(
    app: &tauri::AppHandle,
) -> Result<PathBuf, String> {
    let app_data_directory = app
        .path()
        .app_data_dir()
        .map_err(|error| {
            format!(
                "Unable to locate the app data directory: {error}"
            )
        })?;

    fs::create_dir_all(&app_data_directory)
        .map_err(|error| {
            format!(
                "Unable to create the app data directory: {error}"
            )
        })?;

    Ok(app_data_directory)
}

fn get_database_path(
    app: &tauri::AppHandle,
) -> Result<PathBuf, String> {
    Ok(
        get_app_data_directory(app)?
            .join(DATABASE_FILE_NAME),
    )
}

fn get_automatic_backup_directory(
    app: &tauri::AppHandle,
) -> Result<PathBuf, String> {
    let backup_directory =
        get_app_data_directory(app)?
            .join(AUTOMATIC_BACKUP_FOLDER_NAME);

    fs::create_dir_all(&backup_directory)
        .map_err(|error| {
            format!(
                "Unable to create the automatic backup directory: {error}"
            )
        })?;

    Ok(backup_directory)
}

fn get_sqlite_sidecar_path(
    database_path: &Path,
    suffix: &str,
) -> PathBuf {
    PathBuf::from(format!(
        "{}{suffix}",
        database_path.to_string_lossy()
    ))
}

fn remove_file_if_exists(
    path: &Path,
) -> Result<(), String> {
    if !path.exists() {
        return Ok(());
    }

    fs::remove_file(path).map_err(|error| {
        format!(
            "Unable to remove {}: {error}",
            path.display()
        )
    })
}

fn validate_sqlite_file(
    path: &Path,
) -> Result<(), String> {
    if !path.exists() {
        return Err(
            "The SQLite database file does not exist."
                .to_string(),
        );
    }

    if !path.is_file() {
        return Err(
            "The selected path is not a file."
                .to_string(),
        );
    }

    let metadata =
        fs::metadata(path).map_err(|error| {
            format!(
                "Unable to inspect the SQLite file: {error}"
            )
        })?;

    if metadata.len() < 100 {
        return Err(
            "The selected file is too small to be a valid SQLite database."
                .to_string(),
        );
    }

    const SQLITE_HEADER: &[u8; 16] =
        b"SQLite format 3\0";

    let mut file = File::open(path).map_err(
        |error| {
            format!(
                "Unable to open the SQLite file: {error}"
            )
        },
    )?;

    let mut header = [0_u8; 16];

    file.read_exact(&mut header).map_err(
        |error| {
            format!(
                "Unable to read the SQLite header: {error}"
            )
        },
    )?;

    if &header != SQLITE_HEADER {
        return Err(
            "The selected file is not a valid SQLite database."
                .to_string(),
        );
    }

    Ok(())
}

fn copy_and_validate_database(
    source: &Path,
    destination: &Path,
) -> Result<(), String> {
    validate_sqlite_file(source)?;

    if let Some(parent) = destination.parent() {
        fs::create_dir_all(parent).map_err(
            |error| {
                format!(
                    "Unable to create the destination directory: {error}"
                )
            },
        )?;
    }

    remove_file_if_exists(destination)?;

    fs::copy(source, destination).map_err(
        |error| {
            format!(
                "Unable to copy the database from {} to {}: {error}",
                source.display(),
                destination.display(),
            )
        },
    )?;

    if let Err(error) =
        validate_sqlite_file(destination)
    {
        let _ =
            remove_file_if_exists(destination);

        return Err(error);
    }

    Ok(())
}

fn list_automatic_backups(
    app: &tauri::AppHandle,
) -> Result<Vec<PathBuf>, String> {
    let backup_directory =
        get_automatic_backup_directory(app)?;

    let entries =
        fs::read_dir(&backup_directory).map_err(
            |error| {
                format!(
                    "Unable to read the automatic backup directory: {error}"
                )
            },
        )?;

    let mut backups = entries
        .filter_map(Result::ok)
        .map(|entry| entry.path())
        .filter(|path| {
            if !path.is_file() {
                return false;
            }

            path.file_name()
                .and_then(|name| name.to_str())
                .map(|name| {
                    name.starts_with(
                        AUTOMATIC_BACKUP_FILE_PREFIX,
                    ) && name.ends_with(".db")
                })
                .unwrap_or(false)
        })
        .collect::<Vec<_>>();

    backups.sort_by(|left, right| {
        get_modified_timestamp(right).cmp(
            &get_modified_timestamp(left),
        )
    });

    Ok(backups)
}

fn cleanup_old_automatic_backups(
    app: &tauri::AppHandle,
) -> Result<(), String> {
    let backups =
        list_automatic_backups(app)?;

    for old_backup in backups
        .iter()
        .skip(MAX_AUTOMATIC_BACKUPS)
    {
        remove_file_if_exists(old_backup)?;
    }

    Ok(())
}

fn has_recent_automatic_backup(
    app: &tauri::AppHandle,
) -> Result<bool, String> {
    let backups =
        list_automatic_backups(app)?;

    let Some(latest_backup) =
        backups.first()
    else {
        return Ok(false);
    };

    let latest_timestamp =
        get_modified_timestamp(latest_backup);

    if latest_timestamp == 0 {
        return Ok(false);
    }

    let elapsed = get_unix_timestamp()
        .saturating_sub(latest_timestamp);

    Ok(elapsed < ONE_DAY_IN_SECONDS)
}

fn create_internal_automatic_backup(
    app: &tauri::AppHandle,
    force: bool,
) -> Result<Option<PathBuf>, String> {
    let database_path =
        get_database_path(app)?;

    validate_sqlite_file(&database_path)?;

    if !force
        && has_recent_automatic_backup(app)?
    {
        return Ok(None);
    }

    let backup_directory =
        get_automatic_backup_directory(app)?;

    let backup_file_name = format!(
        "{AUTOMATIC_BACKUP_FILE_PREFIX}-{}.db",
        get_unix_timestamp(),
    );

    let backup_path =
        backup_directory.join(backup_file_name);

    copy_and_validate_database(
        &database_path,
        &backup_path,
    )?;

    cleanup_old_automatic_backups(app)?;

    Ok(Some(backup_path))
}

fn apply_pending_restore(
    app: &tauri::AppHandle,
) -> Result<(), String> {
    let app_data_directory =
        get_app_data_directory(app)?;

    let database_path =
        app_data_directory
            .join(DATABASE_FILE_NAME);

    let pending_restore_path =
        app_data_directory.join(
            PENDING_RESTORE_FILE_NAME,
        );

    let pre_restore_path =
        app_data_directory.join(
            PRE_RESTORE_FILE_NAME,
        );

    if !pending_restore_path.exists() {
        return Ok(());
    }

    validate_sqlite_file(
        &pending_restore_path,
    )?;

    let wal_path =
        get_sqlite_sidecar_path(
            &database_path,
            "-wal",
        );

    let shm_path =
        get_sqlite_sidecar_path(
            &database_path,
            "-shm",
        );

    let journal_path =
        get_sqlite_sidecar_path(
            &database_path,
            "-journal",
        );

    /*
     * Remove journal files belonging to the old
     * database before installing a restored file.
     */
    remove_file_if_exists(&wal_path)?;
    remove_file_if_exists(&shm_path)?;
    remove_file_if_exists(&journal_path)?;

    remove_file_if_exists(
        &pre_restore_path,
    )?;

    /*
     * Preserve the current database before replacing it.
     */
    if database_path.exists() {
        copy_and_validate_database(
            &database_path,
            &pre_restore_path,
        )?;
    }

    copy_and_validate_database(
        &pending_restore_path,
        &database_path,
    )?;

    remove_file_if_exists(
        &pending_restore_path,
    )?;

    Ok(())
}

#[tauri::command]
fn create_database_backup(
    app: tauri::AppHandle,
    destination_path: String,
) -> Result<String, String> {
    let database_path =
        get_database_path(&app)?;

    let destination =
        PathBuf::from(destination_path);

    if destination == database_path {
        return Err(
            "The backup destination cannot be the active Project FMJ database."
                .to_string(),
        );
    }

    copy_and_validate_database(
        &database_path,
        &destination,
    )?;

    Ok(
        destination
            .to_string_lossy()
            .to_string(),
    )
}

#[tauri::command]
fn stage_database_restore(
    app: tauri::AppHandle,
    source_path: String,
) -> Result<(), String> {
    let source =
        PathBuf::from(source_path);

    validate_sqlite_file(&source)?;

    let app_data_directory =
        get_app_data_directory(&app)?;

    let database_path =
        app_data_directory
            .join(DATABASE_FILE_NAME);

    let pending_restore_path =
        app_data_directory.join(
            PENDING_RESTORE_FILE_NAME,
        );

    if source == database_path {
        return Err(
            "The active Project FMJ database cannot be selected as a restore backup."
                .to_string(),
        );
    }

    if source == pending_restore_path {
        return Err(
            "The selected file is already staged for restoration."
                .to_string(),
        );
    }

    copy_and_validate_database(
        &source,
        &pending_restore_path,
    )?;

    Ok(())
}

#[tauri::command]
fn create_automatic_backup(
    app: tauri::AppHandle,
    force: Option<bool>,
) -> Result<Option<String>, String> {
    let created_backup =
        create_internal_automatic_backup(
            &app,
            force.unwrap_or(false),
        )?;

    Ok(
        created_backup.map(|path| {
            path.to_string_lossy().to_string()
        }),
    )
}

#[tauri::command]
fn get_automatic_backup_status(
    app: tauri::AppHandle,
) -> Result<AutomaticBackupStatus, String> {
    let backup_directory =
        get_automatic_backup_directory(&app)?;

    let backups =
        list_automatic_backups(&app)?;

    let latest_backup =
        backups.first();

    Ok(AutomaticBackupStatus {
        backup_directory:
            backup_directory
                .to_string_lossy()
                .to_string(),

        latest_backup_path:
            latest_backup.map(|path| {
                path.to_string_lossy().to_string()
            }),

        latest_backup_timestamp:
            latest_backup.map(|path| {
                get_modified_timestamp(path)
            }),

        backup_count: backups.len(),
    })
}

#[cfg_attr(
    mobile,
    tauri::mobile_entry_point
)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_process::init(),
        )
        .plugin(
            tauri_plugin_dialog::init(),
        )
        .plugin(
            tauri_plugin_fs::init(),
        )
        .plugin(
            tauri_plugin_sql::Builder::default()
                .build(),
        )
        .plugin(
            tauri_plugin_opener::init(),
        )
        .setup(|app| {
            if let Err(error) =
                apply_pending_restore(
                    app.handle(),
                )
            {
                eprintln!(
                    "Project FMJ restore startup error: {error}"
                );
            }

            Ok(())
        })
        .invoke_handler(
            tauri::generate_handler![
                greet,
                create_database_backup,
                stage_database_restore,
                create_automatic_backup,
                get_automatic_backup_status
            ],
        )
        .run(
            tauri::generate_context!(),
        )
        .expect(
            "error while running Project FMJ",
        );
}