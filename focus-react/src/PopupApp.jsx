import { useEffect, useState } from "react";
import { api, loadSettings, saveSettings, onSettingsChanged } from "./storage.js";

const rp = {
  base: "#191724", surface: "#1f1d2e", overlay: "#26233a",
  muted: "#6e6a86", subtle: "#908caa", text: "#e0def4",
  love: "#eb6f92", rose: "#ebbcba",
  pine: "#31748f", foam: "#9ccfd8",
  hlLow: "#21202e",
};
const mono = "'ui-monospace','SFMono-Regular',Menlo,Monaco,Consolas,monospace";

export default function PopupApp() {
  const [focusOn, setFocusOn] = useState(false);
  const [count, setCount]     = useState(0);

  useEffect(() => {
    const apply = (s) => {
      setFocusOn(!!s.focusOn);
      setCount(Array.isArray(s.blockedHosts) ? s.blockedHosts.length : 0);
    };
    loadSettings().then(apply);
    return onSettingsChanged(() => loadSettings().then(apply));
  }, []);

  async function toggle() {
    const next = !focusOn;
    setFocusOn(next);
    await saveSettings({ focusOn: next });
  }

  async function openOptions() {
    if (api?.runtime?.openOptionsPage) await api.runtime.openOptionsPage();
  }

  const accent = focusOn ? rp.love : rp.pine;
  const accentFg = focusOn ? rp.rose : rp.foam;

  return (
    <div style={{
      fontFamily: mono,
      background: rp.base,
      color: rp.text,
      width: 240,
      userSelect: "none",
      border: `1px solid ${rp.overlay}`,
    }}>
      {/* Tabline */}
      <div style={{
        background: rp.surface,
        borderBottom: `1px solid ${rp.overlay}`,
        display: "flex",
        alignItems: "stretch",
        height: 28,
      }}>
        <div style={{
          background: rp.base,
          padding: "0 12px",
          display: "flex",
          alignItems: "center",
          gap: 7,
          borderRight: `1px solid ${rp.overlay}`,
          fontSize: 11,
          color: rp.subtle,
        }}>
          <span style={{ color: accent, fontSize: 9 }}>●</span>
          focus-mode.lua
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "12px 12px 10px" }}>
        <div style={{ color: rp.muted, fontSize: 11, marginBottom: 10 }}>
          -- FocusNode
        </div>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 10px",
          background: rp.hlLow,
          border: `1px solid ${rp.overlay}`,
          marginBottom: 8,
        }}>
          <div>
            <div style={{ fontSize: 12, color: rp.text }}>Focus Mode</div>
            <div style={{ fontSize: 11, color: rp.muted, marginTop: 2 }}>
              {count} site{count === 1 ? "" : "s"} blocked
            </div>
          </div>
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 8px",
            background: `${accent}20`,
            border: `1px solid ${accent}66`,
            color: accentFg,
            letterSpacing: "0.1em",
          }}>
            {focusOn ? "ON" : "OFF"}
          </div>
        </div>

        <button
          onClick={toggle}
          style={{
            display: "block",
            width: "100%",
            padding: "7px 10px",
            marginBottom: 5,
            background: `${accent}15`,
            border: `1px solid ${accent}55`,
            color: accentFg,
            fontFamily: mono,
            fontSize: 12,
            cursor: "pointer",
            textAlign: "left",
            outline: "none",
          }}
        >
          <span style={{ color: rp.muted }}>:</span>FocusToggle
        </button>

        <button
          onClick={openOptions}
          style={{
            display: "block",
            width: "100%",
            padding: "7px 10px",
            background: "transparent",
            border: `1px solid ${rp.overlay}`,
            color: rp.subtle,
            fontFamily: mono,
            fontSize: 12,
            cursor: "pointer",
            textAlign: "left",
            outline: "none",
          }}
        >
          <span style={{ color: rp.muted }}>:</span>Settings
        </button>
      </div>

      {/* Statusline */}
      <div style={{
        background: rp.surface,
        borderTop: `1px solid ${rp.overlay}`,
        display: "flex",
        alignItems: "stretch",
        height: 22,
      }}>
        <div style={{
          background: accent,
          color: rp.base,
          padding: "0 8px",
          display: "flex",
          alignItems: "center",
          fontWeight: 700,
          fontSize: 10,
          letterSpacing: "0.08em",
        }}>
          {focusOn ? "FOCUSED" : "NORMAL"}
        </div>
        <div style={{
          padding: "0 8px",
          display: "flex",
          alignItems: "center",
          color: rp.subtle,
          fontSize: 10,
          borderRight: `1px solid ${rp.overlay}`,
        }}>
          focus-mode.lua
        </div>
        <div style={{
          marginLeft: "auto",
          padding: "0 8px",
          display: "flex",
          alignItems: "center",
          color: rp.muted,
          fontSize: 10,
        }}>
          {count} sites
        </div>
      </div>
    </div>
  );
}
