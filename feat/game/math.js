/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * math.js — kuis matematika acak, 60 detik, tanpa API eksternal.
 */
import { isOn } from '../../core/groupSettings.js'
import { startGame, hasGame } from '../../handlers/gameHandler.js'

export default {
  name: 'math',
  aliases: ['kuismath', 'matematika'],
  tags: 'game',
  cooldown: 3000,
  description: 'Kuis matematika (butuh .on game)',
  async run(ctx) {
    if (!ctx.isGroup) {
      await ctx.reply('🚫 Khusus grup.')
      return
    }
    if (!isOn(ctx.chat, 'game')) {
      await ctx.reply('🎮 Fitur game belum dinyalakan di grup ini. Admin: `.on game`')
      return
    }
    if (hasGame(ctx.chat, 'math')) {
      await ctx.reply('⏳ Kuis math masih berjalan di grup ini.')
      return
    }

    const a = Math.floor(Math.random() * 90) + 10
    const b = Math.floor(Math.random() * 90) + 10
    const ops = ['+', '-', '×']
    const op = ops[Math.floor(Math.random() * ops.length)]
    const answer = op === '+' ? a + b : op === '-' ? a - b : a * b

    startGame(ctx.client, ctx.chat, 'math', {
      answer: String(answer),
      display: String(answer),
      expiresAt: Date.now() + 60_000
    })

    await ctx.reply(
      `🧮 *KUIS MATEMATIKA*\n\n${a} ${op} ${b} = ?\n\n` +
      `Ketik jawabanmu (60 detik). Ketik *nyerah* buat menyerah.`
    )
  }
}
