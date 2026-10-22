import FlipClock from "./FlipClock.jsx";

export default function TimerDisplay({ session, config, now }) {
  const complete = session?.status === "complete";
  const paused = session?.status === "paused";
  const rest = session?.phase === "rest" && !complete;
  const duration = (rest ? config.restMinutes : config.focusMinutes) * 60;
  const seconds = session && !complete
    ? Math.min(duration, Math.max(0, Math.ceil((paused ? session.remainingMs : session.endsAt - now) / 1000)))
    : complete ? 0 : duration;
  const progress = complete ? 100 : session
    ? Math.min(100, Math.max(0, paused ? (1 - session.remainingMs / (duration * 1000)) * 100
      : (now - session.phaseStartedAt) / (session.endsAt - session.phaseStartedAt) * 100)) : 0;
  const restOver = !!session?.lastRestEndedAt;

  return (
    <div className={`timer-display ${rest ? "is-rest" : "is-focus"}`}>
      <div className="timer-mode-row">
        <span className="timer-mode"><span className="timer-dot" />{complete ? "COMPLETE" : rest ? "REST" : "FOCUS"}{paused ? " · PAUSED" : ""}</span>
        <span className="timer-cycle">cycle {session?.cycle ?? 1} / {config.cycles}</span>
      </div>
      {restOver && <div className="rest-over" role="status">Rest time over</div>}
      <FlipClock seconds={seconds} />
      <div className="timer-progress" role="progressbar" aria-label="Current phase elapsed"
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
        <div style={{ width: `${progress}%` }} />
      </div>
      <div className="timer-caption">
        <span>{complete ? "All cycles finished · sites stay blocked" : session
          ? rest ? "Take a breath. Your sites are available." : "Distractions blocked. One thing at a time."
          : "A little structure. A little breathing room."}</span>
        <span>{Math.floor(progress)}%</span>
      </div>
    </div>
  );
}
