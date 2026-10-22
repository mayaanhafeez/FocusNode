import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "./storage.js";
import TimerDisplay from "./TimerDisplay.jsx";
import TimerControls from "./TimerControls.jsx";

async function openTimerWindow() {
  const url = api?.runtime?.getURL ? api.runtime.getURL("dist/timer.html") : new URL("timer.html", location.href).href;
  if (api?.windows?.create) {
    await api.windows.create({ url, type: "popup", width: 420, height: 520 });
  } else {
    window.open(url, "focusnode-timer", "width=420,height=520");
  }
}

export default function FloatingTimer({ session, config, now, popup = false, busy, onCommand, commandError }) {
  const [pipWindow, setPipWindow] = useState(null);
  const [error, setError] = useState("");
  const supported = !!window.documentPictureInPicture;

  useEffect(() => {
    if (!pipWindow) return;
    const close = () => setPipWindow(null);
    pipWindow.addEventListener("pagehide", close);
    return () => { pipWindow.removeEventListener("pagehide", close); pipWindow.close(); };
  }, [pipWindow]);

  async function open() {
    setError("");
    try {
      // Toolbar popups disappear when PiP opens, so launch a durable timer window first.
      if (!supported || popup) return await openTimerWindow();
      if (pipWindow) { pipWindow.close(); return; }
      const pip = await window.documentPictureInPicture.requestWindow({ width: 380, height: 380 });
      pip.document.title = "FocusNode timer";
      document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
        const clone = node.cloneNode(true);
        if (node.tagName === "LINK") clone.href = node.href;
        pip.document.head.appendChild(clone);
      });
      pip.document.body.className = "timer-pip-body";
      setPipWindow(pip);
    } catch (err) {
      setError(`Could not open picture-in-picture: ${err.message}. Try the timer window instead.`);
    }
  }

  return <>
    <button className="timer-button timer-secondary" onClick={open}>
      {popup ? "↗ Floating timer" : supported ? pipWindow ? "Close picture-in-picture" : "↗ Picture-in-picture" : "↗ Timer window"}
    </button>
    {!popup && <p className="timer-hint">{supported
      ? "Picture-in-picture stays on top. Keep this page open."
      : "This browser uses a compact window; always-on-top PiP needs a supported Chromium browser."}</p>}
    {error && <div className="timer-error" role="alert">{error}<button className="timer-button" onClick={openTimerWindow}>Open timer window</button></div>}
    {pipWindow && createPortal(<div className="pip-timer"><div className="timer-eyebrow">FocusNode / pomodoro</div>
      <TimerDisplay session={session} config={config} now={now} />
      <TimerControls session={session} busy={busy} onCommand={onCommand} />
      {commandError && <div className="timer-error" role="alert">{commandError}</div>}
    </div>, pipWindow.document.body)}
  </>;
}
