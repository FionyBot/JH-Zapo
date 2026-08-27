/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 */
import { loadFeatures } from '../loader.js'

export default {
  name: 'reload',
  tags: 'owner',
  owner: true,
  description: 'Muat ulang semua feature tanpa restart bot',
  async run(ctx) {
    const count = await loadFeatures()
    await ctx.reply(`🔄 Feature dimuat ulang: ${count} feature aktif.`)
  }
}
