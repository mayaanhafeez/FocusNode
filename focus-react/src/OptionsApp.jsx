import { useEffect, useMemo, useState } from "react";
import { loadSettings, saveSettings, onSettingsChanged } from "./storage.js";

const rp = {
  base: "#191724", surface: "#1f1d2e", overlay: "#26233a",
  muted: "#6e6a86", subtle: "#908caa", text: "#e0def4",
  love: "#eb6f92", gold: "#f6c177", rose: "#ebbcba",
  pine: "#31748f", foam: "#9ccfd8", iris: "#c4a7e7",
  hlLow: "#21202e", hlMed: "#403d52", hlHigh: "#524f67",
};
const mono = "'ui-monospace','SFMono-Regular',Menlo,Monaco,Consolas,monospace";

function normalizeSite(input) {
  const raw = input.trim();
  if (!raw) return "";
  let s = raw;
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  try {
    const url = new URL(s);
    let host = url.hostname.toLowerCase();
    if (host.startsWith("www.")) host = host.slice(4);
    return host;
  } catch {
    return "";
  }
}

function SectionLabel({ children }) {
  return (
    <div style={{ color: rp.muted, fontSize: 12, marginBottom: 14, fontFamily: mono }}>
      {children}
    </div>
  );
}

export default function OptionsApp() {
  const [focusOn, setFocusOn]           = useState(false);
  const [blockedHosts, setBlockedHosts] = useState([]);
  const [siteInput, setSiteInput]       = useState("");
  const [error, setError]               = useState("");

  useEffect(() => {
    const apply = (s) => {
      setFocusOn(!!s.focusOn);
      setBlockedHosts(Array.isArray(s.blockedHosts) ? s.blockedHosts : []);
    };
    loadSettings().then(apply);
    return onSettingsChanged(() => loadSettings().then(apply));
  }, []);

  const hosts = useMemo(
    () => [...new Set(blockedHosts.map((h) => h.toLowerCase()))].sort(),
    [blockedHosts]
  );

  async function toggleFocus() {
    const next = !focusOn;
    setFocusOn(next);
    await saveSettings({ focusOn: next });
  }

  async function addSite(e) {
    e.preventDefault();
    setError("");
    const host = normalizeSite(siteInput);
    if (!host) return setError("invalid domain — try youtube.com");
    if (hosts.includes(host)) return setError("already in list");
    const next = [...hosts, host];
    setBlockedHosts(next);
    setSiteInput("");
    await saveSettings({ blockedHosts: next });
  }

  async function removeSite(host) {
    const next = hosts.filter((h) => h !== host);
    setBlockedHosts(next);
    await saveSettings({ blockedHosts: next });
  }

  async function clearAll() {
    if (!confirm("Clear all blocked sites?")) return;
    setBlockedHosts([]);
    await saveSettings({ blockedHosts: [] });
  }

  const accent   = focusOn ? rp.love : rp.pine;
  const accentFg = focusOn ? rp.rose : rp.foam;

  return (
    <div style={{
      fontFamily: mono,
      background: rp.base,
      color: rp.text,
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Tabline */}
      <div style={{
        background: rp.surface,
        borderBottom: `1px solid ${rp.overlay}`,
        display: "flex",
        alignItems: "stretch",
        height: 32,
        flexShrink: 0,
      }}>
        <div style={{
          background: rp.base,
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          gap: 7,
          borderRight: `1px solid ${rp.overlay}`,
          fontSize: 12,
          color: rp.subtle,
        }}>
          <span style={{ color: accent, fontSize: 9 }}>●</span>
          blocked-sites.lua
        </div>
      </div>

      {/* Buffer content */}
      <div style={{ flex: 1, overflow: "auto", padding: "32px 24px 48px" }}>
        <div style={{ maxWidth: 660, margin: "0 auto" }}>

          {/* ── focus mode ── */}
          <section style={{ marginBottom: 36 }}>
            <SectionLabel>-- focus mode</SectionLabel>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              background: rp.hlLow,
              border: `1px solid ${rp.overlay}`,
            }}>
              <div>
                <div style={{ fontSize: 13, color: rp.text }}>
                  status: <span style={{ color: accentFg, fontWeight: 600 }}>{focusOn ? "on" : "off"}</span>
                </div>
                <div style={{ fontSize: 11, color: rp.muted, marginTop: 3 }}>
                  {hosts.length} site{hosts.length === 1 ? "" : "s"} will be blocked
                </div>
              </div>
              <button
                onClick={toggleFocus}
                style={{
                  padding: "6px 16px",
                  background: `${accent}15`,
                  border: `1px solid ${accent}55`,
                  color: accentFg,
                  fontFamily: mono,
                  fontSize: 12,
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <span style={{ color: rp.muted }}>:</span>FocusToggle
              </button>
            </div>
          </section>

          {/* ── add site ── */}
          <section style={{ marginBottom: 36 }}>
            <SectionLabel>-- add site</SectionLabel>
            <form onSubmit={addSite} style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", background: rp.hlLow, border: `1px solid ${rp.overlay}` }}>
                <span style={{ padding: "0 8px 0 12px", color: rp.muted, fontSize: 13 }}>›</span>
                <input
                  value={siteInput}
                  onChange={(e) => setSiteInput(e.target.value)}
                  placeholder="youtube.com"
                  style={{
                    flex: 1,
                    padding: "10px 12px 10px 0",
                    background: "transparent",
                    border: "none",
                    color: rp.text,
                    fontFamily: mono,
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  padding: "0 20px",
                  background: `${rp.pine}18`,
                  border: `1px solid ${rp.pine}55`,
                  color: rp.foam,
                  fontFamily: mono,
                  fontSize: 12,
                  cursor: "pointer",
                  outline: "none",
                  whiteSpace: "nowrap",
                }}
              >
                add
              </button>
            </form>
            {error && (
              <div style={{
                marginTop: 8,
                padding: "6px 12px",
                background: `${rp.love}12`,
                border: `1px solid ${rp.love}44`,
                color: rp.love,
                fontSize: 11,
              }}>
                E: {error}
              </div>
            )}
          </section>

          {/* ── blocked sites ── */}
          <section>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
              <SectionLabel style={{ marginBottom: 0 }}>
                -- blocked sites ({hosts.length})
              </SectionLabel>
              {hosts.length > 0 && (
                <button
                  onClick={clearAll}
                  style={{
                    padding: "3px 10px",
                    background: "transparent",
                    border: `1px solid ${rp.love}44`,
                    color: rp.love,
                    fontFamily: mono,
                    fontSize: 11,
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  :ClearAll
                </button>
              )}
            </div>

            {hosts.length === 0 ? (
              <div style={{ color: rp.muted, fontSize: 12, padding: "20px 0", textAlign: "center" }}>
                ~ no sites blocked
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {hosts.map((h, i) => (
                  <div
                    key={h}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: `1px solid ${rp.overlay}`,
                    }}
                  >
                    <span style={{
                      width: 36,
                      flexShrink: 0,
                      color: rp.muted,
                      fontSize: 11,
                      textAlign: "right",
                      paddingRight: 16,
                      userSelect: "none",
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ flex: 1, fontSize: 13, color: rp.foam }}>
                      {h}
                    </span>
                    <button
                      onClick={() => removeSite(h)}
                      style={{
                        padding: "3px 10px",
                        background: "transparent",
                        border: `1px solid ${rp.overlay}`,
                        color: rp.muted,
                        fontFamily: mono,
                        fontSize: 11,
                        cursor: "pointer",
                        outline: "none",
                        flexShrink: 0,
                      }}
                    >
                      remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>

      {/* Statusline */}
      <div style={{
        background: rp.surface,
        borderTop: `1px solid ${rp.overlay}`,
        display: "flex",
        alignItems: "stretch",
        height: 26,
        flexShrink: 0,
      }}>
        <div style={{
          background: accent,
          color: rp.base,
          padding: "0 10px",
          display: "flex",
          alignItems: "center",
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: "0.07em",
        }}>
          {focusOn ? "FOCUSED" : "NORMAL"}
        </div>
        <div style={{
          padding: "0 12px",
          display: "flex",
          alignItems: "center",
          color: rp.subtle,
          fontSize: 11,
          borderRight: `1px solid ${rp.overlay}`,
        }}>
          blocked-sites.lua
        </div>
        <div style={{
          padding: "0 12px",
          display: "flex",
          alignItems: "center",
          color: rp.muted,
          fontSize: 11,
        }}>
          utf-8
        </div>
        <div style={{
          marginLeft: "auto",
          padding: "0 12px",
          display: "flex",
          alignItems: "center",
          color: rp.muted,
          fontSize: 11,
        }}>
          {hosts.length} sites
        </div>
      </div>
    </div>
  );
}
