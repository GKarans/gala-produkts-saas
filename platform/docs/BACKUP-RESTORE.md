# Backup and restore drill

## Scope

The backup contains a PostgreSQL custom-format dump, every private R2 object, and a manifest with object sizes and SHA-256 checksums. Credentials are read only from the process environment and never written to the archive.

## Backup

1. Install PostgreSQL client tools matching the server major version.
2. Load read-only staging credentials in the shell.
3. Run `npm run backup -- D:\secure-backups\lumiq-staging-YYYY-MM-DD`.
4. Run `npm run backup:verify -- D:\secure-backups\lumiq-staging-YYYY-MM-DD`.
5. Encrypt the directory at rest and record duration, dump size, object count and manifest checksum.

## Restore drill

1. Create a new empty Supabase drill project and a new empty private R2 bucket. Never target production or staging.
2. Load only the drill credentials and set `PLATFORM_RESTORE_DRILL=EMPTY-ISOLATED-TARGET`.
3. Run `npm run restore:drill -- D:\secure-backups\lumiq-staging-YYYY-MM-DD`.
4. Run migrations, start web and worker services against the drill targets, then test login, event ownership, thumbnails, full photos and one ZIP export.
5. Compare database row counts and sampled object SHA-256 values with the manifest. Destroy the drill environment after evidence is retained.

The scripts and local validation are complete. A dated cloud restore record remains a release gate until isolated staging services exist.
