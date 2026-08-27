/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 */
import config from '../../config.js'
import { listFeatures } from '../loader.js'
import { totalUsers } from '../../core/database.js'

const CATEGORY = {
  general: '📌 GENERAL',
  interactive: '🎮 INTERACTIVE',
  owner: '👑 OWNER',
  tools: '🛠️ TOOLS',
  media: '🎨 MEDIA',
  ai: '🤖 AI',
  group: '👥 GROUP'
}

function fmtUptime(ms) {
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const parts = []
  if (d) parts.push(`${d} hari`)
  if (h) parts.push(`${h} jam`)
  parts.push(`${m} mnt`)
  return parts.join(' ')
}

export default {
  name: 'menu',
  aliases: ['help', 'cmd'],
  tags: 'general',
  description: 'Menampilkan daftar command',
  async run(ctx) {
    const features = listFeatures()
    const grouped = {}
    for (const f of features) {
      const tag = f.tags || 'other'
      ;(grouped[tag] ??= []).push(f)
    }

    const p = config.mainPrefix
    const lines = []

    lines.push(`╭━━━「 *${config.botName}* 」`)
    lines.push(`│ 👋 Hai, ${ctx.pushName || 'user'}!`)
    lines.push(`│ 🔖 Role: ${ctx.isStaff ? `${ctx.role.toUpperCase()}${ctx.staffLabel ? ` • ${ctx.staffLabel}` : ''}` : 'User'}`)
    lines.push(`│ 🧩 ${features.length} fitur • 👥 ${totalUsers()} user`)
    lines.push(`│ ⏱ Aktif ${fmtUptime(process.uptime() * 1000)}`)
    lines.push(`╰━━━━━━━━━━━━━━`)
    lines.push('')

    for (const [tag, list] of Object.entries(grouped)) {
      lines.push(`┌─「 ${CATEGORY[tag] || `📦 ${tag.toUpperCase()}`} 」`)
      for (const f of list) {
        const lock = f.owner ? ' 🔒' : f.admin ? ' 🛡️' : ''
        lines.push(`│ • ${p}${f.name}${lock} — ${f.description || ''}`)
      }
      lines.push(`└──────────`)
      lines.push('')
    }

    lines.push(`> _*Made with ♡ by JamvanHax0r*_\n> _*• ${config.botName} x Zapo-JS •*_`)
    await ctx.reply(lines.join('\n'))
  }
}
