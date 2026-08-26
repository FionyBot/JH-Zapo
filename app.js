import { client } from './core/session.js'
import { logger } from './core/logger.js'
import { showQr } from './core/qr.js'
import { loadFeatures } from './core/features.js'
import { route } from './core/router.js'

await loadFeatures()

client.on('auth_qr', ({ qr, ttlMs }) => {
  showQr(qr, ttlMs).catch((err) => logger.error({ err }, 'Gagal menampilkan QR'))
})

client.on('auth_paired', ({ credentials }) => {
  logger.info(`Berhasil pairing sebagai ${credentials.meJid}`)
})

// zapo-js TIDAK auto-reconnect by design — reconnection loop dengan backoff
// ditangani manual di sini (lihat https://zapo.to/en/guides/reconnection).
const MAX_RECONNECT_ATTEMPTS = 10
let reconnectAttempt = 0

client.on('connection', (event) => {
  if (event.status === 'open') {
    logger.info(`Terhubung${event.isNewLogin ? ' (login baru)' : ''}`)
    reconnectAttempt = 0
    return
  }

  logger.warn({ reason: event.reason, isLogout: event.isLogout }, 'Koneksi terputus')

  if (event.isLogout) {
    logger.error('Device di-unlink. Hapus folder .session/ lalu jalankan ulang untuk pairing baru.')
    return
  }

  void reconnectWithBackoff()
})

async function reconnectWithBackoff() {
  if (reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
    logger.error(`Menyerah setelah ${reconnectAttempt} percobaan reconnect.`)
    return
  }
  const delayMs = Math.min(30_000, 1_000 * 2 ** reconnectAttempt)
  reconnectAttempt += 1
  logger.info(`Reconnect dalam ${delayMs}ms (percobaan ke-${reconnectAttempt})`)
  await new Promise((resolve) => setTimeout(resolve, delayMs))
  try {
    await client.connect()
  } catch (err) {
    logger.error({ err }, 'Reconnect gagal')
    void reconnectWithBackoff()
  }
}

client.on('message', (event) => {
  route(client, event).catch((err) => logger.error({ err }, 'Gagal memproses pesan masuk'))
})

async function main() {
  await client.connect()
  logger.info('Bot berjalan. Tekan Ctrl+C untuk berhenti.')
}

main().catch((err) => {
  logger.error({ err }, 'Gagal menjalankan bot')
  process.exit(1)
})

// Graceful shutdown — disconnect() menyimpan kredensial, tidak logout.
process.on('SIGINT', async () => {
  logger.info('Mematikan bot...')
  await client.disconnect()
  process.exit(0)
})
