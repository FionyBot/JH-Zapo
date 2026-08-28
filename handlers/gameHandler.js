/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * gameHandler.js — Registry sesi game + listener jawaban.
 * [FIX AND UPDATE BELOW]
 *
 * Sesi dikunci per JENIS game per grup (`chat:type`) — tebakkata & math
 * bisa jalan bareng; duplikasi game sejenis yang ditolak. Pola ini juga
 * siap buat game lobby (werewolf/mafia/uno) nanti.
 * Timeout 60 detik, dukungan jawaban "nyerah".
 */
import config from '../config.js'
import { logger } from '../core/logger.js'
import { buildContext } from '../core/context.js'

const sessions = new Map() // key: `${chat}:${type}`

export function startGame(client, chat, type, session) {
  const key = `${chat}:${type}`
  const s = { ...session, id: `${Date.now()}-${Math.random()}` }
  sessions.set(key, s)

  setTimeout(async () => {
    if (sessions.get(key)?.id === s.id) {
      sessions.delete(key)
      try {
        await client.message.send(chat, `⏰ Waktu habis! Jawabannya *${s.display}*`)
      } catch { /* grup mungkin udah gak bisa dikirimi */ }
    }
  }, Math.max(1000, s.expiresAt - Date.now()))
}

export function hasGame(chat, type) {
  return sessions.has(`${chat}:${type}`)
}

export async function checkGameAnswer(client, event) {
  try {
    if (event.key.fromMe) return
    const chat = event.key.remoteJid
    const ctx = buildContext(client, event)
    const body = (ctx.body ?? '').trim().toLowerCase()
    if (!body) return
    if (config.prefixes.some((p) => body.startsWith(p))) return // biar command jalan

    // Cocokkan jawaban ke sesi mana pun yang aktif di grup ini
    for (const [key, s] of [...sessions.entries()]) {
      if (!key.startsWith(`${chat}:`)) continue
      if (Date.now() > s.expiresAt) {
        sessions.delete(key)
        continue
      }
      if (body === s.answer) {
        sessions.delete(key)
        await client.message.send(chat, {
          extendedTextMessage: {
            text: `🎉 @${ctx.senderNumber} benar! Jawabannya *${s.display}*`,
            contextInfo: { mentionedJid: [ctx.sender] }
          }
        })
        return
      }
    }

    // "nyerah" → tutup sesi terbaru di grup ini
    if (body === 'nyerah') {
      let latestKey = null
      let latest = null
      for (const [key, s] of sessions.entries()) {
        if (!key.startsWith(`${chat}:`)) continue
        if (!latest || s.expiresAt > latest.expiresAt) {
          latest = s
          latestKey = key
        }
      }
      if (latest) {
        sessions.delete(latestKey)
        await client.message.send(chat, `🏳️ Oke, menyerah. Jawabannya *${latest.display}*`)
      }
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'game answer check gagal')
  }
}
