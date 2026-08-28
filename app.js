/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * app.js — FionyVerse entry point.
 * Jantung file! Hati2 dlm mengubah file ini!
 */
import { createStore, WaClient } from 'zapo-js'
import { createSqliteStore } from '@zapo-js/store-sqlite'
import { createInterface } from 'node:readline'
import fs from 'node:fs'
import config from './config.js'
import { logger, clientLogger } from './core/logger.js'
import { setupQR } from './auth/qrHandler.js'
import { setupPairing } from './auth/pairingHandler.js'
import { setupConnection, markShutdown } from './auth/connectionManager.js'
import { loadFeatures } from './feat/loader.js'
import { route } from './handlers/messageHandler.js'
import { setupGroupHandler } from './handlers/groupHandler.js'
import { setupErrorHandler } from './handlers/errorHandler.js'
import { checkAntilink } from './handlers/antilinkHandler.js'
import { checkGameAnswer } from './handlers/gameHandler.js'
import { normalizeNumber } from './core/staff.js'

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

async function chooseAuth() {
  if (config.auth.method === 'qr') return 'qr'
  if (config.auth.method === 'pairing') return 'pairing'

  if (!process.stdin.isTTY) {
    logger.warn('ℹ️ Mode non-interaktif terdeteksi (pm2). Auth diambil dari config.')
    return config.auth.pairingNumber ? 'pairing' : 'qr'
  }

  console.log('\n🤖 FionyVerse — Authentication')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  [1] 📱 QR Code (scan dari WhatsApp)')
  console.log(`  [2] 🔑 Pairing Code (custom: ${config.auth.customCode})`)
  const answer = await ask('\nInput Jawaban (ketik 1 / 2, lalu Enter): ')
  return answer === '2' ? 'pairing' : 'qr'
}

const sessionDir = './session'
if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true })

const store = createStore({
  backends: {
    sqlite: createSqliteStore({ path: `${sessionDir}/state.sqlite`, driver: 'auto' })
  },
  providers: {
    auth: 'sqlite', signal: 'sqlite', preKey: 'sqlite', session: 'sqlite',
    identity: 'sqlite', senderKey: 'sqlite', appState: 'sqlite',
    privacyToken: 'sqlite', messages: 'sqlite', threads: 'sqlite', contacts: 'sqlite'
  }
})

const client = new WaClient(
  {
    store,
    sessionId: 'default',
    connectTimeoutMs: 15_000,
    nodeQueryTimeoutMs: 30_000,
    history: { enabled: true, requireFullSync: true }
  },
  clientLogger
)

async function main() {
  logger.info(`🚀 ${config.botName} starting...`)

  setupErrorHandler()
  await loadFeatures()
  setupConnection(client)
  setupGroupHandler(client)

  // [Fix] Listener terpisah: antilink & game — routing inti gak disentuh
  client.on('message', (event) => {
    void checkAntilink(client, event)
    void checkGameAnswer(client, event)
    route(client, event).catch((err) => logger.error({ err }, 'Gagal memproses pesan'))
  })

  const method = await chooseAuth()

  if (method === 'pairing') {
    let number = normalizeNumber(config.auth.pairingNumber ?? '')
    if (!number && process.stdin.isTTY) {
      number = normalizeNumber(await ask('📞 Input Jawaban (nomor pairing, contoh 628xxx / 08xxx): '))
      while (!number) {
        number = normalizeNumber(await ask('Nomor tidak valid. Input Jawaban ulang: '))
      }
    }
    if (!number) {
      logger.error('❌ pairingNumber belum diset di config (mode non-interaktif).')
      process.exit(1)
    }

    const requestCode = setupPairing(client, number)
    await client.connect()
    await requestCode()
  } else {
    setupQR(client)
    await client.connect()
  }

  const state = client.auth.getState()
  if (state?.registered) {
    logger.success('✅ Bot berjalan. Ctrl+C buat berhenti.')
  } else {
    logger.info('⏳ Menunggu pairing... bot aktif begitu pairing sukses.')
  }
}

main().catch((err) => {
  logger.error({ err }, '❌ Gagal menjalankan bot')
  process.exit(1)
})

process.on('SIGINT', async () => {
  logger.info('🛑 Mematikan bot...')
  markShutdown()
  try { clientLogger.level = 'error' } catch {}
  await client.disconnect().catch(() => {})
  process.exit(0)
})
