import test from "node:test";
import assert from "node:assert/strict";
import {validateProductionConfig, validateRemoteHyperdriveProject} from "../scripts/production-preflight.mjs";

const staging = {
  name: "lumiq-cam",
  hyperdrive: [{binding: "HYPERDRIVE", id: "96846aaf46fd470e96f0313b09e1d01a"}],
  r2_buckets: [{binding: "R2_PHOTOS", bucket_name: "lumiq-staging-photos"}]
};

function candidate() {
  return {
    name: "lumiq-production-candidate",
    workers_dev: true,
    preview_urls: false,
    vars: {
      PLATFORM_MODE: "production",
      PLATFORM_RELEASE_APPROVED: "production",
      PLATFORM_ORIGIN: "https://lumiq-production-candidate.example.workers.dev",
      PLATFORM_SUPABASE_URL: "https://prodproject123.supabase.co",
      PLATFORM_SUPABASE_PROJECT_REF: "prodproject123",
      PLATFORM_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic_test_key",
      R2_BUDGET_ENABLED: "true",
      R2_MAX_CLASS_A_OPS_MONTH: "10000",
      R2_MAX_CLASS_B_OPS_MONTH: "100000",
      R2_MAX_LIFETIME_WRITE_BYTES: "2147483648",
      R2_MAX_STREAM_WRITE_BYTES: "73400320",
      LUMIQ_JOBS_DLQ_NAME: "lumiq-production-jobs-dlq"
    },
    hyperdrive: [{binding: "HYPERDRIVE", id: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}],
    r2_buckets: [{binding: "R2_PHOTOS", bucket_name: "lumiq-production-photos"}],
    queues: {
      producers: [{binding: "LUMIQ_JOBS_QUEUE", queue: "lumiq-production-jobs"}],
      consumers: [{queue: "lumiq-production-jobs", dead_letter_queue: "lumiq-production-jobs-dlq"}]
    }
  };
}

const testHyperdriveId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

test("production preflight accepts isolated candidate with budget and queue recovery", () => {
  const result = validateProductionConfig(candidate(), staging, testHyperdriveId);
  assert.equal(result.worker, "lumiq-production-candidate");
  assert.equal(result.bucket, "lumiq-production-photos");
  assert.equal(result.queue, "lumiq-production-jobs");
});

test("production preflight rejects shared DB, bucket, domain and missing budget or DLQ", () => {
  const sharedDb = candidate();
  sharedDb.hyperdrive[0].id = staging.hyperdrive[0].id;
  assert.throws(() => validateProductionConfig(sharedDb, staging, testHyperdriveId), /must not reuse/);

  const testDb = candidate();
  testDb.hyperdrive[0].id = testHyperdriveId;
  assert.throws(() => validateProductionConfig(testDb, staging, testHyperdriveId), /must not reuse/);

  const sharedBucket = candidate();
  sharedBucket.r2_buckets[0].bucket_name = "lumiq-staging-photos";
  assert.throws(() => validateProductionConfig(sharedBucket, staging, testHyperdriveId), /production-\*/);

  const customDomain = candidate();
  customDomain.routes = [{pattern: "lumiq.cam", custom_domain: true}];
  assert.throws(() => validateProductionConfig(customDomain, staging, testHyperdriveId), /must not claim/);

  const noBudget = candidate();
  noBudget.vars.R2_BUDGET_ENABLED = "false";
  assert.throws(() => validateProductionConfig(noBudget, staging, testHyperdriveId), /hard stop/);

  const noDlq = candidate();
  noDlq.queues.consumers[0].dead_letter_queue = undefined;
  assert.throws(() => validateProductionConfig(noDlq, staging, testHyperdriveId), /DLQ/);
});

test("production preflight rejects unsafe public variables and disabled preview protection", () => {
  const wrongDbProject = candidate();
  wrongDbProject.vars.PLATFORM_SUPABASE_PROJECT_REF = "otherproject123";
  assert.throws(() => validateProductionConfig(wrongDbProject, staging, testHyperdriveId), /project reference must match/);

  const secretInVars = candidate();
  secretInVars.vars.PLATFORM_SESSION_ENCRYPTION_KEY = "must-not-be-inline";
  assert.throws(() => validateProductionConfig(secretInVars, staging, testHyperdriveId), /secret bindings/);

  const databaseUrlInVars = candidate();
  databaseUrlInVars.vars.PLATFORM_DATABASE_URL = "postgres://must-not-be-inline";
  assert.throws(() => validateProductionConfig(databaseUrlInVars, staging, testHyperdriveId), /secret bindings/);

  const previews = candidate();
  previews.preview_urls = true;
  assert.throws(() => validateProductionConfig(previews, staging, testHyperdriveId), /preview URLs disabled/);

  const otherWorkersOrigin = candidate();
  otherWorkersOrigin.vars.PLATFORM_ORIGIN = "https://another-worker.example.workers.dev";
  assert.throws(() => validateProductionConfig(otherWorkersOrigin, staging, testHyperdriveId), /own bare HTTPS/);

  const environmentOverride = candidate();
  environmentOverride.env = {production: {vars: {PLATFORM_MODE: "production"}}};
  assert.throws(() => validateProductionConfig(environmentOverride, staging, testHyperdriveId), /Named Wrangler environments/);

  const extraService = candidate();
  extraService.services = [{binding: "STAGING_WORKER", service: "lumiq-cam"}];
  assert.throws(() => validateProductionConfig(extraService, staging, testHyperdriveId), /Unexpected services/);
});

test("remote Hyperdrive identity must match the isolated Supabase project", () => {
  const id = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const expected = "prodproject123";
  const remote = {
    id,
    origin: {
      host: "aws-0-eu-central-1.pooler.supabase.com",
      user: `lumiq_runtime.${expected}`
    }
  };
  assert.deepEqual(validateRemoteHyperdriveProject(remote, id, expected), {
    id,
    host: "aws-0-eu-central-1.pooler.supabase.com",
    projectRef: expected
  });
  assert.throws(() => validateRemoteHyperdriveProject(remote, id, "anotherproject"), /does not match/);
  assert.throws(() => validateRemoteHyperdriveProject({...remote, id: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"}, id, expected), /ID does not match/);
  assert.deepEqual(validateRemoteHyperdriveProject({id, origin: {host: "db.prodproject123.supabase.co", user: "postgres"}}, id, expected), {
    id,
    host: "db.prodproject123.supabase.co",
    projectRef: expected
  });
});
