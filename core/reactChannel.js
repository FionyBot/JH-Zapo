/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass.
 * Hargai sebagaimana u mau dihargai.
 * reactChannel.js — Auto-react ke postingan baru di channel khusus bot
 * (config.reactChannel.dedicatedChannelUrl). Begitu ada post baru, bot
 * otomatis kasih reaction emoji random ke situ.
 *
 * CATATAN JUJUR: zapo-js belum dokumentasiin persis bentuk field di dalam
 * event 'newsletter' (nama field JID & serverId-nya). Kode di bawah nyoba
 * beberapa kemungkinan nama field yang lazim, DAN nge-log bentuk mentah
 * event-nya sekali di awal biar gampang di-debug kalau ternyata meleset —
 * tinggal cek log pas post pertama nongol, kirim ke gue kalau perlu
 * disesuaikan.
 */
import { logger } from './logger.js'
import config from '../config.js'
import {
  parseChannelUrl,
  resolveNewsletterJid,
  pickRandomEmoji,
  reactToChannelPost
} from '../lib/newsletter.js'

let targetJid = null
let loggedRawEventOnce = false

function logRawEventOnce(event) {
  if (loggedRawEventOnce) return
  loggedRawEventOnce = true
  let raw
  try {
    raw = JSON.stringify(event, null, 2)
  } catch {
    raw = '[gak bisa di-stringify — kemungkinan ada circular reference di event-nya]'
  }
  logger.info(`📡 [React Channel] Bentuk event 'newsletter' pertama kali kedetect:\n${raw}`)
}

// Nyoba beberapa kemungkinan nama field buat JID channel & serverId post-nya.
function extractActivity(event) {
  const newsletterJid =
    event?.newsletterJid ?? event?.jid ?? event?.chat ?? event?.newsletter?.jid ?? null

  const serverId =
    event?.serverId ??
    event?.messageServerId ??
    event?.message?.serverId ??
    event?.message?.id ??
    event?.id ??
    null

  return { newsletterJid, serverId }
}

async function handleNewsletterEvent(client, event) {
  logRawEventOnce(event)
  if (!targetJid) return

  const { newsletterJid, serverId } = extractActivity(event)
  if (!newsletterJid || newsletterJid !== targetJid) return // bukan channel yang kita mau
  if (!serverId) {
    logger.warn({ event }, '⚠️ [React Channel] Kedetect activity tapi gak nemu serverId — cek bentuk event di log di atas')
    return
  }

  try {
    const emoji = pickRandomEmoji()
    await reactToChannelPost(client, { newsletterJid: targetJid, serverId, emoji })
    logger.success(`${emoji} [React Channel] Auto-react ke post baru (serverId: ${serverId})`)
  } catch (err) {
    logger.error({ err: err.message }, '❌ [React Channel] Gagal auto-react')
  }
}

export function setupReactChannel(client) {
  if (config.reactChannel?.enabled === false) {
    logger.info('⏸️  [React Channel] Nonaktif (config.reactChannel.enabled = false).')
    return
  }

  const parsed = parseChannelUrl(config.reactChannel?.dedicatedChannelUrl ?? '')
  if (!parsed) {
    logger.warn('⚠️ [React Channel] dedicatedChannelUrl di config gak valid/kosong, auto-react gak diaktifin.')
    return
  }

  client.on('newsletter', (event) => {
    void handleNewsletterEvent(client, event)
  })

  // Resolve + follow tiap kali koneksi kebuka (fresh connect / reconnect).
  // resolveNewsletterJid udah di-cache jadi ini murah buat dipanggil ulang.
  client.on('connection', async (connEvent) => {
    if (connEvent.status !== 'open') return
    try {
      targetJid = await resolveNewsletterJid(client, parsed.inviteCode)
      await client.newsletter.follow(targetJid).catch(() => {}) // gapapa kalo udah follow
      logger.info(`👀 [React Channel] Auto-react aktif buat channel ${targetJid}`)
    } catch (err) {
      logger.error({ err: err.message }, '❌ [React Channel] Gagal resolve/follow channel khusus bot')
    }
  })
}
