import config from '../bot.config.js'
import { logger } from './logger.js'
import { buildContext } from './context.js'
import { readRichReply } from './richMessage.js'
import { getFeature } from './features.js'
import { checkCooldown, checkFlood } from './cooldown.js'
import { touchUser, incrementCommand } from './db.js'
import { sendTyping, markRead } from './presence.js'

const richHandlers = new Map()

export function onRichReply(id, handler) {
  richHandlers.set(id, handler)
}

const num = (jid) => (jid || '').split('@')[0].split(':')[0]

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
  const who = `${ctx.pushName || 'Anonim'} +${num(ctx.sender)}`
  const where = ctx.isGroup ? 'GRUP' : 'PRIV'

  // Auto-read pesan masuk
  if (config.autoRead) {
    void markRead(client, event)
  }

  // 1) respons richMessage (tap tombol / pilih list)
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

  // 2) diagnostik respons rich yang id-nya gak kebaca
  if (
    event.message?.interactiveResponseMessage ||
    event.message?.buttonsResponseMessage ||
    event.message?.listResponseMessage ||
    event.message?.templateButtonReplyMessage
  ) {
    logger.warn({ raw: event.message }, '🧩 Respons richMessage belum dikenal')
    return
  }

  // 3) log pesan masuk biasa
  logger.info(`💬 ${who} [${where}] ${describeMessage(event.message)}`)

  // 4) routing command multi-prefix
  if (!ctx.body) return

  let matchedPrefix = ''
  for (const prefix of config.prefix) {
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
  if (!feature) return

  // Catat user ke database
  const user = touchUser(ctx.sender, ctx.pushName)

  // User di-ban? (owner kebal)
  if (user?.banned && !ctx.isOwner) {
    logger.info(`🚫 ${who} [${where}] di-ban — command ${commandName} ditolak`)
    await ctx.reply('🚫 Kamu telah di-ban oleh owner bot.')
    return
  }

  // Fitur khusus owner
  if (feature.owner && !ctx.isOwner) {
    await ctx.reply('🚫 Fitur ini khusus owner bot.')
    return
  }

  // Anti-spam (flood protection)
  if (!ctx.isOwner && config.antiSpam?.enabled) {
    const flood = checkFlood(ctx.sender, config.antiSpam)
    if (flood.flooded) {
      await ctx.reply(`🐢 Pelan-pelan! Tunggu ${(flood.remainingMs / 1000).toFixed(0)} detik sebelum kirim command lagi.`)
      return
    }
  }

  // Cooldown per-command
  if (!ctx.isOwner) {
    const cd = checkCooldown(ctx.sender, commandName, feature.cooldown ?? config.cooldown ?? 0)
    if (cd.onCooldown) {
      await ctx.reply(`⏳ Tunggu ${(cd.remainingMs / 1000).toFixed(1)} detik lagi buat pakai ${matchedPrefix}${commandName}.`)
      return
    }
  }

  // Indikator "sedang mengetik..."
  if (config.typingPresence) {
    void sendTyping(client, ctx.chat)
  }

  ctx.prefix = matchedPrefix
  ctx.command = commandName.toLowerCase()
  ctx.args = args
  ctx.text = args.join(' ')

  incrementCommand(ctx.sender)
  logger.info(`⚙️  [CMD] ${matchedPrefix}${commandName} dijalankan oleh +${num(ctx.sender)}`)
  try {
    await feature.run(ctx)
  } catch (err) {
    logger.error({ err, feature: feature.name }, 'Feature gagal dijalankan')
    await ctx.reply(`⚠️ Terjadi error saat menjalankan ${matchedPrefix}${feature.name}.`)
  }
}
