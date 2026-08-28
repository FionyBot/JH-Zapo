/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * gc.js — .g <aksi> : manajemen grup serba satu pintu.
 * open/close/setname/setdesc/link/revoke — semua method resmi zapo.
 */
import { isGroupAdmin } from '../../core/permission.js'

export default {
  name: 'g',
  aliases: ['gc', 'grup'],
  tags: 'group',
  description: 'Manajemen grup: open/close/setname/setdesc/link/revoke',
  async run(ctx) {
    if (!ctx.isGroup) {
      await ctx.reply('🚫 Khusus grup.')
      return
    }
    if (!(await isGroupAdmin(ctx))) {
      await ctx.reply('🚫 Khusus Admin grup / Staff bot.')
      return
    }

    const action = (ctx.args[0] ?? '').toLowerCase()
    const rest = ctx.text.slice((ctx.args[0] ?? '').length).trim()
    const g = ctx.client.group

    try {
      switch (action) {
        case 'open':
          await g.setSetting(ctx.chat, 'announcement', false)
          await ctx.reply('✅ Grup dibuka — semua member bisa kirim pesan.')
          return

        case 'close':
          await g.setSetting(ctx.chat, 'announcement', true)
          await ctx.reply('🔒 Grup ditutup — hanya admin yang bisa kirim pesan.')
          return

        case 'setname':
          if (!rest) {
            await ctx.reply(`Format: ${ctx.prefix}g setname <nama baru>`)
            return
          }
          await g.setSubject(ctx.chat, rest)
          await ctx.reply(`✅ Nama grup diganti jadi "${rest}".`)
          return

        case 'setdesc':
          if (!rest) {
            await ctx.reply(`Format: ${ctx.prefix}g setdesc <deskripsi baru>`)
            return
          }
          await g.setDescription(ctx.chat, rest)
          await ctx.reply('✅ Deskripsi grup diperbarui.')
          return

        case 'link': {
          const code = await g.queryInviteCode(ctx.chat)
          await ctx.reply(`🔗 Link grup:\nhttps://chat.whatsapp.com/${code}`)
          return
        }

        case 'revoke': {
          const res = await g.revokeInvite(ctx.chat)
          await ctx.reply(`🔄 Link lama diputus. Link baru:\nhttps://chat.whatsapp.com/${res.code}`)
          return
        }

        default:
          await ctx.reply(
            `📋 Sub-command:\n` +
            `• ${ctx.prefix}g open / close — buka/tutup grup\n` +
            `• ${ctx.prefix}g setname <nama>\n` +
            `• ${ctx.prefix}g setdesc <deskripsi>\n` +
            `• ${ctx.prefix}g link — lihat invite link\n` +
            `• ${ctx.prefix}g revoke — putar ulang invite link`
          )
      }
    } catch (err) {
      await ctx.reply(`😵 Gagal: ${String(err.message).slice(0, 120)}`)
    }
  }
}
