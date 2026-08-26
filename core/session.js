import { createStore, WaClient } from 'zapo-js'
import { createSqliteStore } from '@zapo-js/store-sqlite'
import config from '../bot.config.js'
import { logger } from './logger.js'
import fs from 'node:fs' // 👈 Tambahin import fs

// 👇 TAMBAHKAN INI: Cek dan bikin folder .session kalau belum ada
const sessionDir = '.session'
if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true })
  logger.info(`Folder ${sessionDir} berhasil dibuat.`)
}

// Semua credential & Signal state disimpan di .session/ — folder ini WAJIB
// masuk .gitignore, isinya setara akses penuh ke akun WhatsApp yang dipakai.
const store = createStore({
  backends: {
    sqlite: createSqliteStore({ path: '.session/state.sqlite', driver: 'auto' })
  },
  providers: {
    auth: 'sqlite',
    signal: 'sqlite',
    preKey: 'sqlite',
    session: 'sqlite',
    identity: 'sqlite',
    senderKey: 'sqlite',
    appState: 'sqlite',
    privacyToken: 'sqlite',
    messages: 'sqlite',
    threads: 'sqlite',
    contacts: 'sqlite'
  }
})

export const client = new WaClient(
  {
    store,
    sessionId: config.sessionId,
    connectTimeoutMs: 15_000,
    nodeQueryTimeoutMs: 30_000,
    history: { enabled: true, requireFullSync: true }
  },
  logger
)
