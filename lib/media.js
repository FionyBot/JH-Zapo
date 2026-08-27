/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * media.js — Download & upload media
 */
import { logger } from '../core/logger.js'

const MEDIA_FIELDS = [
  'imageMessage',
  'videoMessage',
  'stickerMessage',
  'documentMessage',
  'audioMessage'
]

function withTimeout(promise, ms = 10_000) {
  return Promise.race([
    Promise.resolve(promise),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`timeout unduh media ${ms}ms`)), ms)
    )
  ])
}

function findContainer(message) {
  if (!message) return undefined
  if (MEDIA_FIELDS.some((f) => message[f])) return message

  const quoted = message.extendedTextMessage?.contextInfo?.quotedMessage
  if (quoted && MEDIA_FIELDS.some((f) => quoted[f])) return quoted

  return undefined
}

export async function downloadMedia(client, event) {
  const container = findContainer(event.message)
  if (!container) return undefined

  const field = MEDIA_FIELDS.find((f) => container[f])

  try {
    const bytes = await withTimeout(client.message.downloadBytes(container), 10_000)
    return {
      buffer: Buffer.from(bytes),
      mimetype: container[field]?.mimetype ?? 'application/octet-stream',
      kind: field.replace('Message', '')
    }
  } catch (err) {
    logger.warn({ err: err.message, field }, '📥 Gagal/timeout unduh media')
    return undefined
  }
}
