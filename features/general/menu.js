import config from '../../bot.config.js'
import { listFeatures } from '../../core/features.js'

const CATEGORY = {
  general: '📌 GENERAL',
  interactive: '🎮 INTERACTIVE',
  owner: '👑 OWNER',
  tools: '🛠️ TOOLS',
  media: '🎨 MEDIA',
  ai: '🤖 AI'
}

export default {
  name: 'menu',
  aliases: ['help', 'cmd'],
  tags: 'general',
  description: 'Menampilkan daftar command yang tersedia',
  async run(ctx) {
    const grouped = {}
    for (const f of listFeatures()) {
      const tag = f.tags || 'other'
      ;(grouped[tag] ??= []).push(f)
    }

    const p = config.mainPrefix
    const lines = [
      `*${config.botName}*`,
      `Prefix: ${config.prefix.join('  ')}`,
      `Halo ${ctx.pushName || 'user'}, berikut daftar command 👇`,
      ''
    ]

    for (const [tag, list] of Object.entries(grouped)) {
      lines.push(CATEGORY[tag] || `📦 ${tag.toUpperCase()}`)
      for (const f of list) {
        const lock = f.owner ? ' 🔒' : ''
        lines.push(`├ ${p}${f.name}${lock}${f.description ? ` — ${f.description}` : ''}`)
      }
      lines.push('')
    }

    lines.push(`Contoh: ${p}ping`)
    await ctx.reply(lines.join('\n'))
  }
}
