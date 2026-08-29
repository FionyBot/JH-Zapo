/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * rest.js — Istirahat time-based: mulai rest, cek progress, narasi bertahap.
 * [UPDATE BELOW]
 *
 * Durasi mengikuti seberapa habisnya stats (30s – 10m).
 */
import { createCharacter, getCharacter, startRest } from '../../core/rpg.js'
import { FLAVOR, pick, restStage, fmtSec } from '../../src/rpg/flavor.js'

export default {
  name: 'rest',
  aliases: ['istirahat'],
  tags: 'rpg',
  cooldown: 5000,
  description: 'Beristirahat — pemulihan bertahap sesuai waktu',
  async run(ctx) {
    const char = createCharacter(ctx.sender, ctx.pushName)

    // Sedang rest → tunjukin progress
    if (char.resting) {
      const pct = Math.floor(char.restProgress * 100)
      await ctx.reply(
`╭─「 *ISTIRAHAT* 」🛖─
│
│ ${restStage(char.restProgress)}
│
│ 🕰️ Progress: *${pct}%*
│ ⏳ Sisa waktu: ${fmtSec(char.restRemaining)}
│
│ ❤️ HP: ${char.hp}/${char.max_hp}
│ ⚡ Energi: ${char.energy}/${char.max_energy}
│ 💪 Stamina: ${char.stamina}/${char.max_stamina}
│
╰────────────────────✦╯`
      )
      return
    }

    // Udah penuh
    if (
      char.energy >= char.max_energy &&
      char.stamina >= char.max_stamina &&
      char.hp >= char.max_hp
    ) {
      await ctx.reply(pick(FLAVOR.fresh))
      return
    }

    // Mulai rest
    const { duration } = startRest(ctx.sender)
    await ctx.reply(
      `${pick(FLAVOR.startRest)}\n\n` +
      `🕰️ Perkiraan pemulihan: *${fmtSec(duration)}*\n` +
      `Cek progresmu kapan pun dengan *.rest* atau *.status*.`
    )
  }
}
