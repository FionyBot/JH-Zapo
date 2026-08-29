/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * clue.js — Minta clue buat game yang support (tebakkata, dll).
 * Max 2 clue per sesi: kalimat hint + underscore pattern.
 */
import { getSession } from '../../handlers/gameHandler.js'

export default {
  name: 'clue',
  aliases: ['bantuan', 'hint'],
  tags: 'game',
  cooldown: 0,
  description: 'Minta clue buat game yang sedang berjalan',
  async run(ctx) {
    if (!ctx.isGroup) {
      await ctx.reply('🚫 Khusus grup.')
      return
    }

    let activeSession = null
    let activeType = null
    for (const type of ['tebakkata']) {
      const s = getSession(ctx.chat, type)
      if (s?.supportClue && Date.now() < s.expiresAt) {
        activeSession = s
        activeType = type
        break
      }
    }

    if (!activeSession) {
      await ctx.reply('😅 Gak ada game yang butuh clue di grup ini sekarang.')
      return
    }

    if (activeSession.clueCount >= 2) {
      await ctx.reply('💡 Clue sudah habis (max 2 per sesi).')
      return
    }

    activeSession.clueCount += 1

    if (activeSession.clueCount === 1) {
      // Clue 1: kalimat hint tambahan
      const word = activeSession.answer
      const firstLetter = word[0].toUpperCase()
      const length = word.length
      await ctx.reply(
`╭─💡「 *CLUE #1* 」💡─╮
│
│ 📌 Kata ini:
│   • Berawalan huruf *${firstLetter}*
│   • Panjang *${length}* huruf
│
╰────────────────────✦╯`
      )
    } else {
      // Clue 2: underscore pattern (huruf pertama kebuka)
      const word = activeSession.answer
      const pattern = word[0].toUpperCase() + ' ' + word.slice(1).split('').map(() => '_').join(' ')
      await ctx.reply(
`╭─💡「 *CLUE #2* 」💡─╮
│
│ 🎯 Pola kata:
│   ${pattern}
│
╰────────────────────✦╯`
      )
    }
  }
}
