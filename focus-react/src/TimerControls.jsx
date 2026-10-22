export default function TimerControls({ session, busy, onCommand }) {
  if (!session) return null;
  return <div className="timer-session-actions">
    {session.status !== "complete" && <div className="timer-playback">
      <button className="timer-button timer-primary" disabled={busy} onClick={() => onCommand(session.status === "paused" ? "resume" : "pause")}>
        {session.status === "paused" ? "▶ Play" : "Ⅱ Pause"}
      </button>
      <button className="timer-button" disabled={busy} onClick={() => onCommand("skip")} title="Skip the current phase; paused timers stay paused">Skip ⏭</button>
    </div>}
    <button className="timer-button timer-secondary" disabled={busy} onClick={() => onCommand("stop")}>
      {session.status === "complete" ? "Finish & unblock sites" : "End session & unblock sites"}
    </button>
  </div>;
}
