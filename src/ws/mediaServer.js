/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass.
 * Hargai sebagaimana u mau dihargai.
 * mediaServer.js — WebSocket media proxy stateless
 *
 * Client connect: wss://audio.jhx.my.id/wss/audio?url=<ENCODED>&mime=<MIME>
 *
 * PATCH: kalau param `mime` gak dikirim client (aurora.js cuma kirim url),
 * server sekarang INFER dari ekstensi file — gak lagi fallback buta
 * ke video/mp4 yang bikin blob audio salah label & player gagal decode.
 *
 * Protocol (persis yang dibaca player Aurora):
 *  S→C JSON {type:'start', mime, contentLength}
 *  S→C binary chunks
 *  S→C JSON {type:'end'} | {type:'error', message}
 */

import { WebSocketServer } from 'ws';
import { Readable } from 'node:stream';
import http from 'node:http';
import { URL } from 'node:url';

const EXT_MIME = {
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  ogg: 'audio/ogg',
  wav: 'audio/wav',
  flac: 'audio/flac',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mkv: 'video/x-matroska'
};

function mimeFromUrl(u) {
  const ext = (String(u).split('?')[0].split('.').pop() || '').toLowerCase();
  return EXT_MIME[ext] || null;
}

export function createMediaWsServer({ port = 8090, path = '/wss/audio' } = {}) {
  const server = http.createServer((req, res) => {
    res.writeHead(426, { 'Content-Type': 'text/plain' });
    res.end('Upgrade required');
  });

  const wss = new WebSocketServer({ server, path });

  wss.on('connection', (ws, req) => {
    const u = new URL(req.url, 'http://localhost');
    const sourceUrl = u.searchParams.get('url');

    if (!sourceUrl) {
      console.log('[MediaWS] reject: missing url param');
      ws.close(4001, 'missing url param');
      return;
    }

    // param mime menang; kalau gak ada, infer dari ekstensi; terakhir baru fallback
    const mime = u.searchParams.get('mime') || mimeFromUrl(sourceUrl) || 'application/octet-stream';

    console.log('[MediaWS] connect | mime=' + mime + ' | url=' + sourceUrl.slice(0, 80));

    let cancelled = false;
    ws.on('close', () => { cancelled = true; });
    ws.on('error', () => { cancelled = true; });

    (async () => {
      let stream = null;
      try {
        const res = await fetch(sourceUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          redirect: 'follow'
        });
        if (!res.ok || !res.body) {
          ws.send(JSON.stringify({ type: 'error', message: 'source fetch failed: ' + res.status }));
          try { ws.close(); } catch {}
          return;
        }

        const total = Number(res.headers.get('content-length') || 0);
        ws.send(JSON.stringify({ type: 'start', mime, contentLength: total }));

        stream = Readable.fromWeb(res.body);
        for await (const piece of stream) {
          if (cancelled || ws.readyState !== 1) { cancelled = true; break; }
          ws.send(Buffer.isBuffer(piece) ? piece : Buffer.from(piece));
        }

        try { stream.destroy?.(); } catch {}
        if (!cancelled) ws.send(JSON.stringify({ type: 'end' }));
        try { if (!cancelled) ws.close(); } catch {}
      } catch (e) {
        console.log('[MediaWS] stream error:', e.message || e);
        try { stream?.destroy?.(); } catch {}
        try { ws.send(JSON.stringify({ type: 'error', message: String(e.message || e) })); } catch {}
        try { ws.close(); } catch {}
      }
    })();
  });

  server.listen(port, () => console.log(`[MediaWS] server aktif di :${port}${path}`));
  return { server, wss };
}
