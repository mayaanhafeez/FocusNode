import { useEffect, useState } from "react";
import { loadSettings, saveSettings, onSettingsChanged } from "./storage.js";

export default function PopupApp() {
  const [focusOn, setFocusOn] = useState(false);
  const [count, setCount] = useState(0);

  async function refresh() {
    const s = await loadSettings();
    setFocusOn(!!s.focusOn);
    setCount(Array.isArray(s.blockedHosts) ? s.blockedHosts.length : 0);
  }

  useEffect(() => {
    refresh();
    const unsub = onSettingsChanged(refresh);
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggle() {
    const next = !focusOn;
    setFocusOn(next);
    await saveSettings({ focusOn: next });

    // Optional: if turning ON, reload active tab so blocker triggers immediately
    if (window.chrome?.tabs) {
      const [tab] = await window.chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) await window.chrome.tabs.reload(tab.id);
    }
  }

  async function openOptions() {
    if (window.chrome?.runtime?.openOptionsPage) {
      await window.chrome.runtime.openOptionsPage();
    }
  }

  return (
    <div
      style={{
        fontFamily: "system-ui",
        padding: 12,
        background: "#0b1220",
        color: "#e5e7eb",
        minHeight: 140,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14 }}>Focus Mode</div>
          <div style={{ opacity: 0.75, fontSize: 12, marginTop: 2 }}>
            {count} blocked site{count === 1 ? "" : "s"}
          </div>
        </div>

        <span
          style={{
            fontSize: 12,
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid rgba(148,163,184,.22)",
            background: focusOn ? "rgba(34,197,94,.15)" : "rgba(148,163,184,.10)",
            fontWeight: 800,
          }}
        >
          {focusOn ? "ON" : "OFF"}
        </span>
      </div>

      <button
        onClick={toggle}
        style={{
          width: "100%",
          marginTop: 12,
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid rgba(99,102,241,.45)",
          background: "rgba(99,102,241,.22)",
          color: "#e5e7eb",
          cursor: "pointer",
          fontWeight: 800,
        }}
      >
        {focusOn ? "Turn Focus OFF" : "Turn Focus ON"}
      </button>

      <button
        onClick={openOptions}
        style={{
          width: "100%",
          marginTop: 8,
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid rgba(148,163,184,.22)",
          background: "rgba(148,163,184,.10)",
          color: "#e5e7eb",
          cursor: "pointer",
          fontWeight: 700,
        }}
      >
        Open settings
      </button>
    </div>
  );
}


