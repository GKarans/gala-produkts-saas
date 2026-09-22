# Production observability

The web and worker emit JSON error records without credentials or photo content. Every API failure returns a request ID. `/healthz` verifies database readiness rather than process liveness alone. Terminal background-job failures and HTTP 5xx responses can notify an HTTPS webhook through `PLATFORM_ALERT_WEBHOOK`.

Before production, connect logs to the selected provider and configure alerts for: health check failures, 5xx rate, p95 latency, failed jobs, mail retry exhaustion, database connections, R2 error rate, upload/finalize mismatch, Stripe webhook failures, disk/memory/CPU, and retention cleanup backlog. Alert delivery must be tested to a real on-call destination and recorded. Public status must never expose internal diagnostics.
