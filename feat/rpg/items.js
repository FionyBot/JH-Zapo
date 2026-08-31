/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * items.js — Katalog lengkap item & item_id.
 */
import { ITEM_INDEX, TIER_ICON } from '../../src/rpg/dropTable.js'

const TIER_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary']
const TIER_LABEL = {
  common: 'COMMON',
  uncommon: 'UNCOMMON',
  rare: 'RARE',
  epic: 'EPIC',
  legendary: 'LEGENDARY'
}

export default {
  name: 'items',
  aliases: ['itemlist', 'katalog'],
  tags: 'rpg',
  description: 'Katalog lengkap item & item_id Nusantara Wilds',
  async run(ctx) {
    const blocks = []
    for (const tier of TIER_ORDER) {
      const items = Object.entries(ITEM_INDEX).filter(([, it]) => it.tier === tier)
      if (!items.length) continue
      blocks.push(
        `┌─「 ${TIER_ICON[tier]} *${TIER_LABEL[tier]}* 」\n` +
        items.map(([id, it]) => `│ • *${it.name}* _(${id})_ — ${it.value}G`).join('\n') +
        `\n└──────────`
      )
    }

    await ctx.reply(
`╭─📦「 *KATALOG ITEM* 」📦─
│
│ Gunakan _item_id_ di dalam
│ kurung untuk .sell / .craft.
│
${blocks.join('\n│\n')}
│
╰────────────────────✦╯`
    )
  }
}
