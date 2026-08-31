/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 */
import { getUser, getBalance } from '../../core/database.js'
import { getCharacter, getInventory, getActiveQuests } from '../../core/rpg.js'

export default {
  name: 'me',
  aliases: ['profile', 'stats'],
  tags: 'general',
  description: 'Profil kamu: statistik bot + petualangan Nusantara Wilds',
  async run(ctx) {
    const user = getUser(ctx.sender)
    if (!user) {
      await ctx.reply('Data kamu belum tercatat. Coba pakai command lain dulu.')
      return
    }

    const fmt = (t) => new Date(t).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
    const bal = getBalance(ctx.sender)
    const char = getCharacter(ctx.sender)
    const inv = char ? getInventory(ctx.sender) : []
    const quests = char ? getActiveQuests(ctx.sender) : []

    const roleLine = ctx.isStaff
      ? `${ctx.role.toUpperCase()}${ctx.staffLabel ? ` • ${ctx.staffLabel}` : ''}`
      : 'User biasa'

    const wilds = char
      ? `│ 🌱 Level ${char.level} — ${char.xp}/${char.level * 100} XP\n` +
        `│ ❤️ ${char.hp}/${char.max_hp} • ⚡ ${char.energy}/${char.max_energy} • 💪 ${char.stamina}/${char.max_stamina}\n` +
        `│ 📍 ${char.location}${char.resting ? ` • 🛖 rest ${Math.floor(char.restProgress * 100)}%` : ''}\n` +
        `│ 🎒 ${inv.length} jenis item • 📜 ${quests.length} misi aktif`
      : `│ Belum memulai petualangan.\n│ Ketik .hunt buat mulai!`

    const text =
`╭─「 *PROFIL PETUALANG* 」👤─╮
│
│ 👤 Nama: ${user.name ?? ctx.pushName ?? '-'}
│ 📞 Nomor: @${ctx.senderNumber}
│ 🎖️ Role: ${roleLine}
│
│ ──  *STATISTIK BOT* ─
│ 🧩 Total command: ${user.command_count}
│ 📅 Pertama aktif: ${fmt(user.first_seen)}
│ 🕒 Terakhir aktif: ${fmt(user.last_seen)}
│ ${user.banned ? '🚫 Status: DI-BAN' : '✅ Status: Aktif'}
│
│ ── 🧭 *NUSANTARA WILDS* ──
${wilds}
│ 💰 ${bal.gold}G • 💎 ${bal.gems}
│
╰────────────────────✦╯`

    await ctx.client.message.send(ctx.chat, {
      extendedTextMessage: {
        text,
        contextInfo: { mentionedJid: [ctx.sender] }
      }
    })
  }
}
