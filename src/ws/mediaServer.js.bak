/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass.
 * Hargai sebagaimana u mau dihargai.
 * mediaServer.js — WebSocket media proxy stateless
 *
 * [UPDATE AND FIX BELOW]
 * Client connect: wss://audio.jhx.my.id/wss/audio?url=<ENCODED>&mime=<MIME>
 *
 * Protocol (persis yang dibaca player Aurora):
 *  S→C JSON {type:'start', mime, contentLength}
 *  S→C binary chunks
 *  S→C JSON {type:'end'} | {type:'error', message}
 *
 * Stateless: gak ada token, gak ada session, gak ada cache.
 * Tiap koneksi = fresh fetch upstream. Simple, smooth, ringan.
 */

import { WebSocketServer } from 'ws';
import { Readable } from 'node:stream';
import http from 'node:http';
import { URL } from 'node:url';

export function createMediaWsServer({ port = 8090, path = '/wss/audio' } = {}) {
  const server = http.createServer((req, res) => {
    res.writeHead(426, { 'Content-Type': 'text/plain' });
    res.end('Upgrade required');
  });

  const wss = new WebSocketServer({ server, path });

  wss.on('connection', (ws, req) => {
    const u = new URL(req.url, 'http://localhost');
    const sourceUrl = u.searchParams.get('url');
    const mime = u.searchParams.get('mime') || 'video/mp4';

    if (!sourceUrl) {
      console.log('[MediaWS] reject: missing url param');
      ws.close(4001, 'missing url param');
      return;
    }

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
