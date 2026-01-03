export const DEFAULTS = { focusOn: false, blockedHosts: [] };

export async function loadSettings() {
  // Works in extension pages
  if (window.chrome?.storage?.sync) {
    return await window.chrome.storage.sync.get(DEFAULTS);
  }

  // Dev fallback (popup.html opened in normal browser during dev)
  const raw = localStorage.getItem("dev_settings");
  return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
}

export async function saveSettings(partial) {
  if (window.chrome?.storage?.sync) {
    await window.chrome.storage.sync.set(partial);
    return;
  }

  // Dev fallback
  const current = await loadSettings();
  const next = { ...current, ...partial };
  localStorage.setItem("dev_settings", JSON.stringify(next));
}

export function onSettingsChanged(cb) {
  if (!window.chrome?.storage?.onChanged) return () => {};
  const handler = (changes, area) => {
    if (area !== "sync") return;
    if (changes.focusOn || changes.blockedHosts) cb();
  };
  window.chrome.storage.onChanged.addListener(handler);
  return () => window.chrome.storage.onChanged.removeListener(handler);
}

