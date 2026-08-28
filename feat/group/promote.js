/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * promote.js — .promote / .demote admin grup via tag atau nomor.
 * [FIX] Reply pakai mention rapi (LID di-resolve ke PN).
 */
import { isGroupAdmin } from '../../core/permission.js'
import { normalizeNumber } from '../../core/staff.js'
import { sendMention } from '../../core/lid.js'

export default {
  name: 'promote',
  aliases: ['demote'],
  tags: 'group',
  description: 'Naik/turunkan admin grup via tag atau nomor (admin grup/staff)',
  async run(ctx) {
    if (!ctx.isGroup) {
      await ctx.reply('🚫 Khusus grup.')
      return
    }
    if (!(await isGroupAdmin(ctx))) {
      await ctx.reply('🚫 Khusus Admin grup / Staff bot.')
      return
    }

    let target = ctx.mentioned?.[0]
    if (!target) {
      const num = normalizeNumber(ctx.args[0] ?? '')
      if (!num) {
        await ctx.reply(
          `Format:\n• ${ctx.prefix}${ctx.command} <tag orangnya>\n• ${ctx.prefix}${ctx.command} 628xxx`
        )
        return
      }
      target = `${num}@s.whatsapp.net`
    }

    try {
      if (ctx.command === 'promote') {
        await ctx.client.group.promoteParticipants(ctx.chat, [target])
        await sendMention(ctx.client, ctx.chat, target, '⬆️ @user sekarang admin grup.')
      } else {
        await ctx.client.group.demoteParticipants(ctx.chat, [target])
        await sendMention(ctx.client, ctx.chat, target, '⬇️ @user bukan admin lagi.')
      }
    } catch (err) {
      await ctx.reply(`😵 Gagal ${ctx.command}: ${String(err.message).slice(0, 120)}`)
    }
  }
}
