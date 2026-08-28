/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * antilinkHandler.js — Listener terpisah: hapus link yang masuk BLACKLIST.
 *
 * Link umum (IG/YT/TikTok/X/dll) = boleh. Link di blacklist
 * (invite WA/Telegram/dll — bau promote) = dihapus + warning mention.
 * Staff bot & admin grup kebal. Delete via protocolMessage REVOKE.
 */
import config from '../config.js'
import { logger } from '../core/logger.js'
import { buildContext } from '../core/context.js'
import { isOn, getSetting } from '../core/groupSettings.js'
import { getGroupRole } from '../core/permission.js'

const URL_RE = /(https?:\/\/|www\.)[^\s]+/gi

function hostOf(url) {
  return url
    .replace(/^(https?:\/\/)?(www\.)?/i, '')
    .split(/[/?#]/)[0]
    .toLowerCase()
}

export async function checkAntilink(client, event) {
  try {
    if (event.key.fromMe) return

    const ctx = buildContext(client, event)
    if (!ctx.isGroup || !ctx.body) return
    if (!isOn(ctx.chat, 'antilink')) return
    if (ctx.isStaff) return

    const urls = ctx.body.match(URL_RE)
    if (!urls) return

    const blacklist = (getSetting(ctx.chat, 'antilink_blacklist') ?? config.antilink.defaultBlacklist)
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)

    const violation = urls.some((u) => {
      const host = hostOf(u)
      return blacklist.some((d) => host === d || host.endsWith(`.${d}`))
    })
    if (!violation) return

    const role = await getGroupRole(client, ctx.chat, ctx.sender, ctx.senderLid)
    if (role) return

    await client.message.send(ctx.chat, {
      protocolMessage: { key: event.key, type: 0 }
    })

    await client.message.send(ctx.chat, {
      extendedTextMessage: {
        text: `⚠️ @${ctx.senderNumber} mengirim link terlarang (blacklist) — pesan dihapus.`,
        contextInfo: { mentionedJid: [ctx.sender] }
      }
    })

    logger.info(`🛡️ antilink: pesan +${ctx.senderNumber} dihapus @ ${ctx.chat}`)
  } catch (err) {
    logger.warn({ err: err.message }, 'antilink check gagal')
  }
}
