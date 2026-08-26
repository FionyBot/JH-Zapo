import { touchUser, setBanned, topUsers, totalUsers } from '../../core/db.js'

export default {
  name: 'ban',
  aliases: ['unban', 'users'],
  tags: 'owner',
  owner: true,
  description: 'Ban/unban user & lihat daftar user (khusus owner)',
  async run(ctx) {
    // .users → daftar user teraktif
    if (ctx.command === 'users') {
      const top = topUsers(10)
      const lines = top.map(
        (u, i) =>
          `${i + 1}. +${u.jid.split('@')[0]} — ${u.command_count} cmd${u.banned ? ' 🚫' : ''}`
      )
      await ctx.reply(
        `👥 *TOTAL USER: ${totalUsers()}*\n\n${lines.join('\n') || '(belum ada user tercatat)'}`
      )
      return
    }

    // .ban / .unban <nomor>
    const targetNumber = (ctx.args[0] ?? '').replace(/\D/g, '')
    if (!targetNumber) {
      await ctx.reply(
        `Format: ${ctx.prefix}${ctx.command} <nomor>\nContoh: ${ctx.prefix}${ctx.command} 628123456789`
      )
      return
    }

    const jid = `${targetNumber}@s.whatsapp.net`

    if (ctx.command === 'ban') {
      touchUser(jid, null)
      setBanned(jid, true)
      await ctx.reply(`🚫 User +${targetNumber} telah di-BAN.`)
    } else {
      setBanned(jid, false)
      await ctx.reply(`✅ User +${targetNumber} telah di-unban.`)
    }
  }
}
