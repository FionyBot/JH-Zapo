/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * rpgdev.js — Dev tools Nusantara Wilds.
 *
 * Owner-only:
 * - reset player / reset all
 * - give item
 * - set stat
 * - full heal/end rest
 * - add/clear/list quest
 * - list item database
 * - leaderboard
 * - maintenance DB
 * [FIX V2 BELOW]
 *
 * Semua tampilan target di-resolve LID → PN (core/lid.js)
 * dan dirender sebagai mention biru yang bisa diklik.
 */
import {
  createCharacter,
  getCharacter,
  getCharacterStats,
  getAllCharacters,
  updateCharacter,
  resetCharacter,
  resetAllCharacters,
  addItem,
  addQuest,
  clearQuests,
  getActiveQuests,
  maintenance
} from '../../core/rpg.js'
import { normalizeNumber } from '../../core/staff.js'
import { resolveLidToPn } from '../../core/lid.js'
import { ITEM_INDEX, TIER_ICON } from '../../src/rpg/dropTable.js'

const STAT_FIELDS = new Set([
  'hp', 'max_hp',
  'energy', 'max_energy',
  'stamina', 'max_stamina',
  'level', 'xp', 'gold',
  'location'
])

function numOnly(jid) {
  return jid?.split('@')[0]?.split(':')[0] ?? jid
}

async function mentionFor(ctx, jid) {
  const pn = await resolveLidToPn(ctx.client, ctx.chat, jid)
  return { pn, num: numOnly(pn) }
}

async function replyMention(ctx, pn, text) {
  const num = numOnly(pn)
  await ctx.client.message.send(ctx.chat, {
    extendedTextMessage: {
      text: text.replaceAll('{target}', `@${num}`),
      contextInfo: { mentionedJid: [pn] }
    }
  })
}

async function numberToBestJid(ctx, number) {
  const pn = `${number}@s.whatsapp.net`

  if (getCharacter(pn)) return pn

  try {
    const rows = await ctx.client.profile.getLidsByPhoneNumbers([number])
    const lid = rows?.[0]?.lidJid
    if (lid && getCharacter(lid)) return lid
    if (lid && ctx.isGroup) return lid
  } catch {}

  return pn
}

async function parseTarget(ctx, start = 1) {
  const token = ctx.args[start]
  const mentioned = ctx.mentioned?.[0]

  if (token && ['me', 'self', 'aku'].includes(token.toLowerCase())) {
    return { jid: ctx.sender, next: start + 1 }
  }

  if (mentioned && token?.startsWith('@')) {
    return { jid: mentioned, next: start + 1 }
  }

  const num = normalizeNumber(token ?? '')
  if (num) {
    return { jid: await numberToBestJid(ctx, num), next: start + 1 }
  }

  return { jid: ctx.sender, next: start }
}

function help(prefix) {
  return (
`╭─🛠️「 *RPG DEV TOOLS* 」🛠️─
│
│ *Player*
│ ${prefix}rpgdev profile [me/@/628xxx]
│ ${prefix}rpgdev reset [me/@/628xxx]
│ ${prefix}rpgdev resetall confirm
│
│ *Resource & Stats*
│ ${prefix}rpgdev give [target] <item_id> [amount]
│ ${prefix}rpgdev stat [target] <field> <value>
│ ${prefix}rpgdev full [target]
│
│ *Quest*
│ ${prefix}rpgdev quest [target] <daily|weekly|monthly|story> <quest_id> <target>
│ ${prefix}rpgdev quests [target]
│ ${prefix}rpgdev clearquest [target]
│
│ *Database*
│ ${prefix}rpgdev items [keyword]
│ ${prefix}rpgdev top [limit]
│ ${prefix}rpgdev maintenance
│
╰────────────────────✦╯`
  )
}

