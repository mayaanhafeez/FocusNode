const DEFAULTS = {
  focusOn: false,
  blockedHosts: []
};

function normalizeHost(host) {
  const h = (host || "").toLowerCase();
  return h.startsWith("www.") ? h.slice(4) : h;
}

function isBlocked(host, blockedHosts) {
  const h = normalizeHost(host);
  return blockedHosts.some((b) => normalizeHost(b) === h);
}

async function getSettings() {
  return await chrome.storage.sync.get(DEFAULTS);
}

async function maybeBlockTab(tabId, url) {
  if (!url) return;
  let u;
  try {
    u = new URL(url);
  } catch {
    return;
  }

  // Ignore internal browser/extension pages
  if (u.protocol !== "http:" && u.protocol !== "https:") return;

  const { focusOn, blockedHosts } = await getSettings();
  if (!focusOn) return;

  const host = u.hostname;
  if (!isBlocked(host, blockedHosts)) return;

  const blockedUrl =
    chrome.runtime.getURL("blocked.html") +
    `?site=${encodeURIComponent(normalizeHost(host))}&originalUrl=${encodeURIComponent(url)}`;

  // Avoid infinite loop
  if (url.startsWith(chrome.runtime.getURL("blocked.html"))) return;

  await chrome.tabs.update(tabId, { url: blockedUrl });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "loading" && tab.url) {
    maybeBlockTab(tabId, tab.url);
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  if (tab?.url) maybeBlockTab(tabId, tab.url);
});

async function updateBadge() {
  const { focusOn } = await chrome.storage.sync.get({ focusOn: false });
  await chrome.action.setBadgeText({ text: focusOn ? "ON" : "" });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.focusOn) updateBadge();
});

updateBadge();


