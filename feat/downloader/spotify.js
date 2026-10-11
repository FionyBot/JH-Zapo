/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * spotify.js — Search dan Download lagu dari Spotify
 */

import { onRichReply } from '../../handlers/messageHandler.js';
import { JHSpotSearch, JHSpotDL, JHSDown } from '../../scraper/SPOTIFY.js';

const SESSIONS = (globalThis.JH_SPOTIFY_SESSIONS ??= new Map());
const PER_PAGE = 3;
const LINE = '━━━━━━━━━━━━━━━━━━━━';

const cut = (s, n) => {
  s = String(s || '').replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
};

async function processDownload(ctx, url, metaData = null) {
  const axios = (await import('axios')).default;
  const rawMessage = ctx.message || ctx.raw;

  await ctx.react('⏳');
  
  try {
    let res = await JHSpotDL(url);
    
    if (!res.status || !res.data?.download_url) {
      res = await JHSDown(url);
    }

    if (!res.status || !res.data?.download_url) {
      await ctx.react('❎');
      return ctx.reply('❌ Gagal mendownload lagu dari semua provider: ' + (res.error || 'Kesalahan sistem.'));
    }

    const title = (metaData?.name || res.data.title || 'Spotify Audio').replace(/[\\/:*?"<>|]/g, '');
    const artist = metaData?.artists || res.data.artist || 'Unknown Artist';
    const album = metaData?.album || 'Unknown Album';
    const duration = metaData?.duration_ms ? (metaData.duration_ms / 60000).toFixed(2).replace('.', ':') : '-';
    
    const caption = 
      `*${title}*\n\n` +
      `*Artist:* ${artist}\n` +
      `*Album:* ${album}\n` +
      `*Duration:* ${duration}\n` +
      `*Link:* ${url}\n\n` +
      `> Downloading audio...`;

    let coverBuffer = null;
    if (metaData && metaData.cover) {
      try {
        const imgRes = await axios.get(metaData.cover, { responseType: 'arraybuffer' });
        coverBuffer = Buffer.from(imgRes.data);
      } catch (e) {}
    }

    if (coverBuffer) {
      await ctx.client.message.send(
        ctx.chat,
        {
          type: 'image',
          media: coverBuffer,
          mimetype: 'image/jpeg',
          caption: caption
        },
        { quote: rawMessage }
      );
    } else {
      await ctx.reply(caption);
    }

    const { data: audioBuffer } = await axios.get(res.data.download_url, { responseType: 'arraybuffer' });

    await ctx.client.message.send(
      ctx.chat,
      {
        type: 'audio',
        media: Buffer.from(audioBuffer),
        mimetype: 'audio/mpeg',
        ptt: false,
        fileName: `${title}.mp3`
      },
      { quote: rawMessage }
    );
    
    await ctx.react('✅');
  } catch (error) {
    await ctx.react('❎');
    return ctx.reply('❌ Terjadi kesalahan saat memproses audio: ' + String(error.message || error).slice(0, 200));
  }
}

async function pickResult(ctx, idx) {
  const sess = SESSIONS.get(ctx.sender);
  if (!sess) return ctx.reply('Sesi habis. Ketik *.spotify <query>* lagi.');
  
  const track = sess.results[idx];
  if (!track) return ctx.reply('Nomor lagu tidak valid.');
  
  SESSIONS.delete(ctx.sender);
  await processDownload(ctx, track.spotify_url, track);
}

async function sendPage(ctx, page) {
  const sess = SESSIONS.get(ctx.sender);
  if (!sess) return ctx.reply('Sesi habis. Ketik *.spotify <query>* lagi.');

  const { results, query } = sess;
  const totalPages = Math.ceil(results.length / PER_PAGE);
  page = Math.max(0, Math.min(page, totalPages - 1));

  const start = page * PER_PAGE;
  const items = results.slice(start, start + PER_PAGE);

  let text = `✦ ──『 🎧 SPOTIFY SEARCH 』── ⚝\n\n`;
  text += `🔎 Query : *${cut(query, 38)}*\n`;
  text += `📄 Page  : ${page + 1}/${totalPages} • ${results.length} hasil\n\n`;
  text += LINE + '\n';

  items.forEach((t, i) => {
    text += `\n${start + i + 1} ─ ${cut(t.name, 45)}\n`;
    text += `    👤 ${cut(t.artists, 35)}\n`;
    text += `    💿 ${cut(t.album || 'Unknown', 35)}\n`;
  });

  text += '\n' + LINE + '\n\n';
  text += `Tap tombol angka buat download audionya 🎧`;

  const buttons = items.map((t, i) => ({
    name: 'quick_reply',
    buttonParamsJson: JSON.stringify({
      display_text: String(start + i + 1),
      id: `spot:${ctx.sender}:pick:${start + i}`
    })
  }));

  if (page > 0) {
    buttons.push({
      name: 'quick_reply',
      buttonParamsJson: JSON.stringify({
        display_text: '◀ Prev',
        id: `spot:${ctx.sender}:prev:${page - 1}`
      })
    });
  }
  
  if (page < totalPages - 1) {
    buttons.push({
      name: 'quick_reply',
      buttonParamsJson: JSON.stringify({
        display_text: 'Next ▶',
        id: `spot:${ctx.sender}:next:${page + 1}`
      })
    });
  }

  items.forEach((t, i) => {
    onRichReply(`spot:${ctx.sender}:pick:${start + i}`, async (c2) => {
      await pickResult(c2, start + i);
    });
  });
  
  if (page > 0) {
    onRichReply(`spot:${ctx.sender}:prev:${page - 1}`, async (c2) => {
      await sendPage(c2, page - 1);
    });
  }
  
  if (page < totalPages - 1) {
    onRichReply(`spot:${ctx.sender}:next:${page + 1}`, async (c2) => {
      await sendPage(c2, page + 1);
    });
  }

  await ctx.client.message.send(ctx.chat, {
    interactiveMessage: {
      body: { text },
      footer: { text: '🎧 FionyVerse • Spotify Downloader' },
      nativeFlowMessage: { buttons, messageVersion: 1 }
    }
  });
}

export default {
  name: 'spotify',
  aliases: ['sp', 'spot', 'spdl'],
  tags: 'downloader',
  description: 'Search dan Download Spotify via Button',

  async run(ctx) {
    const query = (ctx.text || '').trim();
    if (!query) {
      return ctx.reply(
        '✦ *SPOTIFY DOWNLOADER* ✦\n\n' +
        'Ketik: `.spotify <Judul Lagu>`\n' +
        'Atau: `.spotify <Link Spotify>`'
      );
    }

    if (query.includes('spotify.com/track')) {
      const urlMatch = query.match(/https?:\/\/[^\s]+/);
      if (!urlMatch) {
        await ctx.react('❎');
        return ctx.reply('❌ URL tidak valid.');
      }
      return await processDownload(ctx, urlMatch[0]);
    }

    await ctx.react('⏳');
    
    try {
      const searchRes = await JHSpotSearch(query);
      if (!searchRes.status || !searchRes.data?.tracks?.length) {
        await ctx.react('❎');
        return ctx.reply('❌ Lagu tidak ditemukan: ' + (searchRes.error || 'Pencarian kosong.'));
      }

      SESSIONS.set(ctx.sender, { query, results: searchRes.data.tracks });
      await sendPage(ctx, 0);
      await ctx.react('✅');
      
    } catch (e) {
      await ctx.react('❎');
      ctx.reply('❌ Error sistem: ' + String(e.message || e));
    }
  }
};