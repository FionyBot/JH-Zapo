/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * setblacklist.js — set blacklist domain antilink per grup.
 */
import config from '../../config.js'
import { isGroupAdmin } from '../../core/permission.js'
import { getSetting, setSetting } from '../../core/groupSettings.js'

export default {
  name: 'setblacklist',
  aliases: ['blacklist'],
  tags: 'group',
  description: 'Set blacklist domain antilink (pisahkan dengan koma)',
  async run(ctx) {
    if (!ctx.isGroup) {
      await ctx.reply('🚫 Khusus grup.')
      return
    }
    if (!(await isGroupAdmin(ctx))) {
      await ctx.reply('🚫 Khusus Admin grup / Staff bot.')
      return
    }

    if (!ctx.text) {
      const current = getSetting(ctx.chat, 'antilink_blacklist') ?? config.antilink.defaultBlacklist
      await ctx.reply(`🚫 Blacklist antilink grup ini:\n${current}`)
      return
    }

    setSetting(ctx.chat, 'antilink_blacklist', ctx.text)
    await ctx.reply(`✅ Blacklist antilink diset:\n${ctx.text}`)
  }
}
