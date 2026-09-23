import process from "node:process";
import {createApp} from "../../../platform/server/app.mjs";
import {openDatabase} from "../../../platform/server/db.mjs";
import {createR2Storage} from "./r2-storage.js";
import {createWorkerHandler} from "./router.js";
import {validateWebp} from "./webp-validation.js";

const requiredEnvironment = [
  "PLATFORM_MODE",
  "PLATFORM_RELEASE_APPROVED",
  "PLATFORM_ORIGIN",
  "PLATFORM_SUPABASE_URL",
  "PLATFORM_SUPABASE_PUBLISHABLE_KEY",
  "PLATFORM_SESSION_ENCRYPTION_KEY"
];
const migrationVersions = ["001-platform", "002-delivery-leases", "003-publication-allowances", "004-account-profile", "005-gallery-curation", "006-r2-usage-guard"];
let migrationsVerified = false;
async function getApp(env) {
  for (const name of [...requiredEnvironment, "PLATFORM_EMAIL_KEY", "PLATFORM_EMAIL_FROM"]) {
    if (typeof env[name] === "string") process.env[name] = env[name];
  }
  if (!env.PLATFORM_ORIGIN || !env.HYPERDRIVE?.connectionString || !env.R2_PHOTOS) {
    throw new Error("Worker backend configuration is incomplete.");
  }
  const budgetEnabled = env.R2_BUDGET_ENABLED === "true";
  if (env.PLATFORM_MODE === "production" && !budgetEnabled) {
    throw new Error("Production requires the R2 usage hard stop.");
  }
  const db = await openDatabase({connection: env.HYPERDRIVE.connectionString, skipMigrations: true, maxConnections: 5, fetchTypes: false, ssl: false});
  try {
    if (!migrationsVerified) {
      const applied = new Set((await db.query("select version from platform_migrations")).rows.map(row => row.version));
      if (migrationVersions.some(version => !applied.has(version))) {
        throw new Error("Required database migrations are missing.");
      }
      migrationsVerified = true;
    }
    return await createApp({
      origin: env.PLATFORM_ORIGIN,
      local: false,
      db,
      files: createR2Storage(env.R2_PHOTOS, budgetEnabled ? {
        db,
        limits: {
          classAOpsPerMonth: env.R2_MAX_CLASS_A_OPS_MONTH,
          classBOpsPerMonth: env.R2_MAX_CLASS_B_OPS_MONTH,
          lifetimeWriteBytes: env.R2_MAX_LIFETIME_WRITE_BYTES,
          streamWriteBytes: env.R2_MAX_STREAM_WRITE_BYTES
        }
      } : {}),
      uploadsViaApi: true,
      validateImage: validateWebp
    });
  } catch (error) {
    await db.close();
    throw error;
  }
}

const handler = createWorkerHandler(getApp);

export default {
  ...handler,
  async scheduled(_controller, env, context) {
    if (!env.HYPERDRIVE?.connectionString) return;
    context.waitUntil((async () => {
      const app = await getApp(env);
      try {
        await app.jobs.tick();
        await app.jobs.retention();
        await app.deliverMail();
      } finally {
        await app.db.close();
      }
    })());
  }
};
