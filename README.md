# utility-api

A Hono TypeScript API built with Deno and deployed as a Cloudflare Worker.

## Routes

| Route                    | Description                              |
| ------------------------ | ---------------------------------------- |
| `GET /`                  | Docs page.                               |
| `GET /healthz`           | HTML health check page.                  |
| `GET /healthz?fmt=json`  | JSON health check.                       |
| `GET /ignores`           | Bundled gitignore template index.        |
| `GET /ignores/:template` | Gitignore template as plaintext or JSON. |
| `GET /ignores/merge`     | Merge gitignore templates.               |
| `GET /licenses`          | Bundled license template index.          |
| `GET /licenses/:license` | License by SPDX identifier.              |

## Structured responses

Structured endpoints support `?fmt=json` and `?fmt=xml`. They return metadata
with the API version, docs URL, timestamp, and request ID. Document-like
endpoints use `content`; other structured endpoints use `data`.

```json
{
  "meta": {
    "service": "utility-api",
    "version": "0.1.0",
    "docs": "/",
    "timestamp": "2026-06-02T00:00:00.000Z",
    "requestId": "..."
  },
  "content": {}
}
```

## Development

Run the worker locally:

```sh
deno task dev
```

Refresh bundled templates:

```sh
deno task sync:ignores
deno task sync:licenses
```

Check TypeScript and formatting:

```sh
deno task check
deno task fmt:check
```

Format the project with dprint:

```sh
deno task fmt
```

Generate Cloudflare binding types after changing `wrangler.jsonc`:

```sh
deno task types
```

The docs page uses vendored Fontsource files from `public/assets/fonts`: IBM
Plex Sans comes from `@fontsource-variable/ibm-plex-sans`, and IBM Plex Serif
uses static Fontsource files because Fontsource does not publish an IBM Plex
Serif variable package. The stylesheet lives at `public/assets/styles.css` and
uses Oxocarbon-inspired colors.
