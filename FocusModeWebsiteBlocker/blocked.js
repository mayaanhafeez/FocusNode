const params = new URLSearchParams(location.search);
const site = params.get("site") || "(unknown site)";
const originalUrl = params.get("originalUrl") || null;
document.getElementById("site").textContent = site;

document.getElementById("back").onclick = () => history.back();

document.getElementById("openOptions").onclick = async () => {
  // Opens your React options page
  await chrome.runtime.openOptionsPage();
};

document.getElementById("turnOff").onclick = async () => {
  // Turn off focus mode
  await chrome.storage.sync.set({ focusOn: false });
  
  // Navigate back to the original URL if we have it
  if (originalUrl && (originalUrl.startsWith("http://") || originalUrl.startsWith("https://"))) {
    // Get the current tab (the blocked page) and navigate to the original URL
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.tabs.update(tab.id, { url: originalUrl });
    }
  } else {
    // Fallback: just go back in history
    history.back();
  }
};

