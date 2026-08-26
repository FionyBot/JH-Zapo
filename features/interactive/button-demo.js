import { onRichReply } from '../../core/router.js'

// Handler dijalankan saat user tap salah satu tombol di bawah.
// Key-nya (mis. "rich:hai") adalah id yang kita set sendiri di `buttons` — bebas
// dinamai apa aja, asal unik antar feature.
onRichReply('rich:hai', async (ctx) => {
  await ctx.reply(`Haii ${ctx.pushName || ''}! 👋 Ada yang bisa dibantu?`)
})

onRichReply('rich:info', async (ctx) => {
  await ctx.reply('Bot ini jalan di atas Zapo-JS, pakai richMessage (interactiveMessage + nativeFlow) 🧩')
})

export default {
  name: 'button',
  tags: 'interactive',
  description: 'Contoh richMessage: tombol quick-reply',
  async run(ctx) {
    await ctx.replyButtons({
      text: 'Pilih salah satu opsi di bawah ini:',
      footer: 'wabot-core • richMessage demo',
      buttons: [
        { id: 'rich:hai', text: '👋 Sapa aku' },
        { id: 'rich:info', text: 'ℹ️ Info bot' }
      ]
    })
  }
}
