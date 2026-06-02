import { Hono } from "hono";
import { ignoreIndex, ignoreMerge, ignoreTemplate } from "./ignores.ts";
import { docsPage, healthPage } from "./pages.tsx";
import { contentJson, json, service } from "./response.ts";

const app = new Hono();

app.get("/", (ctx) => ctx.html(docsPage()));

app.get("/healthz", (ctx) => {
  if (ctx.req.query("fmt") === "json") {
    return json(ctx, { ok: true, status: "healthy", service: service.name });
  }

  return ctx.html(healthPage());
});

app.get("/ignores", ignoreIndex);
app.get("/ignores/merge", ignoreMerge);
app.get("/ignores/:template", ignoreTemplate);

app.get("/licenses", (ctx) => {
  const content = {
    type: "license-index",
    format: "text/plain",
    status: "placeholder",
    body: "License templates will be bundled from GitHub's Choose a License data.\n",
    sources: ["https://github.com/github/choosealicense.com"],
  };

  if (ctx.req.query("fmt") === "json") {
    return contentJson(ctx, content);
  }

  return ctx.text(content.body);
});

app.notFound((ctx) => json(ctx, { error: "not_found", message: "No route matched this request." }, 404));

app.onError((err, ctx) => {
  console.error(JSON.stringify({ level: "error", message: err.message, stack: err.stack }));
  return json(ctx, { error: "internal_server_error", message: "The worker hit an unexpected error." }, 500);
});

export default app;
