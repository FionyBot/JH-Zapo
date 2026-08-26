import config from '../bot.config.js'
import { logger } from './logger.js'
import { buildContext } from './context.js'
import { readRichReply } from './richMessage.js'
import { getFeature } from './features.js'

// name-space untuk id richMessage supaya gak nabrak sama id command lain,
// mis. tombol dengan id "rich:greet" ditangani terpisah dari command teks "greet".
const richHandlers = new Map()

/** Daftarkan handler untuk id tombol/list tertentu (dipakai dari feature). */
export function onRichReply(id, handler) {
  richHandlers.set(id, handler)
}

export async function route(client, event) {
  // Sinkronisasi multi-device — abaikan pesan yang bot kirim sendiri
  if (event.key.fromMe) return

  const ctx = buildContext(client, event)

  // 1) Cek dulu apakah ini balesan richMessage (klik tombol / pilih list)
  const richReply = readRichReply(event.message)
  if (richReply) {
    const handler = richHandlers.get(richReply.id)
    if (handler) {
      await handler(ctx, richReply)
    } else {
      logger.debug({ id: richReply.id }, 'Tidak ada handler untuk richMessage id ini')
    }
    return
  }

  // 2) Bukan richMessage → treat sebagai command teks biasa
  if (!ctx.body || !ctx.body.startsWith(config.prefix)) return

  const withoutPrefix = ctx.body.slice(config.prefix.length).trim()
  const [commandName, ...args] = withoutPrefix.split(/\s+/)
  if (!commandName) return

  const feature = getFeature(commandName)
  if (!feature) return

  if (feature.owner && !ctx.isOwner) {
    await ctx.reply('🚫 Fitur ini khusus owner bot.')
    return
  }

  ctx.command = commandName.toLowerCase()
  ctx.args = args
  ctx.text = args.join(' ')

  try {
    await feature.run(ctx)
  } catch (err) {
    logger.error({ err, feature: feature.name }, 'Feature gagal dijalankan')
    await ctx.reply(`⚠️ Terjadi error saat menjalankan ${config.prefix}${feature.name}.`)
  }
}
