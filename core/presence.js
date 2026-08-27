/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * presence.js — Typing indicator & read receipt
 */
import { logger } from './logger.js'

let readWarned = false
let typingWarned = false

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

export async function sendTyping(client, chat) {
  try {
    await client.presence.sendChatstate(chat, { type: 'composing' })
  } catch {
    try {
      await client.presence.sendChatstate(chat, { state: 'composing' })
    } catch (err) {
      if (!typingWarned) {
        typingWarned = true
        logger.warn({ err }, 'Typing indicator gagal')
      }
    }
  }
}
