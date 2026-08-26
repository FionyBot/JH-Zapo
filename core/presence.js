/**
 * presence.js — adapter typing indicator & read receipt.
 */
import { logger } from './logger.js'

let presenceWarned = false
let readWarned = false

/** Nampilin indikator "sedang mengetik..." di chat. */
export async function sendTyping(client, chat) {
  const attempts = []
  const p = client.presence

  if (typeof p?.send === 'function') {
    attempts.push(() => p.send({ chat, type: 'composing' }))
    attempts.push(() => p.send(chat, 'composing'))
  }
  if (typeof p?.setTyping === 'function') attempts.push(() => p.setTyping(chat, true))
  if (typeof p?.broadcast === 'function') attempts.push(() => p.broadcast({ chat, type: 'composing' }))
  if (typeof client.sendPresenceUpdate === 'function') {
    attempts.push(() => client.sendPresenceUpdate('composing', chat))
  }

  for (const attempt of attempts) {
    try {
      await attempt()
      return
    } catch {
      // bentuk salah, coba berikutnya
    }
  }

  if (!presenceWarned) {
    presenceWarned = true
    logger.warn('API presence zapo tidak dikenali — indikator typing dinonaktifkan. Cek docs zapo halaman "Presence & status".')
  }
}

/** Tandai pesan masuk sebagai dibaca (read receipt). */
export async function markRead(client, event) {
  const key = event.key
  const candidates = [
    [client.message, client.message?.read],
    [client.message, client.message?.markRead],
    [client, client.readMessages],
    [client.receipt, client.receipt?.read]
  ]

  for (const [thisArg, fn] of candidates) {
    if (typeof fn !== 'function') continue
    try {
      await fn.call(thisArg, [key])
      return
    } catch {
      // coba kandidat berikutnya
    }
  }

  if (!readWarned) {
    readWarned = true
    logger.warn('API read-receipt zapo tidak dikenali — auto-read dinonaktifkan. Cek docs zapo halaman "Receiving messages".')
  }
}
