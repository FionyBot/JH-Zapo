/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * mediafire.js — MediaFire Downloader Feature
 */

import { JHMediaFire } from '../../scraper/MEDIAFIRE.js';

export default {
  name: 'mediafire',
  aliases: ['mf', 'mfdl', 'mediafiredl'],
  tags: 'downloader',
  description: 'Download file dari MediaFire',

  async run(ctx) {
    const text = (ctx.text || '').trim();
    const urlMatch = text.match(/https?:\/\/(www\.)?mediafire\.com\/(file|download)\/[^\s]+/i);

    if (!urlMatch) {
      return ctx.reply(
        '✦ *MEDIAFIRE DOWNLOADER* ✦\n\n' +
        'Kirim link MediaFire yang mau di-download.\n' +
        '*Contoh:*\n' +
        '`.mf https://www.mediafire.com/file/xxxxx`'
      );
    }

    const targetUrl = urlMatch[0];
    await ctx.react('⏳');

    try {
      const res = await JHMediaFire(targetUrl);

      if (!res.status) {
        await ctx.react('❎');
        return ctx.reply('❌ Gagal: ' + res.error);
      }

      const { file_name, file_size, download_url } = res.data;
      const rawQuote = ctx.message ?? ctx.event ?? ctx.raw ?? ctx.msg ?? null;

      await ctx.reply(`✅ *File Ditemukan!*\n\n📄 *Nama:* ${file_name}\n⚖️ *Size:* ${file_size}\n\n_Sedang mengunduh dan mengirim file, tunggu sebentar..._`);

      const axios = (await import('axios')).default;
      const { data: fileBuffer, headers } = await axios.get(download_url, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Referer': 'https://www.mediafire.com/'
        }
      });

      const mimeType = headers['content-type'] || 'application/octet-stream';

      await ctx.client.message.send(
        ctx.chat,
        {
          type: 'document',
          media: Buffer.from(fileBuffer),
          fileName: file_name,
          mimetype: mimeType,
          caption: `📥 *MEDIAFIRE DOWNLOADER*\n\n📄 *Nama:* ${file_name}\n⚖️ *Ukuran:* ${file_size}\n> _🤖 *Powered by FionyVerse*_`
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