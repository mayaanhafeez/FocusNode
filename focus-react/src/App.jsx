import { useEffect, useMemo, useState } from "react";

const DEFAULTS = { focusOn: false, blockedHosts: [] };

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

// Small helper so your React page works:
// - inside extension (chrome.storage exists)
// - in dev mode in normal browser tab (fallback to localStorage)
async function loadSettings() {
  if (window.chrome?.storage?.sync) {
    return await window.chrome.storage.sync.get(DEFAULTS);
  }
  const raw = localStorage.getItem("dev_settings");
  return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
}

async function saveSettings(partial) {
  if (window.chrome?.storage?.sync) {
    await window.chrome.storage.sync.set(partial);
    return;
  }
  const current = await loadSettings();
  const next = { ...current, ...partial };
  localStorage.setItem("dev_settings", JSON.stringify(next));
}

export default function App() {
  const [focusOn, setFocusOn] = useState(false);
  const [blockedHosts, setBlockedHosts] = useState([]);
  const [siteInput, setSiteInput] = useState("");
  const [error, setError] = useState("");

  // Load settings once
  useEffect(() => {
    (async () => {
      const s = await loadSettings();
      setFocusOn(!!s.focusOn);
      setBlockedHosts(Array.isArray(s.blockedHosts) ? s.blockedHosts : []);
    })();
  }, []);

  const hosts = useMemo(() => {
    return [...new Set(blockedHosts.map((h) => h.toLowerCase()))].sort();
  }, [blockedHosts]);

  async function toggleFocus() {
    const next = !focusOn;
    setFocusOn(next);
    await saveSettings({ focusOn: next });
  }

  async function addSite(e) {
    e.preventDefault();
    setError("");

    const host = normalizeSite(siteInput);
    if (!host) {
      setError("Enter a valid domain like youtube.com");
      return;
    }
    if (hosts.includes(host)) {
      setError("That site is already on the list.");
      return;
    }

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
    <div style={{ fontFamily: "system-ui", padding: 20, maxWidth: 800, margin: "0 auto" }}>
      <h1>Focus Mode Settings (React)</h1>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 10 }}>
        <div
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid #ccc",
            background: focusOn ? "#d1fae5" : "#eee",
            fontWeight: 700,
          }}
        >
          {focusOn ? "ON" : "OFF"}
        </div>

        <button onClick={toggleFocus} style={{ padding: "10px 12px", cursor: "pointer" }}>
          {focusOn ? "Turn Focus OFF" : "Turn Focus ON"}
        </button>

        <button onClick={clearAll} style={{ padding: "10px 12px", cursor: "pointer" }} disabled={hosts.length === 0}>
          Clear list
        </button>
      </div>

      <form onSubmit={addSite} style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <input
          value={siteInput}
          onChange={(e) => setSiteInput(e.target.value)}
          placeholder="e.g., youtube.com"
          style={{ flex: 1, padding: "10px 12px" }}
        />
        <button type="submit" style={{ padding: "10px 12px", cursor: "pointer" }}>
          Add
        </button>
      </form>

      {error ? <div style={{ marginTop: 10, color: "crimson" }}>{error}</div> : null}

      <h2 style={{ marginTop: 18 }}>Blocked sites</h2>
      {hosts.length === 0 ? (
        <p>No sites yet.</p>
      ) : (
        <ul>
          {hosts.map((h) => (
            <li key={h} style={{ marginBottom: 8 }}>
              <b>{h}</b>{" "}
              <button onClick={() => removeSite(h)} style={{ marginLeft: 10, cursor: "pointer" }}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <p style={{ marginTop: 20, opacity: 0.7 }}>
        Tip: This page writes to <code>chrome.storage.sync</code>, so your popup + service worker will immediately use the same data.
      </p>
    </div>
  );
}

