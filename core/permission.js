/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * permission.js — Helper permission grup.
 * [FIX AND UPDATE BELOW]
 *
 * Role grup dibaca dari flag resmi zapo: isAdmin / isSuperAdmin (boolean),
 * dengan fallback string role/rank buat kompatibilitas. Identitas dicocokkan
 * lewat semua bentuk jid participant (PN & LID).
 */

/** Return 'superadmin' | 'admin' | null buat satu participant. */
export async function getGroupRole(client, chat, sender, senderLid) {
  try {
    const meta = await client.group.queryGroupMetadata(chat)
    const me = (meta.participants ?? []).find((p) => {
      const ids = [p.jid, p.lid, p.phoneJid, p.pnJid, p.id, p.participantJid, p.jidAlt, p.lidJid]
      return ids.includes(sender) || (senderLid && ids.includes(senderLid))
    })
    if (!me) return null
    if (me.isSuperAdmin || me.rank === 'superadmin' || me.role === 'superadmin') return 'superadmin'
    if (me.isAdmin || me.rank === 'admin' || me.role === 'admin') return 'admin'
    return null
  } catch {
    return null
  }
}

/** Staff bot otomatis lolos; selain itu harus admin/superadmin grup. */
export async function isGroupAdmin(ctx) {
  if (ctx.isAdmin) return true
  const role = await getGroupRole(ctx.client, ctx.chat, ctx.sender, ctx.senderLid)
  return role === 'admin' || role === 'superadmin'
}
