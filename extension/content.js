// Read only the player bar, never the currently browsed song page.
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (message.type !== 'metadata') return;
  const bar = document.querySelector('.m-playbar');
  const song = bar?.querySelector('.words .name');
  const artist = bar?.querySelector('.words .by');
  reply({title: (song?.getAttribute('title') || song?.textContent || '').trim().slice(0, 150), artist: (artist?.getAttribute('title') || artist?.textContent || '').trim().slice(0, 150)});
});
