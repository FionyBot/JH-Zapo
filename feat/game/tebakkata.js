/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * tebakkata.js — tebak kata berpetunjuk, 60 detik, bank kata lokal.
 * JSON more bervariasi akan diadd/bikin nanti. 
 */
import { isOn } from '../../core/groupSettings.js'
import { startGame, hasGame } from '../../handlers/gameHandler.js'

const BANK = [
  { w: 'kopi', c: 'minuman hitam yang bikin melek' },
  { w: 'hujan', c: 'turun dari langit, bikin malas keluar' },
  { w: 'pasar', c: 'tempat ibu beli sayur' },
  { w: 'sepeda', c: 'dua roda, dikayuh, ramah lingkungan' },
  { w: 'gunung', c: 'lebih tinggi dari bukit' },
  { w: 'laptop', c: 'komputer yang bisa dibawa ke mana-mana' },
  { w: 'pisang', c: 'buah kuning kesukaan monyet' },
  { w: 'kucing', c: 'hewan berbulu yang suka mengeong' },
  { w: 'sekolah', c: 'tempat belajar tiap pagi' },
  { w: 'bintang', c: 'kelip-kelip di langit malam' },
  { w: 'pantai', c: 'ada pasir dan ombak' },
  { w: 'jam', c: 'benda yang selalu berdetak' }
]

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

    const pick = BANK[Math.floor(Math.random() * BANK.length)]

    startGame(ctx.client, ctx.chat, 'tebakkata', {
      answer: pick.w,
      display: pick.w,
      expiresAt: Date.now() + 60_000
    })

    await ctx.reply(
      `🔤 *TEBAK KATA*\n\nPetunjuk: ${pick.c}\n\n` +
      `Ketik jawabanmu (60 detik). Ketik *nyerah* buat menyerah.`
    )
  }
}
