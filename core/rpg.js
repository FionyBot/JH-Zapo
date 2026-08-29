/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * rpg.js — Character management Nusantara Wilds + maintenance DB.
 * [UPDATE BELOW]
 *
 * Rest time-based (lazy resolve), penangkal DB bengkak,
 * + getCompletedQuestIds buat urutan story quest.
 */
import Database from 'better-sqlite3'
import fs from 'node:fs'
import { logger } from './logger.js'

const sessionDir = './session'
if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true })
}

const db = new Database(`${sessionDir}/rpg.sqlite`)

db.exec(`
  CREATE TABLE IF NOT EXISTS rpg_characters (
    jid TEXT PRIMARY KEY,
    name TEXT,
    hp INTEGER DEFAULT 100,
    max_hp INTEGER DEFAULT 100,
    energy INTEGER DEFAULT 100,
    max_energy INTEGER DEFAULT 100,
    stamina INTEGER DEFAULT 100,
    max_stamina INTEGER DEFAULT 100,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    gold INTEGER DEFAULT 0,
    location TEXT DEFAULT 'desa',
    rest_started_at INTEGER DEFAULT 0,
    rest_duration INTEGER DEFAULT 0,
    rest_base_energy INTEGER DEFAULT 0,
    rest_base_stamina INTEGER DEFAULT 0,
    rest_base_hp INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  )
`)

for (const col of [
  'rest_started_at', 'rest_duration',
  'rest_base_energy', 'rest_base_stamina', 'rest_base_hp'
]) {
  try { db.exec(`ALTER TABLE rpg_characters ADD COLUMN ${col} INTEGER DEFAULT 0`) } catch {}
}

db.exec(`
  CREATE TABLE IF NOT EXISTS rpg_inventory (
    jid TEXT,
    item_id TEXT,
    amount INTEGER DEFAULT 0,
    PRIMARY KEY (jid, item_id)
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS rpg_quests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jid TEXT,
    quest_type TEXT,
    quest_id TEXT,
    progress INTEGER DEFAULT 0,
    target INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  )
`)

db.exec(`CREATE INDEX IF NOT EXISTS idx_quests_jid_status ON rpg_quests(jid, status)`)

/* ---------- internal ---------- */

function readRaw(jid) {
  return db.prepare('SELECT * FROM rpg_characters WHERE jid = ?').get(jid)
}

function write(jid, updates) {
  const fields = Object.keys(updates)
  if (!fields.length) return readRaw(jid)
  const sets = fields.map((f) => `${f} = ?`).join(', ')
  const values = fields.map((f) => updates[f])
  values.push(jid)
  db.prepare(`UPDATE rpg_characters SET ${sets} WHERE jid = ?`).run(...values)
  return readRaw(jid)
}

function resolveRest(raw) {
  if (!raw) return raw
  if (!raw.rest_started_at) {
    return { ...raw, resting: false, restProgress: 0, restRemaining: 0 }
  }

  const now = Math.floor(Date.now() / 1000)
  const elapsed = now - raw.rest_started_at
  const duration = Math.max(1, raw.rest_duration)

  if (elapsed >= duration) {
    const done = write(raw.jid, {
      energy: raw.max_energy,
      stamina: raw.max_stamina,
      hp: raw.max_hp,
      rest_started_at: 0,
      rest_duration: 0,
      rest_base_energy: 0,
      rest_base_stamina: 0,
      rest_base_hp: 0
    })
    return { ...done, resting: false, restProgress: 1, restRemaining: 0 }
  }

  const p = elapsed / duration
  const lerp = (base, max) => Math.floor(base + (max - base) * p)
  return {
    ...raw,
    energy: lerp(raw.rest_base_energy, raw.max_energy),
    stamina: lerp(raw.rest_base_stamina, raw.max_stamina),
    hp: lerp(raw.rest_base_hp, raw.max_hp),
    resting: true,
    restProgress: p,
    restRemaining: duration - elapsed
  }
}

/* ---------- Character ---------- */

export function getCharacter(jid) {
  return resolveRest(readRaw(jid))
}

export function createCharacter(jid, name) {
  const existing = readRaw(jid)
  if (existing) return resolveRest(existing)
  db.prepare('INSERT INTO rpg_characters (jid, name) VALUES (?, ?)').run(jid, name ?? 'Petualang')
  return getCharacter(jid)
}

export function updateCharacter(jid, updates) {
  return resolveRest(write(jid, updates))
}

export function startRest(jid) {
  const c = getCharacter(jid)
  const missing =
    (c.max_energy - c.energy) + (c.max_stamina - c.stamina) + (c.max_hp - c.hp)
  const duration = Math.min(600, Math.max(30, missing * 2))
  const now = Math.floor(Date.now() / 1000)

  write(jid, {
    rest_started_at: now,
    rest_duration: duration,
    rest_base_energy: c.energy,
    rest_base_stamina: c.stamina,
    rest_base_hp: c.hp
  })

  return { duration }
}

