/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 */
import config from '../../config.js'
import { listFeatures } from '../loader.js'
import { totalUsers, getBalance } from '../../core/database.js'
import { getCharacter } from '../../core/rpg.js'
import { onRichReply } from '../../handlers/messageHandler.js'

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

const CATEGORY_INFO = {
  general: 'Informasi & Utilitas Dasar',
  interactive: 'Demo Tombol & List',
  owner: 'Khusus Owner Bot',
  tools: 'Stiker & Konversi Media',
  media: 'Olah Media',
  ai: 'Kecerdasan Buatan',
  group: 'Manajemen Grup',
  game: 'Game Santai Grup',
  rpg: 'Petualangan Nusantara Wilds'
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

function footer() {
  return `> _*Made with ♡ by JamvanHax0r*_\n> _*• ${config.botName} x Zapo-JS •*_`
}

function regroup() {
  const grouped = {}
  for (const f of listFeatures()) {
    const tag = f.tags || 'other'
    ;(grouped[tag] ??= []).push(f)
  }
  return grouped
}

function header(ctx, features) {
  const char = getCharacter(ctx.sender)
  const bal = getBalance(ctx.sender)
  return [
    `╭━━━「 *${config.botName}* 」`,
    `│ 👋 Hai, ${ctx.pushName || 'user'}!`,
    `│ 🔖 Role: ${ctx.isStaff ? `${ctx.role.toUpperCase()}${ctx.staffLabel ? ` • ${ctx.staffLabel}` : ''}` : 'User'}`,
    `│ 🧩 ${features.length} fitur • 👥 ${totalUsers()} user`,
    `│ ⏱ Aktif ${fmtUptime(process.uptime() * 1000)}`,
    char
      ? `│ 🧭 NW: Lv.${char.level} • 💰 ${bal.gold}G • 💎 ${bal.gems}`
      : `│ 🧭 NW: belum mulai — coba ${config.mainPrefix}hunt`,
    `╰━━━━━━━━━━━━━━`
  ]
}

function commandLine(f, p) {
  const lock = f.owner ? ' 🔒' : f.admin ? ' 🛡️' : ''
  const aliases = (f.aliases ?? []).map((a) => `${p}${a}`).join(' / ')
  return `│ • *${p}${f.name}${aliases ? ` / ${aliases}` : ''}*${lock} — _${f.description || ''}_`
}

function allMenu(ctx, grouped) {
  const p = config.mainPrefix
  const lines = [...header(ctx, listFeatures()), '']
  for (const [tag, list] of Object.entries(grouped)) {
    lines.push(`┌─「 ${CATEGORY[tag] || `📦 ${tag.toUpperCase()}`} 」`)
    for (const f of list) lines.push(commandLine(f, p))
    lines.push(`└──────────`)
    lines.push('')
  }
  lines.push(footer())
  return lines.join('\n')
}

function categoryMenu(ctx, tag, grouped) {
  const p = config.mainPrefix
  const list = grouped[tag] ?? []
  const lines = [
    `╭─「 ${CATEGORY[tag] || `📦 ${tag.toUpperCase()}`} 」`,
    `│ _${CATEGORY_INFO[tag] || ''}_`,
    ...list.map((f) => commandLine(f, p)),
    `└──────────`,
    '',
    `💡 *.menu all* buat lihat semua • *.menu button* via tombol`
  ]
  return lines.join('\n')
}

function overviewMenu(ctx, grouped) {
  const lines = [...header(ctx, listFeatures()), '']
  lines.push(`┌─「 ️ DAFTAR KATEGORI 」`)
  for (const [tag, list] of Object.entries(grouped)) {
    lines.push(`│ ${CATEGORY[tag] || `📦 ${tag.toUpperCase()}`} — _${CATEGORY_INFO[tag] || ''}_ (${list.length} fitur)`)
  }
  lines.push(`└──────────`)
  lines.push('')
  lines.push(`💡 Buka kategori: *.menu <kategori>* (mis. *.menu rpg*)`)
  lines.push(`   Lihat semua: *.menu all* • Via tombol: *.menu button*`)
  lines.push(footer())
  return lines.join('\n')
}

/** [UPDATE] Daftarin handler button menu (id: menu:cat:<tag> / menu:all). */
function ensureHandlers(grouped) {
  for (const tag of Object.keys(grouped)) {
    onRichReply(`menu:cat:${tag}`, async (c) => {
      await c.reply(categoryMenu(c, tag, regroup()))
    })
  }
  onRichReply('menu:all', async (c) => {
    await c.reply(allMenu(c, regroup()))
  })
}

export default {
  name: 'menu',
  aliases: ['help', 'cmd'],
  tags: 'general',
  description: 'Menu: default per-kategori, .menu all, .menu <kategori>, .menu button',
  async run(ctx) {
    const grouped = regroup()
    ensureHandlers(grouped)
    const sub = (ctx.args[0] ?? '').toLowerCase()

    if (sub === 'all') {
      await ctx.reply(allMenu(ctx, grouped))
      return
    }

    if (sub === 'button' || sub === 'btn') {
      const buttons = Object.keys(grouped).map((tag) => ({
        id: `menu:cat:${tag}`,
        text: CATEGORY[tag] || `📦 ${tag.toUpperCase()}`
      }))
      buttons.push({ id: 'menu:all', text: '📜 SEMUA' })

      await ctx.replyButtons({
        text: `Pilih kategori ${config.botName}:`,
        footer: 'Menu Interaktif',
        buttons
      })
      return
    }

    if (sub) {
      if (!grouped[sub]) {
        await ctx.reply(
          `❌ Kategori "${sub}" gak ada.\nKategori tersedia: ${Object.keys(grouped).join(', ')}`
        )
        return
      }
      await ctx.reply(categoryMenu(ctx, sub, grouped))
      return
    }

    await ctx.reply(overviewMenu(ctx, grouped))
  }
}
