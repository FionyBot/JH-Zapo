/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * dropTable.js — Random drop logic + index item global + resolver input.
 * [UPDATE BELOW]
 *
 * Tier rarity: common 60% / uncommon 25% / rare 10% / epic 4% / legendary 1%
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const RESOURCES = JSON.parse(readFileSync(join(__dirname, 'resources.json'), 'utf8'))

export const TIER_ICON = {
  common: '⚪',
  uncommon: '🟢',
  rare: '🔵',
  epic: '🟣',
  legendary: '🌟'
}

export const ITEM_INDEX = {}
for (const pool of Object.values(RESOURCES)) {
  for (const [tier, items] of Object.entries(pool)) {
    for (const it of items) ITEM_INDEX[it.id] = { ...it, tier }
  }
}

/** Terima item_id ATAU nama barang → kembalikan item_id valid. */
export function resolveItemId(input) {
  if (!input) return null
  const q = String(input).toLowerCase().trim()
  if (ITEM_INDEX[q]) return q

  for (const [id, it] of Object.entries(ITEM_INDEX)) {
    if (it.name.toLowerCase() === q) return id
  }

  const compact = q.replace(/[\s_\-]+/g, '')
  for (const [id, it] of Object.entries(ITEM_INDEX)) {
    if (id.replace(/[_\-]+/g, '') === compact) return id
    if (it.name.toLowerCase().replace(/\s+/g, '') === compact) return id
  }
  return null
}

const TIER_CHANCES = {
  common: 0.60,
  uncommon: 0.25,
  rare: 0.10,
  epic: 0.04,
  legendary: 0.01
}

function pickTier() {
  const rand = Math.random()
  let cumulative = 0
  for (const [tier, chance] of Object.entries(TIER_CHANCES)) {
    cumulative += chance
    if (rand <= cumulative) return tier
  }
  return 'common'
}

export function rollDrop(activity) {
  const pool = RESOURCES[activity]
  if (!pool) return null

  const tier = pickTier()
  const items = pool[tier]
  if (!items?.length) return null

  const item = items[Math.floor(Math.random() * items.length)]
  return { ...item, tier }
}
