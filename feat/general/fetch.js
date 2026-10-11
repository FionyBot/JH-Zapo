/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass.
 * Hargai sebagaimana u mau dihargai.
 * fetch.js — Fetch isi sebuah URL (gambar/teks/json/html/file apapun)
 */
import { format } from 'util';
import path from 'path';
import { onRichReply } from '../../handlers/messageHandler.js';

const RETRY_SESSIONS = (globalThis.JH_FETCH_SESSIONS ??= new Map());

const MAX_REDIRECTS = 20;
const MAX_BYTES = 100 * 1024 * 1024;

function normalizeUrl(input) {
  let text = input.trim();
  if (!/^https?:\/\//i.test(text)) text = 'http://' + text;
  return text;
}

async function doFetch(ctx, startUrl) {
  let redirectUrl = startUrl;
  let redirectCount = 0;

  while (true) {
    if (redirectCount > MAX_REDIRECTS) {
      throw new Error(`Too many redirects (max: ${MAX_REDIRECTS})`);
    }

    const res = await fetch(redirectUrl);

    if ([301, 302, 307, 308].includes(res.status)) {
      const location = res.headers.get('location');
      if (!location) break;
      redirectUrl = new URL(location, redirectUrl).toString();
      redirectCount += 1;
      continue;
    }

    const len = Number(res.headers.get('content-length') || 0);
    if (len > MAX_BYTES) {
      throw new Error('Content-Length kegedean: ' + len + ' byte');
    }

    const contentType = res.headers.get('content-type') || '';
    const filename = path.basename(new URL(redirectUrl).pathname) || 'file';

    if (/^image\//.test(contentType)) {
      const buf = Buffer.from(await res.arrayBuffer());
      await ctx.client.message.send(ctx.chat, {
        type: 'image', media: buf, mimetype: contentType, caption: startUrl
      });
    } else if (/^video\//.test(contentType)) {
      const buf = Buffer.from(await res.arrayBuffer());
      await ctx.client.message.send(ctx.chat, {
        type: 'video', media: buf, mimetype: contentType, caption: startUrl
      });
    } else if (/^text\/html/.test(contentType)) {
      const html = await res.text();
      await ctx.client.message.send(ctx.chat, {
        type: 'document', media: Buffer.from(html), mimetype: 'text/html', fileName: 'file.html'
      });
    } else if (/^text\//.test(contentType)) {
      const txt = await res.text();
      await ctx.reply(txt.slice(0, 65536));
      await ctx.client.message.send(ctx.chat, {
        type: 'document', media: Buffer.from(txt), mimetype: 'text/plain', fileName: 'file.txt'
      });
    } else if (/^application\/json/.test(contentType)) {
      const json = await res.json();
      const pretty = format(JSON.stringify(json, null, 2));
      await ctx.reply(pretty.slice(0, 65536));
      await ctx.client.message.send(ctx.chat, {
        type: 'document', media: Buffer.from(pretty), mimetype: 'application/json', fileName: 'file.json'
      });
    } else {
      const buf = Buffer.from(await res.arrayBuffer());
      await ctx.client.message.send(ctx.chat, {
        type: 'document', media: buf, mimetype: contentType || 'application/octet-stream', fileName: filename
      });
    }

    return;
  }
}

async function runFetch(ctx, url) {
  await ctx.react('⏳');
  try {
    await doFetch(ctx, url);
    await ctx.react('✅');
  } catch (e) {
    await ctx.react('❎');
    await ctx.reply('Gagal fetch: ' + (e.message || e));
    return;
  }

  const token = Math.random().toString(36).slice(2, 10);
  const buttonId = `fetch:retry:${token}`;
  RETRY_SESSIONS.set(buttonId, url);

  onRichReply(buttonId, async (c2) => {
    const savedUrl = RETRY_SESSIONS.get(buttonId);
    RETRY_SESSIONS.delete(buttonId);
    if (!savedUrl) return c2.reply('Sesi tombol udah expired, ketik ulang *.get <url>*.');
    await runFetch(c2, savedUrl);
  });

  await ctx.replyButtons({
    text: `Request to: ${url} was executed.`,
    footer: 'Want to try it again?',
    buttons: [{ id: buttonId, text: '⟳ Try Again' }]
  });
}

export default {
  name: 'get',
  aliases: ['fetch'],
  tags: 'general',
  description: 'Fetch isi sebuah URL (gambar/teks/json/html/file apapun)',

  async run(ctx) {
    const text = (ctx.text || '').trim();
    if (!text) return ctx.reply('URL-nya mana, Kak?');

    const url = normalizeUrl(text);
    await runFetch(ctx, url);
  }
};