/** Purge pre-existing BIB / Linksy browser records after migration to
 * server-backed or volatile state. Never writes replacement browser data. */
export function purgeLegacyBrowserRecords(): void {
  if (typeof window === "undefined") return;
  // Run the legacy migration once only; repeated cleanup erased active auth
  // sessions on refresh and after returning from hosted Stripe pages.
  const migrationMarker = "bib:legacy-browser-cleanup:v2";
  try {
    if (window.localStorage.getItem(migrationMarker) === "done") return;
  } catch {
    // Storage might be unavailable (private browsing).
  }
  const matches = (key: string) =>
    key !== migrationMarker &&
    !/^sb-[a-z0-9-]+-auth-token$/i.test(key) &&
    key !== "supabase.auth.token" &&
    /^(bib(?:[._:-]|$)|linksy(?:[._:-]|$)|alert-sound-enabled$)/i.test(key);
  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      const keys = Array.from({ length: storage.length }, (_, i) => storage.key(i))
        .filter((key): key is string => !!key && matches(key));
      for (const key of keys) storage.removeItem(key);
    } catch {
      // Some browsers forbid storage entirely; no persistent fallback.
    }
  }
  // Remove explicitly named legacy application databases, if present.
  if (typeof indexedDB !== "undefined" && typeof indexedDB.databases === "function") {
    void indexedDB.databases().then(databases => {
      for (const database of databases) {
        if (database.name && /^(bib|linksy)([._:-]|$)/i.test(database.name)) {
          indexedDB.deleteDatabase(database.name);
        }
      }
    }).catch(() => {});
  }
  if ("caches" in window) {
    void window.caches.keys().then(keys => Promise.all(
      keys.filter(key => /^(bib|linksy)([._:-]|$)/i.test(key))
        .map(key => window.caches.delete(key)),
    )).catch(() => {});
  }
  try {
    window.localStorage.setItem(migrationMarker, "done");
  } catch {
    // Preserve normal operation if browser storage is unavailable.
  }
}
