/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * shop.js — Logic sell/buy/craft Nusantara Wilds.
 * [UPDATE AND FIX BELOW]
 *
 * - Wallet SATU dompet (users.sqlite)
 * - Buyback rate 60% (sekali potong)
 * - itemInfo(): nama/harga/efek konsumsi dari semua sumber item
 * - resolveAnyItemId(): resolver universal (gathering + toko + craft)
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { getInventory, removeItem, addItem } from './rpg.js'
import { getBalance, addReward, spendGold } from './database.js'
import { ITEM_INDEX, resolveItemId } from '../src/rpg/dropTable.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SHOP = JSON.parse(readFileSync(join(__dirname, '../src/rpg/shop.json'), 'utf8'))
const RECIPES = JSON.parse(readFileSync(join(__dirname, '../src/rpg/recipes.json'), 'utf8'))

export const MERCHANT_NAME = SHOP.merchant

const SHOP_RESTORE = {
  bread: { energy_restore: 20, hp_restore: 0 },
  tea: { energy_restore: 10, hp_restore: 10 }
}
const CRAFT_RESTORE = {
  healing_salve: { energy_restore: 0, hp_restore: 30 },
  energy_tonic: { energy_restore: 40, hp_restore: 0 },
  herbal_bandage: { energy_restore: 0, hp_restore: 25 }
}

export function getShopItems() {
  return SHOP.items
}

export function getRecipes() {
  return RECIPES.recipes
}

export function getRecipe(id) {
  return RECIPES.recipes.find((r) => r.id === id) ?? null
}

/** Info item dari sumber mana pun; null kalau gak dikenal. */
export function itemInfo(id) {
  if (ITEM_INDEX[id]) return ITEM_INDEX[id]

  const shop = SHOP.items.find((i) => i.id === id)
  if (shop) {
    return {
      id,
      name: shop.name,
      tier: 'common',
      value: shop.price,
      ...(SHOP_RESTORE[id] ?? {})
    }
  }

  const rec = RECIPES.recipes.find((r) => r.output.id === id)
  if (rec) {
    return {
      id,
      name: rec.output.name,
      tier: 'uncommon',
      value: 20,
      ...(CRAFT_RESTORE[id] ?? {})
    }
  }

  return null
}

/** Resolve input (id/nama, multi-kata) ke item_id dari SEMUA sumber. */
export function resolveAnyItemId(raw) {
  const fromGather = resolveItemId(raw)
  if (fromGather) return fromGather

  const q = String(raw ?? '').toLowerCase().trim()
  if (!q) return null
  const compact = q.replace(/[\s_\-]+/g, '')

  const pools = [
    ...SHOP.items.map((i) => ({ id: i.id, name: i.name })),
    ...RECIPES.recipes.map((r) => ({ id: r.output.id, name: r.output.name }))
  ]

  return (
    pools.find((p) => p.id === q)?.id ??
    pools.find((p) => p.name.toLowerCase() === q)?.id ??
    pools.find(
      (p) =>
        p.name.toLowerCase().replace(/\s+/g, '') === compact ||
        p.id.replace(/[_\-]+/g, '') === compact
    )?.id ??
    null
  )
}

/** Resolve input ke item toko (id atau nama, multi-kata). */
export function resolveShopItem(raw) {
  const q = String(raw ?? '').toLowerCase().trim()
  if (!q) return null
  const compact = q.replace(/[\s_\-]+/g, '')
  return (
    SHOP.items.find((i) => i.id === q) ??
    SHOP.items.find((i) => i.name.toLowerCase() === q) ??
    SHOP.items.find((i) => i.name.toLowerCase().replace(/\s+/g, '') === compact) ??
    null
  )
}

/** Jual item → gold masuk dompet (buyback 60%). */
export function sellItem(jid, itemId, amount) {
  const inv = getInventory(jid)
  const owned = inv.find((r) => r.item_id === itemId)
  if (!owned || owned.amount < amount) return { error: 'insufficient' }

  const info = itemInfo(itemId)
  const price = Math.max(1, Math.floor((info?.value ?? 5) * 0.6))
  const totalGold = price * amount

  removeItem(jid, itemId, amount)
  const bal = addReward(jid, { gold: totalGold })

  return { success: true, item: info?.name ?? itemId, amount, totalGold, price, balance: bal }
}

/** Beli item → gold keluar dompet. */
export function buyItem(jid, itemId, amount) {
  const shopItem = SHOP.items.find((i) => i.id === itemId)
  if (!shopItem) return { error: 'not_found' }

  const totalCost = shopItem.price * amount
  const bal = getBalance(jid)
  if (bal.gold < totalCost) {
    return { error: 'insufficient_gold', needed: totalCost, have: bal.gold }
  }

  const after = spendGold(jid, totalCost)
  addItem(jid, itemId, amount)

  return { success: true, item: shopItem.name, amount, totalCost, remainingGold: after.gold }
}

/** Craft item dari resep. */
export function craftItem(jid, recipeId) {
  const recipe = getRecipe(recipeId)
  if (!recipe) return { error: 'recipe_not_found' }

  const inv = getInventory(jid)

  for (const ing of recipe.ingredients) {
    const owned = inv.find((r) => r.item_id === ing.id)
    if (!owned || owned.amount < ing.amount) {
      return {
        error: 'insufficient_ingredient',
        missing: ing.id,
        needed: ing.amount,
        have: owned?.amount ?? 0
      }
    }
  }

  for (const ing of recipe.ingredients) {
    removeItem(jid, ing.id, ing.amount)
  }

  addItem(jid, recipe.output.id, recipe.output.amount)

  return { success: true, recipe, output: recipe.output }
}