export function gainXp(jid, amount) {
  const char = getCharacter(jid)
  if (!char) return { char: null, leveledUp: false }

  let xp = char.xp + amount
  let level = char.level
  let { max_hp, max_energy, max_stamina } = char
  let leveledUp = false

  while (xp >= level * 100) {
    xp -= level * 100
    level += 1
    leveledUp = true
    max_hp += 10
    max_energy += 5
    max_stamina += 5
  }

  const updates = { xp, level, max_hp, max_energy, max_stamina }
  if (leveledUp) {
    updates.hp = max_hp
    updates.energy = max_energy
    updates.stamina = max_stamina
    updates.rest_started_at = 0
    updates.rest_duration = 0
  }

  return { char: updateCharacter(jid, updates), leveledUp }
}

export function resetCharacter(jid) {
  db.prepare('DELETE FROM rpg_characters WHERE jid = ?').run(jid)
  db.prepare('DELETE FROM rpg_inventory WHERE jid = ?').run(jid)
  db.prepare('DELETE FROM rpg_quests WHERE jid = ?').run(jid)
}

export function resetAllCharacters() {
  db.prepare('DELETE FROM rpg_characters').run()
  db.prepare('DELETE FROM rpg_inventory').run()
  db.prepare('DELETE FROM rpg_quests').run()
}

/* ---------- Inventory ---------- */

export function getInventory(jid) {
  return db.prepare('SELECT * FROM rpg_inventory WHERE jid = ? AND amount > 0').all(jid)
}

export function addItem(jid, itemId, amount = 1) {
  const existing = db.prepare(
    'SELECT amount FROM rpg_inventory WHERE jid = ? AND item_id = ?'
  ).get(jid, itemId)

  if (existing) {
    db.prepare('UPDATE rpg_inventory SET amount = amount + ? WHERE jid = ? AND item_id = ?')
      .run(amount, jid, itemId)
  } else {
    db.prepare('INSERT INTO rpg_inventory (jid, item_id, amount) VALUES (?, ?, ?)')
      .run(jid, itemId, amount)
  }
}

export function removeItem(jid, itemId, amount = 1) {
  const existing = db.prepare(
    'SELECT amount FROM rpg_inventory WHERE jid = ? AND item_id = ?'
  ).get(jid, itemId)

  if (!existing || existing.amount < amount) return false

  const left = existing.amount - amount
  if (left <= 0) {
    db.prepare('DELETE FROM rpg_inventory WHERE jid = ? AND item_id = ?').run(jid, itemId)
  } else {
    db.prepare('UPDATE rpg_inventory SET amount = ? WHERE jid = ? AND item_id = ?')
      .run(left, jid, itemId)
  }
  return true
}

/* ---------- Quest ---------- */

export function addQuest(jid, questType, questId, target) {
  db.prepare('INSERT INTO rpg_quests (jid, quest_type, quest_id, target) VALUES (?, ?, ?, ?)')
    .run(jid, questType, questId, target)
  return getActiveQuests(jid)
}

export function getActiveQuests(jid) {
  return db.prepare("SELECT * FROM rpg_quests WHERE jid = ? AND status = 'active'").all(jid)
}

export function getCompletedQuestIds(jid) {
  return db.prepare(
    "SELECT quest_id FROM rpg_quests WHERE jid = ? AND status = 'completed'"
  ).all(jid).map((r) => r.quest_id)
}

export function updateQuestProgress(jid, questId, increment = 1) {
  const quest = db.prepare(
    "SELECT * FROM rpg_quests WHERE jid = ? AND quest_id = ? AND status = 'active'"
  ).get(jid, questId)
  if (!quest) return null

  const progress = quest.progress + increment
  const status = progress >= quest.target ? 'completed' : 'active'
  db.prepare('UPDATE rpg_quests SET progress = ?, status = ? WHERE id = ?')
    .run(progress, status, quest.id)

  return { ...quest, progress, status }
}

export function clearQuests(jid) {
  db.prepare('DELETE FROM rpg_quests WHERE jid = ?').run(jid)
}

/* ---------- Stats ---------- */

export function getAllCharacters(limit = 10) {
  return db.prepare('SELECT * FROM rpg_characters ORDER BY level DESC, xp DESC LIMIT ?').all(limit)
}

export function getCharacterStats(jid) {
  const char = getCharacter(jid)
  if (!char) return null
  return { ...char, inventory: getInventory(jid), activeQuests: getActiveQuests(jid).length }
}

/* ---------- Maintenance ---------- */

export function maintenance() {
  try {
    db.prepare('DELETE FROM rpg_inventory WHERE amount <= 0').run()

    const cutoff = Math.floor(Date.now() / 1000) - 7 * 86400
    const cleaned = db.prepare(
      "DELETE FROM rpg_quests WHERE status != 'active' AND created_at < ?"
    ).run(cutoff)

    db.pragma('wal_checkpoint(TRUNCATE)')
    db.pragma('optimize')

    logger.info(`🧹 RPG maintenance: ${cleaned.changes} quest lama dibersihkan`)
  } catch (err) {
    logger.warn({ err: err.message }, 'RPG maintenance gagal')
  }
}
