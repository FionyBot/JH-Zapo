/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * connectionManager.js — Connection state & reconnection dengan backoff.
 */
import { logger } from '../core/logger.js'

let shuttingDown = false

export function markShutdown() {
  shuttingDown = true
}

export function setupConnection(client) {
  const MAX_RECONNECT_ATTEMPTS = 10
  let reconnectAttempt = 0

  client.on('connection', (event) => {
    if (shuttingDown) return // intentional close — diem aja

    if (event.status === 'open') {
      logger.success(`🟢 Terhubung${event.isNewLogin ? ' (login baru)' : ''}`)
      reconnectAttempt = 0
      return
    }

    logger.warn({ reason: event.reason, isLogout: event.isLogout }, '🔴 Koneksi terputus')

    if (event.isLogout) {
      logger.error('❌ Device di-unlink. Hapus folder session/ lalu jalankan ulang.')
      return
    }

    void reconnectWithBackoff()
  })

  async function reconnectWithBackoff() {
    if (shuttingDown) return
    if (reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
      logger.error(`❌ Menyerah setelah ${reconnectAttempt} percobaan reconnect.`)
      return
    }
    const delayMs = Math.min(30_000, 1_000 * 2 ** reconnectAttempt)
    reconnectAttempt += 1
    logger.info(`⏳ Reconnect dalam ${delayMs}ms (percobaan ke-${reconnectAttempt})`)
    await new Promise((resolve) => setTimeout(resolve, delayMs))
    try {
      await client.connect()
    } catch (err) {
      logger.error({ err: err.message }, '❌ Reconnect gagal')
      void reconnectWithBackoff()
    }
  }
}
