import test from 'node:test';
import assert from 'node:assert/strict';
const event = () => ({addListener(fn) { this.listener = fn; }});
const data = {};
const downloads = [];
globalThis.chrome = {
  storage: {session: {async get(k) { return {[k]: data[k]}; }, async set(v) { Object.assign(data, v); }, async remove(k) { delete data[k]; }}},
  action: {async setBadgeText() {}, async setBadgeBackgroundColor() {}},
  webRequest: {onHeadersReceived: event()},
  tabs: {async get() { return {url: 'https://music.163.com/'}; }, async sendMessage() { return {title: '晴天', artist: '周杰伦'}; }, onRemoved: event(), onUpdated: event()},
  runtime: {id: 'test', getURL: p => 'chrome-extension://test/' + p, onMessage: event()},
  downloads: {async download(options) { downloads.push(options); return 42; }}
};
await import('../extension/background.js');
const sender = {id: 'test', url: 'chrome-extension://test/index.html'};
const message = payload => new Promise(resolve => chrome.runtime.onMessage.listener({tabId: 7, ...payload}, sender, resolve));
test('captures, deduplicates, persists through reads and downloads only captured IDs', async () => {
  const details = {tabId: 7, statusCode: 206, method: 'GET', initiator: 'https://music.163.com', url: 'https://m10.music.126.net/song.mp3?token=abc', responseHeaders: [{name: 'Content-Type', value: 'audio/mpeg'}]};
  chrome.webRequest.onHeadersReceived.listener(details);
  chrome.webRequest.onHeadersReceived.listener(details);
  chrome.webRequest.onHeadersReceived.listener({...details, url: 'https://m10.music.126.net/other.mp3', initiator: 'https://evil.org'});
  const result = await message({type: 'list'});
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].title, '晴天 — 周杰伦');
  assert.equal((await message({type: 'download', id: 'invented'})).ok, false);
  assert.equal(downloads.length, 0);
  const saved = await message({type: 'download', id: result.items[0].id, title: 'custom'});
  assert.equal(saved.downloadId, 42);
  assert.equal(downloads[0].url, details.url);
  assert.equal(downloads[0].filename, 'Cloud Music/custom.mp3');
  assert.equal(downloads[0].saveAs, true);
  await message({type: 'clear'});
  assert.deepEqual((await message({type: 'list'})).items, []);
});
test('content scripts cannot initiate downloads', () => {
  const result = chrome.runtime.onMessage.listener({type: 'download', tabId: 7}, {id: 'test', url: 'https://music.163.com/'}, () => assert.fail('must not reply'));
  assert.equal(result, undefined);
});
