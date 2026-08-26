import config from '../bot.config.js'
import { logger } from './logger.js'
import { buildContext } from './context.js'
import { readRichReply } from './richMessage.js'
import { getFeature, checkCooldown } from './features.js'

const richHandlers = new Map()

export function onRichReply(id, handler) {
  richHandlers.set(id, handler)
}

export async function route(client, event) {
  if (event.key.fromMe) return

  const ctx = buildContext(client, event)

  // 1) Cek dulu apakah ini balesan richMessage (klik tombol / pilih list)
  const richReply = readRichReply(event.message)
  if (richReply) {
    const handler = richHandlers.get(richReply.id)
    if (handler) {
      await handler(ctx, richReply)
    } else {
      logger.warn({ id: richReply.id, name: richReply.name }, 'Tidak ada handler untuk richMessage id ini')
    }
    return
  }

  // Diagnostik: ada pesan respons richMessage tapi id gak kebaca
  if (
    event.message?.interactiveResponseMessage ||
    event.message?.buttonsResponseMessage ||
    event.message?.listResponseMessage
  ) {
    logger.warn({ message: event.message }, 'Respons richMessage gak dikenal, cek bentuk raw-nya')
    return
  }

  // 2) Cek multi-prefix
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

  // 3) Cek owner
  if (feature.owner && !ctx.isOwner) {
    await ctx.reply('🚫 Fitur ini khusus owner bot.')
    return
  }

  // 4) Cek cooldown (skip untuk owner)
  if (!ctx.isOwner && config.cooldown > 0) {
    const { onCooldown, remainingMs } = checkCooldown(
      ctx.sender,
      commandName,
      feature.cooldown || config.cooldown
    )
    
    if (onCooldown) {
      const remainingSec = (remainingMs / 1000).toFixed(1)
      await ctx.reply(`⏳ Tunggu ${remainingSec} detik sebelum menggunakan command ini lagi.`)
      return
    }
  }

  ctx.prefix = matchedPrefix
  ctx.command = commandName.toLowerCase()
  ctx.args = args
  ctx.text = args.join(' ')

  try {
    await feature.run(ctx)
  } catch (err) {
    logger.error({ err, feature: feature.name }, 'Feature gagal dijalankan')
    await ctx.reply(`⚠️ Terjadi error saat menjalankan ${matchedPrefix}${feature.name}.`)
  }
}
