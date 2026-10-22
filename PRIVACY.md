# Privacy Policy — FocusNode

FocusNode does not collect, transmit, sell, or share any user data.

## What the extension stores

- Your block list (the domains you've chosen to block).
- Whether Focus Mode is currently on or off.
- Pomodoro durations, cycle count, and the current timer's phase, pause state, and deadlines. These timer values use local extension storage and are not synced between devices.

Settings use the browser's built-in extension storage (`chrome.storage` /
`browser.storage`). The block list and manual Focus Mode setting use browser-managed
sync storage, which may sync through your browser account if enabled. Pomodoro
data stays in local extension storage. FocusNode has no backend, no analytics,
and makes no network requests of its own.

## Why the extension needs its permissions

- **storage** — to save your block list and Focus Mode state so they persist
  between browser sessions.
- **tabs** — to read the active tab's URL and compare it against your block
  list, and to redirect a tab to the local blocked-page when it matches while
  Focus Mode is on. The URL is only ever compared locally in memory; it is
  never recorded or transmitted anywhere.
- **alarms** — to move between pomodoro focus/rest periods while the popup is closed.
- **offscreen** (Chrome) — to play a bundled ping sound from a hidden local document. Firefox plays the same sound from its background page. No microphone access is used.

## Third parties

None. FocusNode does not share data with any third party, because it does not
collect any in the first place.

## Contact

Questions or concerns: open an issue at
https://github.com/mayaanhafeez/FocusNode/issues
