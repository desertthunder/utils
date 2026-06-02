/** @jsxImportSource hono/jsx */
import type { Child } from "hono/jsx";
import { renderToString } from "hono/jsx/dom/server";
import { service } from "./response.ts";

type LayoutProps = { title: string; description: string; children: Child; };

export function docsPage(): string {
  return renderDocument(
    <Layout title="Owais's Utility API" description="Small utility endpoints for tools and scripts.">
      <header class="hero flow">
        <p class="eyebrow">{service.name}</p>
        <h1>Owais's Utility API</h1>
        <p class="lede">
          Small HTTP utilities for scripts, editors, and local development. The first endpoints will serve gitignore and
          license templates.
        </p>
        <div class="hero-actions" aria-label="Primary routes">
          <a class="button" href="/healthz">Check health</a>
          <a class="button button-secondary" href="/ignores">View gitignore placeholder</a>
        </div>
      </header>

      <main class="flow">
        <section class="panel flow" aria-labelledby="routes-title">
          <h2 id="routes-title">Routes</h2>
          <div class="route-list">
            <RouteCard method="GET" path="/">This docs page.</RouteCard>
            <RouteCard method="GET" path="/healthz">
              Health check page. Add <code>?fmt=json</code> for JSON.
            </RouteCard>
            <RouteCard method="GET" path="/ignores">Placeholder for gitignore templates.</RouteCard>
            <RouteCard method="GET" path="/licenses">Placeholder for license templates.</RouteCard>
          </div>
        </section>

        <section class="panel flow" aria-labelledby="json-title">
          <h2 id="json-title">Response Structure</h2>
          <p>JSON endpoints return a metadata wrapper with the API version, docs URL, timestamp, and request ID.</p>
          <pre><code>{jsonExample()}</code></pre>
        </section>

        <section class="panel flow" aria-labelledby="credits-title">
          <h2 id="credits-title">Credits</h2>
          <p>
            Gitignore templates will be bundled from{" "}
            <a href="https://github.com/github/gitignore">GitHub's gitignore repository</a> and{" "}
            <a href="https://www.toptal.com/developers/gitignore">Toptal's gitignore generator</a>.{" "}
            License templates will be bundled from{" "}
            <a href="https://github.com/github/choosealicense.com">GitHub's Choose a License data</a>.
          </p>
        </section>
      </main>

      <footer class="site-footer" aria-label="Project links">
        <FooterLink icon="cloud" label="API" href="https://api.desertthunder.dev">api.desertthunder.dev</FooterLink>
        <FooterLink icon="github" label="Source" href="https://github.com/desertthunder/utils">
          github.com/desertthunder/utils
        </FooterLink>
        <FooterLink icon="globe" label="Site" href="https://desertthunder.dev">desertthunder.dev</FooterLink>
        <FooterLink icon="bluesky" label="Bluesky" href="https://bsky.app/profile/desertthunder.dev/">
          @desertthunder.dev
        </FooterLink>
        <FooterLink icon="envelope" label="Email" href="mailto:me@desertthunder.dev">me@desertthunder.dev</FooterLink>
      </footer>
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
        <meta name="theme-color" content="#161616" />
        <title>{title}</title>
        <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
        <link rel="stylesheet" href="/assets/styles.css" />
      </head>
      <body>
        <div class="site-shell">{children}</div>
      </body>
    </html>
  );
}

function FooterLink({ icon, label, href, children }: { icon: string; label: string; href: string; children: Child; }) {
  return (
    <a class="footer-link" href={href}>
      <span class={`footer-icon footer-icon-${icon}`} aria-hidden="true"></span>
      <span>
        <span class="footer-label">{label}</span>
        <span class="footer-name">{children}</span>
      </span>
    </a>
  );
}

function RouteCard({ method, path, children }: { method: string; path: string; children: Child; }) {
  return (
    <a class="route-card" href={path}>
      <span>
        <span class="method">{method}</span>
        <span class="route-path">
          <code>{path}</code>
        </span>
      </span>
      <span class="route-description">{children}</span>
    </a>
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
  const content = {
    type: "gitignore",
    format: "text/plain",
    templates: ["github:node"],
    body: "node_modules/\ndist/\n.env\n",
  };
  return JSON.stringify({ meta, content }, null, 2);
}
