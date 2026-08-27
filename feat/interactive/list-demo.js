/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 */
import config from '../../config.js'
import { onRichReply } from '../../handlers/messageHandler.js'
import { listFeatures } from '../loader.js'

onRichReply('rich:list-ping', async (ctx) => {
  const start = Date.now()
  await ctx.reply(`🏓 Pong!\n- Response: ${Date.now() - start}ms`)
})

onRichReply('rich:list-menu', async (ctx) => {
  const lines = listFeatures()
    .map((f) => `• ${config.mainPrefix}${f.name} — ${f.description}`)
    .join('\n')
  await ctx.reply(`*${config.botName}*\nPrefix: ${config.prefixes.join(' ')}\n\n${lines}`)
})

export default {
  name: 'list',
  aliases: ['layanan'],
  tags: 'interactive',
  description: 'Contoh richMessage: list/menu single-select',
  async run(ctx) {
    await ctx.replyList({
      text: 'Pilih layanan yang kamu butuhkan:',
      footer: `${config.botName} • Interactive`,
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
