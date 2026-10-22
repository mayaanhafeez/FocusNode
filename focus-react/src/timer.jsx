import React from "react";
import ReactDOM from "react-dom/client";
import TimerApp from "./TimerApp.jsx";

document.body.className = "timer-page-body";
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><TimerApp /></React.StrictMode>,
);
