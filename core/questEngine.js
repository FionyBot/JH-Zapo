/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * questEngine.js — Klaim, progress, expiry, dan reward quest.
 * [UPDATE AND FIX BELOW]
 *
 * Ekonomi terunifikasi:
 * - gold & gems → wallet (users.sqlite)
 * - XP quest → gainXp karakter (satu sumber XP buat level)
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { addQuest, getActiveQuests, getCompletedQuestIds, updateQuestProgress, gainXp } from './rpg.js'
import { addReward } from './database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const QUESTS = JSON.parse(readFileSync(join(__dirname, '../src/rpg/quests.json'), 'utf8'))

const EXPIRY_SEC = { daily: 86400, weekly: 7 * 86400, monthly: 30 * 86400, story: 0 }

export const TYPE_ICON = { daily: '🌅', weekly: '🗓️', monthly: '🌙', story: '📖' }

export function questDef(type, id) {
  return (QUESTS[type] ?? []).find((q) => q.id === id) ?? null
}

function isExpired(row) {
  const ttl = EXPIRY_SEC[row.quest_type] ?? 0
  if (!ttl) return false
  return Math.floor(Date.now() / 1000) - row.created_at > ttl
}

export function activeQuests(jid) {
  return getActiveQuests(jid).filter((r) => !isExpired(r))
}

export function activeOfType(jid, type) {
  return activeQuests(jid).find((r) => r.quest_type === type) ?? null
}

export function claimQuest(jid, type) {
  if (activeOfType(jid, type)) return { error: 'active' }

  if (type === 'story') {
    const done = new Set(getCompletedQuestIds(jid))
    const next = (QUESTS.story ?? []).find((q) => !done.has(q.id))
    if (!next) return { error: 'done_all' }
    addQuest(jid, 'story', next.id, next.target)
    return { quest: next }
  }

  const pool = QUESTS[type] ?? []
  if (!pool.length) return { error: 'empty' }
  const pick = pool[Math.floor(Math.random() * pool.length)]
  addQuest(jid, type, pick.id, pick.target)
  return { quest: pick }
}

/** Dipanggil dari gathering: naikkan progress quest yang metric-nya cocok. */
export function progressQuests(jid, metrics) {
  const done = []
  for (const row of activeQuests(jid)) {
    const def = questDef(row.quest_type, row.quest_id)
    if (!def || !metrics.includes(def.metric)) continue

    const updated = updateQuestProgress(jid, row.quest_id, 1)
    if (updated?.status === 'completed') {
      // gold & gems → wallet; XP → karakter
      const wallet = addReward(jid, { gold: def.reward.gold, gems: def.reward.gems })
      const { char } = gainXp(jid, def.reward.xp)
      done.push({
        ...def,
        balance: { gold: wallet.gold, gems: wallet.gems, xp: char?.xp ?? 0 }
      })
    }
  }
  return done
}
