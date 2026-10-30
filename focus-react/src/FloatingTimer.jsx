import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "./storage.js";
import TimerDisplay from "./TimerDisplay.jsx";
import TimerControls from "./TimerControls.jsx";

// The launcher is a tiny window whose only job is to open PiP on one click.
async function openTimerWindow(launcher = false) {
  const base = api?.runtime?.getURL ? api.runtime.getURL("dist/timer.html") : new URL("timer.html", location.href).href;
  const url = launcher ? `${base}?launcher` : base;
  const [width, height] = launcher ? [260, 150] : [420, 520];
  if (api?.windows?.create) {
    await api.windows.create({ url, type: "popup", width, height });
  } else {
    window.open(url, "focusnode-timer", `width=${width},height=${height}`);
  }
}

async function minimizeOwnWindow() {
  try {
    const { id } = await api.windows.getCurrent();
    await api.windows.update(id, { state: "minimized" });
  } catch {
    // Not fatal: the launcher just stays visible.
  }
}

export default function FloatingTimer({ session, config, now, popup = false, launcher = false, busy, onCommand, commandError }) {
  const [pipWindow, setPipWindow] = useState(null);
  const [pipNow, setPipNow] = useState(now);
  const [error, setError] = useState("");
  const supported = !!window.documentPictureInPicture;

  useEffect(() => {
    if (!pipWindow) return;
    const close = () => {
      setPipWindow(null);
      if (launcher) window.close();
    };
    pipWindow.addEventListener("pagehide", close);
    // Tick from the PiP document: a minimized opener's timers get heavily throttled.
    const interval = pipWindow.setInterval(() => setPipNow(Date.now()), 250);
    return () => { pipWindow.clearInterval(interval); pipWindow.removeEventListener("pagehide", close); pipWindow.close(); };
  }, [pipWindow, launcher]);

  async function open() {
    setError("");
    try {
      // Toolbar popups disappear when PiP opens (closing it), so PiP is opened from a launcher window.
      if (!supported || popup) return await openTimerWindow(popup && supported);
      if (pipWindow) { pipWindow.close(); return; }
      const pip = await window.documentPictureInPicture.requestWindow({ width: 380, height: 380 });
      pip.document.title = "FocusNode timer";
      document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
        const clone = node.cloneNode(true);
        if (node.tagName === "LINK") clone.href = node.href;
        pip.document.head.appendChild(clone);
      });
      pip.document.body.className = "timer-pip-body";
      setPipNow(Date.now());
      setPipWindow(pip);
      if (launcher) await minimizeOwnWindow();
    } catch (err) {
      setError(`Could not open picture-in-picture: ${err.message}. Try the timer window instead.`);
    }
  }

  const label = launcher ? "⧉ Pop out timer"
    : popup ? "↗ Floating timer" : supported ? pipWindow ? "Close picture-in-picture" : "↗ Picture-in-picture" : "↗ Timer window";
  return <>
    <button className="timer-button timer-secondary" autoFocus={launcher} onClick={open}>{label}</button>
    {!popup && !launcher && <p className="timer-hint">{supported
      ? "Picture-in-picture stays on top. Keep this page open."
      : "This browser uses a compact window; always-on-top PiP needs a supported Chromium browser."}</p>}
    {error && <div className="timer-error" role="alert">{error}<button className="timer-button" onClick={() => openTimerWindow()}>Open timer window</button></div>}
    {pipWindow && createPortal(<div className="pip-timer"><div className="timer-eyebrow">FocusNode / pomodoro</div>
      <TimerDisplay session={session} config={config} now={pipNow} />
      <TimerControls session={session} busy={busy} onCommand={onCommand} />
      {commandError && <div className="timer-error" role="alert">{commandError}</div>}
    </div>, pipWindow.document.body)}
  </>;
}
