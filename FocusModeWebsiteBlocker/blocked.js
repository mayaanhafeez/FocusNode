const api = globalThis.browser ?? globalThis.chrome;

const params = new URLSearchParams(location.search);
const site = params.get("site") || "(unknown site)";
document.getElementById("site").textContent = site;
document.getElementById("statusSite").textContent = site;

document.getElementById("back").onclick = () => {
  // The previous history entry is the blocked URL itself, which would
  // immediately re-trigger the block. Skip past it when possible.
  if (history.length > 2) history.go(-2);
  else history.back();
};

document.getElementById("openOptions").onclick = async () => {
  await api.runtime.openOptionsPage();
};

document.getElementById("turnOff").onclick = async () => {
  // End an active pomodoro too; manual focus cannot override a running phase.
  const response = await api.runtime.sendMessage({ type: "pomodoro:manual", focusOn: false });
  if (!response?.ok) document.getElementById("phaseDescription").textContent = response?.error || "Could not turn off Focus Mode. Try reloading the extension.";
};

document.getElementById("openTimer").onclick = () => api.tabs.create({ url: api.runtime.getURL("dist/timer.html") });

async function updatePhaseMessage() {
  const { pomodoro } = await api.storage.local.get("pomodoro");
  document.getElementById("phaseMessage").hidden = !pomodoro?.lastRestEndedAt;
  document.getElementById("phaseDescription").textContent = pomodoro?.status === "complete"
    ? "all pomodoro cycles finished — focus mode is still on"
    : "blocked during your focus session";
}
api.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.pomodoro) void updatePhaseMessage();
});
void updatePhaseMessage();
