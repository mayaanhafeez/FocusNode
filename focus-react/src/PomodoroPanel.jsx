import { useState } from "react";
import { timerCommand, timerCore } from "./storage.js";
import usePomodoro from "./usePomodoro.js";
import TimerDisplay from "./TimerDisplay.jsx";
import TimerControls from "./TimerControls.jsx";
import FloatingTimer from "./FloatingTimer.jsx";
import "./pomodoro.css";

function TimerSetup({ initialConfig, onStart, busy }) {
  const [config, setConfig] = useState(initialConfig);
  return <form onSubmit={(event) => { event.preventDefault(); onStart(config); }}>
    <div className="timer-fields">
      {[["focusMinutes", "Focus / min", 180], ["restMinutes", "Rest / min", 180], ["cycles", "Cycles", 99]].map(([key, label, max]) => (
        <label key={key}>{label}<input type="number" min="1" max={max} step="1" required value={config[key]}
          disabled={busy} onChange={(event) => setConfig({ ...config, [key]: event.target.value === "" ? "" : Number(event.target.value) })} /></label>
      ))}
    </div>
    <button className="timer-button timer-primary" disabled={busy} type="submit">{busy ? "Starting…" : "▶ Start pomodoro"}</button>
  </form>;
}

export default function PomodoroPanel({ compact = false, standalone = false, launcher = false }) {
  const { settings, now, error: loadError } = usePomodoro();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const session = settings?.pomodoro;
  const config = session?.config ?? settings?.pomodoroConfig ?? timerCore.DEFAULT_CONFIG;

  async function command(action, data) {
    setBusy(true);
    setError("");
    try { await timerCommand(action, data); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  if (launcher) {
    return <section className="pomodoro-panel timer-launcher" aria-label="Pomodoro timer">
      <FloatingTimer session={session} config={config} now={now} launcher busy={busy} onCommand={command} commandError={error} />
    </section>;
  }

  return <section className={`pomodoro-panel ${compact ? "timer-compact" : ""} ${standalone ? "timer-standalone" : ""}`} aria-label="Pomodoro timer">
    <div className="timer-eyebrow">-- pomodoro <span>{session ? "session.lua" : "make time for what matters"}</span></div>
    <TimerDisplay session={session} config={config} now={now} />
    {settings && (session ? <TimerControls session={session} busy={busy} onCommand={command} />
      : <TimerSetup key={JSON.stringify(config)} initialConfig={config} busy={busy} onStart={(value) => command("start", { config: value })} />)}
    <FloatingTimer session={session} config={config} now={now} popup={compact} busy={busy} onCommand={command} commandError={error} />
    {(error || loadError) && <div className="timer-error" role="alert">{error || loadError}</div>}
    {!session && <p className="timer-hint">One cycle = focus + rest. A ping marks each phase. Sites re-block after every rest.</p>}
  </section>;
}
