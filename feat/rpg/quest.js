/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * quest.js — Papan misi & klaim quest Nusantara Wilds.
 * .quest → papan | .quest daily/weekly/monthly/story → klaim
 */
import { createCharacter } from '../../core/rpg.js'
import { activeQuests, activeOfType, claimQuest, questDef, TYPE_ICON } from '../../core/questEngine.js'

function questBox(icon, header, def, row) {
  return (
`╭─${icon}「 *${header}* 」${icon}─╮
│
│ 📜 *${def?.title ?? row.quest_id}*
│ ${def?.desc ?? ''}
│
│ 🎯 Progres: ${row.progress}/${row.target}
│ 🎁 Hadiah: ${def?.reward.gold ?? 0}G / ${def?.reward.xp ?? 0}XP / ${def?.reward.gems ?? 0}💎
│
╰────────────────────✦╯`
  )
}

export default {
  name: 'quest',
  aliases: ['misi', 'quests'],
  tags: 'rpg',
  cooldown: 3000,
  description: 'Papan misi & klaim quest (daily/weekly/monthly/story)',
  async run(ctx) {
    createCharacter(ctx.sender, ctx.pushName)
    const sub = (ctx.args[0] ?? '').toLowerCase()

    if (['daily', 'weekly', 'monthly', 'story'].includes(sub)) {
      const existing = activeOfType(ctx.sender, sub)
      if (existing) {
        await ctx.reply(questBox(TYPE_ICON[sub], `MISI ${sub.toUpperCase()} BERJALAN`, questDef(sub, existing.quest_id), existing))
        return
      }

      const res = claimQuest(ctx.sender, sub)
      if (res.error === 'done_all') {
        await ctx.reply('📖 Semua bab cerita telah kau selesaikan. Rimba menunggu musim baru...')
        return
      }
      if (res.error === 'active' || !res.quest) {
        await ctx.reply('😅 Gak ada misi tersedia buat sekarang.')
        return
      }

      await ctx.reply(questBox(TYPE_ICON[sub], 'MISI BARU', res.quest, { progress: 0, target: res.quest.target }))
      return
    }

    // Papan misi
    const actives = activeQuests(ctx.sender)
    const lines = actives.length
      ? actives
          .map((r) => {
            const def = questDef(r.quest_type, r.quest_id)
            return `│ ${TYPE_ICON[r.quest_type]} *${def?.title ?? r.quest_id}* — ${r.progress}/${r.target}`
          })
          .join('\n')
      : '│ Papan misimu masih kosong.\n│ Klaim: .quest daily / weekly / monthly / story'

    await ctx.reply(
`╭─「 *PAPAN MISI* 」📜─
│
${lines}
│
│ 🌅 daily • 🗓️ weekly • 🌙 monthly • 📖 story
╰────────────────────✦╯`
    )
  }
}
