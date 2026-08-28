/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * hidetag.js — tag senyap semua member grup, dukung quote media/teks.
 * Relay proto pesan yang di-quote apa adanya + suntik mentionedJid.
 */
import { logger } from '../../core/logger.js'
import { isGroupAdmin } from '../../core/permission.js'

export default {
  name: 'hidetag',
  aliases: ['ht'],
  tags: 'group',
  description: 'Tag senyap semua member grup, dukung quote media (admin grup/staff)',
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
    const text = ctx.text || ''

    const unwrap = (m) => {
      if (!m) return m
      if (m.viewOnceMessage?.message) return unwrap(m.viewOnceMessage.message)
      if (m.ephemeralMessage?.message) return unwrap(m.ephemeralMessage.message)
      return m
    }

    const quoted = unwrap(ctx.event.message?.extendedTextMessage?.contextInfo?.quotedMessage)

    if (quoted && Object.keys(quoted).length) {
      try {
        const msg = structuredClone(quoted)
        const type = Object.keys(msg)[0]

        if (type === 'conversation') {
          await ctx.client.message.send(ctx.chat, {
            extendedTextMessage: {
              text: text || msg.conversation,
              contextInfo: { mentionedJid: jids }
            }
          })
          return
        }

        const node = msg[type]
        if (node && typeof node === 'object') {
          if (text) {
            if (type === 'imageMessage' || type === 'videoMessage' || type === 'documentMessage') {
              node.caption = text
            } else if (type === 'extendedTextMessage' || node.text !== undefined) {
              node.text = text
            }
          }
          node.contextInfo = { ...(node.contextInfo ?? {}), mentionedJid: jids }
        }

        await ctx.client.message.send(ctx.chat, msg)
        return
      } catch (err) {
        logger.warn({ err: err.message }, '📎 relay proto gagal, fallback teks')
      }
    }

    await ctx.client.message.send(ctx.chat, {
      extendedTextMessage: {
        text: text || '📢 Pengumuman dari admin grup!',
        contextInfo: { mentionedJid: jids }
      }
    })
  }
}
