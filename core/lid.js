/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * lid.js — Util resolusi LID → PN + kirim reply dengan mention rapih.
 * Pola sama kayak staff resolver & group handler yang sudah ada.
 */

/** Kalau jid LID, petakan ke nomor PN lewat metadata grup. Kalau gagal, biarkan ae. */
export async function resolveLidToPn(client, groupJid, jid) {
  if (!jid?.endsWith('@lid')) return jid
  try {
    const meta = await client.group.queryGroupMetadata(groupJid)
    const pns = (meta.participants ?? [])
      .map((p) => (typeof p === 'string' ? p : p.jid))
      .filter((j) => typeof j === 'string' && j.endsWith('@s.whatsapp.net'))
    const rows = await client.profile.getLidsByPhoneNumbers(pns.map((j) => j.split('@')[0]))
    for (const r of rows) {
      if (r?.lidJid === jid) return r.phoneJid ?? r.queriedJid ?? jid
    }
  } catch { /* biarkan apa adanya */ }
  return jid
}

export async function sendMention(client, chat, jid, text) {
  const pn = await resolveLidToPn(client, chat, jid)
  const num = pn.split('@')[0].split(':')[0]
  await client.message.send(chat, {
    extendedTextMessage: {
      text: text.replace('@user', `@${num}`),
      contextInfo: { mentionedJid: [pn] }
    }
  })
}
