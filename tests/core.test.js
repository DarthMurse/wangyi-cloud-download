import test from 'node:test';
import assert from 'node:assert/strict';
import {isMusicPage, isAudioHost, audioFormat, safeFilename} from '../extension/core.js';
test('host validation rejects suffix tricks, credentials and unsafe protocols', () => {
  assert.equal(isMusicPage('https://music.163.com/#/song?id=1'), true);
  for (const url of ['https://music.163.com.evil.org/x.mp3', 'file://music.163.com/x.mp3', 'https://evil.org/x.mp3']) assert.equal(isAudioHost(url), false);
  assert.equal(isAudioHost('https://user:pass@m10.music.126.net/a.mp3'), false);
  assert.equal(isAudioHost('https://m10.music.126.net/a.mp3'), true);
});
test('detects complete audio files and rejects error responses and segments', () => {
  const root = 'https://m10.music.126.net/';
  assert.equal(audioFormat(root + 'audio', 'audio/mpeg; charset=binary'), 'mp3');
  assert.equal(audioFormat(root + 'song.FLAC?token=abc', 'application/octet-stream'), 'flac');
  assert.equal(audioFormat(root + 'song.mp3', 'text/html'), null);
  assert.equal(audioFormat(root + 'seg.m4s', 'audio/mp4'), null);
  assert.equal(audioFormat(root + 'list.m3u8', 'audio/mpeg'), null);
  assert.equal(audioFormat(root + 'unknown'), null);
});
test('filenames cannot escape the download folder and support Chinese', () => {
  assert.equal(safeFilename('晴天 — 周杰伦', 'flac'), 'Cloud Music/晴天 — 周杰伦.flac');
  assert.equal(safeFilename('CON', 'mp3'), 'Cloud Music/Track_CON.mp3');
  assert.equal(safeFilename('../../x:bad\\name? ', 'mp3'), 'Cloud Music/.._.._x_bad_name_.mp3');
  assert.equal(safeFilename('song', '../exe'), 'Cloud Music/song.mp3');
});
