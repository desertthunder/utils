import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export const service = { name: "utility-api", version: "0.1.0", docs: "/" } as const;

type JsonPayload = Record<string, unknown> | unknown[] | string | number | boolean | null;

export type JsonMeta = {
  service: typeof service.name;
  version: typeof service.version;
  docs: typeof service.docs;
  timestamp: string;
  requestId: string;
};

export type JsonEnvelope<T extends JsonPayload> = { meta: JsonMeta; data: T; };
export type ContentEnvelope<T extends JsonPayload> = { meta: JsonMeta; content: T; };

export function requestId(c: Context): string {
  return c.req.header("cf-ray") ?? crypto.randomUUID();
}

export function meta(c: Context): JsonMeta {
  return {
    service: service.name,
    version: service.version,
    docs: service.docs,
    timestamp: new Date().toISOString(),
    requestId: requestId(c),
  };
}

export function withMeta<T extends JsonPayload>(c: Context, data: T): JsonEnvelope<T> {
  return { meta: meta(c), data };
}

export function withContent<T extends JsonPayload>(c: Context, content: T): ContentEnvelope<T> {
  return { meta: meta(c), content };
}

export function json<T extends JsonPayload>(c: Context, data: T, status: ContentfulStatusCode = 200) {
  return c.json(withMeta(c, data), status);
}

export function contentJson<T extends JsonPayload>(c: Context, content: T, status: ContentfulStatusCode = 200) {
  return c.json(withContent(c, content), status);
}

export function xml<T extends JsonPayload>(c: Context, data: T, status: ContentfulStatusCode = 200) {
  return xmlResponse(c, withMeta(c, data), status);
}

export function contentXml<T extends JsonPayload>(c: Context, content: T, status: ContentfulStatusCode = 200) {
  return xmlResponse(c, withContent(c, content), status);
}

export function wantsJson(c: Context): boolean {
  return c.req.query("fmt") === "json";
}

export function wantsXml(c: Context): boolean {
  return c.req.query("fmt") === "xml";
}

function xmlResponse<T extends JsonPayload>(
  c: Context,
  payload: JsonEnvelope<T> | ContentEnvelope<T>,
  status: ContentfulStatusCode,
) {
  return c.body(toXml("response", payload), status, { "Content-Type": "application/xml; charset=utf-8" });
}

function toXml(name: string, value: unknown): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet type="text/xsl" href="/assets/xml-response.xsl"?>\n${
    nodeToXml(name, value)
  }\n`;
}

function nodeToXml(name: string, value: unknown): string {
  if (Array.isArray(value)) {
    return `<${name}>${value.map((item) => nodeToXml("item", item)).join("")}</${name}>`;
  }

  if (value && typeof value === "object") {
    const children = Object.entries(value).map(([key, child]) => nodeToXml(key, child)).join("");
    return `<${name}>${children}</${name}>`;
  }

  if (value === null || value === undefined) return `<${name}/>`;
  return `<${name}>${escapeXml(String(value))}</${name}>`;
}

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;");
}
