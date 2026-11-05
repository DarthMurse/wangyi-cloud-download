let tabId;
const $ = id => document.getElementById(id);
async function request(type, extra = {}) {
  const result = await chrome.runtime.sendMessage({type, tabId, ...extra});
  if (!result?.ok) throw new Error(result?.error || 'Extension unavailable. Reload the extension and page.');
  return result;
}
function status(text) { $('status').textContent = text; }
async function refresh() {
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    tabId = tab?.id;
    const {items} = await request('list');
    $('tracks').replaceChildren();
    $('count').textContent = items.length;
    $('empty').hidden = items.length > 0;
    status(items.length ? 'Check the filename before saving. Player labels are best effort.' : 'Listening for audio on this tab.');
    for (const item of items) {
      const row = document.createElement('section'); row.className = 'track';
      const label = document.createElement('label'); label.textContent = 'Filename'; label.htmlFor = item.id;
      const input = document.createElement('input'); input.id = item.id; input.value = item.title; input.maxLength = 100;
      const detail = document.createElement('div'); detail.className = 'detail';
      const info = document.createElement('span'); info.textContent = `${item.format.toUpperCase()} · ${new Date(item.detectedAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`;
      const button = document.createElement('button'); button.className = 'save'; button.textContent = 'Save audio ↓';
      button.addEventListener('click', async () => {
        button.disabled = true;
        try { const {downloadId} = await request('download', {id: item.id, title: input.value}); status('Download started. Check Chrome Downloads for completion.'); button.dataset.downloadId = downloadId; }
        catch (error) { status(error.message); }
        finally { button.disabled = false; }
      });
      detail.append(info, button); row.append(label, input, detail); $('tracks').append(row);
    }
  } catch (error) { status(error.message); $('tracks').replaceChildren(); $('count').textContent = '0'; $('empty').hidden = true; }
}
chrome.downloads.onChanged.addListener(delta => {
  if (![...document.querySelectorAll('[data-download-id]')].some(el => Number(el.dataset.downloadId) === delta.id)) return;
  if (delta.error) status(`Download interrupted (${delta.error.current}). Replay the song to obtain a fresh link, then try again.`);
  else if (delta.state?.current === 'complete') status('Audio saved. Find it in Chrome Downloads.');
});
$('refresh').addEventListener('click', refresh);
$('clear').addEventListener('click', async () => { try { await request('clear'); await refresh(); } catch (error) { status(error.message); } });
refresh();
