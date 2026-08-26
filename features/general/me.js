import { getUser } from '../../core/db.js'

export default {
  name: 'me',
  aliases: ['profile', 'stats'],
  tags: 'general',
  description: 'Lihat statistik pemakaian kamu di bot',
  async run(ctx) {
    const user = getUser(ctx.sender)
    if (!user) {
      await ctx.reply('Data kamu belum tercatat. Coba pakai command lain dulu.')
      return
    }

    const fmt = (t) => new Date(t).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

    await ctx.reply(
      `👤 *PROFIL KAMU*\n\n` +
        `• Nama: ${user.name ?? ctx.pushName ?? '-'}\n` +
        `• Nomor: +${ctx.senderNumber}\n` +
        `• Role: ${ctx.isStaff ? `${ctx.role.toUpperCase()}${ctx.staffLabel ? ` (${ctx.staffLabel})` : ''}` : 'User biasa'}\n` +
        `• Total command: ${user.command_count}\n` +
        `• Pertama aktif: ${fmt(user.first_seen)}\n` +
        `• Terakhir aktif: ${fmt(user.last_seen)}\n` +
        `• Status: ${user.banned ? 'DI-BAN 🚫' : 'Aktif ✅'}`
    )
  }
}
