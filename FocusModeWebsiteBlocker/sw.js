// Firefox exposes `browser`, Chrome exposes `chrome`; both are promise-based in MV3.
const api = globalThis.browser ?? globalThis.chrome;

const DEFAULTS = {
  focusOn: false,
  blockedHosts: []
};

const BLOCKED_PAGE = api.runtime.getURL("blocked.html");

function normalizeHost(host) {
  const h = (host || "").toLowerCase();
  return h.startsWith("www.") ? h.slice(4) : h;
}

function isBlocked(host, blockedHosts) {
  const h = normalizeHost(host);
  return blockedHosts.some((b) => {
    const blocked = normalizeHost(b);
    return h === blocked || h.endsWith("." + blocked);
  });
}

async function getSettings() {
  return await api.storage.sync.get(DEFAULTS);
}

async function maybeBlockTab(tabId, url, settings) {
  if (!url) return;
  let u;
  try {
    u = new URL(url);
  } catch {
    return;
  }

  // Ignore internal browser/extension pages (including blocked.html itself)
  if (u.protocol !== "http:" && u.protocol !== "https:") return;

  const { focusOn, blockedHosts } = settings ?? (await getSettings());
  if (!focusOn) return;

  const host = u.hostname;
  if (!isBlocked(host, blockedHosts)) return;

  const blockedUrl =
    BLOCKED_PAGE +
    `?site=${encodeURIComponent(normalizeHost(host))}&originalUrl=${encodeURIComponent(url)}`;

  try {
    await api.tabs.update(tabId, { url: blockedUrl });
  } catch {
    // Tab may have been closed
  }
}

async function blockMatchingTabs() {
  const settings = await getSettings();
  if (!settings.focusOn) return;
  const tabs = await api.tabs.query({});
  await Promise.all(tabs.map((t) => maybeBlockTab(t.id, t.url, settings)));
}

async function restoreBlockedTabs() {
  const tabs = await api.tabs.query({});
  await Promise.all(
    tabs
      .filter((t) => t.url?.startsWith(BLOCKED_PAGE))
      .map(async (t) => {
        const original = new URL(t.url).searchParams.get("originalUrl");
        if (!original || !/^https?:\/\//i.test(original)) return;
        try {
          await api.tabs.update(t.id, { url: original });
        } catch {
          // Tab may have been closed
        }
      })
  );
}

api.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "loading" && tab.url) {
    maybeBlockTab(tabId, tab.url);
  }
});

api.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await api.tabs.get(tabId);
    if (tab?.url) maybeBlockTab(tabId, tab.url);
  } catch {
    // Tab may have been closed
  }
});

async function updateBadge() {
  const { focusOn } = await api.storage.sync.get({ focusOn: false });
  await api.action.setBadgeBackgroundColor({ color: "#22c55e" });
  await api.action.setBadgeText({ text: focusOn ? "ON" : "" });
}

api.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;
  if (changes.focusOn) {
    updateBadge();
    if (changes.focusOn.newValue) blockMatchingTabs();
    else restoreBlockedTabs();
  } else if (changes.blockedHosts) {
    blockMatchingTabs();
  }
});

updateBadge();
