/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass.
 * Hargai sebagaimana u mau dihargai.
 * hotReload.js — Watch folder feat/, auto panggil loadFeatures() begitu ada
 * file yang ditambah/diedit/dihapus. Gak perlu ketik .reload manual lagi,
 * dan gak perlu restart bot/session WA sama sekali.
 *
 * Catatan penting: ini cuma nge-cover file di feat/ (command), sama persis
 * kayak yang udh ada di command .reload manual (feat/owner/reload.js) —
 * cuma sekarang triggernye otomatis dari filesystem, bukan dari chat.
 * Perubahan di app.js / core / handlers / lib / auth tetap butuh restart,
 * karena file-file itu di-import sekali pas boot dan di-cache Node (ESM),
 * bukan lewat registry cache-busting kayak feature.
 */
import chokidar from 'chokidar'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'
import { logger } from './logger.js'
import { loadFeatures } from '../feat/loader.js'
import config from '../config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = join(__dirname, '..')
const FEAT_DIR = join(ROOT_DIR, 'feat')

const EVENT_LABEL = {
  add: 'File baru ➕',
  change: 'File diedit ✏️',
  unlink: 'File dihapus 🗑️'
}

let watcher = null
let debounceTimer = null
let pendingChanges = new Set()
let isReloading = false
let rerunQueued = false
let clientRef = null

function ownerJids() {
  return (config.staff ?? [])
    .filter((entry) => entry.role === 'owner')
    .map((entry) => `${entry.number}@s.whatsapp.net`)
}

function queueReload(eventName, filePath) {
  const rel = relative(FEAT_DIR, filePath) || filePath
  pendingChanges.add(`${EVENT_LABEL[eventName] ?? eventName}: ${rel}`)
  logger.info(`♻️  [Hot Reload] ${EVENT_LABEL[eventName] ?? eventName} — ${rel}`)

  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(runReload, config.hotReload?.debounceMs ?? 400)
}

async function notifyOwners(changes, count) {
  if (!config.hotReload?.notifyOwner || !clientRef) return
  const text =
    `♻️ *Hot Reload*\n${changes.map((c) => `• ${c}`).join('\n')}\n\n` +
    `✅ ${count} feature aktif.`

  for (const jid of ownerJids()) {
    try {
      await clientRef.message.send(jid, text)
    } catch (err) {
      logger.warn({ err, jid }, '⚠️  [Hot Reload] Gagal kirim notifikasi ke owner')
    }
  }
}

async function runReload() {
  if (isReloading) {
    rerunQueued = true
    return
  }
  isReloading = true

  const changes = [...pendingChanges]
  pendingChanges.clear()

  try {
    const count = await loadFeatures()
    logger.success(`✅ [Hot Reload] Selesai — ${count} feature aktif (${changes.length} file berubah).`)
    await notifyOwners(changes, count)
  } catch (err) {
    logger.error({ err }, '❌ [Hot Reload] Gagal reload feature')
  } finally {
    isReloading = false
    if (rerunQueued) {
      rerunQueued = false
      void runReload()
    }
  }
}

/**
 * JH — FIONY
 * Nyalain watcher. Panggil sekali di app.js setelah loadFeatures() pertama.
 * @param {import('zapo-js').WaClient} client - dipakai buat notif owner (opsional)
 */
export function setupHotReload(client) {
  if (config.hotReload?.enabled === false) {
    logger.info('⏸️  [Hot Reload] Nonaktif (config.hotReload.enabled = false).')
    return null
  }

  if (watcher) return watcher

  clientRef = client ?? null

  watcher = chokidar.watch(FEAT_DIR, {
    ignoreInitial: true,
    persistent: true,
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 }
  })

  watcher
    .on('add', (p) => queueReload('add', p))
    .on('change', (p) => queueReload('change', p))
    .on('unlink', (p) => queueReload('unlink', p))
    .on('error', (err) => logger.error({ err }, '❌ [Hot Reload] Watcher error'))

  logger.info(`👀 [Hot Reload] Memantau folder "${relative(ROOT_DIR, FEAT_DIR)}/" — auto reload aktif.`)
  return watcher
}

/** Matiin watcher, dimulai pas bot shutdown (SIGINT). */
export async function stopHotReload() {
  if (!watcher) return
  clearTimeout(debounceTimer)
  await watcher.close()
  watcher = null
}
