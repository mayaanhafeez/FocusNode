// Chrome service workers have no audio APIs. An offscreen document plays the ping.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "audio:ping") return;
  const ping = document.getElementById("ping");
  ping.currentTime = 0;
  ping.play().then(() => sendResponse({ ok: true }), (error) => sendResponse({ ok: false, error: error.message }));
  return true;
});
