/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * kick.js — .kick / .add member via tag atau nomor.
 * [FIX] Reply pakai mention rapi (LID di-resolve ke PN).
 */
import config from '../../config.js'
import { isGroupAdmin } from '../../core/permission.js'
import { normalizeNumber } from '../../core/staff.js'
import { sendMention } from '../../core/lid.js'

export default {
  name: 'kick',
  aliases: ['add'],
  tags: 'group',
  description: 'Kick/add member via tag atau nomor (admin grup/staff)',
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

    const targetNumber = target.split('@')[0].split(':')[0]
    const targetStaff = config.staff.find((s) => s.number === targetNumber)
    if (targetStaff?.role === 'owner') {
      await ctx.reply('🚫 Gak bisa kick/add sesama owner!')
      return
    }

    try {
      if (ctx.command === 'kick') {
        await ctx.client.group.removeParticipants(ctx.chat, [target])
        await sendMention(ctx.client, ctx.chat, target, '🚪 @user di-kick dari grup.')
      } else {
        await ctx.client.group.addParticipants(ctx.chat, [target])
        await sendMention(ctx.client, ctx.chat, target, '✅ @user ditambahkan ke grup.')
      }
    } catch (err) {
      await ctx.reply(`😵 Gagal ${ctx.command}: ${String(err.message).slice(0, 120)}`)
    }
  }
}
