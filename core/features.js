import { readdir } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { logger } from './logger.js'

const FEATURES_DIR = fileURLToPath(new URL('../features/', import.meta.url))

const byCommand = new Map()
let loadedCount = 0
const cooldowns = new Map() // Track cooldown per user per command

async function walk(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)))
    } else if (extname(entry.name) === '.js') {
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

/**
 * Cek apakah user masih dalam cooldown untuk command tertentu
 * Return: { onCooldown: boolean, remainingMs: number }
 */
export function checkCooldown(userId, commandName, cooldownMs = 3000) {
  const key = `${userId}:${commandName}`
  const now = Date.now()
  const lastUsed = cooldowns.get(key) || 0
  
  if (now - lastUsed < cooldownMs) {
    return {
      onCooldown: true,
      remainingMs: cooldownMs - (now - lastUsed)
    }
  }
  
  cooldowns.set(key, now)
  return { onCooldown: false, remainingMs: 0 }
}
