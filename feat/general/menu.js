/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 */
import config from '../../config.js'
import { listFeatures } from '../loader.js'
import { totalUsers, getBalance } from '../../core/database.js'
import { getCharacter } from '../../core/rpg.js'

const CATEGORY = {
  general: '📌 GENERAL',
  interactive: '🎮 INTERACTIVE',
  owner: '👑 OWNER',
  tools: '🛠️ TOOLS',
  media: '🎨 MEDIA',
  ai: '🤖 AI',
  group: '👥 GROUP',
  game: '🎮 GAME',
  rpg: '🧭 RPG'
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

    // [UPDATE] Elemen RPG biar "terkoneksi"
    const char = getCharacter(ctx.sender)
    const bal = getBalance(ctx.sender)

    lines.push(`╭━━━「 *${config.botName}* 」`)
    lines.push(`│ 👋 Hai, ${ctx.pushName || 'user'}!`)
    lines.push(`│ 🔖 Role: ${ctx.isStaff ? `${ctx.role.toUpperCase()}${ctx.staffLabel ? ` • ${ctx.staffLabel}` : ''}` : 'User'}`)
    lines.push(`│ 🧩 ${features.length} fitur • 👥 ${totalUsers()} user`)
    lines.push(`│ ⏱ Aktif ${fmtUptime(process.uptime() * 1000)}`)
    lines.push(
      char
        ? `│ 🧭 NW: Lv.${char.level} • 💰 ${bal.gold}G • 💎 ${bal.gems}`
        : `│ 🧭 NW: belum mulai — coba ${p}hunt`
    )
    lines.push(`╰━━━━━━━━━━━━━━`)
    lines.push('')

    for (const [tag, list] of Object.entries(grouped)) {
      lines.push(`┌─「 ${CATEGORY[tag] || `📦 ${tag.toUpperCase()}`} 」`)
      for (const f of list) {
        const lock = f.owner ? ' 🔒' : f.admin ? ' 🛡️' : ''
        const aliases = (f.aliases ?? []).map((a) => `${p}${a}`).join(' / ')
        lines.push(`│ • *${p}${f.name}${aliases ? ` / ${aliases}` : ''}${lock}* — _${f.description || ''}_`)
      }
      lines.push(`└──────────`)
      lines.push('')
    }

    lines.push(`> _*Made with ♡ by JamvanHax0r*_\n> _*• ${config.botName} x Zapo-JS •*_`)
    await ctx.reply(lines.join('\n'))
  }
}
