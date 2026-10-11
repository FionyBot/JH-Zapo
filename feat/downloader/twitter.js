/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * twitter.js — Twitter/X Downloader
 */

import { JHTwitter } from '../../scraper/X.js';
import { sendCarousel } from '../../lib/carousel.js';

const TWITTER_URL_REGEX = /https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/i;

function extractUrl(ctx) {
  const text = (ctx.text || '').trim();
  const match = text.match(TWITTER_URL_REGEX);
  if (match) return match[0];

  const quoted = ctx.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
  const quotedMatch = quotedText.match(TWITTER_URL_REGEX);
  if (quotedMatch) return quotedMatch[0];

  return null;
}

function cleanQuality(q) {
  return String(q || '')
    .replace(/download\s+mp4\s*/i, '')
    .replace(/[()]/g, '')
    .trim() || 'HD';
}

function formatCaption(videos, images, url, title) {
  const parts = [];
  if (videos.length) parts.push(`🎬 Video ${cleanQuality(videos[0].quality)}`);
  if (images.length) parts.push(`🖼️ ${images.length} Image`);

  let instruction;
  if (videos.length && images.length) {
    instruction = '🎬 *Video dikirim dulu, gambar menyusul di bawah.*';
  } else if (videos.length) {
    instruction = '🎬 *Video Twitter siap ditonton.*';
  } else if (images.length >= 2) {
    instruction = '👇 *Scroll dan geser untuk melihat semua gambar.*';
  } else {
    instruction = '🖼️ *Single image Twitter.*';
  }

  return [
    '┌───「 🐦 *TWITTER DOWNLOADER* 」───┐',
    '',
    `- *Title:* _${title ? (title.length > 50 ? title.slice(0, 47) + '...' : title) : 'Unknown'}_`,
    `- *Media:* _${parts.join(' + ')}_`,
    `- *Link:* _${url}_`,
    '',
    '└──────────────────────────────────────┘',
    '',
    instruction,
    '',
    '> ✨ _*Powered by FionyVerse*_'
  ].join('\n');
}

async function downloadMedia(url) {
  const axios = (await import('axios')).default;
  const { data: buffer } = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 120000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  const buf = Buffer.from(buffer);
  if (!buf.length) throw new Error('Empty buffer dari URL media');
  return buf;
}

export default {
  name: 'twitter',
  aliases: ['x', 'twt', 'twtdl'],
  tags: 'downloader',
  description: 'Download Twitter/X (video HD + semua gambar via Carousel)',

  async run(ctx) {
    const url = extractUrl(ctx);

    if (!url) {
      return ctx.reply(
        '🐦 *TWITTER DOWNLOADER*\n\n' +
        'Kirim link Twitter/X atau reply pesan yang berisi link.\n\n' +
        '*Contoh:*\n' +
        '`.x https://x.com/A_FionyJKT48/status/2052781238470209712`'
      );
    }

    await ctx.react('⏳');

    let result;
    try {
      result = await JHTwitter(url);
    } catch (e) {
      await ctx.react('❎');
      return ctx.reply('❌ Gagal scrape: ' + String(e.message || e).slice(0, 200));
    }

    if (!result.status) {
      await ctx.react('❎');
      return ctx.reply('❌ Gagal download: ' + (result.error || 'Unknown error'));
    }

    const title = result.data.title || '';
    const videos = result.data.videos || [];
    const images = result.data.images || [];
    const summary = formatCaption(videos, images, url, title);

    try {
      let firstSent = false;
      const nextCaption = (extra) => {
        if (!firstSent) {
          firstSent = true;
          return extra ? summary + '\n\n' + extra : summary;
        }
        return extra || undefined;
      };

      if (videos.length) {
        const hd = videos[0];
        const videoBuffer = await downloadMedia(hd.url);
        await ctx.client.message.send(ctx.chat, {
          type: 'video',
          media: videoBuffer,
          mimetype: 'video/mp4',
          caption: nextCaption()
        });
      }

      if (images.length >= 2) {
        const cards = images.map((img, index) => ({
          imageUrl: img.url,
          body: [
            `*Image ${index + 1} dari ${images.length}*`,
            '',
            '🐦 Twitter/X post'
          ].join('\n'),
          footer: 'Powered by FionyVerse',
          buttons: [
            { type: 'url', displayText: '🌐 Buka di Twitter', url }
          ]
        }));

        await sendCarousel(ctx, {
          text: nextCaption(videos.length ? '🖼️ *Gambar dari post yang sama:*' : ''),
          cards
        });
      } else if (images.length === 1) {
        const imgBuffer = await downloadMedia(images[0].url);
        await ctx.client.message.send(ctx.chat, {
          type: 'image',
          media: imgBuffer,
          mimetype: 'image/jpeg',
          caption: nextCaption()
        });
      }

      await ctx.react('✅');
    } catch (e) {
      await ctx.react('❎');
      return ctx.reply('❌ Error sistem saat mengirim media: ' + String(e.message || e).slice(0, 250));
    }
  }
};