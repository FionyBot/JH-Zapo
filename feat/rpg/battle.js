/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * battle.js — Tantang monster rimba (tiered) + narasi pertarungan.
 */
import { createCharacter } from '../../core/rpg.js'
import { getMonsters, battle, BATTLE_COST } from '../../core/combat.js'
import { itemInfo } from '../../core/shop.js'
import { TIER_ICON } from '../../src/rpg/dropTable.js'

function resolveMonster(raw) {
  const q = raw.toLowerCase().trim()
  const compact = q.replace(/[\s_\-]+/g, '')
  const ms = getMonsters()
  return (
    ms.find((m) => m.id === q) ??
    ms.find((m) => m.name.toLowerCase() === q) ??
    ms.find((m) => m.name.toLowerCase().replace(/\s+/g, '') === compact) ??
    null
  )
}

export default {
  name: 'battle',
  aliases: ['lawan', 'serang', 'fight'],
  tags: 'rpg',
  cooldown: 5000,
  description: 'Bertarung dengan monster rimba (tiered)',
  async run(ctx) {
    createCharacter(ctx.sender, ctx.pushName)
    const raw = ctx.args.join(' ')

    if (!raw) {
      const lines = getMonsters().map((m) =>
        `│ ${TIER_ICON[m.tier]} *${m.name}* _(${m.id})_ — ❤️${m.hp} ⚔️${m.atk}\n│    🎁 ${itemInfo(m.loot)?.name ?? m.loot} • ${m.gold}G • ${m.xp}XP`
      )

      await ctx.reply(
`╭─⚔️「 *RIMBA LIAR* 」⚔️─╮
│
│ Biaya pertarungan:
│ ⚡ ${BATTLE_COST.energy} • 💪 ${BATTLE_COST.stamina}
│
${lines.join('\n')}
│
│ 💡 Tantang: ${ctx.prefix}battle <nama/id>
╰────────────────────✦╯`
      )
      return
    }

    const monster = resolveMonster(raw)
    if (!monster) {
      await ctx.reply(`❌ Monster "${raw}" tidak ada di rimba.`)
      return
    }

    const res = battle(ctx.sender, monster.id)

    if (res.error === 'resting') {
      await ctx.reply('🛖 Kamu sedang beristirahat — pertarungan bisa menunggu.')
      return
    }
    if (res.error === 'tired') {
      await ctx.reply(`😮‍💨 Tubuhmu terlalu lemah buat bertarung (butuh ⚡${BATTLE_COST.energy} 💪${BATTLE_COST.stamina}).\n.rest atau .use dulu.`)
      return
    }

    if (res.won) {
      let text =
        `${monster.intro}\n\n` +
        `⚔️ Pertarungan berlangsung *${res.rounds} ronde*...\n\n` +
        `╭─🏆「 *KEMENANGAN* 」🏆─╮\n` +
        `│ ${monster.win}\n` +
        `│\n` +
        `│ 🎁 *${itemInfo(monster.loot)?.name ?? monster.loot}* ×1\n` +
        `│ 💰 +${monster.gold}G • ⭐ +${monster.xp}XP\n` +
        `│ 💰 Dompet: ${res.wallet.gold}G • ⭐ ${res.xp}XP\n` +
        `│ ❤️ HP sisa: ${res.hpLeft}\n`

      if (res.weapon?.broken) {
        text += `│ 💥 *${itemInfo(res.weapon.broken)?.name ?? res.weapon.broken}* hancur setelah pertarungan!\n`
      } else if (res.weapon?.durability !== undefined) {
        text += `│ 🗡️ Durability senjata: ${res.weapon.durability}\n`
      }

      text += `╰────────────────────✦╯`

      for (const c of res.quests) {
        text += `\n\n📜 *MISI SELESAI — ${c.title}!*\n🎁 +${c.reward.gold}G • +${c.reward.xp}XP • +${c.reward.gems}💎`
      }

      await ctx.reply(text)
      return
    }

    await ctx.reply(
      `${monster.intro}\n\n` +
      `⚔️ Pertarungan berlangsung *${res.rounds} ronde*...\n\n` +
      `╭─💀「 *KEKALAHAN* 」💀─╮\n` +
      `│ ${monster.lose}\n` +
      `│\n` +
      `│ ❤️ HP: 1 — segera .rest atau .use\n` +
      `│ ⭐ +2 XP (pelajaran berharga)\n` +
      `╰────────────────────✦╯`
    )
  }
}
