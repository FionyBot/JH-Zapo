/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * smeme.js — Bikin Gambar Menjadi Stiker Meme
 *
 * Thanks to XN for helping this. 
 */

import { downloadMediaMessage, resolveMediaPayload } from 'zapo-js';
import { loadImage, createCanvas } from '@napi-rs/canvas';

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
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function writeExifWebp(webpBuffer, packname, author) {
  const json = {
    'sticker-pack-id': 'fionyverse-smeme',
    'sticker-pack-name': packname,
    'sticker-pack-publisher': author,
    emojis: ['😘']
  };

  const exifAttr = Buffer.from([
    0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
    0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00
  ]);

  const jsonBuf = Buffer.from(JSON.stringify(json), 'utf-8');
  const exif = Buffer.concat([exifAttr, jsonBuf]);

  exif.writeUIntLE(jsonBuf.length, 14, 4);

  const padding = Buffer.alloc(exif.length % 2 === 1 ? 1 : 0);
  const exifChunk = Buffer.alloc(8 + exif.length + padding.length);

  exifChunk.write('EXIF', 0);
  exifChunk.writeUInt32LE(exif.length, 4);
  exif.copy(exifChunk, 8);

  if (padding.length > 0) {
    padding.copy(exifChunk, 8 + exif.length);
  }

  const vp8xIndex = webpBuffer.indexOf(Buffer.from('VP8X', 'ascii'));

  if (vp8xIndex === -1) {
    const vp8xChunk = Buffer.from([
      0x56, 0x50, 0x38, 0x58, 0x0A, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00,
      0xFF, 0x01, 0x00, 0xFF, 0x01, 0x00
    ]);

    const newRiffSize = webpBuffer.length - 8 + 18 + exifChunk.length;
    const header = Buffer.alloc(12);

    header.write('RIFF', 0);
    header.writeUInt32LE(newRiffSize, 4);
    header.write('WEBP', 8);

    return Buffer.concat([
      header,
      vp8xChunk,
      webpBuffer.slice(12),
      exifChunk
    ]);
  }

  webpBuffer[vp8xIndex + 8] |= 0x08;

  const originalRiffSize = webpBuffer.readUInt32LE(4);
  webpBuffer.writeUInt32LE(originalRiffSize + exifChunk.length, 4);

  return Buffer.concat([
    webpBuffer,
    exifChunk
  ]);
}

function isEmojiSegment(segment) {
  return /[\p{Extended_Pictographic}\p{Regional_Indicator}]/u.test(segment);
}

function splitTextSegments(text) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter('id', {
      granularity: 'grapheme'
    });
    return Array.from(segmenter.segment(text), item => item.segment);
  }
  return Array.from(text);
}

function getTextWidth(ctx, text, fontSize) {
  const segments = splitTextSegments(text);
  let width = 0;

  for (const segment of segments) {
    if (isEmojiSegment(segment)) {
      ctx.font = `${fontSize}px "Noto Color Emoji"`;
    } else {
      ctx.font = `900 ${fontSize}px "Impact", "Arial Black", sans-serif`;
    }
    width += ctx.measureText(segment).width;
  }

  return width;
}

function drawMixedText(ctx, text, centerX, centerY, fontSize, maxWidth) {
  if (!text) return;

  const segments = splitTextSegments(text);
  const textWidth = getTextWidth(ctx, text, fontSize);
  const scale = textWidth > maxWidth ? maxWidth / textWidth : 1;
  const finalFontSize = Math.max(Math.floor(fontSize * scale), 12);
  const finalTextWidth = getTextWidth(ctx, text, finalFontSize);

  let currentX = centerX - finalTextWidth / 2;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(Math.floor(finalFontSize / 6), 3);
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'black';

  for (const segment of segments) {
    const emoji = isEmojiSegment(segment);

    if (emoji) {
      ctx.font = `${finalFontSize}px "Noto Color Emoji"`;
    } else {
      ctx.font = `900 ${finalFontSize}px "Impact", "Arial Black", sans-serif`;
    }

    const segmentWidth = ctx.measureText(segment).width;

    if (!emoji) {
      ctx.strokeText(segment, currentX, centerY);
    }
    ctx.fillText(segment, currentX, centerY);

    currentX += segmentWidth;
  }
}

async function createMeme(imageBuffer, topText, bottomText) {
  const img = await loadImage(imageBuffer);
  const size = 512;

  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  const scale = Math.min(size / img.width, size / img.height);
  const w = img.width * scale;
  const h = img.height * scale;

  const x = (size - w) / 2;
  const y = (size - h) / 2;

  ctx.drawImage(img, x, y, w, h);

  const fontSize = Math.max(Math.floor(h / 8), 24);
  const maxWidth = w * 0.95;

  drawMixedText(
    ctx,
    topText,
    size / 2,
    y + (fontSize / 2) + 10,
    fontSize,
    maxWidth
  );

  drawMixedText(
    ctx,
    bottomText,
    size / 2,
    y + h - (fontSize / 2) - 10,
    fontSize,
    maxWidth
  );

  return canvas.encode('webp');
}

export default {
  name: 'smeme',
  aliases: ['stickermeme', 'stikermeme', 'sm'],
  tags: 'sticker',
  description: 'Bikin stiker meme dari gambar (.smeme atas | bawah)',

  async run(ctx) {
    const event = getEvent(ctx);

    if (!event) {
      return ctx.reply('Gagal mendapatkan event pesan dari sistem.');
    }

    const rawMessage = event.message ?? event;
    const ctxInfo = getContextInfo(rawMessage);
    const targetMessage = ctxInfo?.quotedMessage || rawMessage;

    const payload = targetMessage
      ? resolveMediaPayload(targetMessage)
      : null;

    if (
      !payload ||
      !payload.mimetype ||
      !payload.mimetype.includes('image')
    ) {
      return ctx.reply(
        '✦ *STICKER MEME* ✦\n\n' +
        'Kirim/reply gambar dengan format:\n' +
        '`.smeme teks atas | teks bawah`\n' +
        '`.smeme teks atas doang`\n' +
        '`.smeme | teks bawah doang`'
      );
    }

    const text = (ctx.text || '').trim();

    if (!text) {
      return ctx.reply(
        'Teksnya mana Kak? Contoh: *.smeme Fiony🥰 | Kesayangan JH*'
      );
    }

    let topText = '';
    let bottomText = '';

    if (text.includes('|')) {
      const parts = text.split('|');

      topText = parts[0].trim().toUpperCase();
      bottomText = parts.slice(1).join('|').trim().toUpperCase();
    } else {
      topText = text.toUpperCase();
    }

    await ctx.react('⏳');

    try {
      const stream = await downloadMediaMessage(targetMessage);
      const imgBuffer = await streamToBuffer(stream);

      const rawWebp = await createMeme(
        imgBuffer,
        topText,
        bottomText
      );

      const finalSticker = await writeExifWebp(
        rawWebp,
        'Made with',
        'Fiony Bot♡'
      );

      await ctx.client.message.send(
        ctx.chat,
        {
          type: 'sticker',
          media: finalSticker,
          mimetype: 'image/webp'
        },
        {
          quote: rawMessage
        }
      );

      await ctx.react('✅');
    } catch (error) {
      await ctx.react('❎');

      return ctx.reply(
        '❌ Gagal membuat sticker meme: ' +
        String(error.message || error).slice(0, 250)
      );
    }
  }
};