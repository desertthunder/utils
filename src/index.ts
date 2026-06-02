import { Hono } from "hono";
import { docsPage, healthPage } from "./pages.tsx";
import { json, service } from "./response.ts";

const app = new Hono();

app.get("/", (ctx) => ctx.html(docsPage()));

app.get("/healthz", (c) => {
  if (c.req.query("fmt") === "json") {
    return json(c, { ok: true, status: "healthy", service: service.name });
  }

  return c.html(healthPage());
});

app.get(
  "/ignores",
  (c) =>
    json(c, {
      status: "placeholder",
      message: "Bundled gitignore templates will ship here.",
      sources: ["https://www.toptal.com/developers/gitignore", "https://github.com/github/gitignore"],
    }),
);

app.notFound((ctx) => json(ctx, { error: "not_found", message: "No route matched this request." }, 404));

app.onError((err, ctx) => {
  console.error(JSON.stringify({ level: "error", message: err.message, stack: err.stack }));
  return json(ctx, { error: "internal_server_error", message: "The worker hit an unexpected error." }, 500);
});

export default app;
