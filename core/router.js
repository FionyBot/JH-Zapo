import config from '../bot.config.js'
import { logger } from './logger.js'
import { buildContext } from './context.js'
import { readRichReply } from './richMessage.js'
import { getFeature } from './features.js'

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

  // 2) diagnostik: ada respons rich tapi id gak kebaca
  if (
    event.message?.interactiveResponseMessage ||
    event.message?.buttonsResponseMessage ||
    event.message?.listResponseMessage
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

  if (feature.owner && !ctx.isOwner) {
    await ctx.reply('🚫 Fitur ini khusus owner bot.')
    return
  }

  ctx.prefix = matchedPrefix
  ctx.command = commandName.toLowerCase()
  ctx.args = args
  ctx.text = args.join(' ')

  logger.info(`⚙️  [CMD] ${matchedPrefix}${commandName} dijalankan oleh +${num(ctx.sender)}`)
  try {
    await feature.run(ctx)
  } catch (err) {
    logger.error({ err, feature: feature.name }, 'Feature gagal dijalankan')
    await ctx.reply(`⚠️ Terjadi error saat menjalankan ${matchedPrefix}${feature.name}.`)
  }
}
