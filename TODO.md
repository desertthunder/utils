# TODO

## Gitignore template bundling

Gitignore templates are bundled at build time. Do not fetch GitHub or Toptal
from the Worker during normal requests. Runtime fetching adds latency,
rate-limit risk, and non-reproducible responses.

Generated structure:

```text
data/
  ignores/
    github/
      raw/
      index.json
    toptal/
      raw/
      index.json
    catalog.json
```

Refresh upstream data with:

```sh
deno task sync:ignores
```

The sync task:

1. Fetches upstream template data from GitHub and Toptal.
2. Stores raw templates in `data/ignores/{source}/raw`.
3. Generates a compact catalog with:
   - source
   - name
   - aliases
   - path
   - content hash
4. Generates importable data for the Worker.

The Worker imports generated files so deployments are deterministic.

## Response structure

Ignore content endpoints should return plaintext by default. The API should be
pleasant to use from `curl`, shell scripts, and editor integrations without
requiring JSON parsing.

Use `fmt=json` for structured responses with metadata:

```text
GET /ignores/github:node
GET /ignores/github:node?fmt=json
GET /ignores/merge?templates=github:node,toptal:deno,github:global-macos
GET /ignores/merge?templates=github:node,toptal:deno,github:global-macos&fmt=json
```

Plaintext response:

```text
node_modules/
dist/
.env
```

JSON response:

```json
{
  "meta": {
    "service": "utility-api",
    "version": "0.1.0",
    "docs": "/",
    "timestamp": "2026-06-02T00:00:00.000Z",
    "requestId": "..."
  },
  "content": {
    "type": "gitignore",
    "format": "text/plain",
    "templates": ["github:node", "github:macos"],
    "options": { "comments": "keep", "dupes": "remove", "header": "keep" },
    "body": "node_modules/\n.DS_Store\n"
  }
}
```

Use `content` rather than `data` for endpoints whose main result is a document
or file-like body. Keep error responses JSON-only with the existing metadata
wrapper.

## Credits

Add visible credits to the docs page:

- API home: <https://api.desertthunder.dev>
- Source: <https://github.com/desertthunder/utils>
- GitHub gitignore templates: <https://github.com/github/gitignore>
- Toptal gitignore generator: <https://www.toptal.com/developers/gitignore>
- GitHub Choose a License: <https://github.com/github/choosealicense.com>

## License templates

License fetching is implemented as a separate endpoint family. It uses the same
response model as gitignores: plaintext by default, JSON with `fmt=json`.

Upstream source is GitHub's Choose a License data:

```text
https://github.com/github/choosealicense.com
```

GitHub also exposes API endpoints, but vendoring from the data repository is
better for deterministic deploys:

```text
https://api.github.com/licenses
https://api.github.com/licenses/mit
```

Proposed generated structure:

```text
data/
  licenses/
    github/
      raw/
      index.json
    catalog.json
```

The license sync task reads the Choose a License markdown/front matter and
stores:

- key, such as `mit` or `apache-2.0`
- SPDX ID
- display name
- source URL
- permissions, conditions, and limitations when available
- body text
- content hash

Implemented:

```text
GET /licenses
GET /licenses/:license
GET /licenses/:license?fmt=json
```

The `:license` parameter matches SPDX identifiers case-insensitively. The
lowercase Choose a License key is accepted as a fallback when it differs.

Plaintext default:

```text
MIT License

Copyright (c) <year> <name>

...
```

JSON response:

```json
{
  "meta": {},
  "content": {
    "type": "license",
    "format": "text/plain",
    "key": "mit",
    "spdxId": "MIT",
    "name": "MIT License",
    "source": "github:choosealicense",
    "body": "MIT License\n\n..."
  }
}
```

Placeholder replacement is supported:

```text
GET /licenses/mit?year=2026&name=Owais
```

Placeholders stay intact unless the caller provides values. Do not guess the
author or year.

## Ignore endpoints

Implemented:

```text
GET /ignores
GET /ignores/:template
GET /ignores/merge?templates=github:node,toptal:deno,github:global-macos
```

Consider a POST endpoint once merge options grow:

```text
POST /ignores/merge
```

Example body:

```json
{
  "templates": ["github:node", "toptal:deno", "github:global-macos"],
  "source": "all",
  "comments": "prune",
  "dupes": "remove"
}
```

## Merge options

Support these query/body options first:

```text
source=github|toptal|all
comments=keep|prune
dupes=keep|remove
header=keep|none
```

Recommended defaults:

```text
source=all
comments=keep
dupes=remove
header=keep
```

## Merge behavior

Preserve template order from the request. Gitignore negation makes order
meaningful, so do not alphabetize merged content.

When removing duplicates, only remove exact normalized-line duplicates.
Normalize by trimming surrounding whitespace and ignoring blank lines.
Do not rewrite path semantics.

These lines should stay distinct:

```gitignore
dist
/dist
dist/
```

When `comments=prune`, remove lines where the trimmed line starts with `#`.
Collapse repeated blank lines and trim the final output.

When headers are enabled and comments are kept, add source headers:

```gitignore
# --- github: Node ---
node_modules/
npm-debug.log*

# --- github: macOS ---
.DS_Store
.AppleDouble
```

If `comments=prune`, skip headers too.

## Build-time search

Add MiniSearch later for human-friendly catalogue search. Keep exact template
resolution separate from fuzzy search so script endpoints stay deterministic.

Possible endpoints:

```text
GET /ignores/search?q=node
GET /licenses/search?q=apache
```

Generate the searchable documents during sync, then build a MiniSearch index in
the Worker from vendored data. Search fields should start with name, aliases,
source, and description when available.

## Name collisions

Support qualified template names:

```text
github:node
toptal:node
node
```

For unqualified names:

1. If exactly one template matches, use it.
2. If multiple templates match and contents are identical, use one.
3. If multiple templates differ, return `409` with the available choices unless
   `source=` disambiguates the request.

## Local development

Local development should use the vendored generated data by default. That keeps
local responses identical to production responses.

Use explicit sync commands when refreshing upstream data:

```sh
deno task sync:ignores
```

Do not fetch upstream templates on every local request. That makes basic local
development depend on network access and can hide bugs that only happen with the
bundled production data.

A useful local-only escape hatch may be added later:

```sh
IGNORE_SYNC_MODE=remote deno task dev
```

If implemented, that mode should be opt-in and should still write fetched data
through the same normalization and catalog generation path. It should not create
a separate runtime code path for merging templates.

## User configuration

Add a project config file so other users can fork or clone this project and make
it their own without editing route/page internals.

Possible file:

```text
utility.config.ts
```

Initial config shape:

```ts
export default {
  service: {
    name: "utility-api",
    title: "Owais's Utility API",
    version: "0.1.0",
    docs: "/",
  },
  owner: {
    name: "Owais",
    site: "https://desertthunder.dev",
    email: "me@desertthunder.dev",
    bluesky: "https://bsky.app/profile/desertthunder.dev/",
  },
  project: {
    apiUrl: "https://api.desertthunder.dev",
    sourceUrl: "https://github.com/desertthunder/utils",
  },
  theme: { accent: "#33b1ff", background: "#161616" },
} as const;
```

Use this config for:

- JSON response metadata
- docs page title and description
- footer links
- theme color metadata
- generated examples

Keep endpoint behavior independent from branding config.
