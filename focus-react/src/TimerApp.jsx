import { api } from "./storage.js";
import PomodoroPanel from "./PomodoroPanel.jsx";

const launcher = new URLSearchParams(location.search).has("launcher") && !!window.documentPictureInPicture;

export default function TimerApp() {
  if (launcher) return <main className="timer-launcher-page"><PomodoroPanel launcher /></main>;
  return <main className="timer-page">
    <header className="timer-page-header"><span>● FocusNode</span>
      <button onClick={() => api?.runtime?.openOptionsPage()}>Settings ↗</button>
    </header>
    <PomodoroPanel standalone />
  </main>;
}
