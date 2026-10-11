/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * unwm.js — Bersihkan Watermark Dari Gambar
 */

import { JHUNWM } from '../../scraper/UNWM.js';
import { downloadMediaMessage, resolveMediaPayload } from 'zapo-js';

function getEvent(ctx) {
  return ctx.message ?? ctx.event ?? ctx.raw ?? ctx.msg ?? null;
}

function getContextInfo(message) {
  if (!message) return null;
  for (const key of Object.keys(message)) {
    const node = message[key];
    if (node && typeof node === 'object' && node.contextInfo) {
      return node.contextInfo;
    }
  }
  return null;
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export default {
  name: 'unwm',
  aliases: ['unwatermark', 'hapuswm', 'delwm', 'clean'],
  tags: 'media',
  description: 'Membersihkan gambar dari coretan atau watermark',

  async run(ctx) {
    const event = getEvent(ctx);
    if (!event) {
      return ctx.reply('Gagal mendapatkan event pesan dari sistem.');
    }

    const rawMessage = event.message ?? event;
    const ctxInfo = getContextInfo(rawMessage);
    const targetMessage = ctxInfo?.quotedMessage || rawMessage;

    const payload = targetMessage && resolveMediaPayload(targetMessage);

    if (!payload || !payload.mimetype || !payload.mimetype.includes('image')) {
      return ctx.reply(
        '✦ *IMAGE CLEANER* ✦\n\n' +
        'Kirim gambar dengan caption `.unwm` atau reply gambar dengan perintah `.unwm` untuk membersihkan watermark yang ada.'
      );
    }

    await ctx.react('⏳');

    try {
      const stream = await downloadMediaMessage(targetMessage);
      const imgBuffer = await streamToBuffer(stream);

      const result = await JHUNWM(imgBuffer, payload.mimetype);

      if (!result.status || !result.data?.url) {
        await ctx.react('❎');
        return ctx.reply('❌ Gagal memproses gambar: ' + (result.error || 'Terjadi kesalahan server.'));
      }

      const axios = (await import('axios')).default;
      const { data: resultBuffer } = await axios.get(result.data.url, { responseType: 'arraybuffer' });

      const caption = [
        '┌───「 🪄 *IMAGE CLEANER* 」───┐',
        '',
        'Gambar berhasil dibersihkan, Kak!',
        '',
        '└───────────────────────────┘',
        '',
        '> ✨ _*Powered by FionyVerse*_'
      ].join('\n');

      await ctx.client.message.send(
        ctx.chat,
        {
          type: 'image',
          media: Buffer.from(resultBuffer),
          mimetype: 'image/jpeg',
          caption: caption
        },
        { quote: rawMessage }
      );

      await ctx.react('✅');
    } catch (error) {
      await ctx.react('❎');
      return ctx.reply('❌ Error sistem: ' + String(error.message || error).slice(0, 250));
    }
  }
};