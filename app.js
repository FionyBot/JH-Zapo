/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * app.js — FionyVerse entry point.
 * [Update] Interaktif (node app.js) maupun non-interaktif (pm2) — prompt cuma
 * muncul kalau TTY tersedia & config belum nyetel method/nomor — FLEKSIBEL.
 * Jantung bot! Hati2 dlm mengubah file ini! 
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

  // Non-interaktif (pm2): gak nanya-nanya, putuskan dari config
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

  await loadFeatures()
  setupConnection(client)

  client.on('message', (event) => {
    route(client, event).catch((err) => logger.error({ err }, 'Gagal memproses pesan'))
  })

  const method = await chooseAuth()

  if (method === 'pairing') {
    // Dari config (pm2) kalau ada, sonst tanya interaktif
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
