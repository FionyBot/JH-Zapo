/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass.
 * Hargai sebagaimana u mau dihargai.
 * rch.js — Owner-only: react manual ke postingan channel WA MANAPUN,
 * cukup paste link postingannya (gak perlu follow dulu).
 * Contoh: .rch https://whatsapp.com/channel/xxxxxxxx/1958
 */
import { logger } from '../../core/logger.js'
import { parseChannelUrl, resolveNewsletterJid, pickRandomEmoji, reactToChannelPost } from '../../lib/newsletter.js'

export default {
  name: 'rch',
  aliases: ['reactchannel'],
  tags: 'owner',
  owner: true,
  cooldown: 3000,
  description: 'React ke postingan channel WA — .rch <link_postingan>',
  async run(ctx) {
    const url = ctx.args?.[0]
    if (!url) {
      await ctx.reply(
        '📎 Kasih link postingan channel-nya ya.\n' +
        'Contoh: .rch https://whatsapp.com/channel/xxxxxxxx/1958'
      )
      return
    }

    const parsed = parseChannelUrl(url)
    if (!parsed) {
      await ctx.reply('❌ Link gak dikenali. Formatnya harus: https://whatsapp.com/channel/<kode>/<angka>')
      return
    }
    if (!parsed.serverId) {
      await ctx.reply(
        '❌ Itu link channel-nya doang, bukan link postingan spesifik.\n' +
        'Ambil link-nya dari titik tiga (⋮) di postingan yang mau di-react → "Copy link".'
      )
      return
    }

    await ctx.react('⏳').catch(() => {})
    try {
      const newsletterJid = await resolveNewsletterJid(ctx.client, parsed.inviteCode)
      const emoji = pickRandomEmoji()
      await reactToChannelPost(ctx.client, { newsletterJid, serverId: parsed.serverId, emoji })

      await ctx.react('✅').catch(() => {})
      await ctx.reply(`${emoji} Berhasil react postingan channel!`)
    } catch (err) {
      logger.error({ err }, '❌ Gagal react channel manual (.rch)')
      await ctx.react('❌').catch(() => {})
      await ctx.reply(`😵 Gagal react: ${String(err.message ?? err).slice(0, 150)}`)
    }
  }
}
