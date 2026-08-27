/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 */
import sharp from 'sharp'
import { logger } from '../../core/logger.js'
import { downloadMedia } from '../../lib/media.js'

export default {
  name: 'toimg',
  aliases: ['toimage', 'img'],
  tags: 'tools',
  cooldown: 5000,
  description: 'Stiker → gambar PNG (balas stikernya)',
  async run(ctx) {
    const media = await downloadMedia(ctx.client, ctx.event)

    if (!media) {
      await ctx.reply('📥 Media gak ketemu / gak bisa diunduh (mungkin udah kadaluarsa).')
      return
    }

    if (media.kind !== 'sticker') {
      await ctx.reply(`Balas *stiker* dengan caption ${ctx.prefix}toimg`)
      return
    }

    const png = await sharp(media.buffer).png().toBuffer()

    const attempts = [
      { type: 'image', media: png, mimetype: 'image/png', caption: '🖼️ Ini dia hasilnya, Kak!' },
      { type: 'image', media: png, mimetype: 'image/png' },
      { type: 'image', buffer: png, mimetype: 'image/png' }
    ]

    let lastErr
    for (const [i, content] of attempts.entries()) {
      try {
        await ctx.client.message.send(ctx.chat, content)
        logger.info(`🖼️ toimg terkirim (bentuk ke-${i + 1})`)
        return
      } catch (err) {
        lastErr = err
        logger.warn({ bentuk: i + 1, err: err.message }, 'Percobaan kirim image gagal')
      }
    }

    throw lastErr ?? new Error('send image gagal')
  }
}
