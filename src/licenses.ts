import type { Context } from "hono";
import { licenseTemplates } from "./generated/licenses.ts";
import { contentJson, json } from "./response.ts";

type LicenseTemplate = (typeof licenseTemplates)[number];

export function licenseIndex(c: Context) {
  const licenses = licenseTemplates.map(licenseSummary);
  const body = licenses.map((license) => `${license.spdxId}\t${license.name}`).join("\n") + "\n";

  if (c.req.query("fmt") === "json") {
    return contentJson(c, { type: "license-index", format: "application/json", count: licenses.length, licenses });
  }

  return c.text(body);
}

export function licenseTemplate(c: Context) {
  const name = c.req.param("license") ?? "";
  const license = resolveLicense(name);

  if (!license) {
    return json(c, { error: "not_found", message: "No license matched this SPDX identifier." }, 404);
  }

  const body = applyPlaceholders(license.body, { year: c.req.query("year"), name: c.req.query("name") });

  const content = {
    type: "license",
    format: "text/plain",
    key: license.key,
    spdxId: license.spdxId,
    name: license.name,
    source: license.source,
    sourceUrl: license.sourceUrl,
    permissions: license.permissions,
    conditions: license.conditions,
    limitations: license.limitations,
    body,
  };

  if (c.req.query("fmt") === "json") return contentJson(c, content);
  return c.text(body);
}

function resolveLicense(name: string): LicenseTemplate | undefined {
  const normalized = name.trim().toLowerCase();
  return licenseTemplates.find((license) => {
    return license.spdxId.toLowerCase() === normalized || license.key.toLowerCase() === normalized;
  });
}

function applyPlaceholders(body: string, values: { year?: string; name?: string; }) {
  let output = body;
  if (values.year) output = output.replaceAll("[year]", values.year);
  if (values.name) output = output.replaceAll("[fullname]", values.name);
  return output;
}

function licenseSummary(license: LicenseTemplate) {
  return {
    id: license.id,
    key: license.key,
    spdxId: license.spdxId,
    name: license.name,
    description: license.description,
    source: license.source,
    sourceUrl: license.sourceUrl,
    hash: license.hash,
    permissions: license.permissions,
    conditions: license.conditions,
    limitations: license.limitations,
  };
}
