/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass.
 * Hargai sebagaimana u mau dihargai.
 * iqc.js — iPhone Quote Chat maker. Render origins by JAMVANHAX0R — FIONY BOT.
 */

import { generateIqc } from '../../lib/iqcGenerator.js';

function parseArgs(raw) {
  const parts = raw.split('|').map((p) => p.trim());
  return {
    text: parts[0] || '',
    chatTime: parts[1] || null,
    statusBarTime: parts[2] || null
  };
}

export default {
  name: 'iqc',
  aliases: ['iphonequote', 'quotechat'],
  tags: 'media',
  description: 'Bikin gambar iPhone Quote Chat (long-press context menu ala iOS)',

  async run(ctx) {
    const raw = (ctx.text || '').trim();
    
    if (!raw) {
      return ctx.reply(
        '✦ *iPhone Quote Chat* ✦\n\n' +
        'Cara pake:\n*.iqc <teks>*\n' +
        'Custom jam:\n*.iqc <teks>|<chatTime>|<statusBarTime>*\n\n' +
        'Contoh:\n.iqc Fiony cantik\n.iqc Fiony cantik|22:11|22:20'
      );
    }

    const { text, chatTime, statusBarTime } = parseArgs(raw);
    
    if (!text) {
      return ctx.reply('Teksnya mana? Contoh: *.iqc Fiony cantik*');
    }

    await ctx.react('⏳');
    
    try {
      const buffer = await generateIqc({ text, chatTime, statusBarTime });

      await ctx.client.message.send(ctx.chat, {
        type: 'image',
        media: buffer,
        mimetype: 'image/png'
      });

      await ctx.react('✅');
    } catch (e) {
      await ctx.react('❎');
      return ctx.reply('Gagal bikin iPhone Quote Chat: ' + (e.message || e));
    }
  }
};