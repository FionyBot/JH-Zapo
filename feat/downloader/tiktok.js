/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * tiktok.js — TikTok Downloader Feature
 */
import { JHTTDL } from '../../scraper/TIKTOK.js';
import { sendCarousel } from '../../lib/carousel.js';
import { onRichReply } from '../../handlers/messageHandler.js';

const TIKTOK_URL_REGEX = /https?:\/\/(?:(?:www|vt|vm|m)\.)?tiktok\.com\/[^\s<>"']+/i;
const SLIDESHOW_CACHE = new Map();
const CACHE_TTL = 10 * 60 * 1000;

function extractUrl(ctx) {
  const text = String(ctx.text || '');
  const match = text.match(TIKTOK_URL_REGEX);

  if (match) {
    return match[0].replace(/[),.!?]+$/, '');
  }

  const quoted = ctx.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const quotedText =
    quoted?.conversation ||
    quoted?.extendedTextMessage?.text ||
    '';

  const quotedMatch = quotedText.match(TIKTOK_URL_REGEX);

  if (quotedMatch) {
    return quotedMatch[0].replace(/[),.!?]+$/, '');
  }

  return null;
}

function detectMediaType(buffer, contentType, expectedType) {
  const type = String(contentType || '').toLowerCase();

  if (buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    return {
      type: expectedType || 'video',
      mimetype: 'video/mp4'
    };
  }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return {
      type: 'image',
      mimetype: 'image/jpeg'
    };
  }

  if (
    buffer.length >= 8 &&
    buffer.toString('hex', 0, 8) === '89504e470d0a1a0a'
  ) {
    return {
      type: 'image',
      mimetype: 'image/png'
    };
  }

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return {
      type: 'image',
      mimetype: 'image/webp'
    };
  }

  if (type.startsWith('video/')) {
    return {
      type: expectedType || 'video',
      mimetype: type
    };
  }

  if (type.startsWith('image/')) {
    return {
      type: 'image',
      mimetype: type
    };
  }

  if (type.startsWith('audio/')) {
    return {
      type: 'audio',
      mimetype: type
    };
  }

  return null;
}

async function downloadMedia(url, expectedType) {
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
    throw new Error('URL media tidak valid');
  }

  const axios = (await import('axios')).default;
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 120000,
    maxRedirects: 5,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 Chrome/150.0.0.0 Mobile Safari/537.36',
      Accept: '*/*'
    },
    validateStatus: status => status >= 200 && status < 300
  });

  const buffer = Buffer.from(response.data || []);
  const contentType = String(response.headers?.['content-type'] || '')
    .split(';')[0]
    .trim()
    .toLowerCase();

  if (!buffer.length) {
    throw new Error('File media kosong');
  }

  if (
    contentType.includes('text/html') ||
    contentType.includes('application/json')
  ) {
    throw new Error(`URL mengembalikan ${contentType}, bukan file media`);
  }

  const mediaInfo = detectMediaType(buffer, contentType, expectedType);

  if (!mediaInfo) {
    throw new Error(
      `Format file tidak dikenali (content-type: ${contentType || 'tidak diketahui'})`
    );
  }

  if (expectedType === 'video' && mediaInfo.type !== 'video') {
    throw new Error(`URL tidak berisi video (terdeteksi ${mediaInfo.mimetype})`);
  }

  if (expectedType === 'image' && mediaInfo.type !== 'image') {
    throw new Error(`URL tidak berisi gambar (terdeteksi ${mediaInfo.mimetype})`);
  }

  return {
    buffer,
    mimetype: mediaInfo.mimetype,
    type: mediaInfo.type
  };
}

function getErrorMessage(error) {
  const responseData = error?.response?.data;
  let responseText = '';

  if (Buffer.isBuffer(responseData)) {
    responseText = responseData.toString('utf8').slice(0, 300);
  } else if (typeof responseData === 'string') {
    responseText = responseData.slice(0, 300);
  } else if (responseData && typeof responseData === 'object') {
    try {
      responseText = JSON.stringify(responseData).slice(0, 300);
    } catch {}
  }

  const status = error?.response?.status;
  const message = String(error?.message || error || 'Unknown error');

  return [
    status ? `HTTP ${status}` : '',
    message,
    responseText
  ].filter(Boolean).join(' | ').slice(0, 250);
}

function formatCaption(data) {
  const authorName = data.author?.name || 'Unknown';
  const authorUsername = data.author?.username || 'Unknown';
  const plays = Number(data.stats?.playCount || 0);
  const comments = Number(data.stats?.commentCount || 0);
  const shares = Number(data.stats?.shareCount || 0);

  return [
    '┌───「 🎵 *TIKTOK DOWNLOADER* 」───┐',
    '',
    `👤 *Author:* ${authorName} (@${authorUsername})`,
    `📝 *Caption:* ${data.title || '-'}`,
    '',
    '📊 *Statistik:*',
    `▶️ Plays: ${plays.toLocaleString('id-ID')}`,
    `💬 Comments: ${comments.toLocaleString('id-ID')}`,
    `↗️ Shares: ${shares.toLocaleString('id-ID')}`,
    '',
    '└──────────────────────────────────────┘',
    '',
    '> ✨ _*Powered by FionyVerse*_'
  ].join('\n');
}

