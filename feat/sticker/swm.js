/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * swm.js — Colong Stiker Orang dengan WM Kita Sendiri
 *
 * Thanks to XN for helping this. 
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

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function writeExifWebp(webpBuffer, packname, author) {
  const json = {
    "sticker-pack-id": "fionyverse-swm",
    "sticker-pack-name": packname,
    "sticker-pack-publisher": author,
    "emojis": ["😘"]
  };

  const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
  const jsonBuf = Buffer.from(JSON.stringify(json), "utf-8");
  const exif = Buffer.concat([exifAttr, jsonBuf]);
  exif.writeUIntLE(jsonBuf.length, 14, 4);

  const padding = Buffer.alloc(exif.length % 2 === 1 ? 1 : 0);
  const exifChunk = Buffer.alloc(8 + exif.length + padding.length);
  exifChunk.write('EXIF', 0);
  exifChunk.writeUInt32LE(exif.length, 4);
  exif.copy(exifChunk, 8);
  if (padding.length > 0) padding.copy(exifChunk, 8 + exif.length);

  const chunks = [];
  let offset = 12;
  let hasVp8x = false;

  while (offset < webpBuffer.length) {
    if (offset + 8 > webpBuffer.length) break;
    const chunkId = webpBuffer.toString('ascii', offset, offset + 4);
    const chunkSize = webpBuffer.readUInt32LE(offset + 4);
    const chunkTotal = 8 + chunkSize + (chunkSize % 2 === 1 ? 1 : 0);
    
    if (chunkId === 'VP8X') {
      hasVp8x = true;
    }

    if (chunkId !== 'EXIF') {
      chunks.push(webpBuffer.slice(offset, offset + chunkTotal));
    }
    offset += chunkTotal;
  }

  const vp8xChunk = Buffer.from([
    0x56, 0x50, 0x38, 0x58,
    0x0A, 0x00, 0x00, 0x00,
    0x08, 0x00, 0x00, 0x00,
    0xFF, 0x01, 0x00,
    0xFF, 0x01, 0x00
  ]);

  if (!hasVp8x) {
    chunks.unshift(vp8xChunk);
  } else {
    chunks[0][8] |= 0x08;
  }

  chunks.push(exifChunk);

  let payloadSize = 0;
  for (const chunk of chunks) payloadSize += chunk.length;

  const header = Buffer.alloc(12);
  header.write('RIFF', 0);
  header.writeUInt32LE(4 + payloadSize, 4);
  header.write('WEBP', 8);

  return Buffer.concat([header, ...chunks]);
}

export default {
  name: 'swm',
  aliases: ['wm', 'stickerwm', 'stikerwm', 'take'],
  tags: 'sticker',
  description: 'Ubah watermark stiker (.swm packname | author)',

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
        '✦ *STICKER WATERMARK* ✦\n\n' +
        'Reply stiker yang mau diubah watermark-nya.\n\n' +
        '*Format:*\n' +
        '`.swm Nama Pack | Nama Author`\n' +
        '`.swm Nama Pack`\n' +
        '`.swm | Nama Author`'
      );
    }

    const payload = resolveMediaPayload(targetMessage);

    if (!payload || !payload.mimetype || !payload.mimetype.includes('webp')) {
      return ctx.reply('⚠️ Yang di-reply harus berupa stiker, Kak!');
    }

    const text = (ctx.text || '').trim();
    if (!text) {
      return ctx.reply('Teks watermarknya mana? Contoh: *.swm Fiony Bot | JamvanHax0r*');
    }

    let packname = '';
    let author = '';

    if (text.includes('|')) {
      const parts = text.split('|');
      packname = parts[0].trim();
      author = parts.slice(1).join('|').trim();
    } else {
      packname = text;
    }

    await ctx.react('⏳');

    try {
      const stream = await downloadMediaMessage(targetMessage);
      const stickerBuffer = await streamToBuffer(stream);

      const finalSticker = await writeExifWebp(stickerBuffer, packname, author);

      await ctx.client.message.send(
        ctx.chat,
        {
          type: 'sticker',
          media: finalSticker,
          mimetype: 'image/webp'
        },
        { quote: rawMessage }
      );

      await ctx.react('✅');
    } catch (error) {
      await ctx.react('❎');
      return ctx.reply('❌ Gagal merubah watermark stiker: ' + String(error.message || error).slice(0, 250));
    }
  }
};