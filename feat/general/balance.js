/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * balance.js — Cek saldo reward (gold/xp/gems).
 */
import { getBalance } from '../../core/database.js'

export default {
  name: 'balance',
  aliases: ['bal', 'saldo'],
  tags: 'general',
  description: 'Cek saldo reward kamu',
  async run(ctx) {
    const bal = getBalance(ctx.sender)
    const name = ctx.pushName || 'User'

    await ctx.reply(
`╭─💰「 *SALDO ${name.toUpperCase()}* 」💰─╮
│
│ 💰 Gold: *${bal.gold}*
│ ⭐ XP: *${bal.xp}*
│ 💎 Gems: *${bal.gems}*
│
│ 💡 Reward aktif pas RPG rilis.
│
╰────────────────────✦╯`
    )
  }
}
