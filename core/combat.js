/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * combat.js — Equipment & battle engine Nusantara Wilds.
 *
 * - Loadout: slot weapon & armor, durability senjata turun tiap menang
 * - Battle: simulasi ronde sederhana (atk vs def + rand), biaya energi/stamina
 * - Menang → loot + gold + XP + quest metric kill:*
 * - Kalah → HP 1, XP penghibur
 */
import Database from 'better-sqlite3'
import fs from 'node:fs'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { getCharacter, updateCharacter, addItem, removeItem, getInventory, gainXp } from './rpg.js'
import { addReward } from './database.js'
import { progressQuests } from './questEngine.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const MONSTERS = JSON.parse(readFileSync(join(__dirname, '../src/rpg/monsters.json'), 'utf8'))
const EQUIP = JSON.parse(readFileSync(join(__dirname, '../src/rpg/equip.json'), 'utf8'))

const sessionDir = './session'
if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true })
const db = new Database(`${sessionDir}/rpg.sqlite`)

db.exec(`
  CREATE TABLE IF NOT EXISTS rpg_equipment (
    jid TEXT,
    slot TEXT,
    item_id TEXT,
    durability INTEGER DEFAULT 0,
    PRIMARY KEY (jid, slot)
  )
`)

export function getMonsters() { return MONSTERS }
export function getMonster(id) { return MONSTERS.find((m) => m.id === id) ?? null }
export function getEquipInfo(id) { return EQUIP[id] ?? null }

export function getLoadout(jid) {
  return db.prepare('SELECT * FROM rpg_equipment WHERE jid = ?').all(jid)
}

export function playerCombatStats(jid) {
  const char = getCharacter(jid)
  let atk = 5 + char.level
  let def = 0
  for (const row of getLoadout(jid)) {
    const info = EQUIP[row.item_id]
    if (!info) continue
    atk += info.atk ?? 0
    def += info.def ?? 0
  }
  return { atk, def, char }
}

export function equipItem(jid, itemId) {
  const info = EQUIP[itemId]
  if (!info) return { error: 'not_equippable' }

  const owned = getInventory(jid).find((r) => r.item_id === itemId)
  if (!owned) return { error: 'not_owned' }

  removeItem(jid, itemId, 1)

  const old = db.prepare('SELECT * FROM rpg_equipment WHERE jid = ? AND slot = ?').get(jid, info.slot)
  if (old) addItem(jid, old.item_id, 1)

  db.prepare(`
    INSERT INTO rpg_equipment (jid, slot, item_id, durability) VALUES (?, ?, ?, ?)
    ON CONFLICT(jid, slot) DO UPDATE SET item_id = excluded.item_id, durability = excluded.durability
  `).run(jid, info.slot, itemId, info.durability ?? 10)

  return { success: true, slot: info.slot, durability: info.durability ?? 10 }
}

export function unequipSlot(jid, slot) {
  const row = db.prepare('SELECT * FROM rpg_equipment WHERE jid = ? AND slot = ?').get(jid, slot)
  if (!row) return { error: 'empty' }
  db.prepare('DELETE FROM rpg_equipment WHERE jid = ? AND slot = ?').run(jid, slot)
  addItem(jid, row.item_id, 1)
  return { success: true, item: row.item_id }
}

function damageWeapon(jid) {
  const row = db.prepare("SELECT * FROM rpg_equipment WHERE jid = ? AND slot = 'weapon'").get(jid)
  if (!row) return null
  const left = row.durability - 1
  if (left <= 0) {
    db.prepare("DELETE FROM rpg_equipment WHERE jid = ? AND slot = 'weapon'").run(jid)
    return { broken: row.item_id }
  }
  db.prepare("UPDATE rpg_equipment SET durability = ? WHERE jid = ? AND slot = 'weapon'").run(left, jid)
  return { durability: left, item: row.item_id }
}

export const BATTLE_COST = { energy: 25, stamina: 20 }

export function battle(jid, monsterId) {
  const monster = getMonster(monsterId)
  if (!monster) return { error: 'not_found' }

  const { atk, def, char } = playerCombatStats(jid)
  if (char.resting) return { error: 'resting' }
  if (char.energy < BATTLE_COST.energy || char.stamina < BATTLE_COST.stamina) return { error: 'tired' }

  updateCharacter(jid, {
    energy: char.energy - BATTLE_COST.energy,
    stamina: char.stamina - BATTLE_COST.stamina
  })

  let mHp = monster.hp
  let pHp = char.hp
  let rounds = 0

  while (mHp > 0 && pHp > 0 && rounds < 30) {
    rounds += 1
    mHp -= atk + Math.floor(Math.random() * 4)
    if (mHp <= 0) break
    pHp -= Math.max(1, monster.atk - def + Math.floor(Math.random() * 3))
  }

  const won = mHp <= 0 && pHp > 0

  if (won) {
    const after = updateCharacter(jid, { hp: Math.max(1, pHp) })
    addItem(jid, monster.loot, 1)
    const wallet = addReward(jid, { gold: monster.gold })
    const { char: c2 } = gainXp(jid, monster.xp)
    const weapon = damageWeapon(jid)
    const quests = progressQuests(jid, [`kill:${monster.id}`, `kill_tier:${monster.tier}`])

    return {
      won: true, monster, rounds,
      hpLeft: after.hp,
      wallet, xp: c2?.xp ?? 0,
      weapon, quests
    }
  }

  updateCharacter(jid, { hp: 1 })
  const { char: c2 } = gainXp(jid, 2)
  return { won: false, monster, rounds, hpLeft: 1, xp: c2?.xp ?? 0 }
}
