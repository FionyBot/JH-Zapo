/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 */
import config from '../../config.js'
import { touchUser, setBanned, topUsers, totalUsers } from '../../core/database.js'

export default {
  name: 'ban',
  aliases: ['unban', 'users'],
  tags: 'owner',
  admin: true,
  description: 'Ban/unban user (via nomor atau tag) & daftar user',
  async run(ctx) {
    if (ctx.command === 'users') {
      const top = topUsers(10)
      const lines = top.map(
        (u, i) => `${i + 1}. +${u.jid.split('@')[0]} — ${u.command_count} cmd${u.banned ? ' 🚫' : ''}`
      )
      await ctx.reply(`👥 *TOTAL USER: ${totalUsers()}*\n\n${lines.join('\n') || '(belum ada user tercatat)'}`)
      return
    }

    let targetJid = ctx.mentioned?.[0]

    if (!targetJid) {
      const targetNumber = (ctx.args[0] ?? '').replace(/\D/g, '')
      if (!targetNumber) {
        await ctx.reply(
          `Format:\n• ${ctx.prefix}${ctx.command} 628123456789\n• ${ctx.prefix}${ctx.command} <tag orangnya>`
        )
        return
      }
      targetJid = `${targetNumber}@s.whatsapp.net`
    }

    const targetNumber = targetJid.split('@')[0].split(':')[0]
    const isLid = targetJid.endsWith('@lid')
    const label = isLid ? 'User yang di-tag' : `+${targetNumber}`

    const targetStaff = config.staff.find((s) => s.number === targetNumber)
    if (targetStaff?.role === 'owner') {
      await ctx.reply('🚫 Gak bisa ban/unban sesama owner!')
      return
    }

    if (ctx.command === 'ban') {
      touchUser(targetJid, null)
      setBanned(targetJid, true)
      await ctx.reply(`🚫 ${label} telah di-BAN.`)
    } else {
      setBanned(targetJid, false)
      await ctx.reply(`✅ ${label} telah di-unban.`)
    }
  }
}
