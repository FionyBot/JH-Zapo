/**
 * © JamvanHax0r
 * tagall.js — mention KELIHATAN semua member + custom caption.
 */
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

    const meta = await ctx.client.group.queryGroupMetadata(ctx.chat)

    const senderPart = meta.participants.find(
      (p) => p.jid === ctx.sender || (ctx.senderLid && p.jid === ctx.senderLid)
    )
    const isGroupAdmin = ['admin', 'superadmin'].includes(senderPart?.role ?? senderPart?.rank ?? '')
    if (!ctx.isAdmin && !isGroupAdmin) {
      await ctx.reply('🚫 Khusus admin grup / staff bot.')
      return
    }

    const jids = meta.participants.map((p) => p.jid)
    const caption = ctx.text || '📢 Semua kumpul sini!'

    const tags = jids.map((j) => `@${j.split('@')[0]}`).join(' ')
    const text = `> _*🔔 TAGALL — ${meta.subject ?? 'Grup'}*_\n- Message: _${caption}_\n\n${tags}`

    await ctx.client.message.send(ctx.chat, {
      extendedTextMessage: {
        text,
        contextInfo: { mentionedJid: jids }
      }
    })
  }
}
