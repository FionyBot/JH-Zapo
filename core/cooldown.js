/**
 * cooldown.js — anti-spam & jeda per-command (in-memory, cukup buat 1 proses bot).
 */

const perUserCommand = new Map() // "jid:command" -> timestamp terakhir
const perUserFlood = new Map()   // jid -> { hits: number[], mutedUntil: number }

/** Cek jeda per-command. */
export function checkCooldown(userId, command, cooldownMs = 0) {
  if (!cooldownMs || cooldownMs <= 0) return { onCooldown: false, remainingMs: 0 }

  const key = `${userId}:${command}`
  const now = Date.now()
  const last = perUserCommand.get(key) ?? 0

  if (now - last < cooldownMs) {
    return { onCooldown: true, remainingMs: cooldownMs - (now - last) }
  }

  perUserCommand.set(key, now)
  return { onCooldown: false, remainingMs: 0 }
}

/** Cek flood: terlalu banyak command dalam jendela waktu → dibisukan sementara. */
export function checkFlood(userId, { max = 5, windowMs = 10_000, muteMs = 30_000 } = {}) {
  const now = Date.now()
  const state = perUserFlood.get(userId) ?? { hits: [], mutedUntil: 0 }

  if (state.mutedUntil > now) {
    return { flooded: true, remainingMs: state.mutedUntil - now }
  }

  state.hits = state.hits.filter((t) => now - t < windowMs)
  state.hits.push(now)

  if (state.hits.length > max) {
    state.mutedUntil = now + muteMs
    state.hits = []
    perUserFlood.set(userId, state)
    return { flooded: true, remainingMs: muteMs }
  }

  perUserFlood.set(userId, state)
  return { flooded: false, remainingMs: 0 }
}
