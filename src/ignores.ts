import type { Context } from "hono";
import { ignoreTemplates } from "./generated/ignores.ts";
import { contentJson, contentXml, json, wantsJson, wantsXml } from "./response.ts";

type Source = "github" | "toptal";
type SourceFilter = Source | "all";
type CommentsOption = "keep" | "prune";
type DupesOption = "keep" | "remove";
type HeaderOption = "keep" | "none";
type IgnoreTemplate = (typeof ignoreTemplates)[number];

type MergeOptions = { source: SourceFilter; comments: CommentsOption; dupes: DupesOption; header: HeaderOption; };

const sources = ["github", "toptal"] as const;

export function ignoreIndex(c: Context) {
  const summaries = ignoreTemplates.map(templateSummary);
  const body = summaries.map((template) => `${template.id}\t${template.name}`).join("\n") + "\n";

  const content = {
    type: "gitignore-index",
    format: "application/json",
    count: summaries.length,
    templates: summaries,
  };

  if (wantsJson(c)) return contentJson(c, content);
  if (wantsXml(c)) return contentXml(c, content);

  return c.text(body);
}

export function ignoreTemplate(c: Context) {
  const name = c.req.param("template") ?? "";
  const source = parseSource(c.req.query("source") ?? "all");
  if (!source) return optionError(c, "source", "github|toptal|all");

  const resolved = resolveTemplate(name, source);
  if (resolved.error) return resolutionError(c, resolved.error, resolved.matches);

  const template = resolved.template;
  const content = {
    type: "gitignore",
    format: "text/plain",
    templates: [template.id],
    options: { source },
    body: template.body,
  };

  if (wantsJson(c)) return contentJson(c, content);
  if (wantsXml(c)) return contentXml(c, content);
  return c.text(template.body);
}

export function ignoreMerge(c: Context) {
  const rawTemplates = c.req.query("templates");
  if (!rawTemplates) {
    return json(c, { error: "bad_request", message: "Missing templates query parameter." }, 400);
  }

  const options = parseMergeOptions(c);
  if (options.error) return optionError(c, options.error.name, options.error.expected);

  const templates: IgnoreTemplate[] = [];
  for (const name of rawTemplates.split(",").map((value) => value.trim()).filter(Boolean)) {
    const resolved = resolveTemplate(name, options.value.source);
    if (resolved.error) return resolutionError(c, resolved.error, resolved.matches);
    templates.push(resolved.template);
  }

  const body = mergeTemplates(templates, options.value);
  const content = {
    type: "gitignore",
    format: "text/plain",
    templates: templates.map((template) => template.id),
    options: options.value,
    body,
  };

  if (wantsJson(c)) return contentJson(c, content);
  if (wantsXml(c)) return contentXml(c, content);
  return c.text(body);
}

function parseMergeOptions(
  c: Context,
): { value: MergeOptions; error?: never; } | { value?: never; error: { name: string; expected: string; }; } {
  const source = parseSource(c.req.query("source") ?? "all");
  if (!source) return { error: { name: "source", expected: "github|toptal|all" } };

  const comments = parseEnum(c.req.query("comments") ?? "keep", ["keep", "prune"] as const);
  if (!comments) return { error: { name: "comments", expected: "keep|prune" } };

  const dupes = parseEnum(c.req.query("dupes") ?? "remove", ["keep", "remove"] as const);
  if (!dupes) return { error: { name: "dupes", expected: "keep|remove" } };

  const header = parseEnum(c.req.query("header") ?? "keep", ["keep", "none"] as const);
  if (!header) return { error: { name: "header", expected: "keep|none" } };

  return { value: { source, comments, dupes, header } };
}

function resolveTemplate(
  name: string,
  source: SourceFilter,
): { template: IgnoreTemplate; error?: never; matches?: never; } | {
  template?: never;
  error: "not_found" | "ambiguous";
  matches: IgnoreTemplate[];
} {
  const [qualifiedSource, rawName] = qualifiedName(name);
  const requestedSource = qualifiedSource ?? source;
  const key = normalizeKey(rawName);
  const matches = ignoreTemplates.filter((template) => {
    if (requestedSource !== "all" && template.source !== requestedSource) return false;
    const aliases: readonly string[] = template.aliases;
    return template.key === key || aliases.includes(key) || aliases.includes(rawName.toLowerCase());
  });

  if (matches.length === 0) return { error: "not_found", matches };
  if (matches.length === 1) return { template: matches[0] };

  const uniqueHashes = new Set(matches.map((match) => match.hash));
  if (uniqueHashes.size === 1) return { template: matches[0] };

  return { error: "ambiguous", matches };
}

function qualifiedName(name: string): [Source | undefined, string] {
  const [maybeSource, ...rest] = name.split(":");
  if (rest.length > 0 && isSource(maybeSource)) return [maybeSource, rest.join(":")];
  return [undefined, name];
}

function mergeTemplates(templates: IgnoreTemplate[], options: MergeOptions): string {
  const seen = new Set<string>();
  const sections: string[] = [];

  for (const template of templates) {
    const lines = template.body.split(/\r?\n/);
    const section: string[] = [];

    if (options.comments === "keep" && options.header === "keep") {
      section.push(`# --- ${template.id} (${template.name}) ---`);
    }

    for (const line of lines) {
      const trimmed = line.trim();
      if (options.comments === "prune" && trimmed.startsWith("#")) continue;

      if (options.dupes === "remove" && trimmed !== "") {
        if (seen.has(trimmed)) continue;
        seen.add(trimmed);
      }

      section.push(line);
    }

    sections.push(section.join("\n"));
  }

  let output = sections.join("\n\n");
  if (options.comments === "prune") output = output.replace(/\n{3,}/g, "\n\n");
  return output.trimEnd() + "\n";
}

function templateSummary(template: IgnoreTemplate) {
  return {
    id: template.id,
    source: template.source,
    key: template.key,
    name: template.name,
    aliases: template.aliases,
    hash: template.hash,
  };
}

function resolutionError(c: Context, error: "not_found" | "ambiguous", matches: IgnoreTemplate[]) {
  if (error === "not_found") {
    return json(c, { error: "not_found", message: "No gitignore template matched this request." }, 404);
  }

  return json(c, {
    error: "ambiguous_template",
    message: "Multiple gitignore templates matched this request. Use a qualified name or source parameter.",
    choices: matches.map(templateSummary),
  }, 409);
}

function optionError(c: Context, name: string, expected: string) {
  return json(c, { error: "bad_request", message: `Invalid ${name} option. Expected one of: ${expected}.` }, 400);
}

function parseSource(value: string): SourceFilter | undefined {
  if (value === "all" || isSource(value)) return value;
  return undefined;
}

function isSource(value: string): value is Source {
  return sources.includes(value as Source);
}

function parseEnum<const T extends readonly string[]>(value: string, allowed: T): T[number] | undefined {
  return allowed.includes(value) ? value as T[number] : undefined;
}

function normalizeKey(value: string): string {
  return value.replace(/\.gitignore$/i, "").trim().toLowerCase().replace(/\+/g, "plus").replace(/#/g, "sharp").replace(
    /[^a-z0-9]+/g,
    "-",
  ).replace(/^-+|-+$/g, "");
}
