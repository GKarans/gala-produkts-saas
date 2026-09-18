# Staging and production topology

## Decision

Use a managed Node web service and a separate background worker. `render.yaml` is the reproducible Render Blueprint. PostgreSQL remains in an isolated Supabase project, private media in an isolated R2 bucket, authentication in Supabase Auth, test payments in Stripe test mode, and transactional email in a dedicated SMTP provider.

The Blueprint is configuration only. Importing it can create paid Render resources, so the owner must review current prices and explicitly approve creation. Do not reuse MVP projects, buckets, credentials, domains, or OAuth clients.

## Staging setup

1. Create a new Supabase project and run `npm run migrate` with only its database URL loaded.
2. Create a private R2 bucket and bucket-scoped object read/write credentials. Configure CORS only for the exact staging origin.
3. Configure a Google OAuth web client with the Supabase callback URL and add the staging origin/redirect URL in Supabase Auth.
4. Create Stripe products and test-mode prices for Single, Gathering, and Studio. Add the staging webhook endpoint.
5. Configure a staging-only sender/domain in the email provider.
6. Import `render.yaml`, review paid plans, then enter every `sync: false` value as a secret.
7. Run `npm run migrate`, deploy the web service and worker, then execute `npm run check` locally and the staging smoke checklist in `TESTING.md`.

## Production gate

Production uses distinct services and secrets. A staging database dump restore, R2 restore drill, maximum-plan load run, independent security report, tax/legal approval, alert delivery drill, and paid pilot must all have dated evidence before `PLATFORM_RELEASE_APPROVED` may change from `staging`.

## GitHub protection

In repository Settings > Branches, protect `main`: require a pull request, require `verify` and `javascript` checks, dismiss stale approvals, require conversation resolution, block force pushes, and disallow bypass except an emergency administrator. Workflow files cannot enforce repository settings by themselves.
