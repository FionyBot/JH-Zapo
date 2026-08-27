/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 */
import config from '../../config.js'
import { logger } from '../../core/logger.js'
import { downloadMedia } from '../../lib/media.js'
import { buildSticker, MAX_STICKER_BYTES } from '../../lib/sticker.js'

export default {
  name: 'sticker',
  aliases: ['s', 'stiker'],
  tags: 'tools',
  cooldown: 5000,
  description: 'Gambar/GIF/video (≤10 dtk) → stiker (kirim/balas media)',
  async run(ctx) {
    const media = await downloadMedia(ctx.client, ctx.event)

    if (!media || !['image', 'video'].includes(media.kind)) {
      await ctx.reply(
        `Kirim/balas *gambar, GIF, atau video* dengan caption ${ctx.prefix}sticker\n` +
        `(video maks ${config.sticker.maxVideoSeconds} detik)`
      )
      return
    }

    if (media.kind === 'video') await ctx.react('⏳').catch(() => {})

    let buf
    try {
      buf = await buildSticker(media, {
        packName: config.sticker.packName,
        author: config.sticker.author,
        withExif: config.sticker.withExif !== false,
        maxVideoSeconds: config.sticker.maxVideoSeconds
      })
    } catch (err) {
      if (/ffmpeg|ENOENT/i.test(err.message)) {
        await ctx.reply('🎬 ffmpeg belum terpasang di server. Install dulu: `apt install -y ffmpeg`')
        return
      }
      throw err
    }

    if (buf.length > MAX_STICKER_BYTES) {
      await ctx.reply(
        `😅 Videonya kelewat berat buat limit stiker WA (±1MB): hasil ${(buf.length / 1024).toFixed(0)}KB.\n` +
        `Potong durasinya dulu ya — GIF & video pendek aman kok.`
      )
      return
    }

    try {
      await ctx.client.message.send(ctx.chat, {
        type: 'sticker',
        media: buf,
        mimetype: 'image/webp'
      })
    } catch (err) {
      logger.error({ err: err.message, size: buf.length }, 'Gagal kirim stiker')
      await ctx.reply(`😵 Gagal kirim stiker: ${String(err.message).slice(0, 120)}`)
      return
    }

    await ctx.react('✅').catch(() => {})
  }
}