async function profileText(ctx, jid) {
  const s = getCharacterStats(jid)
  if (!s) return `Karakter ${jid} belum ada.`

  const { pn, num } = await mentionFor(ctx, jid)

  // Nama placeholder Dev-<lid> lama → rapihin kalau sekarang ke-resolve PN
  if (s.name?.startsWith('Dev-') && pn.endsWith('@s.whatsapp.net')) {
    const fixed = `Dev-${num}`
    if (fixed !== s.name) updateCharacter(jid, { name: fixed })
  }

  const isPlaceholder = s.name?.startsWith('Dev-')
  const displayName = isPlaceholder ? '{target}' : (s.name ?? '{target}')

  const inv = s.inventory
    .slice(0, 10)
    .map((row) => {
      const it = ITEM_INDEX[row.item_id]
      const icon = it ? TIER_ICON[it.tier] : '•'
      const name = it?.name ?? row.item_id
      return `│ ${icon} ${name} ×${row.amount}`
    })

  const quests = getActiveQuests(jid)

  return (
`╭─「 *RPG PROFILE* 」🧭─╮
│
│ 👤 ${displayName}
│ 🆔 {target}
│
│ Level: ${s.level}
│ XP: ${s.xp}/${s.level * 100}
│ Gold: ${s.gold}
│ Lokasi: ${s.location}
│
│ HP: ${s.hp}/${s.max_hp}
│ Energi: ${s.energy}/${s.max_energy}
│ Stamina: ${s.stamina}/${s.max_stamina}
│ Resting: ${s.resting ? `${Math.floor(s.restProgress * 100)}%` : 'no'}
│
│ 🎒 Inventory: ${s.inventory.length} jenis
${inv.length ? inv.join('\n') : '│ kosong'}
│
│ 📜 Active Quest: ${quests.length}
╰────────────────────✦╯`
  )
}

