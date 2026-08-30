/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass.
 * Hargai sebagaimana u mau dihargai.
 * newsletter.js — Helper AIO buat fitur React Channel:
 * - parse link channel/postingan channel
 * - resolve invite code → JID newsletter (di-cache)
 * - pilih emoji random dari pool
 * - react ke 1 postingan channel (dengan fallback follow-dulu kalau perlu)
 *
 * Coded by JamvanHax0r ft. XN — BCCTeam
 * Cukup pakai ae ye jan hapus credit!
 */
import { logger } from '../core/logger.js'
import config from '../config.js'

// Link channel : https://whatsapp.com/channel/<inviteCode>
// Link post    : https://whatsapp.com/channel/<inviteCode>/<serverId>
const CHANNEL_URL_RE = /whatsapp\.com\/channel\/([A-Za-z0-9]+)(?:\/(\d+))?/i

/**
 * Ini parse link channel atau link postingan channel.
 * @returns {{ inviteCode: string, serverId: string|null }|null}
 */
export function parseChannelUrl(url) {
  const match = CHANNEL_URL_RE.exec(String(url ?? ''))
  if (!match) return null
  return { inviteCode: match[1], serverId: match[2] ?? null }
}

const jidCache = new Map() // inviteCode -> newsletterJid

/** Resolve invite code jadi JID newsletter. Di-cache biar gak lookup berulang2 bray. */
export async function resolveNewsletterJid(client, inviteCode) {
  if (jidCache.has(inviteCode)) return jidCache.get(inviteCode)

  const meta = await client.newsletter.fetchByInvite(inviteCode)
  const jid = meta?.jid ?? meta?.newsletterJid ?? meta?.id
  if (!jid) {
    throw new Error(`Gagal resolve JID dari invite code "${inviteCode}" — bentuk response fetchByInvite gak dikenali`)
  }

  jidCache.set(inviteCode, jid)
  return jid
}

export function pickRandomEmoji() {
  const pool = config.reactChannel?.emojis?.length
    ? config.reactChannel.emojis
    : ['🔥', '❤️', '😍', '👍', '😂', '🥳', '💯', '✨']
  return pool[Math.floor(Math.random() * pool.length)]
}

/**
 * React ke 1 postingan channel. Nyoba serverId versi string dulu, kalau
 * gagal coba versi number. Kalau errornya keliatan gara2 belum follow,
 * coba follow dulu baru retry.
 */
export async function reactToChannelPost(client, { newsletterJid, serverId, emoji }) {
  const idVariants = [...new Set([serverId, Number(serverId)])].filter(
    (v) => v !== undefined && v !== null && !Number.isNaN(v)
  )

  let lastErr
  let triedFollow = false

  for (const idVariant of idVariants) {
    try {
      return await client.newsletter.react({
        newsletterJid,
        parentMessageServerId: idVariant,
        reactionCode: emoji
      })
    } catch (err) {
      lastErr = err
      if (!triedFollow && /follow|subscri|member/i.test(err.message ?? '')) {
        triedFollow = true
        logger.warn({ err: err.message }, '⚠️ [React Channel] React gagal, coba follow dulu...')
        await client.newsletter.follow(newsletterJid).catch(() => {})
      }
    }
  }

  throw lastErr ?? new Error('Gagal react ke postingan channel')
}
