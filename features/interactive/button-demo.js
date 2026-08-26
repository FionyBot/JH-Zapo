import config from '../../bot.config.js'
import { onRichReply } from '../../core/router.js'

onRichReply('rich:hai', async (ctx) => {
  const name = ctx.pushName || 'kawan'
  await ctx.reply(
    `Halo ${name}! 👋\nAda yang bisa ${config.botName} bantu?\nKetik ${config.mainPrefix}menu buat lihat semua command.`
  )
})

onRichReply('rich:info', async (ctx) => {
  await ctx.reply(
    `ℹ️ *INFO ${config.botName.toUpperCase()}*\n\n` +
      `• Base: Zapo-JS (richMessage nativeFlow)\n` +
      `• Prefix: ${config.prefix.join(' ')}\n` +
      `• Owner: ${config.owners.map((n) => `+${n}`).join(', ')}\n\n` +
      `Masih dalam pengembangan 🚧`
  )
})

export default {
  name: 'button',
  aliases: ['btn', 'tombol'],
  tags: 'interactive',
  description: 'Contoh richMessage: tombol quick-reply',
  async run(ctx) {
    await ctx.replyButtons({
      text: `Hai ${ctx.pushName || ''}! Mau ngapain nih?`,
      footer: `${config.botName} • interactive`,
      buttons: [
        { id: 'rich:hai', text: '👋 Sapa bot' },
        { id: 'rich:info', text: 'ℹ️ Info bot' }
      ]
    })
  }
}
