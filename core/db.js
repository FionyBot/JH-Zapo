/**
 * db.js — database user sederhana pakai better-sqlite3.
 * File DB disimpan di .session/users.sqlite (otomatis ke-gitignore lewat pola *.sqlite).
 */
import Database from 'better-sqlite3'
import fs from 'node:fs'

const sessionDir = '.session'
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
    banned INTEGER DEFAULT 0
  )
`)

export function getUser(jid) {
  return db.prepare('SELECT * FROM users WHERE jid = ?').get(jid)
}

/** Catat user baru / perbarui last_seen & nama. Return row user. */
export function touchUser(jid, name) {
  const now = Date.now()
  const existing = getUser(jid)

  if (!existing) {
    db.prepare(
      'INSERT INTO users (jid, name, first_seen, last_seen, command_count, banned) VALUES (?, ?, ?, ?, 0, 0)'
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

