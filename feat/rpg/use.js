/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * use.js — Konsumsi item (makan/minum/oles) buat pulih instan.
 * .use tanpa argumen → langsung tampil apa aja yang bisa dikonsumsi.
 */
import { createCharacter, getCharacter, getInventory, removeItem, updateCharacter } from '../../core/rpg.js'
import { itemInfo, resolveAnyItemId } from '../../core/shop.js'
import { pick } from '../../src/rpg/flavor.js'

const USE_FLAVOR = [
  'Kamu menikmati {item} perlahan — hangatnya menjalar ke seluruh tubuh.',
  'Kamu duduk di batang tumbang, membuka bungkus {item}, dan menghabiskannya sampai remah terakhir.',
  'Rasanya sederhana, tapi justru itu yang membuat {item} terasa berharga di tengah rimba.',
  'Kamu memejamkan mata sejenak setelah {item} — tubuhmu berterima kasih.',
]

export default {
  name: 'use',
  aliases: ['pakai', 'makan', 'minum'],
  tags: 'rpg',
  cooldown: 3000,
  description: 'Gunakan/konsumsi item buat pulihkan HP/energi',
  async run(ctx) {
    const char = createCharacter(ctx.sender, ctx.pushName)

    const arr = [...ctx.args]
    let amount = 1
    if (arr.length > 1 && /^\d+$/.test(arr[arr.length - 1])) {
      amount = Math.max(1, Number(arr.pop()))
    }
    const name = arr.join(' ')

    if (!name) {
      const inv = getInventory(ctx.sender)
      const usable = inv
        .map((row) => ({ row, it: itemInfo(row.item_id) }))
        .filter(({ it }) => it && ((it.energy_restore ?? 0) || (it.hp_restore ?? 0)))

      const lines = usable.map(({ row, it }) => {
        const gains = []
        if (it.energy_restore) gains.push(`⚡+${it.energy_restore}`)
        if (it.hp_restore) gains.push(`❤️+${it.hp_restore}`)
        return `│ 🍽️ *${it.name}* _(${row.item_id})_ ×${row.amount} — ${gains.join(' ')}`
      })

      await ctx.reply(
`╭─🍽️「 *BISA DIKONSUMSI* 」🍽️─
│
${lines.length ? lines.join('\n') : '│ Satchel-mu gak punya barang konsumsi.\n│ Beli di .shop (roti/teh) atau petik berry/madu.'}
│
│ 💡 Pakai: ${ctx.prefix}use <item_id/nama> [amount]
╰────────────────────✦╯`
      )
      return
    }

    const itemId = resolveAnyItemId(name)
    const info = itemId ? itemInfo(itemId) : null
    if (!info) {
      await ctx.reply(`❌ Barang "${name}" tidak dikenal. Cek katalog: ${ctx.prefix}items`)
      return
    }

    const e = info.energy_restore ?? 0
    const h = info.hp_restore ?? 0

    if (!e && !h) {
      await ctx.reply(
        `📦 *${info.name}* bukan barang konsumsi.\n` +
        `Ini perlengkapan/bahan — pasang lewat ${ctx.prefix}equip kalau gear, atau simpan buat crafting.`
      )
      return
    }

    const inv = getInventory(ctx.sender)
    const owned = inv.find((r) => r.item_id === itemId)
    if (!owned || owned.amount < amount) {
      await ctx.reply(`😅 *${info.name}* tidak cukup di satchel-mu.`)
      return
    }

    const after = updateCharacter(ctx.sender, {
      energy: Math.min(char.max_energy, char.energy + e * amount),
      hp: Math.min(char.max_hp, char.hp + h * amount)
    })

    removeItem(ctx.sender, itemId, amount)

    const gains = []
    if (e) gains.push(`⚡ +${e * amount}`)
    if (h) gains.push(`❤️ +${h * amount}`)

    await ctx.reply(
      `${pick(USE_FLAVOR).replaceAll('{item}', `*${info.name}*`)}\n\n` +
      `╭─🍽️「 *DIKONSUMSI* 」🍽️─╮\n` +
      `│ *${info.name}* ×${amount}\n` +
      `│ ${gains.join(' • ')}\n` +
      `│ ❤️ ${after.hp}/${after.max_hp} • ⚡ ${after.energy}/${after.max_energy}\n` +
      `╰────────────────────✦╯`
    )
  }
}
