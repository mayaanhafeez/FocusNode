// Firefox uses classic background scripts; Chrome uses a service worker.
if (!globalThis.FocusNodePomodoro) importScripts("pomodoro-core.js");
const timer = globalThis.FocusNodePomodoro;
const api = globalThis.browser ?? globalThis.chrome;
const DEFAULTS = { focusOn: false, blockedHosts: [] };
const BLOCKED_PAGE = api.runtime.getURL("blocked.html");
const TIMER_PAGE = api.runtime.getURL("dist/timer.html");
const ALARM = "focusnode-pomodoro";

// Serialize transitions and user commands so a late alarm cannot undo a stop/start.
let pending = Promise.resolve();
function enqueue(task) {
  const result = pending.then(task);
  pending = result.catch(console.error);
  return result;
}

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

async function getSettings(pomodoro) {
  const settings = await api.storage.sync.get(DEFAULTS);
  return { ...settings, focusOn: timer.isFocusOn(settings.focusOn, pomodoro), pomodoro };
}

async function maybeBlockTab(tab, settings) {
  if (!tab.url || !settings.focusOn) return;
  let url;
  try { url = new URL(tab.url); } catch { return; }
  if (!["http:", "https:"].includes(url.protocol)) return;
  if (!isBlocked(url.hostname, settings.blockedHosts)) return;
  const blockedUrl = BLOCKED_PAGE +
    `?site=${encodeURIComponent(normalizeHost(url.hostname))}&originalUrl=${encodeURIComponent(tab.url)}`;
  try { await api.tabs.update(tab.id, { url: blockedUrl }); } catch { /* Tab closed. */ }
}

async function enforceTabs(settings) {
  const tabs = await api.tabs.query({});
  await Promise.all(tabs.map(async (tab) => {
    if (settings.focusOn) return maybeBlockTab(tab, settings);
    if (!tab.url?.startsWith(BLOCKED_PAGE + "?")) return;
    const original = new URL(tab.url).searchParams.get("originalUrl");
    if (!original || !/^https?:\/\//i.test(original)) return;
    try { await api.tabs.update(tab.id, { url: original }); } catch { /* Tab closed. */ }
  }));
}

async function updateBadge(settings) {
  const rest = settings.pomodoro && settings.pomodoro.status !== "complete" && settings.pomodoro.phase === "rest";
  const paused = settings.pomodoro?.status === "paused";
  await api.action.setBadgeBackgroundColor({ color: rest ? "#9ccfd8" : "#eb6f92" });
  await api.action.setBadgeText({ text: paused ? "Ⅱ" : rest ? "REST" : settings.focusOn ? "ON" : "" });
}

async function playPing() {
  try {
    if (api.offscreen) {
      if (!(await api.offscreen.hasDocument())) {
        await api.offscreen.createDocument({ url: "audio.html", reasons: ["AUDIO_PLAYBACK"],
          justification: "Play a short ping when a pomodoro focus or rest timer ends." });
      }
      const response = await api.runtime.sendMessage({ type: "audio:ping" });
      if (!response?.ok) throw new Error(response?.error || "Timer audio unavailable");
    } else if (typeof Audio !== "undefined") {
      // Firefox's background script has a DOM and can play audio directly.
      await new Audio(api.runtime.getURL("sounds/ping.wav")).play();
    }
  } catch (error) {
    // Never let audio/device errors interfere with blocking or phase transitions.
    console.warn("FocusNode ping:", error);
  }
}

async function showRestOver() {
  const tabs = await api.tabs.query({});
  const existing = tabs.find((tab) => tab.url?.startsWith(TIMER_PAGE));
  if (existing) {
    await api.tabs.update(existing.id, { active: true });
    if (existing.windowId != null) await api.windows.update(existing.windowId, { focused: true });
  } else {
    await api.tabs.create({ url: TIMER_PAGE });
  }
}

async function reconcile({ enforce = false, announce = true } = {}) {
  const { pomodoro: previous = null } = await api.storage.local.get("pomodoro");
  const pomodoro = timer.advance(previous);
  const changed = pomodoro !== previous;
  if (changed) await api.storage.local.set({ pomodoro });
  // Alarms survive worker suspension, but may be cleared by browser restart.
  if (pomodoro?.status === "running") {
    await api.alarms.create(ALARM, { when: pomodoro.endsAt });
  } else {
    await api.alarms.clear(ALARM);
  }
  const settings = await getSettings(pomodoro);
  if (changed || enforce) {
    await enforceTabs(settings);
    await updateBadge(settings);
  }
  if (announce && changed) await playPing();
  if (announce && changed && pomodoro.lastRestEndedAt &&
      pomodoro.lastRestEndedAt !== previous?.lastRestEndedAt) {
    await showRestOver();
  }
  return settings;
}

api.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM) return enqueue(() => reconcile({ enforce: true }));
});

api.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "loading" || !tab.url) return;
  void enqueue(async () => {
    const settings = await reconcile();
    await maybeBlockTab({ id: tabId, url: tab.url }, settings);
  });
});

api.tabs.onActivated.addListener(({ tabId }) => {
  void enqueue(async () => {
    const settings = await reconcile();
    try { await maybeBlockTab(await api.tabs.get(tabId), settings); } catch { /* Tab closed. */ }
  });
});

api.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && (changes.focusOn || changes.blockedHosts)) {
    void enqueue(() => reconcile({ enforce: true }));
  }
});

api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message?.type?.startsWith("pomodoro:")) return;
  enqueue(async () => {
    switch (message.type) {
      case "pomodoro:start": {
        const pomodoro = timer.start(message.config);
        await api.storage.local.set({ pomodoro, pomodoroConfig: pomodoro.config });
        break;
      }
      case "pomodoro:stop":
        await api.storage.local.set({ pomodoro: null });
        await api.storage.sync.set({ focusOn: false });
        break;
      case "pomodoro:manual":
        await api.storage.local.set({ pomodoro: null });
        await api.storage.sync.set({ focusOn: !!message.focusOn });
        break;
      case "pomodoro:sync":
        break;
      case "pomodoro:pause":
      case "pomodoro:resume":
      case "pomodoro:skip": {
        const settings = await reconcile();
        const action = message.type.split(":")[1];
        const pomodoro = timer[action](settings.pomodoro);
        await api.storage.local.set({ pomodoro });
        if (action === "skip" && pomodoro !== settings.pomodoro) {
          // Show the rest-over screen only after site blocking has been applied.
          await reconcile({ enforce: true, announce: false });
          await playPing();
          if (pomodoro?.lastRestEndedAt && pomodoro.lastRestEndedAt !== settings.pomodoro?.lastRestEndedAt) {
            await showRestOver();
          }
        }
        break;
      }
      default:
        throw new Error("Unknown timer command.");
    }
    return reconcile({ enforce: message.type !== "pomodoro:sync" });
  }).then(
    (settings) => sendResponse({ ok: true, settings }),
    (error) => sendResponse({ ok: false, error: error.message }),
  );
  return true;
});

api.runtime.onStartup.addListener(() => enqueue(() => reconcile({ enforce: true })));
api.runtime.onInstalled.addListener(() => enqueue(() => reconcile({ enforce: true })));
void enqueue(() => reconcile({ enforce: true }));
