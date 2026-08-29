/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * tebakkata.js — tebak kata berpetunjuk, 60 detik, support clue.
 * Bank kata besar dan bervariasi dari level mudah → expert.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { isOn } from '../../core/groupSettings.js'
import { startGame, hasGame } from '../../handlers/gameHandler.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const BANK = JSON.parse(
  readFileSync(join(__dirname, '../../src/data/kata.json'), 'utf8')
)
const LEVELS = Object.keys(BANK)

function pickRandom() {
  const level = LEVELS[Math.floor(Math.random() * LEVELS.length)]
  const pool = BANK[level]
  const pick = pool[Math.floor(Math.random() * pool.length)]
  return { ...pick, level }
}

const LEVEL_ICON = { mudah: '🟢', sedang: '🟡', sulit: '🟠', expert: '🔴' }

export default {
  name: 'tebakkata',
  aliases: ['tebak'],
  tags: 'game',
  cooldown: 3000,
  description: 'Tebak kata berpetunjuk (butuh .on game)',
  async run(ctx) {
    if (!ctx.isGroup) {
      await ctx.reply('🚫 Khusus grup.')
      return
    }
    if (!isOn(ctx.chat, 'game')) {
      await ctx.reply('🎮 Fitur game belum dinyalakan di grup ini. Admin: `.on game`')
      return
    }
    if (hasGame(ctx.chat, 'tebakkata')) {
      await ctx.reply('⏳ Tebakkata masih berjalan di grup ini.')
      return
    }

    const pick = pickRandom()

    startGame(ctx.client, ctx.chat, 'tebakkata', {
      kind: 'word',
      answer: pick.w,
      display: pick.w,
      clue: pick.c,
      supportClue: true,
      expiresAt: Date.now() + 60_000
    })

    const level = LEVEL_ICON[pick.level] ?? '🟢'
    await ctx.reply(
`╭─✦「 *TEBAK KATA* 」✦─╮
│
│ ${level} Level: *${pick.level.toUpperCase()}*
│ 📝 Petunjuk:
│   ${pick.c}
│
│ ⏱️  Waktu: 60 detik
│ 💡 Butuh bantuan? Ketik *.clue*
│ 🏳️  Menyerah? Ketik *nyerah*
│
╰────────────────────✦╯`
    )
  }
}
