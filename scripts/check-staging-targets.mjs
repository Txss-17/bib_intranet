import assert from "node:assert/strict";
import { test } from "node:test";

/**
 * Fail closed before invoking psql. The expected identities must be configured
 * independently of connection URLs and manually verified as staging resources.
 * Never log connection strings: they contain credentials.
 */
export function checkStagingTarget(urlText, expectedDatabase, label) {
  if (!urlText || !expectedDatabase) throw new Error(label + ": staging target identity not configured");
  let url;
  try { url = new URL(urlText); } catch { throw new Error(label + ": invalid connection URL"); }
  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error(label + ": PostgreSQL URL required");
  }
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!url.hostname || !database || database !== expectedDatabase) {
    throw new Error(label + ": database does not match independently approved staging identity");
  }
  if (url.searchParams.get("sslmode") === "disable" && !["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
    throw new Error(label + ": remote plaintext connections are prohibited");
  }
  return { hostname: url.hostname.toLowerCase(), port: url.port || "5432", database };
}

export function checkPair(platform, intranet) {
  if (platform.hostname === intranet.hostname &&
      platform.port === intranet.port &&
      platform.database === intranet.database) {
    throw new Error("Platform and Intranet must not target the same database");
  }
}

if (process.argv[1] && import.meta.url === new URL("file://" + process.argv[1]).href) {
  try {
    const platform = checkStagingTarget(process.env.PLATFORM_DATABASE_URL, process.env.PLATFORM_EXPECTED_DB, "Platform");
    const intranet = checkStagingTarget(process.env.INTRANET_DATABASE_URL, process.env.INTRANET_EXPECTED_DB, "Intranet");
    checkPair(platform, intranet);
    console.log("Staging URL identities match configured expectations (ownership and isolation still require human verification).");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
