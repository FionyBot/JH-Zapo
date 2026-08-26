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

/**
 * Bangun `ctx` — objek ringkas yang dikasih ke tiap feature saat dijalankan.
 * Menyimpan info penting dari event + beberapa helper balasan siap pakai.
 */
export function buildContext(client, event) {
  const senderJid = event.key.participant ?? event.key.remoteJid
  const senderNumber = senderJid?.split('@')[0]?.split(':')[0] ?? ''

  const ctx = {
    client,
    event,
    chat: event.key.remoteJid,
    sender: senderJid,
    isGroup: Boolean(event.key.isGroup),
    isOwner: config.owners.includes(senderNumber),
    pushName: event.pushName,
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

    /** Kirim richMessage berisi tombol quick-reply. */
    async replyButtons({ text, footer, buttons }) {
      return client.message.send(ctx.chat, richButtons({ text, footer, buttons }))
    },

    /** Kirim richMessage berisi list/menu single-select. */
    async replyList({ text, footer, title, buttonText, sections }) {
      return client.message.send(ctx.chat, richList({ text, footer, title, buttonText, sections }))
    }
  }

  return ctx
}
