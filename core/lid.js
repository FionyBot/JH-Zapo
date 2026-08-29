/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * lid.js — Util resolusi LID → PN + kirim reply dengan mention rapi.
 * [FIX AND UPDATE BELOW]
 *
 * Grup WA ada dua mode addressing (PN / LID). Resolver ini:
 * 1) baca dua bentuk identitas participant langsung (grup LID-addressed)
 * 2) fallback: resolve balik via getLidsByPhoneNumbers (grup PN-addressed)
 */

const isPn = (j) => typeof j === 'string' && j.endsWith('@s.whatsapp.net')
const isLid = (j) => typeof j === 'string' && j.endsWith('@lid')

/** Kalau jid LID, petakan ke PN. Kalau gagal/udah PN, biarkan. */
export async function resolveLidToPn(client, groupJid, jid) {
  if (!isLid(jid)) return jid

  try {
    const meta = await client.group.queryGroupMetadata(groupJid)
    const parts = meta.participants ?? []

    // 1) Participant bawa dua bentuk identitas → map langsung
    for (const p of parts) {
      if (typeof p === 'string') continue
      const lids = [p.jid, p.lid, p.lidJid, p.jidAlt, p.participantJid].filter(isLid)
      const pns = [p.jid, p.phoneJid, p.pnJid, p.jidAlt, p.participantJid].filter(isPn)
      if (lids.includes(jid) && pns.length) return pns[0]
    }

    // 2) Grup PN-addressed → resolve balik via getLidsByPhoneNumbers
    const pns = parts.map((p) => (typeof p === 'string' ? p : p.jid)).filter(isPn)
    if (pns.length) {
      const rows = await client.profile.getLidsByPhoneNumbers(pns.map((j) => j.split('@')[0]))
      for (const r of rows) {
        if (r?.lidJid === jid) return r.phoneJid ?? r.queriedJid ?? jid
      }
    }
  } catch { /* biarkan apa adanya */ }

  return jid
}

/** Kirim teks dengan mention yang render nama (placeholder @user). */
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
