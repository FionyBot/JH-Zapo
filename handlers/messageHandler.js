/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * messageHandler.js — Routing pesan masuk: richMessage, command, anti-spam.
 */
import config from '../config.js'
import { logger } from '../core/logger.js'
import { buildContext } from '../core/context.js'
import { readRichReply } from '../lib/richMessage.js'
import { getFeature } from '../feat/loader.js'
import { checkCooldown, checkFlood } from '../core/cooldown.js'
import { touchUser, incrementCommand, getUser } from '../core/database.js'
import { sendTyping, markRead } from '../core/presence.js'
import { reactTo } from '../core/react.js'

const richHandlers = new Map()

export function onRichReply(id, handler) {
  richHandlers.set(id, handler)
}

function describeMessage(message) {
  if (!message) return '(pesan kosong)'
  if (message.conversation) return `teks: "${message.conversation}"`
  if (message.extendedTextMessage?.text) return `teks: "${message.extendedTextMessage.text}"`
  if (message.imageMessage) return `gambar 📷${message.imageMessage.caption ? ` • "${message.imageMessage.caption}"` : ''}`
  if (message.videoMessage) return `video 🎥${message.videoMessage.caption ? ` • "${message.videoMessage.caption}"` : ''}`
  if (message.stickerMessage) return 'stiker 🟡'
  if (message.audioMessage) return 'audio 🎵'
  if (message.documentMessage) return `dokumen 📄 ${message.documentMessage.fileName ?? ''}`
  if (message.contactMessage) return 'kontak 👤'
  if (message.locationMessage) return 'lokasi 📍'
  const keys = Object.keys(message)
  return keys.length ? `(bentuk belum dikenal: ${keys.join(', ')})` : '(pesan kosong)'
}

export async function route(client, event) {
  if (event.key.fromMe) return

  const ctx = buildContext(client, event)
  const who = `${ctx.pushName || 'Anonim'} +${ctx.senderNumber}`
  const where = ctx.isGroup ? 'GRUP' : 'PRIV'

  if (config.autoRead) void markRead(client, event)

  const richReply = readRichReply(event.message)
  if (richReply) {
    logger.info(`🖱️  ${who} [${where}] memilih "${richReply.id}"`)
    const handler = richHandlers.get(richReply.id)
    if (handler) {
      try {
        await handler(ctx, richReply)
      } catch (err) {
        logger.error({ err, id: richReply.id }, 'Handler richMessage gagal')
      }
    } else {
      logger.warn(`⚠️  Tidak ada handler untuk rich id "${richReply.id}"`)
    }
    return
  }

  if (
    event.message?.interactiveResponseMessage ||
    event.message?.buttonsResponseMessage ||
    event.message?.listResponseMessage ||
    event.message?.templateButtonReplyMessage
  ) {
    logger.warn({ raw: event.message }, '🧩 Respons richMessage belum dikenal')
    return
  }

  logger.info(`💬 ${who} [${where}] ${describeMessage(event.message)}`)

  if (!ctx.body) return

  let matchedPrefix = ''
  for (const prefix of config.prefixes) {
    if (ctx.body.startsWith(prefix)) {
      matchedPrefix = prefix
      break
    }
  }
  if (!matchedPrefix) return

  const withoutPrefix = ctx.body.slice(matchedPrefix.length).trim()
  const [commandName, ...args] = withoutPrefix.split(/\s+/)
  if (!commandName) return

  const feature = getFeature(commandName)
  if (!feature) return // Command gak ada → diem, no react

  // [UPDATE⭐] REACT: muncul di sini karena command valid
  void reactTo(client, event, '⏱️')

  touchUser(ctx.sender, ctx.pushName)

  if (!ctx.isStaff) {
    const rowPn = getUser(ctx.sender)
    const rowLid = ctx.senderLid ? getUser(ctx.senderLid) : undefined
    if (rowPn?.banned || rowLid?.banned) {
      logger.info(`🚫 ${who} [${where}] di-ban — command ${commandName} ditolak`)
      await ctx.reply('🚫 Kamu telah di-ban oleh owner bot.')
      return
    }
  }

  if (feature.owner && !ctx.isOwner) {
    await ctx.reply('🚫 Fitur ini khusus Owner bot.')
    return
  }

  if (feature.admin && !ctx.isAdmin) {
    await ctx.reply('🚫 Fitur ini khusus Owner/Admin bot.')
    return
  }

  if (!ctx.isStaff && config.antiSpam?.enabled) {
    const flood = checkFlood(ctx.sender, config.antiSpam)
    if (flood.flooded) {
      await ctx.reply(`🐢 Pelan-pelan! Tunggu ${(flood.remainingMs / 1000).toFixed(0)} detik.`)
      return
    }
  }

  if (!ctx.isStaff) {
    const cd = checkCooldown(ctx.sender, commandName, feature.cooldown ?? config.cooldown ?? 0)
    if (cd.onCooldown) {
      await ctx.reply(`⏳ Tunggu ${(cd.remainingMs / 1000).toFixed(1)} detik buat pakai ${matchedPrefix}${commandName}.`)
      return
    }
  }

  if (config.typingPresence) void sendTyping(client, ctx.chat)

  ctx.prefix = matchedPrefix
  ctx.command = commandName.toLowerCase()
  ctx.args = args
  ctx.text = withoutPrefix.slice(commandName.length).trim()

  incrementCommand(ctx.sender)
  logger.info(`⚙️  [CMD] ${matchedPrefix}${commandName} oleh +${ctx.senderNumber}${ctx.role ? ` (${ctx.role})` : ''}`)

  try {
    await feature.run(ctx)
  } catch (err) {
    logger.error({ err, feature: feature.name }, 'Feature gagal dijalankan')
    await ctx.reply(`⚠️ Terjadi error saat menjalankan ${matchedPrefix}${feature.name}.`)
  }
}
