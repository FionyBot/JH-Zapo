/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * equip.js — Pasang/lepas gear (weapon/armor) + lihat loadout.
 */
import { createCharacter } from '../../core/rpg.js'
import { getLoadout, equipItem, unequipSlot, playerCombatStats } from '../../core/combat.js'
import { itemInfo, resolveAnyItemId } from '../../core/shop.js'

export default {
  name: 'equip',
  aliases: ['loadout', 'unequip'],
  tags: 'rpg',
  cooldown: 3000,
  description: 'Pasang/lepas perlengkapan (weapon/armor)',
  async run(ctx) {
    createCharacter(ctx.sender, ctx.pushName)
    const stats = playerCombatStats(ctx.sender)

    if (ctx.command === 'unequip') {
      const slot = (ctx.args[0] ?? '').toLowerCase()
      if (!['weapon', 'armor'].includes(slot)) {
        await ctx.reply(`Format: ${ctx.prefix}unequip <weapon|armor>`)
        return
      }
      const res = unequipSlot(ctx.sender, slot)
      if (res.error === 'empty') {
        await ctx.reply(`😅 Slot ${slot} kosong.`)
        return
      }
      await ctx.reply(`🎒 *${itemInfo(res.item)?.name ?? res.item}* dilepas dan masuk satchel.`)
      return
    }

    const raw = ctx.args.join(' ')
    if (!raw) {
      const loadout = getLoadout(ctx.sender)
      const w = loadout.find((r) => r.slot === 'weapon')
      const a = loadout.find((r) => r.slot === 'armor')

      await ctx.reply(
`╭─🛡️「 *LOADOUT* 」🛡️─╮
│
│ 🗡️ Weapon: ${w ? `*${itemInfo(w.item_id)?.name}* (dur ${w.durability})` : '— kosong —'}
│ 🥋 Armor: ${a ? `*${itemInfo(a.item_id)?.name}* (dur ${a.durability})` : '— kosong —'}
│
│ ⚔️ ATK: ${stats.atk} • 🛡️ DEF: ${stats.def}
│
│ 💡 Pasang: ${ctx.prefix}equip <item>
╰────────────────────✦╯`
      )
      return
    }

    const itemId = resolveAnyItemId(raw)
    if (!itemId) {
      await ctx.reply(`❌ Barang "${raw}" tidak dikenal.`)
      return
    }

    const res = equipItem(ctx.sender, itemId)
    if (res.error === 'not_equippable') {
      await ctx.reply(`📦 *${itemInfo(itemId)?.name ?? itemId}* bukan gear yang bisa dipasang.`)
      return
    }
    if (res.error === 'not_owned') {
      await ctx.reply(`😅 *${itemInfo(itemId)?.name ?? itemId}* gak ada di satchel-mu.`)
      return
    }

    await ctx.reply(
`╭─🛡️「 *DIPASANG* 」🛡️─╮
│
│ ${res.slot === 'weapon' ? '🗡️' : '🥋'} *${itemInfo(itemId)?.name}*
│ Slot: ${res.slot} • Durability: ${res.durability}
│ ⚔️ ATK: ${stats.atk} • 🛡️ DEF: ${stats.def}
│
╰────────────────────✦╯`
    )
  }
}
