import config from '../../bot.config.js'
import { onRichReply } from '../../core/router.js'
import { listFeatures } from '../../core/features.js'

onRichReply('rich:list-ping', async (ctx) => {
  const start = Date.now()
  await ctx.reply(`🏓 Pong! Respons: ${Date.now() - start}ms`)
})

onRichReply('rich:list-menu', async (ctx) => {
  const lines = listFeatures()
    .map((f) => `• ${config.mainPrefix}${f.name} — ${f.description}`)
    .join('\n')
  await ctx.reply(`*${config.botName}*\nPrefix: ${config.prefix.join(' ')}\n\n${lines}`)
})

export default {
  name: 'list',
  aliases: ['layanan'],
  tags: 'interactive',
  description: 'Contoh richMessage: list/menu single-select',
  async run(ctx) {
    await ctx.replyList({
      text: 'Pilih layanan yang kamu butuhkan:',
      footer: `${config.botName} • interactive`,
      title: 'Layanan Kami',
      buttonText: 'Buka menu',
      sections: [
        {
          title: 'Umum',
          rows: [
            { id: 'rich:list-ping', title: '🏓 Ping', description: 'Cek status bot' },
            { id: 'rich:list-menu', title: '📖 Menu', description: 'Semua command yang tersedia' }
          ]
        }
      ]
    })
  }
}
