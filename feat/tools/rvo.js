/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * rvo.js — Fitur Pembuka/Pembaca View Once
 */

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

function extractCaption(msg) {
  if (!msg) return '';
  const vo2 = msg.viewOnceMessageV2?.message;
  const vo = msg.viewOnceMessage?.message;
  
  return msg.imageMessage?.caption || 
         msg.videoMessage?.caption || 
         vo2?.imageMessage?.caption || 
         vo2?.videoMessage?.caption || 
         vo?.imageMessage?.caption || 
         vo?.videoMessage?.caption || 
         '';
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export default {
  name: 'rvo',
  aliases: ['readviewonce', 'getvo'],
  tags: 'tools',
  description: 'Membuka dan mengirim ulang pesan View Once (Sekali Lihat)',

  async run(ctx) {
    const event = getEvent(ctx);
    if (!event) {
      return ctx.reply('Gagal mendapatkan event pesan dari sistem.');
    }

    const rawMessage = event.message ?? event;
    const ctxInfo = getContextInfo(rawMessage);
    const targetMessage = ctxInfo?.quotedMessage;

    if (!targetMessage) {
      return ctx.reply(
        '✦ *READ VIEW ONCE* ✦\n\n' +
        'Reply pesan View Once (gambar/video/audio) dengan perintah `.rvo`'
      );
    }

    const payload = resolveMediaPayload(targetMessage);

    if (!payload || !payload.mimetype) {
      return ctx.reply('Pesan yang di-reply tidak mengandung media yang bisa dibuka.');
    }

    await ctx.react('⏳');

    try {
      const stream = await downloadMediaMessage(targetMessage);
      const mediaBuffer = await streamToBuffer(stream);

      let mediaType = 'document';
      if (payload.mimetype.includes('image')) mediaType = 'image';
      else if (payload.mimetype.includes('video')) mediaType = 'video';
      else if (payload.mimetype.includes('audio')) mediaType = 'audio';

      const originalCaption = payload.caption || extractCaption(targetMessage);
      const textCaption = originalCaption ? `*Caption Asli:*\n${originalCaption}\n\n` : '';
      const caption = `┌───「 👁️ *READ VIEW ONCE* 」───┐\n\n${textCaption}└──────────────────────────┘\n\n> ✨ _*Powered by FionyVerse*_`;

      const sendOptions = {
        type: mediaType,
        media: mediaBuffer,
        mimetype: payload.mimetype
      };

      if (mediaType === 'image' || mediaType === 'video') {
        sendOptions.caption = caption;
      } else if (mediaType === 'audio' && payload.ptt) {
        sendOptions.ptt = true;
      }

      await ctx.client.message.send(ctx.chat, sendOptions, { quote: rawMessage });
      await ctx.react('✅');
    } catch (error) {
      await ctx.react('❎');
      return ctx.reply('❌ Gagal membuka View Once: ' + String(error.message || error).slice(0, 250));
    }
  }
};