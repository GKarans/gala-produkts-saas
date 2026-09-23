const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});

function logStartupFailure(error) {
  const detail = String(error?.message || "")
    .replace(/postgres(?:ql)?:\/\/\S+/gi, "postgres://[redacted]")
    .replace(/https?:\/\/\S+/gi, "[url]")
    .replace(/\b[a-f0-9]{48,}\b/gi, "[redacted]")
    .slice(0, 180);
  console.error(JSON.stringify({
    component: "worker-startup",
    error: typeof error?.code === "string" && /^[A-Z0-9_]+$/.test(error.code) ? error.code : typeof error?.cause?.code === "string" ? error.cause.code : error?.name || "Error",
    detail,
    status: Number.isInteger(error?.status) ? error.status : undefined
  }));
}

async function withApp(getApp, env, action) {
  const app = await getApp(env);
  try {
    return await action(app);
  } finally {
    await app.db.close();
  }
}

export function createWorkerHandler(getApp) {
  return {
    async fetch(request, env) {
      const url = new URL(request.url);

      if (url.pathname === "/healthz") {
        try {
          return await withApp(getApp, env, async app => {
            await app.db.query("select 1 as ready");
            return json({status: "ok", service: "lumiq-cam", database: "ready", storage: "bound"});
          });
        } catch (error) {
          logStartupFailure(error);
          return json({status: "unavailable", service: "lumiq-cam", database: "unavailable"}, 503);
        }
      }

      if (url.pathname.startsWith("/api/")) {
        try {
          return await withApp(getApp, env, app => app.handle(request, {clientId: request.headers.get("cf-connecting-ip") || "unknown"}));
        } catch (error) {
          logStartupFailure(error);
          return json({error: "Lumiq backend is temporarily unavailable."}, 503);
        }
      }

      return env.ASSETS.fetch(request);
    }
  };
}
