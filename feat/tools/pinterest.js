/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * pinterest.js — Pinterest Search Feature
 */

import { JHPin } from '../../scraper/PINSEARCH.js';
import { sendCarousel } from '../../lib/carousel.js';

export default {
  name: 'pinterest',
  aliases: ['pin', 'pinsearch'],
  tags: 'tools',
  description: 'Mencari gambar dari Pinterest',

  async run(ctx) {
    const query = (ctx.text || '').trim();

    if (!query) {
      return ctx.reply(
        '✦ *PINTEREST SEARCH* ✦\n\n' +
        'Kirim perintah beserta query pencarian.\n\n' +
        '*Contoh:*\n' +
        '`.pin Fiony JKT48`'
      );
    }

    await ctx.react('⏳');

    let result;
    try {
      result = await JHPin(query, 10);
    } catch (e) {
      await ctx.react('❎');
      return ctx.reply('❌ Gagal scrape: ' + String(e.message || e).slice(0, 200));
    }

    if (!result.status || !result.data || result.data.images.length === 0) {
      await ctx.react('❎');
      return ctx.reply('❌ Pencarian gagal: ' + (result.error || 'Gambar tidak ditemukan.'));
    }

    const data = result.data;

    try {
      const cards = data.images.map((imgUrl, index) => ({
        imageUrl: imgUrl,
        body: `*Hasil ${index + 1} dari ${data.total}*`,
        footer: '📌 Pinterest Search',
        buttons: [
          { type: 'url', displayText: '🌐 Buka Gambar Asli', url: imgUrl }
        ]
      }));

      const textCaption = [
        '┌───「 📌 *PINTEREST SEARCH* 」───┐',
        '',
        `- *Query:* _${data.query}_`,
        `- *Total:* _${data.total} Gambar_`,
        '',
        '└──────────────────────────────────────┘',
        '',
        '> ✨ _*Powered by FionyVerse*_'
      ].join('\n');

      await sendCarousel(ctx, {
        text: textCaption,
        cards
      });

      await ctx.react('✅');
    } catch (e) {
      await ctx.react('❎');
      return ctx.reply('❌ Error mengirim carousel: ' + String(e.message || e).slice(0, 250));
    }
  }
};