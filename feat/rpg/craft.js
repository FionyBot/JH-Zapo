/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * craft.js — Racik item dari bahan.
 * .craft → list resep | .craft <recipe_id>
 */
import { createCharacter, getInventory } from '../../core/rpg.js'
import { getRecipes, getRecipe, craftItem } from '../../core/shop.js'
import { ITEM_INDEX, TIER_ICON } from '../../src/rpg/dropTable.js'
import { FLAVOR, pick } from '../../src/rpg/flavor.js'

export default {
  name: 'craft',
  aliases: ['racik', 'buat'],
  tags: 'rpg',
  cooldown: 5000,
  description: 'Racik item dari bahan (resep)',
  async run(ctx) {
    createCharacter(ctx.sender, ctx.pushName)
    const sub = ctx.args[0]

    if (!sub) {
      const recipes = getRecipes()
      const inv = getInventory(ctx.sender)
      const lines = recipes.map((r) => {
        const ings = r.ingredients
          .map((ing) => {
            const it = ITEM_INDEX[ing.id]
            const name = it?.name ?? ing.id
            const have = inv.find((row) => row.item_id === ing.id)?.amount ?? 0
            const enough = have >= ing.amount ? '✅' : '❌'
            return `${enough} ${name} ×${ing.amount} (${have})`
          })
          .join('\n│   ')
        return `│ 📜 *${r.name}* (${r.id})\n│   _${r.desc}_\n│   ${ings}`
      })

      await ctx.reply(
`╭─🔨「 *BUKU RESEP* 」🔨─╮
│
${lines.join('\n│\n')}
│
│ 💡 Racik: ${ctx.prefix}craft <recipe_id>
╰────────────────────✦╯`
      )
      return
    }

    const recipeId = sub
    const res = craftItem(ctx.sender, recipeId)

    if (res.error === 'recipe_not_found') {
      await ctx.reply('❌ Resep tidak dikenal. Ketik .craft buat lihat daftar.')
      return
    }
    if (res.error === 'insufficient_ingredient') {
      const it = ITEM_INDEX[res.missing]
      const name = it?.name ?? res.missing
      await ctx.reply(
        `😅 Bahan kurang:\n` +
        `${name} — butuh ${res.needed}, punya ${res.have}`
      )
      return
    }

    await ctx.reply(
      `${pick(FLAVOR.merchant.craft).replaceAll('{item}', res.output.name)}\n\n` +
      `╭─🔨「 *HASIL RACIKAN* 」🔨─╮\n` +
      `│ *${res.output.name}* ×${res.output.amount}\n` +
      `│ Resep: ${res.recipe.name}\n` +
      `╰────────────────────✦╯`
    )
  }
}
