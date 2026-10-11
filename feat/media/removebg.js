/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * removebg.js — Background Remover Feature
 */

import { JHRMBG } from '../../scraper/RMBG.js';
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
  name: 'removebg',
  aliases: ['rbg', 'hapusbg', 'nobg'],
  tags: 'media',
  description: 'Menghapus background gambar secara otomatis',

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
        '✦ *BACKGROUND REMOVER* ✦\n\n' +
        'Kirim gambar dengan caption `.removebg` atau reply gambar dengan perintah `.removebg` untuk menghapus background pada gambar.'
      );
    }

    await ctx.react('⏳');

    try {
      const stream = await downloadMediaMessage(targetMessage);
      const imgBuffer = await streamToBuffer(stream);

      const result = await JHRMBG(imgBuffer, payload.mimetype);

      if (!result.status || !result.data?.buffer) {
        await ctx.react('❎');
        return ctx.reply('❌ Gagal memproses gambar: ' + (result.error || 'Terjadi kesalahan sistem.'));
      }

      const caption = [
        '┌───「 ✂️ *REMOVE BG* 」───┐',
        '',
        'Background berhasil dihapus, Kak!',
        '',
        '└────────────────────────┘',
        '',
        '> ✨ _*Powered by FionyVerse*_'
      ].join('\n');

      await ctx.client.message.send(
        ctx.chat,
        {
          type: 'image',
          media: result.data.buffer,
          mimetype: 'image/png',
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