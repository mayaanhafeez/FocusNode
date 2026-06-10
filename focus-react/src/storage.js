export const DEFAULTS = { focusOn: false, blockedHosts: [] };

// Firefox exposes `browser`, Chrome exposes `chrome`; both are promise-based in MV3.
export const api = globalThis.browser ?? globalThis.chrome;

export async function loadSettings() {
  // Works in extension pages
  if (api?.storage?.sync) {
    return await api.storage.sync.get(DEFAULTS);
  }

  // Dev fallback (popup.html opened in normal browser during dev)
  const raw = localStorage.getItem("dev_settings");
  return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
}

export async function saveSettings(partial) {
  if (api?.storage?.sync) {
    await api.storage.sync.set(partial);
    return;
  }

  // Dev fallback
  const current = await loadSettings();
  const next = { ...current, ...partial };
  localStorage.setItem("dev_settings", JSON.stringify(next));
}

export function onSettingsChanged(cb) {
  if (!api?.storage?.onChanged) return () => {};
  const handler = (changes, area) => {
    if (area !== "sync") return;
    if (changes.focusOn || changes.blockedHosts) cb();
  };
  api.storage.onChanged.addListener(handler);
  return () => api.storage.onChanged.removeListener(handler);
}
