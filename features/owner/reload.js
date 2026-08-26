import { loadFeatures } from '../../core/features.js'

export default {
  name: 'reload',
  tags: 'owner',
  owner: true,
  description: 'Muat ulang semua feature tanpa restart bot',
  async run(ctx) {
    const count = await loadFeatures()
    await ctx.reply(`♻️ ${count} feature berhasil dimuat ulang.`)
  }
}
