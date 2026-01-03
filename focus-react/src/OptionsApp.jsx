import { useEffect, useMemo, useState } from "react";
import { loadSettings, saveSettings, onSettingsChanged } from "./storage.js";

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

export default function OptionsApp() {
  const [focusOn, setFocusOn] = useState(false);
  const [blockedHosts, setBlockedHosts] = useState([]);
  const [siteInput, setSiteInput] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    const s = await loadSettings();
    setFocusOn(!!s.focusOn);
    setBlockedHosts(Array.isArray(s.blockedHosts) ? s.blockedHosts : []);
  }

  useEffect(() => {
    refresh();
    const unsub = onSettingsChanged(refresh);
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!host) return setError("Enter a valid domain like youtube.com");
    if (hosts.includes(host)) return setError("That site is already on the list.");

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

  return (
    <div
      style={{
        fontFamily: "system-ui, -apple-system, sans-serif",
        minHeight: "100vh",
        background: "#0b1220",
        color: "#e5e7eb",
        padding: "32px 24px",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              margin: 0,
              marginBottom: 8,
              color: "#f8fafc",
            }}
          >
            Focus Mode Settings
          </h1>
          <p style={{ fontSize: 14, opacity: 0.7, margin: 0 }}>
            Manage your blocked sites and toggle focus mode
          </p>
        </div>

        {/* Toggle Section */}
        <div
          style={{
            background: "rgba(30, 41, 59, 0.5)",
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
            border: "1px solid rgba(148, 163, 184, 0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Focus Mode</div>
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                {hosts.length} blocked site{hosts.length === 1 ? "" : "s"}
              </div>
            </div>

            <button
              onClick={toggleFocus}
              style={{
                padding: "12px 24px",
                borderRadius: 12,
                border: focusOn
                  ? "1px solid rgba(34, 197, 94, 0.45)"
                  : "1px solid rgba(148, 163, 184, 0.22)",
                background: focusOn
                  ? "rgba(34, 197, 94, 0.15)"
                  : "rgba(148, 163, 184, 0.10)",
                color: "#e5e7eb",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 14,
                minWidth: 100,
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = focusOn
                  ? "rgba(34, 197, 94, 0.25)"
                  : "rgba(148, 163, 184, 0.18)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = focusOn
                  ? "rgba(34, 197, 94, 0.15)"
                  : "rgba(148, 163, 184, 0.10)";
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: focusOn ? "#22c55e" : "#94a3b8",
                  display: "inline-block",
                }}
              />
              {focusOn ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* Add Site Form */}
        <div
          style={{
            background: "rgba(30, 41, 59, 0.5)",
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
            border: "1px solid rgba(148, 163, 184, 0.1)",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Add Site</div>
          <form onSubmit={addSite} style={{ display: "flex", gap: 12 }}>
            <input
              value={siteInput}
              onChange={(e) => setSiteInput(e.target.value)}
              placeholder="e.g., youtube.com"
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: 10,
                border: "1px solid rgba(148, 163, 184, 0.22)",
                background: "rgba(15, 23, 42, 0.6)",
                color: "#e5e7eb",
                fontSize: 14,
                outline: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.45)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.22)";
              }}
            />
            <button
              type="submit"
              style={{
                padding: "12px 24px",
                borderRadius: 10,
                border: "1px solid rgba(99, 102, 241, 0.45)",
                background: "rgba(99, 102, 241, 0.22)",
                color: "#e5e7eb",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "rgba(99, 102, 241, 0.32)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "rgba(99, 102, 241, 0.22)";
              }}
            >
              Add
            </button>
          </form>

          {error ? (
            <div
              style={{
                marginTop: 12,
                padding: "10px 14px",
                borderRadius: 8,
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#fca5a5",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          ) : null}
        </div>

        {/* Blocked Sites List */}
        <div
          style={{
            background: "rgba(30, 41, 59, 0.5)",
            borderRadius: 16,
            padding: 24,
            border: "1px solid rgba(148, 163, 184, 0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                margin: 0,
                color: "#f8fafc",
              }}
            >
              Blocked Sites
            </h2>
            {hosts.length > 0 && (
              <button
                onClick={clearAll}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#fca5a5",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                  transition: "all 0.2s",
                }}
                disabled={hosts.length === 0}
                onMouseOver={(e) => {
                  if (hosts.length > 0) {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                }}
              >
                Clear All
              </button>
            )}
          </div>

          {hosts.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 16px",
                opacity: 0.6,
                fontSize: 14,
              }}
            >
              No blocked sites yet. Add a site above to get started.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {hosts.map((h) => (
                <div
                  key={h}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    borderRadius: 10,
                    background: "rgba(15, 23, 42, 0.4)",
                    border: "1px solid rgba(148, 163, 184, 0.1)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#e5e7eb",
                      fontFamily: "monospace",
                    }}
                  >
                    {h}
                  </div>
                  <button
                    onClick={() => removeSite(h)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      border: "1px solid rgba(148, 163, 184, 0.22)",
                      background: "rgba(148, 163, 184, 0.10)",
                      color: "#e5e7eb",
                      cursor: "pointer",
                      fontWeight: 500,
                      fontSize: 12,
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
                      e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
                      e.currentTarget.style.color = "#fca5a5";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "rgba(148, 163, 184, 0.10)";
                      e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.22)";
                      e.currentTarget.style.color = "#e5e7eb";
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

