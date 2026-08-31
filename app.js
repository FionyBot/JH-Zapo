/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * app.js — FionyVerse entry point.
 * Jantung bot! Hati2 dlm mengubah ini!
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
import { normalizeNumber, getStaffEntry } from './core/staff.js'
import { maintenance } from './core/rpg.js'
import { runEval } from './core/evalRunner.js'
import { runExec } from './core/execRunner.js'

const EVAL_PREFIX = /^=?> /
const EXEC_PREFIX = /^\$/

/** [UPDATE] React pakai typed send resmi zapo: { type: 'reaction', emoji, target }. */
async function reactTo(client, event, emoji) {
  try {
    await client.message.send(event.key.remoteJid, {
      type: 'reaction',
      emoji,
      target: event
    })
  } catch { /* react gagal = gak fatal */ }
}

function setupOwnerMetaHandler(client) {
  client.on('message', async (event) => {
    try {
      if (event.key.fromMe) return

      const body =
        event.message?.conversation ??
        event.message?.extendedTextMessage?.text ??
        ''
      if (!body) return
      if (!EVAL_PREFIX.test(body) && !EXEC_PREFIX.test(body)) return

      const primary = event.key.participant ?? event.key.remoteJid
      const alt = event.key.participantAlt ?? event.key.remoteJidAlt
      const pnJid = primary?.endsWith('@lid') ? (alt ?? primary) : primary
      const senderNumber = (pnJid ?? '').split('@')[0].split(':')[0]

      const staffEntry = getStaffEntry(senderNumber)
      if (staffEntry?.role !== 'owner') {
        logger.warn(`meta: ditolak — +${senderNumber} bukan owner`)
        return
      }

      const remoteJid = event.key.remoteJid
      const ctx = {
        client,
        chat: remoteJid,
        sender: primary,
        senderNumber,
        pushName: event.pushName ?? senderNumber,
        react: (emoji) => reactTo(client, event, emoji),
        reply: async (text) => {
          try { await client.message.send(remoteJid, String(text)) } catch {}
        }
      }

      if (EXEC_PREFIX.test(body)) {
        await ctx.react('⏱️')
        const command = body.replace(EXEC_PREFIX, '').trim()
        if (!command) return await ctx.reply('⚠️ Command kosong.')
        const result = await runExec(command)
        let response = ''
        if (result.stdout) response += `📤 STDOUT:\n${result.stdout}\n`
        if (result.stderr) response += `📥 STDERR:\n${result.stderr}\n`
        if (result.error && !result.stdout && !result.stderr) response += `❌ Error: ${result.error.message}`
        await ctx.reply(response || '(no output)')
        return
      }

      await ctx.react('⏱️')
      const asReturn = body.startsWith('=')
      const code = body.replace(EVAL_PREFIX, '')
      const m = { ...event, reply: ctx.reply, react: ctx.react, exp: 0 }
      await runEval(code, { m, conn: client, args: code.split(/\s+/), groupMetadata: null }, asReturn)
    } catch (err) {
      logger.warn({ err: err.message }, 'meta: handler gagal')
    }
  })
}

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

  maintenance()
  setInterval(maintenance, 6 * 60 * 60 * 1000)

  setupOwnerMetaHandler(client)

  client.on('message', (event) => {
    const body =
      event.message?.conversation ??
      event.message?.extendedTextMessage?.text ??
      ''
    if (body && config.prefixes.some((p) => body.startsWith(p) && body.length > p.length)) {
      void reactTo(client, event, '⏱️')
    }

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
