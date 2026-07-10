# Privacy Policy — FocusNode

FocusNode does not collect, transmit, sell, or share any user data.

## What the extension stores

- Your block list (the domains you've chosen to block).
- Whether Focus Mode is currently on or off.

Both are stored using the browser's built-in extension storage
(`chrome.storage` / `browser.storage`) and stay on your device. Nothing is
sent to any server — FocusNode has no backend, no analytics, and makes no
network requests of its own.

## Why the extension needs its permissions

- **storage** — to save your block list and Focus Mode state so they persist
  between browser sessions.
- **tabs** — to read the active tab's URL and compare it against your block
  list, and to redirect a tab to the local blocked-page when it matches while
  Focus Mode is on. The URL is only ever compared locally in memory; it is
  never recorded or transmitted anywhere.

## Third parties

None. FocusNode does not share data with any third party, because it does not
collect any in the first place.

## Contact

Questions or concerns: open an issue at
https://github.com/mayaanhafeez/FocusNode/issues
