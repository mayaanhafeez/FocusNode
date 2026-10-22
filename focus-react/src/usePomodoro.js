import { useEffect, useState } from "react";
import { loadSettings, onSettingsChanged, timerCommand } from "./storage.js";

export default function usePomodoro() {
  const [settings, setSettings] = useState(null);
  const [now, setNow] = useState(Date.now);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const refresh = () => loadSettings().then((value) => {
      if (mounted) setSettings(value);
    }).catch((err) => { if (mounted) setError(err.message); });
    void refresh();
    timerCommand("sync").then(refresh).catch((err) => { if (mounted) setError(err.message); });
    const unsubscribe = onSettingsChanged(refresh);
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => { mounted = false; unsubscribe(); clearInterval(interval); };
  }, []);

  const deadline = settings?.pomodoro?.endsAt;
  useEffect(() => {
    if (!deadline) return;
    // A visible timer also wakes the worker at the boundary (alarms can be delayed).
    const timeout = setTimeout(() => {
      timerCommand("sync").catch((err) => setError(err.message));
    }, Math.max(0, deadline - Date.now()));
    return () => clearTimeout(timeout);
  }, [deadline]);

  return { settings, now, error };
}
