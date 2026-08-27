/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * groupHandler.js — Event grup: welcome & goodbye dengan teks custom.
 *
 * [Fix] Payload event grup zapo: participants bisa string ATAU object —
 * dinormalisasi ke JID biar aman. Ekstraksi multi-bentuk + dedupe.
 */
import { logger } from '../core/logger.js'
import { isOn, getSetting } from '../core/groupSettings.js'

const recent = new Map()

/** String langsung pakai; object diambil jid-nya dari field mana pun — fleksibel. */
function toJid(p) {
  if (typeof p === 'string') return p
  return p?.jid ?? p?.participantJid ?? p?.id ?? p?.lid ?? null
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

export function setupGroupHandler(client) {
  async function handleParticipantChange(action, groupJid, participants) {
    // Dedupe 3 detik (jaga-jaga emitter nerbitin 2 bentuk event untuk meminimalisir error bray)
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

  // Event utama zapo: `group`
  client.on('group', (event) => {
    const { action, groupJid, participants } = extract(event)
    if (!action || !groupJid || !participants.length) {
      logger.info({ event }, '👥 group event (non-participant)')
      return
    }
    logger.info(`👥 ${action}: ${participants.join(', ')} @ ${groupJid}`)
    void handleParticipantChange(action, groupJid, participants)
  })

  // Fallback kalau emitter pakai nama spesifik di sini ya bray
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

  logger.info('🔧 Group handler siap (welcome/bye)')
}

async function sendGreeting(client, groupJid, participants, kind) {
  try {
    let groupName = 'grup ini'
    try {
      const meta = await client.group.queryGroupMetadata(groupJid)
      groupName = meta.subject ?? groupName
    } catch { /* pakai default */ }

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
