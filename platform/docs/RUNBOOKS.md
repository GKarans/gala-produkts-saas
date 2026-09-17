# Operations runbooks

Use only an isolated staging environment until LAUNCH-GATES.md is approved. Never paste access tokens, signed URLs, passwords or full customer photos into logs or support tickets.

## Photo missing from the gallery

1. Record event ID, media UUID, time and request ID. Ask whether the guest saw final success.
2. Check `media.status` and both object keys. `pending` is not a saved photo and must not be counted as success.
3. Run read-only `jobs.inspect(eventId)` through a trusted operator script. It checks referenced objects only, not every unreferenced bucket object.
4. If full photo exists and thumbnail is missing, queue `thumbnail-repair` with the media ID. Do not expose the full image in the grid as a fallback.
5. Inspect the job result; compare gallery count and both variants. A missing full file requires backup recovery, not a fabricated success row.
6. Do not run legacy MVP migration scripts or bulk-delete unknown objects. A bucket-wide orphan sweep requires a separate inventory, age cutoff and approval.

## Export failed

1. Check the failed job and whether photos changed after its snapshot. A deliberately removed photo can invalidate an old snapshot.
2. Retry a transient failure from Exports or Operations. Do not reset storage counts or payment state.
3. If the photo set changed, request a new export and compare its manifest to current uploaded IDs.
4. Download prepared parts before their expiry. Each part includes a manifest; count unique IDs across all parts.
5. A terminated worker can reclaim the expired lease. If repeatedly failing, stop automatic restarts, retain logs and inspect memory/R2 errors.

## Accidental archive or deletion

Archive is reversible before retention; Restore returns the collection without enabling guest sharing. Permanent delete is confirmed separately and revokes access immediately. It is not an archive. Stop cleanup promptly if an operator investigates an accidental permanent deletion, but do not promise recovery after objects have been removed.

## Privacy / account erasure request

1. Verify account ownership without asking for passwords. Record request ID and legal deadline under the actual operator policy.
2. Explain photo removal, shared-link revocation, active subscription cancellation and any records that must be retained for accounting.
3. Offer an export where appropriate. Resolve billing in the provider before irreversible identity deletion.
4. Disable shares, revoke sessions, queue photo/cover/export cleanup and verify completion for every owned event.
5. Delete Supabase Auth identity only in the isolated target project after the approved process. Anonymize profile/support fields according to the approved retention schedule; retain only necessary audit/billing records.
6. Record completion and backup-expiry schedule. The current customer-facing function records a reviewed request; it does not pretend this whole process is automatic.

## Refund and billing discrepancy

1. Find the customer, order, provider checkout/subscription and support request. Do not identify accounts by a name alone.
2. Reconcile the canonical Stripe subscription using the admin-only endpoint. Never grant plans from a redirect or a screenshot of payment.
3. Check the approved refund policy and mandatory rights. Operator authorization is required for each real monetary refund.
4. Perform a test refund first in sandbox. Record provider refund ID and outcome; a request is not proof of completed refund.
5. Decide cancellation/entitlement effects explicitly; never erase photos immediately because payment failed. Current published event retention is a separate granted entitlement.
6. No live refund is performed by this code/task. Do not use real API keys to test it.

## Backup and restore drill

1. Select an approved retention/encryption location and name the recovery point. Back up ONLY isolated staging first.
2. Pause writes and workers for the first consistent drill, or use a documented point-in-time DB/object snapshot procedure.
3. Export PostgreSQL using `pg_dump` custom format with the new server credentials. Store credentials separately from the dump.
4. Inventory R2 object keys, byte sizes and SHA-256 hashes, including covers and prepared exports; copy objects to the approved backup destination. A DB dump alone contains no photos.
5. Provision an EMPTY isolated restore database/bucket. Do not restore over MVP or the source. Use `pg_restore` and copy objects preserving keys.
6. Apply the matching code/schema version, configure the restored bucket, and invalidate restored sessions/tokens.
7. Verify event/media counts, every test-object checksum, representative guest revocation and a complete ZIP manifest. Record actual recovery time and missing-data window.
8. Only after evidence is recorded may the backup process be treated as tested. No cloud restore drill was performed during local development.

## Incident / rollback

1. Identify scope and severity, disable new purchases/sharing/uploads as appropriate, preserve evidence and avoid exposing customer data in logs.
2. Inspect request IDs, failed jobs, provider health and recent configuration changes. Do not assume retry fixes a data-integrity issue.
3. Roll back API and worker together to a verified version compatible with the current schema. Prefer forward fixes for additive migrations.
4. Do not reverse destructive migrations without a verified backup and explicit operator approval.
5. Rotate only compromised secrets; session-key rotation invalidates sessions. R2 credentials are backend-only and bucket-scoped.
6. Notify affected users/regulators when required by the approved incident policy and legal advice. No compliance deadlines are invented here.

## Minimum monitoring before sales

- External synthetic health and one harmless authenticated request.
- Oldest queued job, failed jobs, cleanup age, expired retention still holding objects, and failed mail deliveries.
- Successful finalized uploads versus reservations, retry/timeouts, upload duration percentiles, export count/duration/failure.
- R2 bytes and Class A/B operations, API transfer/CPU/memory, DB/Auth operations, email costs and payment fees.
- Budget alerts and a human contact. In-app counters alone are not an incident alerting service.
