/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * gather.js — Aktivitas gathering Nusantara Wilds.
 * [UPDATE BELOW]
 *
 * .hunt / .forage / .fish — energi & stamina terpakai SETIAP percobaan,
 * miss chance 25% biar ada perjuangan, narasi bertema dari flavor.js.
 */
import { createCharacter, getCharacter, updateCharacter, addItem, gainXp } from '../../core/rpg.js'
import { rollDrop, TIER_ICON } from '../../src/rpg/dropTable.js'
import { FLAVOR, pick } from '../../src/rpg/flavor.js'

const ACTIVITY = {
  hunt: { key: 'hunting', icon: '🏹', label: 'BERBURU', energy: 20, stamina: 15 },
  forage: { key: 'foraging', icon: '🌿', label: 'MERAMU', energy: 10, stamina: 5 },
  fish: { key: 'fishing', icon: '🎣', label: 'MEMANCING', energy: 15, stamina: 10 },
}

const XP_GAIN = { common: 2, uncommon: 5, rare: 15, epic: 40, legendary: 100 }
const MISS_CHANCE = 0.25

export default {
  name: 'hunt',
  aliases: ['forage', 'fish'],
  tags: 'rpg',
  cooldown: 5000,
  description: 'Gathering: berburu/meramu/memancing (Nusantara Wilds)',
  async run(ctx) {
    const act = ACTIVITY[ctx.command]
    const existed = getCharacter(ctx.sender)
    const char = createCharacter(ctx.sender, ctx.pushName)

    if (char.energy < act.energy || char.stamina < act.stamina) {
      await ctx.reply(
        `${pick(FLAVOR.tired)}\n\n` +
        `⚡ Energi: ${char.energy}/${char.max_energy}\n` +
        `💪 Stamina: ${char.stamina}/${char.max_stamina}\n\n` +
        `🛖 Ketik *.rest* untuk beristirahat.`
      )
      return
    }

    // Energi & stamina terpakai di SETIAP percobaan — berhasil atau tidak
    const after = updateCharacter(ctx.sender, {
      energy: Math.max(0, char.energy - act.energy),
      stamina: Math.max(0, char.stamina - act.stamina)
    })

    const missed = Math.random() < MISS_CHANCE
    const drop = missed ? null : rollDrop(act.key)

    if (!drop) {
      gainXp(ctx.sender, 1)
      await ctx.reply(
        `${pick(FLAVOR[act.key].miss)}\n\n` +
        `⚡ Energi: ${after.energy}/${after.max_energy}\n` +
        `💪 Stamina: ${after.stamina}/${after.max_stamina}\n` +
        `⭐ +1 XP (pelajaran berharga)`
      )
      return
    }

    addItem(ctx.sender, drop.id, 1)
    const { leveledUp } = gainXp(ctx.sender, XP_GAIN[drop.tier] ?? 2)

    let text =
      pick(FLAVOR[act.key].success).replace('{item}', `*${drop.name}*`) +
      `\n\n╭─${act.icon}「 *${act.label}* 」${act.icon}─╮\n` +
      `│ 🎯 Hasil: *${drop.name}*\n` +
      `│ 🏷️ Tier: ${TIER_ICON[drop.tier]} ${drop.tier.toUpperCase()}\n` +
      `│ 💵 Nilai: ${drop.value} gold\n` +
      `│ ⭐ +${XP_GAIN[drop.tier] ?? 2} XP\n` +
      `│\n` +
      `│ ⚡ Energi: ${after.energy}/${after.max_energy}\n` +
      `│ 💪 Stamina: ${after.stamina}/${after.max_stamina}\n` +
      `╰────────────────────✦╯`

    if (!existed) text = `${pick(FLAVOR.welcome)}\n\n${text}`
    if (leveledUp) {
      text += `\n\n🔥 *TUBUHMU KIAN TERLATIH!* Naik ke level ${after.level} — batas stats meningkat & pulih penuh.`
    }

    await ctx.reply(text)
  }
}
