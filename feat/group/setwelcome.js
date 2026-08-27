/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * setwelcome.js — .setwelcome / .setbye <teks custom>
 * Placeholder: @user (mention yang join/leave), %group (nama grup)
 */
import { setSetting, getSetting } from '../../core/groupSettings.js'
import { isGroupAdmin } from '../../core/permission.js'

export default {
  name: 'setwelcome',
  aliases: ['setbye'],
  tags: 'group',
  description: 'Set custom teks welcome/bye (@user, %group)',
  async run(ctx) {
    if (!ctx.isGroup) {
      await ctx.reply('🚫 Khusus grup.')
      return
    }

    if (!(await isGroupAdmin(ctx))) {
      await ctx.reply('🚫 Khusus admin grup / staff bot.')
      return
    }

    const isWelcome = ctx.command === 'setwelcome'
    const key = isWelcome ? 'welcome_text' : 'bye_text'

    if (!ctx.text) {
      const current = getSetting(ctx.chat, key)
      await ctx.reply(
        `Format: ${ctx.prefix}${ctx.command} <teks>\n` +
        `Placeholder: @user (mention), %group (nama grup)\n\n` +
        `Teks sekarang: ${current ?? '(default)'}`
      )
      return
    }

    setSetting(ctx.chat, key, ctx.text)
    await ctx.reply(`✅ Teks *${isWelcome ? 'welcome' : 'bye'}* diset:\n${ctx.text}`)
  }
}
