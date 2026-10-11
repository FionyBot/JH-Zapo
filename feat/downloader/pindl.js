/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * pindl.js — Pinterest Downloader Feature
 */

import { JHPinDL } from '../../scraper/PINDL.js';

const PIN_URL_REGEX = /https?:\/\/(?:www\.)?pinterest\.com\/pin\/\d+|https?:\/\/pin\.it\/\w+/i;

function extractUrl(ctx) {
  const text = (ctx.text || '').trim();
  const match = text.match(PIN_URL_REGEX);
  if (match) return match[0];

  const quoted = ctx.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
  const quotedMatch = quotedText.match(PIN_URL_REGEX);
  if (quotedMatch) return quotedMatch[0];

  return null;
}

async function downloadMedia(url) {
  const axios = (await import('axios')).default;
  const { data: buffer } = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 120000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    }
  });
  const buf = Buffer.from(buffer);
  if (!buf.length) throw new Error('Empty buffer dari URL media');
  return buf;
}

export default {
  name: 'pindl',
  aliases: ['pinterestdl', 'pindownload'],
  tags: 'downloader',
  description: 'Download Video atau Image dari Pinterest',

  async run(ctx) {
    const url = extractUrl(ctx);

    if (!url) {
      return ctx.reply(
        '📌 *PINTEREST DOWNLOADER*\n\n' +
        'Kirim link Pinterest atau reply pesan yang berisi link.\n\n' +
        '*Contoh:*\n' +
        '`.pindl https://pin.it/6I5d6PLZn`'
      );
    }

    await ctx.react('⏳');

    let result;
    try {
      result = await JHPinDL(url);
    } catch (e) {
      await ctx.react('❎');
      return ctx.reply('❌ Gagal scrape: ' + String(e.message || e).slice(0, 200));
    }

    if (!result.status) {
      await ctx.react('❎');
      return ctx.reply('❌ Gagal download: ' + (result.error || 'Unknown error'));
    }

    const data = result.data;

    try {
      const mediaBuffer = await downloadMedia(data.media_url);
      
      const formatType = data.type === 'video' ? `Video ${data.quality || 'HD'}` : 'Image';
      
      const caption = [
        '┌───「 📌 *PINTEREST DL* 」───┐',
        '',
        `- *Judul:* _${data.title}_`,
        `- *Tipe:* _${formatType}_`,
        '',
        '└──────────────────────────────────────┘',
        '',
        '> ✨ _*Powered by FionyVerse*_'
      ].join('\n');

      await ctx.client.message.send(ctx.chat, {
        type: data.type === 'video' ? 'video' : 'image',
        media: mediaBuffer,
        mimetype: data.type === 'video' ? 'video/mp4' : 'image/jpeg',
        caption: caption
      });

      await ctx.react('✅');
    } catch (e) {
      await ctx.react('❎');
      return ctx.reply('❌ Error mengirim media: ' + String(e.message || e).slice(0, 250));
    }
  }
};