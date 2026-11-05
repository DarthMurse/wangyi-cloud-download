export function isMusicPage(value) {
  try { const u = new URL(value); return /^https?:$/.test(u.protocol) && (u.hostname === 'music.163.com' || u.hostname.endsWith('.music.163.com')); } catch { return false; }
}
export function isAudioHost(value) {
  try {
    const u = new URL(value);
    return /^https?:$/.test(u.protocol) && !u.username && !u.password && ['music.126.net', 'music.163.net', 'music.163.com'].some(h => u.hostname === h || u.hostname.endsWith('.' + h));
  } catch { return false; }
}
export function audioFormat(url, mime = '') {
  if (!isAudioHost(url)) return null;
  const path = new URL(url).pathname;
  if (/\.(m3u8|mpd|ts|m4s)$/i.test(path)) return null;
  const types = {'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/flac': 'flac', 'audio/x-flac': 'flac', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/ogg': 'ogg', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/aac': 'aac'};
  const type = mime.split(';')[0].trim().toLowerCase();
  if (types[type]) return types[type];
  if (type && !['application/octet-stream', 'binary/octet-stream'].includes(type)) return null;
  return path.match(/\.(mp3|flac|m4a|ogg|wav|aac)$/i)?.[1].toLowerCase() || null;
}
export function safeFilename(title, format) {
  let name = String(title || 'Cloud Music audio').normalize('NFC').replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, '_').replace(/[. ]+$/g, '').trim().slice(0, 100).replace(/[. ]+$/g, '');
  if (!name || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)) name = 'Track_' + name;
  return `Cloud Music/${name}.${/^(mp3|flac|m4a|ogg|wav|aac)$/.test(format) ? format : 'mp3'}`;
}
