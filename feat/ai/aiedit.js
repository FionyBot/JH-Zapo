/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * aiedit.js — Fitur Edit Image Menggunakan AI
 */

import axios from 'axios';
import { downloadMediaMessage, resolveMediaPayload } from 'zapo-js';
import { JHPEAI } from '../../scraper/AIEDIT.js';

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

async function downloadResult(url) {
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
  name: 'aiedit',
  aliases: ['imgedit', 'imageedit'],
  tags: 'ai',
  description: 'Ubah gaya foto menggunakan AI',

  async run(ctx) {
    const event = getEvent(ctx);
    if (!event) return ctx.reply('Gagal mendapatkan event message.');

    const rawMessage = event.message ?? event;
    const ctxInfo = getContextInfo(rawMessage);
    const targetMessage = ctxInfo?.quotedMessage || rawMessage;
    
    const payload = targetMessage && resolveMediaPayload(targetMessage);
    if (!payload || !payload.mimetype || !payload.mimetype.startsWith('image/')) {
      return ctx.reply(
        "✦ *FIONY's AI EDITOR* ✦\n\n" +
        "Kirim atau balas gambar dengan caption/perintah.\n" +
        "*Contoh:*\n" +
        "`.aiedit change style to Ghibli Studio Anime style`"
      );
    }

    const promptText = (ctx.text || '').trim() || 'Change style to Ghibli Studio Anime style';

    await ctx.react('⏳');
    await ctx.reply('_Memproses edit, harap tunggu..._');

    try {
      const stream = await downloadMediaMessage(targetMessage);
      const mediaBuffer = await streamToBuffer(stream);

      const res = await JHPEAI(mediaBuffer, promptText);

      if (!res.status) {
        await ctx.react('❎');
        return ctx.reply('❌ Gagal: ' + res.error);
      }

      const rawQuote = ctx.message ?? ctx.event ?? ctx.raw ?? ctx.msg ?? null;
      const imgBuffer = await downloadResult(res.data.result_url);
      
      await ctx.client.message.send(
        ctx.chat,
        {
          type: 'image',
          media: imgBuffer,
          mimetype: 'image/jpeg',
          caption: `🎨 *Fiony's AI Editor*\n\n*Prompt:* _${promptText}_`
        },
        { quote: rawQuote }
      );

      await ctx.react('✅');
    } catch (error) {
      await ctx.react('❎');
      return ctx.reply('❌ Error sistem: ' + String(error.message || error).slice(0, 150));
    }
  }
};