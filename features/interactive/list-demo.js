import config from '../../bot.config.js'
import { onRichReply } from '../../core/router.js'
import { listFeatures } from '../../core/features.js'

// single_select adalah bentuk list/menu terbaru WhatsApp — pengganti `listMessage`
// lama, dan (berbeda dari versi lama) masih tampil normal di akun personal biasa.
onRichReply('rich:list-ping', async (ctx) => {
  await ctx.reply('pong 🏓 (dipilih dari list)')
})

onRichReply('rich:list-menu', async (ctx) => {
  const lines = listFeatures()
    .map((f) => `• ${config.prefix}${f.name} — ${f.description}`)
    .join('\n')
  await ctx.reply(`*${config.botName}*\n\n${lines}`)
})

export default {
  name: 'list',
  tags: 'interactive',
  description: 'Contoh richMessage: list/menu single-select',
  async run(ctx) {
    await ctx.replyList({
      text: 'Pilih layanan yang kamu butuhkan:',
      footer: 'wabot-core • richMessage demo',
      title: 'Layanan Kami',
      buttonText: 'Buka menu',
      sections: [
        {
          title: 'Umum',
          rows: [
            { id: 'rich:list-ping', title: 'Ping', description: 'Cek status bot' },
            { id: 'rich:list-menu', title: 'Menu', description: 'Semua command yang tersedia' }
          ]
        }
      ]
    })
  }
}