onRichReply('rich:tt-slideshow', async ctx => {
  const entry = SLIDESHOW_CACHE.get(ctx.chat);

  if (!entry || Date.now() - entry.ts > CACHE_TTL) {
    SLIDESHOW_CACHE.delete(ctx.chat);
    return ctx.reply(
      '⚠️ Session slideshow udah kedaluwarsa (>10 menit).\nKirim ulang link TikTok-nya ya, Kak.'
    );
  }

  await ctx.react('⏳');

  try {
    if (!entry.downloadUrl) {
      throw new Error('Link video slideshow tidak ditemukan');
    }

    const media = await downloadMedia(entry.downloadUrl, 'video');

    await ctx.client.message.send(ctx.chat, {
      type: 'video',
      media: media.buffer,
      mimetype: media.mimetype,
      caption: `${formatCaption(entry.data)}\n\n🎬 *Slideshow Version*`
    });

    SLIDESHOW_CACHE.delete(ctx.chat);
    await ctx.react('✅');
  } catch (error) {
    await ctx.react('❎');
    return ctx.reply(`❌ Gagal convert slideshow: ${getErrorMessage(error)}`);
  }
});

export default {
  name: 'tiktok',
  aliases: ['tt', 'ttdl', 'tiktokdl'],
  tags: 'downloader',
  description: 'Download Video atau Slideshow dari TikTok',

  async run(ctx) {
    const url = extractUrl(ctx);

    if (!url) {
      return ctx.reply(
        '🎵 *TIKTOK DOWNLOADER*\n\n' +
        'Kirim link TikTok atau reply pesan yang berisi link.\n\n' +
        '*Contoh:*\n' +
        '`.tt https://vt.tiktok.com/ZSbkp7fqg/`'
      );
    }

    await ctx.react('⏳');

    let result;

    try {
      result = await JHTTDL(url);
    } catch (error) {
      await ctx.react('❎');
      return ctx.reply(`❌ Gagal scrape: ${getErrorMessage(error)}`);
    }

    if (!result?.status || !result?.data) {
      await ctx.react('❎');
      return ctx.reply(
        '❌ Gagal download: ' +
          (result?.error || 'Terjadi kesalahan saat memproses data.')
      );
    }

    const data = result.data;
    const caption = formatCaption(data);

    try {
      if (data.type === 'video') {
        const videoUrls = [
          data.hdDownloadUrl,
          data.downloadUrl
        ].filter((value, index, array) => {
          return typeof value === 'string' && value && array.indexOf(value) === index;
        });

        if (!videoUrls.length) {
          throw new Error('Link video tidak ditemukan');
        }

        let lastError;

        for (const videoUrl of videoUrls) {
          try {
            const media = await downloadMedia(videoUrl, 'video');

            await ctx.client.message.send(ctx.chat, {
              type: 'video',
              media: media.buffer,
              mimetype: media.mimetype,
              caption
            });

            await ctx.react('✅');
            return;
          } catch (error) {
            lastError = error;
          }
        }

        throw lastError || new Error('Gagal mengunduh video');
      }

      if (data.type === 'carousel' && Array.isArray(data.images) && data.images.length > 0) {
        if (data.images.length === 1) {
          const imageUrl = data.images[0]?.url || data.images[0]?.downloadUrl;

          if (!imageUrl) {
            throw new Error('Link gambar tidak ditemukan');
          }

          const media = await downloadMedia(imageUrl, 'image');

          await ctx.client.message.send(ctx.chat, {
            type: 'image',
            media: media.buffer,
            mimetype: media.mimetype,
            caption
          });
        } else {
          const cards = data.images.map((image, index) => ({
            imageUrl: image.url || image.downloadUrl,
            body: `*Slide ${index + 1} dari ${data.images.length}*`,
            footer: '🎵 TikTok Slideshow',
            buttons: [
              {
                type: 'url',
                displayText: '🌐 Buka di TikTok',
                url
              },
              {
                type: 'reply',
                displayText: '🎬 Convert Slideshow',
                id: 'rich:tt-slideshow'
              }
            ]
          }));

          await sendCarousel(ctx, {
            text: caption,
            cards
          });

          SLIDESHOW_CACHE.set(ctx.chat, {
            downloadUrl: data.downloadUrl || data.hdDownloadUrl,
            data,
            ts: Date.now()
          });
        }

        if (data.audio_url) {
          try {
            const audio = await downloadMedia(data.audio_url, 'audio');

            if (audio.type === 'audio' || audio.mimetype === 'video/mp4') {
              await ctx.client.message.send(ctx.chat, {
                type: 'audio',
                media: audio.buffer,
                mimetype: audio.mimetype
              });
            }
          } catch {}
        }

        await ctx.react('✅');
        return;
      }

      await ctx.react('❎');
      return ctx.reply('⚠️ Format media tidak didukung atau konten kosong.');
    } catch (error) {
      await ctx.react('❎');
      return ctx.reply(`❌ Error mengirim media: ${getErrorMessage(error)}`);
    }
  }
};