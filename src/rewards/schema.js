/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * schema.js — Definisi currency types buat sistem reward.
 * Siap pakai pas RPG ada (soon).
 */

export const CURRENCY = {
  GOLD: 'gold',    // Mata uang utama (jual/beli)
  XP: 'xp',        // Experience points (leveling)
  GEMS: 'gems',    // Premium currency (rare)
}

export const REWARD_PRESETS = {
  tebakkata: { gold: 10, xp: 5, gems: 0 },
  math: { gold: 15, xp: 8, gems: 0 },
  // Nanti tinggal tambah game lain di sini bray
}