export default {
  name: 'rpgdev',
  aliases: ['rpgadmin', 'nwdev'],
  tags: 'owner',
  owner: true,
  description: 'Dev tools Nusantara Wilds',
  async run(ctx) {
    const action = (ctx.args[0] ?? 'help').toLowerCase()

    if (action === 'help' || action === 'menu') {
      await ctx.reply(help(ctx.prefix))
      return
    }

    if (action === 'profile') {
      const { jid } = await parseTarget(ctx, 1)
      const { num } = await mentionFor(ctx, jid)
      createCharacter(jid, `Dev-${num}`)
      await replyMention(ctx, jid, await profileText(ctx, jid))
      return
    }

    if (action === 'reset') {
      const { jid } = await parseTarget(ctx, 1)
      resetCharacter(jid)
      await replyMention(ctx, jid,
`╭─🧹「 *RESET PLAYER* 」🧹─╮
│
│ Karakter RPG untuk:
│ {target}
│
│ sudah dihapus dari awal.
╰────────────────────✦╯`
      )
      return
    }

    if (action === 'resetall') {
      if ((ctx.args[1] ?? '').toLowerCase() !== 'confirm') {
        await ctx.reply(
          `⚠️ Ini akan menghapus SEMUA data RPG.\n` +
          `Kalau yakin: ${ctx.prefix}rpgdev resetall confirm`
        )
        return
      }

      resetAllCharacters()
      await ctx.reply(
`╭─️「 *RPG RESET ALL* 」⚠️─╮
│
│ Semua karakter, inventory,
│ dan quest RPG sudah dihapus.
│
│ Fair launch ready.
╰────────────────────✦╯`
      )
      return
    }

    if (action === 'give') {
      const { jid, next } = await parseTarget(ctx, 1)
      const itemId = ctx.args[next]
      const amount = Math.max(1, Number(ctx.args[next + 1] ?? 1) || 1)

      if (!itemId) {
        await ctx.reply(`Format: ${ctx.prefix}rpgdev give [target] <item_id> [amount]`)
        return
      }

      const item = ITEM_INDEX[itemId]
      if (!item) {
        await ctx.reply(`❌ Item tidak dikenal: ${itemId}\nCek: ${ctx.prefix}rpgdev items ${itemId}`)
        return
      }

      const { num } = await mentionFor(ctx, jid)
      createCharacter(jid, `Dev-${num}`)
      addItem(jid, itemId, amount)

      await replyMention(ctx, jid,
`╭─🎁「 *GIVE ITEM* 」🎁─╮
│
│ Target: {target}
│ Item: ${TIER_ICON[item.tier]} *${item.name}*
│ ID: ${itemId}
│ Amount: ×${amount}
│
╰────────────────────✦╯`
      )
      return
    }

    if (action === 'stat') {
      const { jid, next } = await parseTarget(ctx, 1)
      const field = ctx.args[next]
      const rawValue = ctx.args.slice(next + 1).join(' ')

      if (!field || !rawValue) {
        await ctx.reply(`Format: ${ctx.prefix}rpgdev stat [target] <field> <value>`)
        return
      }

      if (!STAT_FIELDS.has(field)) {
        await ctx.reply(`❌ Field tidak boleh diubah.\nAllowed: ${[...STAT_FIELDS].join(', ')}`)
        return
      }

      const { num } = await mentionFor(ctx, jid)
      createCharacter(jid, `Dev-${num}`)

      const value = field === 'location' ? rawValue : Number(rawValue)
      if (field !== 'location' && !Number.isFinite(value)) {
        await ctx.reply('❌ Value harus angka.')
        return
      }

      updateCharacter(jid, { [field]: value })
      await replyMention(ctx, jid, `✅ Stat *${field}* untuk {target} diset ke *${value}*.`)
      return
    }

    if (action === 'full') {
      const { jid } = await parseTarget(ctx, 1)
      const { num } = await mentionFor(ctx, jid)
      const char = createCharacter(jid, `Dev-${num}`)

      updateCharacter(jid, {
        hp: char.max_hp,
        energy: char.max_energy,
        stamina: char.max_stamina,
        rest_started_at: 0,
        rest_duration: 0,
        rest_base_energy: 0,
        rest_base_stamina: 0,
        rest_base_hp: 0
      })

      await replyMention(ctx, jid,
`╭─✨「 *FULL RECOVERY* 」✨─╮
│
│ Target: {target}
│ HP/Energi/Stamina penuh.
│ Rest session dibatalkan.
╰────────────────────✦╯`
      )
      return
    }

    if (action === 'quest') {
      const { jid, next } = await parseTarget(ctx, 1)
      const type = ctx.args[next]
      const questId = ctx.args[next + 1]
      const target = Number(ctx.args[next + 2])

      if (!type || !questId || !Number.isFinite(target)) {
        await ctx.reply(
          `Format: ${ctx.prefix}rpgdev quest [target] <daily|weekly|monthly|story> <quest_id> <target>`
        )
        return
      }

      const { num } = await mentionFor(ctx, jid)
      createCharacter(jid, `Dev-${num}`)
      addQuest(jid, type, questId, target)

      await replyMention(ctx, jid,
`╭─📜「 *ADD QUEST* 」📜─╮
│
│ Target: {target}
│ Type: ${type}
│ Quest ID: ${questId}
│ Target: ${target}
│
╰────────────────────✦╯`
      )
      return
    }

    if (action === 'quests') {
      const { jid } = await parseTarget(ctx, 1)
      const quests = getActiveQuests(jid)

      await replyMention(ctx, jid,
`╭─📜「 *ACTIVE QUESTS* 」📜─
│
│ Target: {target}
│
${quests.length
  ? quests.map((q) => `│ ${q.quest_type}/${q.quest_id}: ${q.progress}/${q.target}`).join('\n')
  : '│ Tidak ada quest aktif.'}
│
╰────────────────────✦╯`
      )
      return
    }

    if (action === 'clearquest') {
      const { jid } = await parseTarget(ctx, 1)
      clearQuests(jid)
      await replyMention(ctx, jid, `✅ Semua quest RPG untuk {target} dibersihkan.`)
      return
    }

    if (action === 'items') {
      const q = (ctx.args[1] ?? '').toLowerCase()
      const items = Object.entries(ITEM_INDEX)
        .filter(([id, it]) => !q || id.includes(q) || it.name.toLowerCase().includes(q) || it.tier.includes(q))
        .slice(0, 30)

      await ctx.reply(
`╭─📦「 *ITEM DATABASE* 」📦─╮
│
${items.length
  ? items.map(([id, it]) => `│ ${TIER_ICON[it.tier]} ${id} — ${it.name}`).join('\n')
  : '│ Tidak ada item cocok.'}
│
│ Tampil max 30 item.
╰────────────────────✦╯`
      )
      return
    }

    if (action === 'top') {
      const limit = Math.min(20, Math.max(1, Number(ctx.args[1] ?? 10) || 10))
      const rows = getAllCharacters(limit)

      await ctx.reply(
`╭─🏆「 *RPG LEADERBOARD* 」🏆─╮
│
${rows.length
  ? rows.map((r, i) => `│ ${i + 1}. ${r.name} — Lv.${r.level} (${r.xp} XP)`).join('\n')
  : '│ Belum ada karakter.'}
│
╰────────────────────✦╯`
      )
      return
    }

    if (action === 'maintenance') {
      maintenance()
      await ctx.reply('🧹 RPG maintenance dijalankan.')
      return
    }

    await ctx.reply(help(ctx.prefix))
  }
}
