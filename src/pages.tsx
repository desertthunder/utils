/** @jsxImportSource hono/jsx */
import type { Child } from "hono/jsx";
import { renderToString } from "hono/jsx/dom/server";
import { service } from "./response.ts";

type LayoutProps = { title: string; description: string; children: Child; };

export function docsPage(): string {
  return renderDocument(
    <Layout title="Utility API" description="Small utility endpoints for tools and scripts.">
      <header class="hero flow">
        <p class="eyebrow">{service.name}</p>
        <h1>Utility endpoints for boring developer chores.</h1>
        <p class="lede">
          A Hono API on Cloudflare Workers. The first shipped endpoint will serve bundled gitignore templates from
          Toptal and GitHub.
        </p>
        <div class="hero-actions" aria-label="Primary routes">
          <a class="button" href="/healthz">Check health</a>
          <a class="button button-secondary" href="/ignores">View placeholder</a>
        </div>
      </header>

      <main class="flow">
        <section class="panel flow" aria-labelledby="routes-title">
          <h2 id="routes-title">Routes</h2>
          <div class="route-list">
            <RouteCard method="GET" path="/">Human-readable docs for the API.</RouteCard>
            <RouteCard method="GET" path="/healthz">
              Health check page. Add <code>?fmt=json</code> for JSON.
            </RouteCard>
            <RouteCard method="GET" path="/ignores">Placeholder for bundled gitignore templates.</RouteCard>
          </div>
        </section>

        <section class="panel flow" aria-labelledby="json-title">
          <h2 id="json-title">JSON shape</h2>
          <p>
            Every JSON response is wrapped with metadata so scripts can log the API version, docs URL, timestamp, and
            request ID.
          </p>
          <pre><code>{jsonExample()}</code></pre>
        </section>
      </main>
    </Layout>,
  );
}

export function healthPage(): string {
  return renderDocument(
    <Layout title="Health check" description="Health check for utility-api.">
      <main class="status-shell panel flow">
        <p class="eyebrow">{service.name}</p>
        <h1>Healthy</h1>
        <p class="lede">The worker is responding.</p>
        <p>
          <a href="/healthz?fmt=json">JSON health check</a>
        </p>
      </main>
    </Layout>,
  );
}

function Layout({ title, description, children }: LayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={description} />
        <title>{title}</title>
        <link rel="stylesheet" href="/assets/styles.css" />
      </head>
      <body>
        <div class="site-shell">{children}</div>
      </body>
    </html>
  );
}

function RouteCard({ method, path, children }: { method: string; path: string; children: Child; }) {
  return (
    <article class="route-card">
      <div>
        <p class="method">{method}</p>
        <h3>
          <code>{path}</code>
        </h3>
      </div>
      <p>{children}</p>
    </article>
  );
}

function renderDocument(page: Child): string {
  return `<!doctype html>${renderToString(page)}`;
}

function jsonExample() {
  const meta = {
    service: service.name,
    version: service.version,
    docs: service.docs,
    timestamp: "2026-06-02T00:00:00.000Z",
    requestId: "...",
  };
  return JSON.stringify({ meta, data: { ok: true } }, null, 2);
}
