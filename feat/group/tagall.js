/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * tagall.js — mention KELIHATAN semua member + custom caption.
 * [UPDATE AND FIX BELOW]
 *
 * Cek admin via helper resmi (isAdmin/isSuperAdmin flag zapo).
 */
import { isGroupAdmin } from '../../core/permission.js'

export default {
  name: 'tagall',
  aliases: ['tall', 'mentionall'],
  tags: 'group',
  description: 'Mention kelihatan semua member + custom caption (admin grup/staff)',
  async run(ctx) {
    if (!ctx.isGroup) {
      await ctx.reply('🚫 Command ini khusus grup.')
      return
    }

    if (!(await isGroupAdmin(ctx))) {
      await ctx.reply('🚫 Khusus Admin grup / Staff bot.')
      return
    }

    const meta = await ctx.client.group.queryGroupMetadata(ctx.chat)
    const jids = meta.participants.map((p) => p.jid)
    const caption = ctx.text || '📢 Semua kumpul sini!'

    const tags = jids.map((j) => `@${j.split('@')[0]}`).join(' ')
    const text = `*TAGALL* — ${meta.subject ?? 'Grup'}\n${caption}\n\n${tags}`

    await ctx.client.message.send(ctx.chat, {
      extendedTextMessage: {
        text,
        contextInfo: { mentionedJid: jids }
      }
    })
  }
}
