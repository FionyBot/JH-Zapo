/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass.
 * Hargai sebagaimana u mau dihargai.
 * setppgc.js — Ganti foto profil grup.
 */

import sharp from 'sharp';
import { downloadMediaMessage, resolveMediaPayload } from 'zapo-js';
import { isGroupAdmin } from '../../core/permission.js';

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

async function generateFullProfilePicture(buffer) {
  return sharp(buffer)
    .resize(720, 720, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 92 })
    .toBuffer();
}

export default {
  name: 'setppgc',
  aliases: ['setppgrup', 'setppgroup'],
  tags: 'group',
  description: 'Ganti foto profil grup',

  async run(ctx) {
    if (!ctx.isGroup) {
      await ctx.reply('🚫 Khusus grup.');
      return;
    }
    if (!(await isGroupAdmin(ctx))) {
      await ctx.reply('🚫 Khusus Admin grup / Staff bot.');
      return;
    }

    const event = getEvent(ctx);
    const rawMessage = event?.message ?? event;
    const ctxInfo = getContextInfo(rawMessage);
    const targetMessage = ctxInfo?.quotedMessage || rawMessage;

    const payload = targetMessage && resolveMediaPayload(targetMessage);
    const isImage = payload?.mimetype?.startsWith('image/') && !payload.mimetype.includes('webp');

    if (!payload || !isImage) {
      await ctx.reply('Balas sebuah gambar dengan perintah *.setppgc* buat ganti foto profil grup.');
      return;
    }

    await ctx.react('⏳');

    try {
      const stream = await downloadMediaMessage(targetMessage);
      const media = await streamToBuffer(stream);
      const processed = await generateFullProfilePicture(media);

      if (ctx.client.core?.updateProfilePicture) {
        await ctx.client.core.updateProfilePicture(ctx.chat, processed);
      } else if (ctx.client.group?.updateProfilePicture) {
        await ctx.client.group.updateProfilePicture(ctx.chat, processed);
      } else {
        await ctx.client.profile.setProfilePicture(processed, ctx.chat);
      }

      await ctx.react('✅');
      await ctx.reply('Foto profil grup berhasil diganti, Kak.');
    } catch (e) {
      await ctx.react('❎');
      await ctx.reply(`😵 Gagal ganti foto profil grup: ${String(e.message || e).slice(0, 120)}`);
    }
  }
};