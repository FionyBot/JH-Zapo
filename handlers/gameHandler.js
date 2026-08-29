/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * gameHandler.js — Registry sesi game + listener jawaban.
 * Sesi dikunci per JENIS game per grup. Timeout 60 detik.
 * [UPDATE BELOW]
 *
 * Support clue system (clueCount, supportClue).
 */
import config from '../config.js'
import { logger } from '../core/logger.js'
import { buildContext } from '../core/context.js'
import { grantReward } from '../src/rewards/grant.js'

const sessions = new Map() // key: `${chat}:${type}`

export function startGame(client, chat, type, session) {
  const key = `${chat}:${type}`
  const s = { ...session, id: `${Date.now()}-${Math.random()}`, clueCount: 0 }
  sessions.set(key, s)

  setTimeout(async () => {
    if (sessions.get(key)?.id === s.id) {
      sessions.delete(key)
      try {
        await client.message.send(chat,
`╭─⏰「 *WAKTU HABIS* 」⏰─╮
│
│ 😅 Gak ada yang berhasil jawab.
│ Jawaban: *${s.display}*
│
╰────────────────────✦╯`
        )
      } catch {}
    }
  }, Math.max(1000, s.expiresAt - Date.now()))
}

export function hasGame(chat, type) {
  return sessions.has(`${chat}:${type}`)
}

export function getSession(chat, type) {
  return sessions.get(`${chat}:${type}`)
}

export async function checkGameAnswer(client, event) {
  try {
    if (event.key.fromMe) return
    const chat = event.key.remoteJid
    const ctx = buildContext(client, event)
    const body = (ctx.body ?? '').trim().toLowerCase()
    if (!body) return
    if (config.prefixes.some((p) => body.startsWith(p))) return

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
            text:
`╭─🎉「 *BENAR!* 」🎉─╮
│
│ 👑 @${ctx.senderNumber} berhasil menjawab!
│ Jawaban: *${s.display}*
│
╰────────────────────✦╯`,
            contextInfo: { mentionedJid: [ctx.sender] }
          }
        })
        // Stub reward (log doang, belum aktif)
        await grantReward(client, chat, ctx.sender, key.split(':')[1])
        return
      }
    }

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
        await client.message.send(chat,
`╭─🏳️「 *MENYERAH* 」🏳️─╮
│
│ Jawaban: *${latest.display}*
│ Coba lagi di game berikutnya!
│
╰────────────────────✦╯`
        )
      }
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'game answer check gagal')
  }
}
