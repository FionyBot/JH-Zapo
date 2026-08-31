/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * react.js — Helper untuk react ke pesan (typed send resmi zapo).
 */
import { logger } from './logger.js'

/**
 * React emoji ke pesan pakai typed send resmi zapo.
 * @param {import('zapo-js').WaClient} client
 * @param {object} event - Message event
 * @param {string} emoji - Emoji string
 */
export async function reactTo(client, event, emoji) {
  try {
    await client.message.send(event.key.remoteJid, {
      type: 'reaction',
      emoji,
      target: event
    })
  } catch (err) {
    logger.warn({ err: err.message }, 'react gagal')
  }
}
