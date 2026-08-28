/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * groupHandler.js — Event grup: welcome & goodbye dengan teks custom + PP.
 */
import { logger } from '../core/logger.js'
import { isOn, getSetting } from '../core/groupSettings.js'

const recent = new Map()

function toJid(p) {
  if (typeof p === 'string') return p
  const candidates = [p.jid, p.participantJid, p.participant, p.pnJid, p.phoneJid, p.id, p.lid]
  return (
    candidates.find((c) => typeof c === 'string' && c.endsWith('@s.whatsapp.net')) ??
    candidates.find((c) => typeof c === 'string' && c.includes('@')) ??
    null
  )
}

function extract(event) {
  const rawType = String(event.type ?? event.action ?? event.kind ?? '').toLowerCase()

  let action = null
  if (/add|join/.test(rawType)) action = 'add'
  else if (/remove|leave|kick|left/.test(rawType)) action = 'remove'
  else if (/promote/.test(rawType)) action = 'promote'
  else if (/demote/.test(rawType)) action = 'demote'

  const groupJid = event.groupJid ?? event.id ?? event.jid ?? null

  let raw = event.participants ?? event.participantJids ?? []
  if (!Array.isArray(raw)) raw = [raw]
  if (!raw.length && event.participantJid) raw = [event.participantJid]
  const participants = raw.map(toJid).filter(Boolean)

  return { action, groupJid, participants }
}

async function resolveLids(client, participants, metaParticipants) {
  const lids = participants.filter((p) => p.endsWith('@lid'))
  if (!lids.length) return participants

  try {
    const pns = (metaParticipants ?? [])
      .map(toJid)
      .filter((j) => j && j.endsWith('@s.whatsapp.net'))
    const rows = await client.profile.getLidsByPhoneNumbers(pns.map((j) => j.split('@')[0]))
    const map = new Map()
    for (const r of rows) {
      if (r?.lidJid) map.set(r.lidJid, r.phoneJid ?? r.queriedJid)
    }
    return participants.map((p) => map.get(p) ?? p)
  } catch {
    return participants
  }
}

async function getProfile(client, jid) {
  const get = async (type) => {
    try {
      const pic = await client.profile.getProfilePicture(jid, type)
      if (pic?.url) {
        const res = await fetch(pic.url)
        if (res.ok) return Buffer.from(await res.arrayBuffer())
      }
    } catch { /* abaikan, coba varian lain */ }
    return null
  }

  const image = await get('image')
  const preview = await get('preview')
  return { image: image ?? preview, thumb: preview ?? image }
}

export function setupGroupHandler(client) {
  async function handleParticipantChange(action, groupJid, participants) {
    const key = `${action}|${groupJid}|${participants.join(',')}`
    const now = Date.now()
    if (recent.has(key) && now - recent.get(key) < 3000) return
    recent.set(key, now)
    if (recent.size > 200) recent.clear()

    if (action === 'add' && isOn(groupJid, 'welcome')) {
      await sendGreeting(client, groupJid, participants, 'welcome')
    } else if (action === 'remove' && isOn(groupJid, 'bye')) {
      await sendGreeting(client, groupJid, participants, 'bye')
    }
  }

  client.on('group', (event) => {
    const { action, groupJid, participants } = extract(event)
    if (!action || !groupJid || !participants.length) {
      logger.info({ event }, '👥 group event (non-participant)')
      return
    }
    logger.info(`👥 ${action}: ${participants.join(', ')} @ ${groupJid}`)
    void handleParticipantChange(action, groupJid, participants)
  })

  for (const [name, action] of [
    ['group_participant_add', 'add'],
    ['group_participant_remove', 'remove'],
    ['group_participant_promote', 'promote'],
    ['group_participant_demote', 'demote']
  ]) {
    client.on(name, (event) => {
      const groupJid = event.groupJid ?? event.id ?? event.jid
      let raw = event.participants ?? (event.participantJid ? [event.participantJid] : [])
      if (!Array.isArray(raw)) raw = [raw]
      const participants = raw.map(toJid).filter(Boolean)
      if (groupJid && participants.length) {
        void handleParticipantChange(action, groupJid, participants)
      }
    })
  }

  logger.info('🔧 Group handler siap (welcome/bye + PP)')
}

async function sendGreeting(client, groupJid, rawParticipants, kind) {
  try {
    let groupName = 'grup ini'
    let metaParticipants = []
    try {
      const meta = await client.group.queryGroupMetadata(groupJid)
      groupName = meta.subject ?? groupName
      metaParticipants = meta.participants ?? []
    } catch { /* pakai default */ }

    const participants = await resolveLids(client, rawParticipants, metaParticipants)

    const mentions = []
    const tags = participants
      .map((p) => {
        mentions.push(p)
        return `@${p.split('@')[0].split(':')[0]}`
      })
      .join(' ')

    const custom = getSetting(groupJid, kind === 'welcome' ? 'welcome_text' : 'bye_text')

    const defaultText =
      kind === 'welcome'
        ? `selamat datang @user di %group. Jangan lupa baca deskripsi grup ya!`
        : `selamat tinggal @user, telah keluar dari %group. Jangan lupa arah pulang!`

    const text = (custom ?? defaultText)
      .replace(/%group/g, groupName)
      .replace(/@user/g, tags)

    const { image, thumb } = await getProfile(client, participants[0])
    if (image && thumb) {
      try {
        const up = await client.message.upload(image, { type: 'image', mediaType: 'image' })
        await client.message.send(groupJid, {
          imageMessage: {
            ...up,
            mimetype: 'image/jpeg',
            caption: text,
            jpegThumbnail: new Uint8Array(thumb),
            contextInfo: { mentionedJid: mentions }
          }
        })
        return
      } catch (err) {
        logger.warn({ err: err.message }, 'Gagal kirim greeting gambar, fallback teks')
      }
    }

    await client.message.send(groupJid, {
      extendedTextMessage: {
        text,
        contextInfo: { mentionedJid: mentions }
      }
    })
  } catch (err) {
    logger.warn({ err: err.message, groupJid, kind }, 'Gagal kirim greeting')
  }
}
