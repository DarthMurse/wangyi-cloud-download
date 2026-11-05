# Cloud Music · Save

A dependency-free Chrome Manifest V3 extension for saving direct audio files detected while you play NetEase (Wangyi) Cloud Music in your logged-in browser.

## Install

1. Open `chrome://extensions` in Chrome (102 or newer).
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select this project's **extension** folder (the folder containing `manifest.json`).
4. Pin **Cloud Music · Save** using Chrome's extensions menu.
5. Open https://music.163.com, log in normally, and reload the music page after installation.
6. Play a song. Click the extension, then **Refresh** if necessary. Check or edit its filename and click **Save audio**.
7. Choose where to save. Check `chrome://downloads` for final completion or errors, including after the popup closes.

No build, server, API key, or separate sign-in is needed. A ZIP is also provided; extract it before loading the `extension` folder.

## Behavior and limits

- Captures direct MP3, FLAC, M4A, OGG, WAV, and AAC responses from configured NetEase music hosts. It does not call private music APIs or change account entitlements.
- Downloads exactly the playback file offered by the site. Trial clips remain clips; unavailable tracks, DRM, HLS/DASH segments, and blob-only playback are unsupported. Use it for music you have permission to download.
- Login happens on the music site. The extension does not read passwords or export cookies. Chrome handles applicable cookies when requesting downloads; a server may still reject a separate download request.
- Song labels come from the website's player bar and are best effort. Prefetching or website markup changes can produce missing or incorrect labels. Check the filename and detected time; filenames are editable. Audio tags are not rewritten.
- Only audio requested after installation is detected. If nothing appears, reload the webpage and restart playback. A cached request, unsupported CDN, or unsupported format can prevent detection.
- Signed links can expire. Clear the list, replay the song, then refresh and save again. An HTTP 403 or interrupted download may mean the server disallows a separate request.
- Up to 20 distinct URLs are retained per music tab. Repeated requests for the same URL are deduplicated. Different signed URLs or qualities can appear separately. Clear removes the list, not downloaded files.
- Captured links stay in memory via Chrome session storage. Closing the tab, navigating it away from the music site, or restarting Chrome clears them. Closing the popup does not stop downloads.

## Permissions and privacy

`webRequest` observes response headers; `downloads` saves selected audio; `storage` retains the session list; `activeTab` identifies the tab selected when you open the popup. Host access is restricted to `music.163.com` and its subdomains, `*.music.126.net`, and `*.music.163.net`. No analytics, external libraries, or credential storage. No network requests are sent by the extension except user-requested downloads or links the user opens.

## Development and validation

Run `npm test` and `npm run check` with Node.js 18+. Tests cover URL restrictions, response classification, filename safety, capture/deduplication, message access checks, and download dispatch using a mocked Chrome API. No npm install is necessary.

For a live acceptance check: load unpacked, reload a logged-in music page, play a downloadable track, verify its badge and popup entry, save it, and play the saved file. Also check a preview, expired URL, two separate tabs, clearing the list, and Chrome's interrupted-download reporting. Automated tests do not verify live NetEase compatibility or authenticated downloads.

Implementation references: [Chrome webRequest](https://developer.chrome.com/docs/extensions/reference/api/webRequest), [downloads](https://developer.chrome.com/docs/extensions/reference/api/downloads), and [session storage](https://developer.chrome.com/docs/extensions/reference/api/storage).
