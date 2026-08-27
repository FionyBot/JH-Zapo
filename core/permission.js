/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * permission.js — Helper permission grup.
 * Staff bot otomatis lolos; selain itu harus admin/superadmin grup.
 */
export async function isGroupAdmin(ctx) {
  if (ctx.isAdmin) return true
  try {
    const meta = await ctx.client.group.queryGroupMetadata(ctx.chat)
    const me = meta.participants.find(
      (p) => p.jid === ctx.sender || (ctx.senderLid && p.jid === ctx.senderLid)
    )
    return ['admin', 'superadmin'].includes(me?.role ?? me?.rank ?? '')
  } catch {
    return false
  }
}
