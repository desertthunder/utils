import { ignoreTemplates } from "./generated/ignores.ts";
import { licenseTemplates } from "./generated/licenses.ts";
import { service } from "./response.ts";

export type HealthPayload = ReturnType<typeof healthPayload>;

export function healthPayload() {
  const languageIds = ignoreTemplates.map((template) => template.id);
  const spdxIds = licenseTemplates.map((license) => license.spdxId);

  return {
    ok: true,
    status: "healthy",
    service: service.name,
    catalogs: { ignores: { count: languageIds.length, languageIds }, licenses: { count: spdxIds.length, spdxIds } },
  };
}
