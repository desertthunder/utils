import { Hono } from "hono";
import { docsPage, healthPage } from "./pages.tsx";
import { contentJson, json, service } from "./response.ts";

const app = new Hono();

app.get("/", (ctx) => ctx.html(docsPage()));

app.get("/healthz", (c) => {
  if (c.req.query("fmt") === "json") {
    return json(c, { ok: true, status: "healthy", service: service.name });
  }

  return c.html(healthPage());
});

app.get("/ignores", (c) => {
  const content = {
    type: "gitignore-index",
    format: "text/plain",
    status: "placeholder",
    body: "Gitignore templates will be bundled from GitHub and Toptal.\n",
    sources: ["https://github.com/github/gitignore", "https://www.toptal.com/developers/gitignore"],
  };

  if (c.req.query("fmt") === "json") {
    return contentJson(c, content);
  }

  return c.text(content.body);
});

app.get("/licenses", (c) => {
  const content = {
    type: "license-index",
    format: "text/plain",
    status: "placeholder",
    body: "License templates will be bundled from GitHub's Choose a License data.\n",
    sources: ["https://github.com/github/choosealicense.com"],
  };

  if (c.req.query("fmt") === "json") {
    return contentJson(c, content);
  }

  return c.text(content.body);
});

app.notFound((ctx) => json(ctx, { error: "not_found", message: "No route matched this request." }, 404));

app.onError((err, ctx) => {
  console.error(JSON.stringify({ level: "error", message: err.message, stack: err.stack }));
  return json(ctx, { error: "internal_server_error", message: "The worker hit an unexpected error." }, 500);
});

export default app;
