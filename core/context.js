import config from '../bot.config.js'
import { richButtons, richList } from './richMessage.js'

function extractText(message) {
  if (!message) return undefined
  return (
    message.conversation ??
    message.extendedTextMessage?.text ??
    message.imageMessage?.caption ??
    message.videoMessage?.caption ??
    undefined
  )
}

const digits = (jid) => (jid ?? '').split('@')[0].split(':')[0]

/**
 * Bangun `ctx` per pesan masuk.
 * Menangani PN ↔ LID sesuai docs resmi zapo: kalau pengirim datang sebagai
 * @lid, pakai field alt (participantAlt/remoteJidAlt) sebagai nomor HP.
 */
export function buildContext(client, event) {
  const primary = event.key.participant ?? event.key.remoteJid
  const alt = event.key.participantAlt ?? event.key.remoteJidAlt

  const pnJid = primary?.endsWith('@lid') ? (alt ?? primary) : primary
  const lidJid = primary?.endsWith('@lid') ? primary : alt?.endsWith('@lid') ? alt : undefined

  const senderNumber = digits(pnJid)
  const staff = config.staff.find((s) => s.number === senderNumber)
  const role = staff?.role ?? null

  const ctx = {
    client,
    event,
    chat: event.key.remoteJid,
    sender: pnJid,
    senderLid: lidJid,
    senderNumber,
    pushName: event.pushName,
    isGroup: Boolean(event.key.isGroup),

    // JID yang di-tag/mention di pesan (kalau ada)
    mentioned: event.message?.extendedTextMessage?.contextInfo?.mentionedJid ?? [],

    // Role staff
    role,
    staffLabel: staff?.label ?? null,
    isOwner: role === 'owner',
    isAdmin: role === 'owner' || role === 'admin',
    isStaff: role !== null,

    body: extractText(event.message) ?? '',
    command: '',
    args: [],
    text: '',

    async reply(text) {
      return client.message.send(ctx.chat, text)
    },

    async react(emoji) {
      return client.message.send(ctx.chat, { type: 'reaction', emoji, target: event })
    },

    async replyButtons({ text, footer, buttons }) {
      return client.message.send(ctx.chat, richButtons({ text, footer, buttons }))
    },

    async replyList({ text, footer, title, buttonText, sections }) {
      return client.message.send(ctx.chat, richList({ text, footer, title, buttonText, sections }))
    }
  }

  return ctx
}
