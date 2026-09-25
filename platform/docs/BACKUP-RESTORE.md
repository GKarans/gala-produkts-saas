# Backup and restore drill

## Scope

The backup contains the Lumiq public application tables, Supabase Auth user/identity rows, every private R2 object, and a manifest with database/object sizes and SHA-256 checksums. It deliberately excludes Supabase-managed schema definitions and extension-owned public tables. Verification rejects missing integrity metadata, altered files, size mismatches and paths escaping the backup directory. Credentials are read only from the process environment and never written to the archive.

## Backup

1. Install PostgreSQL 17 **Command Line Tools** only; a local PostgreSQL server is not required. The [official PostgreSQL Windows download page](https://www.postgresql.org/download/windows/) links to the EDB installer, where Command Line Tools can be selected as a component. The helper checks `%LOCALAPPDATA%\Lumiq\postgresql17\bin`, `%USERPROFILE%\AppData\Local\Lumiq\postgresql17\bin`, `%ProgramFiles%\PostgreSQL\17\bin`, and the current `PATH`, then confirms both clients are major version 17.
2. Run `platform/scripts/backup-local.ps1`. It prompts for credentials locally, validates the source project and bucket, then verifies the archive.
3. Keep the verified backup directory outside the repository, encrypt it at rest, and record duration, dump size, object count and manifest checksum.
5. Encrypt the directory at rest and record duration, dump size, object count and manifest checksum.

## Restore drill

1. Create a new empty Supabase drill project and a new empty private R2 bucket. Never target production or the source project.
2. Load only the new drill project's credentials and set `PLATFORM_RESTORE_DRILL=EMPTY-ISOLATED-TARGET` plus `PLATFORM_RESTORE_TARGET_REF` to the exact project reference. The script verifies that reference against the PostgreSQL URL, validates the backup before writes, and refuses any non-empty public schema or R2 bucket.
3. Run `npm run restore:drill -- <verified-backup-directory>`.
4. Run migrations, start web and worker services against the drill targets, then test login, event ownership, thumbnails, full photos and one ZIP export.
5. Compare database row counts and sampled object SHA-256 values with the manifest. Destroy the drill environment after evidence is retained.

Auth provider settings (OAuth, email templates, redirect allowlist and SMTP) are not database rows; configure them separately in the drill project. Existing sessions are not preserved, so users must sign in again. The cloud restore drill is not complete until an isolated target project/bucket exists and the restored app passes the listed smoke tests.
