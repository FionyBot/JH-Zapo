/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * loader.js — Scan feat/xx/xxx.js, daftarkan ke registry, support reload.
 */
import { readdir } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { logger } from '../core/logger.js'

const FEATURES_DIR = fileURLToPath(new URL('.', import.meta.url))
const SELF = fileURLToPath(import.meta.url)

const byCommand = new Map()
let loadedCount = 0

async function walk(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)))
    } else if (extname(entry.name) === '.js' && fullPath !== SELF) {
      files.push(fullPath)
    }
  }
  return files
}

export async function loadFeatures() {
  byCommand.clear()
  const files = await walk(FEATURES_DIR)
  let count = 0

  for (const filePath of files) {
    try {
      const moduleUrl = `${pathToFileURL(filePath).href}?t=${Date.now()}`
      const mod = await import(moduleUrl)
      const feature = mod.default
      if (!feature?.name || typeof feature.run !== 'function') {
        logger.warn({ file: filePath }, 'Feature dilewati: butuh `name` dan `run()`')
        continue
      }
      byCommand.set(feature.name.toLowerCase(), feature)
      for (const alias of feature.aliases ?? []) {
        byCommand.set(alias.toLowerCase(), feature)
      }
      count += 1
    } catch (err) {
      logger.error({ err, file: filePath }, 'Gagal memuat feature')
    }
  }

  loadedCount = count
  logger.info(`${count} feature dimuat dari ${files.length} file`)
  return count
}

export function getFeature(name) {
  return byCommand.get(name.toLowerCase())
}

export function listFeatures() {
  return [...new Set(byCommand.values())]
}

export function featureCount() {
  return loadedCount
}
