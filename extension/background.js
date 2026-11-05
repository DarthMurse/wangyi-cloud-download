import {isMusicPage, audioFormat, safeFilename} from './core.js';
const key = id => `tab:${id}`;
let queue = Promise.resolve();
function serialized(task) {
  const result = queue.then(task);
  queue = result.catch(() => {});
  return result;
}
async function read(id) { return (await chrome.storage.session.get(key(id)))[key(id)] || []; }
async function write(id, items) {
  await chrome.storage.session.set({[key(id)]: items});
  await chrome.action.setBadgeText({tabId: id, text: items.length ? String(items.length) : ''}).catch(() => {});
  await chrome.action.setBadgeBackgroundColor({tabId: id, color: '#b52c32'}).catch(() => {});
}
chrome.webRequest.onHeadersReceived.addListener(details => {
  if (details.tabId < 0 || details.statusCode < 200 || details.statusCode >= 300 || details.method !== 'GET') return;
  const mime = details.responseHeaders?.find(h => h.name.toLowerCase() === 'content-type')?.value || '';
  const format = audioFormat(details.url, mime);
  if (!format || !isMusicPage(details.initiator)) return;
  // Snapshot metadata immediately, before queued storage work can delay it.
  const metadata = chrome.tabs.sendMessage(details.tabId, {type: 'metadata'}, {frameId: 0}).catch(() => ({}));
  serialized(async () => {
    const tab = await chrome.tabs.get(details.tabId);
    if (!isMusicPage(tab.url)) return;
    const items = await read(details.tabId);
    const existing = items.find(item => item.url === details.url);
    if (existing) return;
    const meta = await metadata;
    const title = meta.title ? [meta.title, meta.artist].filter(Boolean).join(' — ') : 'Detected audio';
    const item = {id: crypto.randomUUID(), url: details.url, title, format, detectedAt: Date.now()};
    await write(details.tabId, [item, ...items].slice(0, 20));
  }).catch(console.error);
}, {urls: ['*://*.music.126.net/*', '*://*.music.163.net/*', '*://music.163.com/*', '*://*.music.163.com/*']}, ['responseHeaders']);

chrome.runtime.onMessage.addListener((message, sender, reply) => {
  // Only our popup can list or download captured URLs.
  if (sender.id !== chrome.runtime.id || sender.url !== chrome.runtime.getURL('index.html')) return;
  serialized(async () => {
    if (!Number.isInteger(message.tabId)) throw new Error('Open a NetEase Cloud Music tab first.');
    const tab = await chrome.tabs.get(message.tabId);
    if (!isMusicPage(tab.url)) throw new Error('Open music.163.com and play a song first.');
    if (message.type === 'list') return {items: await read(message.tabId)};
    if (message.type === 'clear') { await write(message.tabId, []); return {}; }
    if (message.type === 'download') {
      const item = (await read(message.tabId)).find(i => i.id === message.id);
      if (!item) throw new Error('This audio is no longer in the list. Play the song again.');
      const downloadId = await chrome.downloads.download({url: item.url, filename: safeFilename(message.title || item.title, item.format), saveAs: true, conflictAction: 'uniquify'});
      return {downloadId};
    }
    throw new Error('Unknown request.');
  }).then(result => reply({ok: true, ...result}), error => reply({ok: false, error: error.message}));
  return true;
});
chrome.tabs.onRemoved.addListener(id => { serialized(() => chrome.storage.session.remove(key(id))).catch(console.error); });
chrome.tabs.onUpdated.addListener((id, change) => {
  if (change.url && !isMusicPage(change.url)) serialized(async () => { await chrome.storage.session.remove(key(id)); await chrome.action.setBadgeText({tabId: id, text: ''}); }).catch(() => {});
});
