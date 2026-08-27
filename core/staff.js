/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * staff.js — Staff & role management
 */
import config from '../config.js'
import { logger } from './logger.js'

export function normalizeNumber(input) {
  let n = String(input ?? '').replace(/\D/g, '')
  if (n.startsWith('0')) n = `62${n.slice(1)}`
  return n
}

const byNumber = new Map()

for (const entry of config.staff) {
  const n = normalizeNumber(entry.number)
  if (n !== String(entry.number)) {
    logger.warn(`Nomor staff "${entry.number}" dinormalisasi jadi "${n}". Disarankan tulis format internasional tanpa +/0.`)
  }
  byNumber.set(n, entry)
}

export function getStaffEntry(pnNumber, lidJid) {
  return byNumber.get(normalizeNumber(pnNumber)) ?? null
}
