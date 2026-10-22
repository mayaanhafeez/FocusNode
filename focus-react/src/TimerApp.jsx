import { api } from "./storage.js";
import PomodoroPanel from "./PomodoroPanel.jsx";

export default function TimerApp() {
  return <main className="timer-page">
    <header className="timer-page-header"><span>● FocusNode</span>
      <button onClick={() => api?.runtime?.openOptionsPage()}>Settings ↗</button>
    </header>
    <PomodoroPanel standalone />
  </main>;
}
