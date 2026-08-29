/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * database.js — Database abstraction untuk FionyVerse
 */
import Database from 'better-sqlite3'
import fs from 'node:fs'
import { logger } from './logger.js'

const sessionDir = './session'
if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true })
}

const db = new Database(`${sessionDir}/users.sqlite`)

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    jid TEXT PRIMARY KEY,
    name TEXT,
    first_seen INTEGER,
    last_seen INTEGER,
    command_count INTEGER DEFAULT 0,
    banned INTEGER DEFAULT 0,
    gold INTEGER DEFAULT 0,
    xp INTEGER DEFAULT 0,
    gems INTEGER DEFAULT 0
  )
`)

try {
  db.exec(`ALTER TABLE users ADD COLUMN gold INTEGER DEFAULT 0`)
} catch {}
try {
  db.exec(`ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0`)
} catch {}
try {
  db.exec(`ALTER TABLE users ADD COLUMN gems INTEGER DEFAULT 0`)
} catch {}

export function getUser(jid) {
  return db.prepare('SELECT * FROM users WHERE jid = ?').get(jid)
}

export function touchUser(jid, name) {
  const now = Date.now()
  const existing = getUser(jid)

  if (!existing) {
    db.prepare(
      'INSERT INTO users (jid, name, first_seen, last_seen, command_count, banned, gold, xp, gems) VALUES (?, ?, ?, ?, 0, 0, 0, 0, 0)'
    ).run(jid, name ?? null, now, now)
  } else {
    db.prepare(
      'UPDATE users SET last_seen = ?, name = COALESCE(?, name) WHERE jid = ?'
    ).run(now, name ?? null, jid)
  }

  return getUser(jid)
}

export function incrementCommand(jid) {
  db.prepare('UPDATE users SET command_count = command_count + 1 WHERE jid = ?').run(jid)
}

export function setBanned(jid, banned) {
  const res = db.prepare('UPDATE users SET banned = ? WHERE jid = ?').run(banned ? 1 : 0, jid)
  return res.changes > 0
}

export function topUsers(limit = 10) {
  return db.prepare('SELECT * FROM users ORDER BY command_count DESC LIMIT ?').all(limit)
}

export function totalUsers() {
  return db.prepare('SELECT COUNT(*) AS c FROM users').get().c
}

/* ---------- Reward System ---------- */

export function getBalance(jid) {
  touchUser(jid, null)
  const row = db.prepare('SELECT gold, xp, gems FROM users WHERE jid = ?').get(jid)
  return { gold: row.gold, xp: row.xp, gems: row.gems }
}

export function addReward(jid, { gold = 0, xp = 0, gems = 0 } = {}) {
  touchUser(jid, null)
  db.prepare(
    'UPDATE users SET gold = gold + ?, xp = xp + ?, gems = gems + ? WHERE jid = ?'
  ).run(gold, xp, gems, jid)
  return getBalance(jid)
}

export function topByXP(limit = 10) {
  return db.prepare('SELECT * FROM users ORDER BY xp DESC LIMIT ?').all(limit)
}

export function topByGold(limit = 10) {
  return db.prepare('SELECT * FROM users ORDER BY gold DESC LIMIT ?').all(limit)
}
