/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * rest.js — Istirahat: pulihkan energi/stamina/HP, narasi bertema.
 */
import { createCharacter, updateCharacter } from '../../core/rpg.js'
import { FLAVOR, pick } from '../../src/rpg/flavor.js'

export default {
  name: 'rest',
  aliases: ['istirahat'],
  tags: 'rpg',
  cooldown: 30000,
  description: 'Istirahat buat pulihkan energi/stamina/HP',
  async run(ctx) {
    const char = createCharacter(ctx.sender, ctx.pushName)

    if (
      char.energy >= char.max_energy &&
      char.stamina >= char.max_stamina &&
      char.hp >= char.max_hp
    ) {
      await ctx.reply('✨ Tubuhmu sudah segar bugar — rimba menunggumu, tak ada yang perlu dipulihkan.')
      return
    }

    const after = updateCharacter(ctx.sender, {
      energy: Math.min(char.max_energy, char.energy + 50),
      stamina: Math.min(char.max_stamina, char.stamina + 50),
      hp: Math.min(char.max_hp, char.hp + 20)
    })

    await ctx.reply(
      `${pick(FLAVOR.rest)}\n\n` +
      `╭─🛖「 *PULIH* 」🛖─╮\n` +
      `│ ❤️ HP: ${after.hp}/${after.max_hp}\n` +
      `│ ⚡ Energi: ${after.energy}/${after.max_energy}\n` +
      `│ 💪 Stamina: ${after.stamina}/${after.max_stamina}\n` +
      `╰────────────────────✦╯`
    )
  }
}
