import { Hono } from "hono";
import { healthPayload } from "./health.ts";
import { ignoreIndex, ignoreMerge, ignoreTemplate } from "./ignores.ts";
import { licenseIndex, licenseTemplate } from "./licenses.ts";
import { docsPage, healthPage } from "./pages.tsx";
import { json, wantsJson, wantsXml, xml } from "./response.ts";

const app = new Hono();

app.get("/", (ctx) => ctx.html(docsPage()));

app.get("/healthz", (ctx) => {
  const health = healthPayload();

  if (wantsJson(ctx)) return json(ctx, health);
  if (wantsXml(ctx)) return xml(ctx, health);

  return ctx.html(healthPage(health));
});

app.get("/ignores", ignoreIndex);
app.get("/ignores/merge", ignoreMerge);
app.get("/ignores/:template", ignoreTemplate);

app.get("/licenses", licenseIndex);
app.get("/licenses/:license", licenseTemplate);

app.notFound((ctx) => json(ctx, { error: "not_found", message: "No route matched this request." }, 404));

app.onError((err, ctx) => {
  console.error(JSON.stringify({ level: "error", message: err.message, stack: err.stack }));
  return json(ctx, { error: "internal_server_error", message: "The worker hit an unexpected error." }, 500);
});

export default app;
