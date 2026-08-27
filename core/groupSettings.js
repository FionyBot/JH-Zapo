/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * groupSettings.js — Settings per-grup (SQLite, key-value).
 * Fondasi sistem on/off fitur ber-permission: welcome, bye, game, antilink, dll.
 */
import Database from 'better-sqlite3'
import fs from 'node:fs'

const sessionDir = './session'
if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true })

const db = new Database(`${sessionDir}/settings.sqlite`)

db.exec(`
  CREATE TABLE IF NOT EXISTS group_settings (
    group_jid TEXT,
    setting_key TEXT,
    value TEXT,
    PRIMARY KEY (group_jid, setting_key)
  )
`)

export function getSetting(groupJid, key) {
  const row = db
    .prepare('SELECT value FROM group_settings WHERE group_jid = ? AND setting_key = ?')
    .get(groupJid, key)
  return row?.value ?? null
}

export function setSetting(groupJid, key, value) {
  db.prepare(`
    INSERT INTO group_settings (group_jid, setting_key, value) VALUES (?, ?, ?)
    ON CONFLICT(group_jid, setting_key) DO UPDATE SET value = excluded.value
  `).run(groupJid, key, value)
}

export function isOn(groupJid, key) {
  return getSetting(groupJid, key) === '1'
}

export function setOn(groupJid, key, on) {
  setSetting(groupJid, key, on ? '1' : '0')
}
