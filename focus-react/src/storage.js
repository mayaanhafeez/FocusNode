import "../../FocusModeWebsiteBlocker/pomodoro-core.js";

export const timerCore = globalThis.FocusNodePomodoro;
export const DEFAULTS = { focusOn: false, blockedHosts: [] };

// Firefox exposes `browser`, Chrome exposes `chrome`; both are promise-based in MV3.
export const api = globalThis.browser ?? globalThis.chrome;

export async function loadSettings() {
  // Works in extension pages
  if (api?.storage?.sync) {
    const [settings, local] = await Promise.all([
      api.storage.sync.get(DEFAULTS),
      api.storage.local.get({ pomodoro: null, pomodoroConfig: timerCore.DEFAULT_CONFIG }),
    ]);
    return { ...settings, ...local, focusOn: timerCore.isFocusOn(settings.focusOn, local.pomodoro) };
  }

  // Dev fallback (popup.html opened in normal browser during dev)
  const raw = localStorage.getItem("dev_settings");
  const settings = { ...DEFAULTS, pomodoro: null, pomodoroConfig: timerCore.DEFAULT_CONFIG,
    ...(raw ? JSON.parse(raw) : {}) };
  settings.pomodoro = timerCore.advance(settings.pomodoro);
  return { ...settings, focusOn: timerCore.isFocusOn(settings.focusOn, settings.pomodoro) };
}

export async function saveSettings(partial) {
  if (api?.storage?.sync) {
    if (Object.hasOwn(partial, "focusOn")) {
      await timerCommand("manual", { focusOn: partial.focusOn });
    } else {
      await api.storage.sync.set(partial);
    }
    return;
  }

  // Dev fallback
  const current = await loadSettings();
  const next = { ...current, ...partial, ...(Object.hasOwn(partial, "focusOn") ? { pomodoro: null } : {}) };
  localStorage.setItem("dev_settings", JSON.stringify(next));
  window.dispatchEvent(new Event("focusnode:settings"));
}

export async function timerCommand(command, data = {}) {
  if (api?.runtime?.sendMessage) {
    const response = await api.runtime.sendMessage({ type: `pomodoro:${command}`, ...data });
    if (!response?.ok) throw new Error(response?.error || "Could not reach the timer. Reload the extension and try again.");
    return response.settings;
  }
  // Local UI preview; real background enforcement requires loading the extension.
  const current = await loadSettings();
  let next = current;
  if (command === "start") {
    next = { ...current, pomodoro: timerCore.start(data.config), pomodoroConfig: data.config };
  } else if (command === "stop" || command === "manual") {
    next = { ...current, pomodoro: null, focusOn: command === "manual" && !!data.focusOn };
  } else if (["pause", "resume", "skip"].includes(command)) {
    next = { ...current, pomodoro: timerCore[command](current.pomodoro) };
  }
  localStorage.setItem("dev_settings", JSON.stringify(next));
  window.dispatchEvent(new Event("focusnode:settings"));
  return loadSettings();
}

export function onSettingsChanged(cb) {
  if (!api?.storage?.onChanged) {
    window.addEventListener("storage", cb);
    window.addEventListener("focusnode:settings", cb);
    return () => {
      window.removeEventListener("storage", cb);
      window.removeEventListener("focusnode:settings", cb);
    };
  }
  const handler = (changes, area) => {
    if ((area === "sync" && (changes.focusOn || changes.blockedHosts)) ||
        (area === "local" && (changes.pomodoro || changes.pomodoroConfig))) cb();
  };
  api.storage.onChanged.addListener(handler);
  return () => api.storage.onChanged.removeListener(handler);
}
