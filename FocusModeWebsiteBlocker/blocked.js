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
  // The background script restores all blocked tabs (including this one)
  // to their original URLs when focusOn flips to false.
  await api.storage.sync.set({ focusOn: false });
};
