/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * status.js — Status karakter + inventory Nusantara Wilds.
 */
import { createCharacter, getInventory } from '../../core/rpg.js'
import { ITEM_INDEX, TIER_ICON } from '../../src/rpg/dropTable.js'
import { restStage, fmtSec } from '../../src/rpg/flavor.js'

export default {
  name: 'status',
  aliases: ['stats', 'inv', 'inventory'],
  tags: 'rpg',
  description: 'Status karakter + inventory Nusantara Wilds',
  async run(ctx) {
    const char = createCharacter(ctx.sender, ctx.pushName)
    const inv = getInventory(ctx.sender)

    const lines = inv
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 15)
      .map((row) => {
        const item = ITEM_INDEX[row.item_id]
        const name = item?.name ?? row.item_id
        const tier = item ? TIER_ICON[item.tier] : ''
        return `│ ${tier} ${name} ×${row.amount}`
      })

    const more = inv.length > 15 ? `\n│ … +${inv.length - 15} item lainnya` : ''
    const empty = '│ Satchel-mu masih kosong.\n│ Rimba di luar sana menunggumu — coba .hunt / .forage / .fish.'

    const restLine = char.resting
      ? `\n│ 🛖 Sedang beristirahat: *${Math.floor(char.restProgress * 100)}%*\n│    ${restStage(char.restProgress)}\n│    ⏳ Sisa ${fmtSec(char.restRemaining)}\n`
      : ''

    await ctx.reply(
`╭─🧭「 *NUSANTARA WILDS* 」🧭─
│
│ 👤 ${char.name} — Level ${char.level}
│ ⭐ XP: ${char.xp}/${char.level * 100}
│ 💰 Gold: ${char.gold}
│ 📍 Lokasi: ${char.location}
│
│ ❤️ HP: ${char.hp}/${char.max_hp}
│ ⚡ Energi: ${char.energy}/${char.max_energy}
│ 💪 Stamina: ${char.stamina}/${char.max_stamina}${restLine}
│
│ 🎒 *SATCHEL* (${inv.length} jenis)
${lines.length ? lines.join('\n') : empty}${more}
│
╰────────────────────✦╯`
    )
  }
}
