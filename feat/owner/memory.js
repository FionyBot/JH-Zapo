/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * memory.js — Cek penggunaan memori sistem bot
 */

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default {
  name: 'memory',
  aliases: ['mem', 'rss', 'usage', 'ram'],
  tags: 'owner',
  description: 'Cek penggunaan memori RAM bot',

  async run(ctx) {
    const mem = process.memoryUsage();

    const text = [
      '—— ｢ *MEMORY USAGE* ｣ ——',
      '',
      `◦ *rss:* ${formatBytes(mem.rss)}`,
      `◦ *heapTotal:* ${formatBytes(mem.heapTotal)}`,
      `◦ *heapUsed:* ${formatBytes(mem.heapUsed)}`,
      `◦ *external:* ${formatBytes(mem.external)}`,
      `◦ *arrayBuffers:* ${formatBytes(mem.arrayBuffers || 0)}`
    ].join('\n');

    return ctx.reply(text);
  }
};