import { useEffect, useState } from "react";
import { api, loadSettings, saveSettings, onSettingsChanged } from "./storage.js";
import PomodoroPanel from "./PomodoroPanel.jsx";

export default function PopupApp() {
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const refresh = () => loadSettings().then(setSettings).catch((err) => setError(err.message));
    void refresh();
    return onSettingsChanged(refresh);
  }, []);

  async function toggle() {
    try { await saveSettings({ focusOn: !settings?.focusOn }); setError(""); }
    catch (err) { setError(err.message); }
  }

  return <div className="focusnode-popup" style={{ width: 340, background: "#191724", color: "#e0def4", fontFamily: "'SFMono-Regular',Menlo,monospace", border: "1px solid #26233a" }}>
    <div style={{ padding: "9px 14px", background: "#1f1d2e", color: "#908caa", fontSize: 11, borderBottom: "1px solid #26233a" }}>
      <span style={{ color: settings?.focusOn ? "#eb6f92" : "#9ccfd8" }}>●</span> focus-mode.lua
    </div>
    <div style={{ padding: 12 }}>
      <button className="timer-button" onClick={toggle} disabled={!settings}
        title={settings?.pomodoro ? "Manual toggle ends the pomodoro session" : "Toggle website blocking"}
        style={{ display: "flex", justifyContent: "space-between", marginTop: 0 }}>
        <span>Focus Mode · {settings?.blockedHosts.length ?? 0} sites</span>
        <span style={{ color: settings?.focusOn ? "#ebbcba" : "#9ccfd8" }}>{settings?.focusOn ? "ON" : "OFF"}</span>
      </button>
      {error && <div className="timer-error" role="alert">{error}</div>}
      <PomodoroPanel compact />
      <button className="timer-button timer-secondary" onClick={() => api?.runtime?.openOptionsPage()}>: Settings & blocked sites</button>
    </div>
  </div>;
}
