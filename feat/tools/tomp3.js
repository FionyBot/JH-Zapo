/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * tomp3.js — Fitur Pengubah Video/Voice Note Menjadi MP3
 */

import { downloadMediaMessage, resolveMediaPayload } from 'zapo-js';
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

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
  name: 'tomp3',
  aliases: ['toaudio', 'mp3', 'audio'],
  tags: 'tools',
  description: 'Convert Video atau Voice Note menjadi MP3',

  async run(ctx) {
    const event = getEvent(ctx);
    if (!event) return ctx.reply('Gagal mendapatkan event pesan dari sistem.');

    const rawMessage = event.message ?? event;
    const ctxInfo = getContextInfo(rawMessage);
    const targetMessage = ctxInfo?.quotedMessage || rawMessage;

    const payload = targetMessage && resolveMediaPayload(targetMessage);

    if (!payload || (!payload.mimetype?.includes('video') && !payload.mimetype?.includes('audio'))) {
      return ctx.reply(
        '✦ *VIDEO TO MP3* ✦\n\n' +
        'Reply video atau Voice Note dengan perintah `.tomp3` buat ngekstrak suaranya doang.'
      );
    }

    await ctx.react('⏳');

    try {
      const stream = await downloadMediaMessage(targetMessage);
      const mediaBuffer = await streamToBuffer(stream);

      const ext = payload.mimetype.includes('video') ? 'mp4' : 'ogg';
      const tmpDir = os.tmpdir();
      const randName = crypto.randomBytes(5).toString('hex');
      const inputPath = path.join(tmpDir, `${randName}.${ext}`);
      const outputPath = path.join(tmpDir, `${randName}.mp3`);

      await fs.writeFile(inputPath, mediaBuffer);

      await new Promise((resolve, reject) => {
        exec(`ffmpeg -i ${inputPath} -q:a 0 -map a ${outputPath}`, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const audioBuffer = await fs.readFile(outputPath);

      await ctx.client.message.send(
        ctx.chat,
        {
          type: 'audio',
          media: audioBuffer,
          mimetype: 'audio/mpeg',
          ptt: false
        },
        { quote: rawMessage }
      );

      await fs.unlink(inputPath).catch(() => {});
      await fs.unlink(outputPath).catch(() => {});

      await ctx.react('✅');
    } catch (error) {
      await ctx.react('❎');
      return ctx.reply('❌ Gagal convert ke MP3: Pastikan FFmpeg terinstall di server! Error: ' + String(error.message || error).slice(0, 150));
    }
  }
};