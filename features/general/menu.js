import config from '../../bot.config.js'
import { listFeatures } from '../../core/features.js'

export default {
  name: 'menu',
  aliases: ['help'],
  tags: 'general',
  description: 'Menampilkan daftar command yang tersedia',
  async run(ctx) {
    const lines = listFeatures()
      .map((f) => `• ${config.prefix}${f.name} — ${f.description}`)
      .join('\n')

    await ctx.reply(`*${config.botName}*\n\n${lines}\n\nContoh: ${config.prefix}ping`)
  }
}
