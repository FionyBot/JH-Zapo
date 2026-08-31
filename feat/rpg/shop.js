/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * shop.js — Toko merchant (Pak Karman).
 * [FIX BELOW]
 *
 * .shop → etalase rapi | .shop buy <id/nama> [amount]
 * Nama barang boleh lebih dari satu kata ("roti gandum 2").
 */
import { createCharacter } from '../../core/rpg.js'
import { getBalance } from '../../core/database.js'
import { getShopItems, resolveShopItem, buyItem, MERCHANT_NAME } from '../../core/shop.js'
import { FLAVOR, pick } from '../../src/rpg/flavor.js'

/** [FIX] Gabung kata jadi nama; angka paling belakang = amount. */
function parseNameAmount(list) {
  const arr = [...list]
  let amount = 1
  if (arr.length > 1 && /^\d+$/.test(arr[arr.length - 1])) {
    amount = Math.max(1, Number(arr.pop()))
  }
  return { name: arr.join(' '), amount }
}

export default {
  name: 'shop',
  aliases: ['beli', 'toko'],
  tags: 'rpg',
  cooldown: 3000,
  description: 'Toko merchant: beli bekal & perlengkapan',
  async run(ctx) {
    createCharacter(ctx.sender, ctx.pushName)
    const bal = getBalance(ctx.sender)
    const sub = (ctx.args[0] ?? '').toLowerCase()

    if (sub === 'buy') {
      const { name, amount } = parseNameAmount(ctx.args.slice(1))
      if (!name) {
        await ctx.reply(`Format: ${ctx.prefix}shop buy <item_id/nama> [amount]`)
        return
      }

      const shopItem = resolveShopItem(name)
      if (!shopItem) {
        await ctx.reply(`❌ "${name}" tidak ada di toko ${MERCHANT_NAME}.`)
        return
      }

      const res = buyItem(ctx.sender, shopItem.id, amount)

      if (res.error === 'insufficient_gold') {
        await ctx.reply(
          `😅 Gold-mu tidak cukup.\nButuh *${res.needed}G*, punyamu *${res.have}G*.\n` +
          `Jual hasil buruan: ${ctx.prefix}sell`
        )
        return
      }

      await ctx.reply(
        `${pick(FLAVOR.merchant.buy).replaceAll('{item}', res.item).replaceAll('{gold}', res.totalCost)}\n\n` +
        `╭─「 *TRANSAKSI BELI* 」🛒─╮\n` +
        `│ Item: *${res.item}* ×${res.amount}\n` +
        `│ Bayar: *${res.totalCost}G*\n` +
        `│ 💰 Sisa: ${res.remainingGold}G\n` +
        `│ Merchant: ${MERCHANT_NAME}\n` +
        `╰────────────────────✦╯`
      )
      return
    }

    // [FIX] Etalase
    const items = getShopItems()
    const lines = items.map(
      (i) => `│ 🛒 *${i.name}* _(${i.id})_ — *${i.price}G*\n│    _${i.desc}_`
    )

    await ctx.reply(
      `${pick(FLAVOR.merchant.greet)}\n\n` +
      `╭─「 *TOKO ${MERCHANT_NAME.toUpperCase()}* 」🛒─╮\n` +
      `│ 💰 Gold-mu: *${bal.gold}G*\n` +
      `│\n` +
      `${lines.join('\n')}\n` +
      `│\n` +
      `│ 💡 Beli: ${ctx.prefix}shop buy <item_id/nama> [amount]\n` +
      `╰────────────────────✦╯`
    )
  }
}
