const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const root = path.resolve(__dirname, "../../FocusModeWebsiteBlocker");

async function background({ now = 1000, savedSession = null } = {}) {
  let clock = now;
  const listeners = {};
  const event = (name) => ({ addListener: (fn) => { (listeners[name] ??= []).push(fn); } });
  const sync = { focusOn: false, blockedHosts: ["example.com"] };
  const local = { pomodoro: savedSession };
  const alarms = new Map();
  const tabs = [{ id: 1, windowId: 1, url: "https://www.example.com/watch" }, { id: 2, url: "https://safe.test" }];
  let pings = 0;
  const area = (state, name) => ({
    get: async (defaults) => typeof defaults === "string" ? { [defaults]: state[defaults] }
      : { ...defaults, ...state },
    set: async (partial) => {
      const changes = {};
      for (const [key, value] of Object.entries(partial)) {
        changes[key] = { oldValue: state[key], newValue: value };
        state[key] = value;
      }
      for (const listener of listeners.storage ?? []) listener(changes, name);
    },
  });
  const api = {
    storage: { sync: area(sync, "sync"), local: area(local, "local"), onChanged: event("storage") },
    tabs: {
      query: async () => tabs.map((tab) => ({ ...tab })),
      get: async (id) => tabs.find((tab) => tab.id === id),
      update: async (id, data) => Object.assign(tabs.find((tab) => tab.id === id), data),
      create: async (data) => { const tab = { id: tabs.length + 1, ...data }; tabs.push(tab); return tab; },
      onUpdated: event("updated"), onActivated: event("activated"),
    },
    windows: { update: async () => {} },
    alarms: { create: async (name, value) => alarms.set(name, value), clear: async (name) => alarms.delete(name), onAlarm: event("alarm") },
    action: { setBadgeText: async () => {}, setBadgeBackgroundColor: async () => {} },
    runtime: {
      getURL: (file) => `chrome-extension://focusnode/${file}`,
      onMessage: event("message"), onStartup: event("startup"), onInstalled: event("installed"),
      sendMessage: async () => { pings++; return { ok: true }; },
    },
    offscreen: { hasDocument: async () => true },
  };
  const context = vm.createContext({ chrome: api, console, URL, Date: class extends Date { static now() { return clock; } } });
  vm.runInContext(fs.readFileSync(path.join(root, "pomodoro-core.js"), "utf8"), context);
  vm.runInContext(fs.readFileSync(path.join(root, "sw.js"), "utf8"), context);
  const command = (type, data = {}) => new Promise((resolve, reject) => {
    listeners.message[0]({ type: `pomodoro:${type}`, ...data }, {}, (response) => {
      if (response.ok) resolve(response.settings); else reject(new Error(response.error));
    });
  });
  await command("sync");
  return { local, sync, tabs, alarms, command, listeners, setNow: (value) => { clock = value; }, get pings() { return pings; } };
}

const config = { focusMinutes: 1, restMinutes: 1, cycles: 2 };

test("background blocks/restores/re-blocks existing tabs and announces rest end", async () => {
  const bg = await background();
  await bg.command("start", { config });
  assert.match(bg.tabs[0].url, /blocked.html\?/);
  assert.equal(bg.tabs[1].url, "https://safe.test");
  assert.equal(bg.alarms.get("focusnode-pomodoro").when, 61000);
  bg.setNow(61000);
  await bg.listeners.alarm[0]({ name: "focusnode-pomodoro" });
  assert.equal(bg.local.pomodoro.phase, "rest");
  assert.equal(bg.tabs[0].url, "https://www.example.com/watch");
  assert.equal(bg.pings, 1);
  bg.setNow(121000);
  await bg.command("sync");
  assert.match(bg.tabs[0].url, /blocked.html\?/);
  assert.ok(bg.tabs.some((tab) => tab.url.endsWith("dist/timer.html")));
  assert.equal(bg.local.pomodoro.cycle, 2);
  assert.equal(bg.pings, 2);
});

test("pause clears the alarm, play recreates it, skip immediately applies blocking", async () => {
  const bg = await background();
  await bg.command("start", { config });
  bg.setNow(21000);
  await bg.command("pause");
  assert.equal(bg.local.pomodoro.remainingMs, 40000);
  assert.equal(bg.alarms.size, 0);
  bg.setNow(100000);
  await bg.command("sync");
  assert.equal(bg.local.pomodoro.status, "paused");
  await bg.command("resume");
  assert.equal(bg.alarms.get("focusnode-pomodoro").when, 140000);
  await bg.command("skip");
  assert.equal(bg.tabs[0].url, "https://www.example.com/watch");
  await bg.command("skip");
  assert.match(bg.tabs[0].url, /blocked.html\?/);
});

test("manual toggle cancels a timer, stale alarms cannot restart it", async () => {
  const bg = await background();
  await bg.command("start", { config });
  await bg.command("manual", { focusOn: false });
  bg.setNow(999999);
  await bg.listeners.alarm[0]({ name: "focusnode-pomodoro" });
  assert.equal(bg.local.pomodoro, null);
  assert.equal(bg.alarms.size, 0);
  assert.equal(bg.tabs[0].url, "https://www.example.com/watch");
});

test("restart catches up persisted sessions and rearms their alarm", async () => {
  const savedSession = { config, status: "running", phase: "focus", cycle: 1,
    phaseStartedAt: 1000, endsAt: 61000, lastRestEndedAt: null };
  const bg = await background({ now: 130000, savedSession });
  assert.equal(bg.local.pomodoro.cycle, 2);
  assert.equal(bg.local.pomodoro.phase, "focus");
  assert.equal(bg.alarms.get("focusnode-pomodoro").when, 181000);
  assert.match(bg.tabs[0].url, /blocked.html\?/);
});

test("completion stays blocked until explicit finish, invalid starts do not mutate state", async () => {
  const bg = await background();
  await assert.rejects(bg.command("start", { config: { ...config, cycles: 0 } }));
  assert.equal(bg.local.pomodoro, null);
  await bg.command("start", { config });
  bg.setNow(999999);
  await bg.command("sync");
  assert.equal(bg.local.pomodoro.status, "complete");
  assert.match(bg.tabs[0].url, /blocked.html\?/);
  assert.equal(bg.alarms.size, 0);
  await bg.command("stop");
  assert.equal(bg.tabs[0].url, "https://www.example.com/watch");
});
