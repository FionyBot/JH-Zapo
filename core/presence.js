/**
 * presence.js — typing indicator & read receipt.
 * Keduanya pakai method resmi dari referensi zapo:
 *  - client.message.sendReceipt(event, { type: 'read' })
 *  - client.presence.sendChatstate(jid, { type: 'composing' })
 */
import { logger } from './logger.js'

let readWarned = false
let typingWarned = false

/** Tandai pesan masuk sebagai dibaca (centang biru). */
export async function markRead(client, event) {
  try {
    await client.message.sendReceipt(event, { type: 'read' })
  } catch (err) {
    if (!readWarned) {
      readWarned = true
      logger.warn({ err }, 'Auto-read gagal')
    }
  }
}

/** Nampilin indikator "sedang mengetik..." di chat. */
export async function sendTyping(client, chat) {
  try {
    await client.presence.sendChatstate(chat, { type: 'composing' })
  } catch {
    try {
      // fallback bentuk options alternatif kalau yang pertama ditolak
      await client.presence.sendChatstate(chat, { state: 'composing' })
    } catch (err) {
      if (!typingWarned) {
        typingWarned = true
        logger.warn({ err }, 'Typing indicator gagal')
      }
    }
  }
}
