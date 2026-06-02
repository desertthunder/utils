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

export function requestId(c: Context): string {
  return c.req.header("cf-ray") ?? crypto.randomUUID();
}

export function withMeta<T extends JsonPayload>(c: Context, data: T): JsonEnvelope<T> {
  return {
    meta: {
      service: service.name,
      version: service.version,
      docs: service.docs,
      timestamp: new Date().toISOString(),
      requestId: requestId(c),
    },
    data,
  };
}

export function json<T extends JsonPayload>(c: Context, data: T, status: ContentfulStatusCode = 200) {
  return c.json(withMeta(c, data), status);
}
