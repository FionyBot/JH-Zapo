/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * sell.js — Jual item ke merchant (Pak Karman).
 * .sell → langsung daftar jual + item_id | .sell <id/nama> [amount]
 */
import { createCharacter, getInventory } from '../../core/rpg.js'
import { sellItem, itemInfo, resolveAnyItemId, MERCHANT_NAME } from '../../core/shop.js'
import { TIER_ICON } from '../../src/rpg/dropTable.js'
import { FLAVOR, pick } from '../../src/rpg/flavor.js'

function parseNameAmount(list) {
  const arr = [...list]
  let amount = 1
  if (arr.length > 1 && /^\d+$/.test(arr[arr.length - 1])) {
    amount = Math.max(1, Number(arr.pop()))
  }
  return { name: arr.join(' '), amount }
}

function sellList(ctx) {
  const inv = getInventory(ctx.sender)
  const lines = inv.map((row) => {
    const it = itemInfo(row.item_id)
    const icon = it ? TIER_ICON[it.tier] : '•'
    const name = it?.name ?? row.item_id
    const price = Math.max(1, Math.floor((it?.value ?? 5) * 0.6))
    return `│ ${icon} *${name}* _(${row.item_id})_ ×${row.amount} — 💰 ${price}G/pcs`
  })

  return (
`╭─🛒「 *DAFTAR JUAL* 」🛒─╮
│
${lines.length ? lines.join('\n') : '│ Satchel-mu kosong — rimba menunggu.\n│ Coba .hunt / .forage / .fish.'}
│
│ 💡 Jual: ${ctx.prefix}sell <item_id/nama> [amount]
│ 📦 Katalog lengkap: ${ctx.prefix}items
╰────────────────────✦╯`
  )
}

export default {
  name: 'sell',
  aliases: ['jual'],
  tags: 'rpg',
  cooldown: 3000,
  description: 'Jual item ke merchant (Pak Karman)',
  async run(ctx) {
    createCharacter(ctx.sender, ctx.pushName)
    const { name, amount } = parseNameAmount(ctx.args)

    if (!name || name.toLowerCase() === 'list') {
      await ctx.reply(sellList(ctx))
      return
    }

    const itemId = resolveAnyItemId(name)
    if (!itemId) {
      await ctx.reply(
        `❌ Barang "${name}" tidak dikenal.\n` +
        `Cek daftar jual: ${ctx.prefix}sell • atau katalog: ${ctx.prefix}items`
      )
      return
    }

    const res = sellItem(ctx.sender, itemId, amount)

    if (res.error === 'insufficient') {
      await ctx.reply(`😅 *${itemInfo(itemId)?.name ?? itemId}* tidak cukup di satchel-mu.`)
      return
    }

    await ctx.reply(
      `${pick(FLAVOR.merchant.sell).replaceAll('{item}', res.item).replaceAll('{gold}', res.totalGold)}\n\n` +
      `╭─💰「 *TRANSAKSI JUAL* 」💰─╮\n` +
      `│ Item: *${res.item}* ×${res.amount}\n` +
      `│ Harga: ${res.price}G × ${res.amount} = *${res.totalGold}G*\n` +
      `│ 💰 Dompet: ${res.balance.gold}G\n` +
      `│ Merchant: ${MERCHANT_NAME}\n` +
      `╰────────────────────✦╯`
    )
  }
}
