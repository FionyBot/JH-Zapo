/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass.
 * Hargai sebagaimana u mau dihargai.
 * swgc.js — Posting STATUS WhatsApp yang nge-mention grup (Status Group Chat).
 */
import { downloadMediaMessage, resolveMediaPayload } from 'zapo-js'

const MAX_TEXT = 700
const MAX_MEDIA_BYTES = 25 * 1024 * 1024

const FONTS = {
  sistem: { id: 0, label: 'Sistem (default)' },
  script: { id: 2, label: 'Script / tulisan tangan' },
  bold: { id: 6, label: 'Sistem Bold' },
  norican: { id: 7, label: 'Norican (kursif)' },
  calistoga: { id: 8, label: 'Calistoga (serif tebal)' },
  exo: { id: 9, label: 'Exo 2 (futuristik)' },
  courier: { id: 10, label: 'Courier Prime Bold (mesin ketik)' }
}

const COLORS = {
  merah: '#E53935', red: '#E53935',
  biru: '#1E88E5', blue: '#1E88E5',
  hijau: '#43A047', green: '#43A047',
  kuning: '#FDD835', yellow: '#FDD835',
  oranye: '#FB8C00', orange: '#FB8C00',
  ungu: '#8E24AA', purple: '#8E24AA',
  pink: '#EC407A',
  tosca: '#00ACC1', teal: '#00ACC1',
  hitam: '#121212', black: '#121212',
  putih: '#FFFFFF', white: '#FFFFFF',
  abu: '#616161', gray: '#616161',
  coklat: '#6D4C41', brown: '#6D4C41',
  navy: '#0D1B2A',
  emas: '#FFB300', gold: '#FFB300'
}

const TEMPLATES = {
  fiony: { bg: '#E91E63', text: '#FFFFFF', font: 'script', label: 'Pink manis ala Fiony' },
  midnight: { bg: '#0D1B2A', text: '#E0E1DD', font: 'bold', label: 'Biru malam' },
  ocean: { bg: '#0077B6', text: '#FFFFFF', font: 'sistem', label: 'Biru laut' },
  sunset: { bg: '#FF6B35', text: '#FFF3E0', font: 'bold', label: 'Jingga senja' },
  forest: { bg: '#1B4332', text: '#D8F3DC', font: 'exo', label: 'Hijau hutan' },
  royal: { bg: '#4A148C', text: '#FFD54F', font: 'calistoga', label: 'Ungu kerajaan' },
  mono: { bg: '#212121', text: '#FFFFFF', font: 'courier', label: 'Monokrom mesin ketik' },
  gold: { bg: '#FFB300', text: '#212121', font: 'bold', label: 'Emas' }
}

const DEFAULT_STYLE = { bg: '#1E88E5', text: '#FFFFFF', font: 'sistem' }

const HELP =
  '📸 *SWGC — Status + Mention Grup*\n\n' +
  '*Teks:*\n`.swgc Halo semua!`\n' +
  '`.swgc Halo semua! --tpl fiony`\n' +
  '`.swgc Halo --bg biru --color putih --font script`\n\n' +
  '*Gambar / Video:*\n' +
  'Reply gambar/video lalu `.swgc caption kamu`,\n' +
  'atau kirim gambar/video dengan caption `.swgc caption kamu`\n\n' +
  '*Reply teks:* reply sebuah pesan teks pake `.swgc` aja\n\n' +
  '`.swgc list` → daftar template, warna & font\n' +
  '`--to <id@g.us>` → pilih grup target (kalo di luar grup)'

function listText() {
  const tpl = Object.entries(TEMPLATES)
    .map(([k, v]) => `• *${k}* — ${v.label}`).join('\n')
  const fonts = Object.entries(FONTS)
    .map(([k, v]) => `• *${k}* — ${v.label}`).join('\n')
  const colors = [...new Set(Object.keys(COLORS))].join(', ')
  return (
    '🎨 *TEMPLATE* (`--tpl nama`)\n' + tpl +
    '\n\n🔤 *FONT* (`--font nama`)\n' + fonts +
    '\n\n🖌️ *WARNA* (`--bg` / `--color`)\n' + colors +
    '\nAtau hex: `#FF5722`'
  )
}

function toArgb(input) {
  if (!input) return null
  const v = String(input).trim().toLowerCase()
  const hex = (COLORS[v] ?? v).replace(/^#/, '')
  if (!/^[0-9a-f]{6}$/i.test(hex)) return null
  return (0xff000000 | parseInt(hex, 16)) >>> 0
}

function parseArgs(raw) {
  const opts = {}
  const text = raw
    .replace(/--(bg|color|font|tpl|to)(?:=|\s+)(\S+)/gi, (_, k, v) => {
      opts[k.toLowerCase()] = v
      return ''
    })
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
  return { text, opts }
}

function getEvent(ctx) {
  return ctx.message ?? ctx.event ?? ctx.raw ?? ctx.msg ?? null
}

function getContextInfo(message) {
  if (!message || typeof message !== 'object') return null
  for (const key of Object.keys(message)) {
    const node = message[key]
    if (node && typeof node === 'object' && node.contextInfo) return node.contextInfo
  }
  return null
}

async function streamToBuffer(stream) {
  const chunks = []
  for await (const chunk of stream) chunks.push(chunk)
  return Buffer.concat(chunks)
}

export default {
  name: 'swgc',
  aliases: ['upswgc', 'swgrup', 'groupstatus'],
  tags: 'group',
  owner: true,
  description: 'Posting status WA yang nge-mention grup (teks/gambar/video + template)',
  cooldown: 30_000,

  async run(ctx) {
    const raw = (ctx.text || '').trim()
    if (/^(list|template|templates|help)$/i.test(raw)) {
      return ctx.reply(/^help$/i.test(raw) ? HELP : listText())
    }

    const { text: argText, opts } = parseArgs(raw)

    const groupJid = opts.to || (ctx.chat?.endsWith('@g.us') ? ctx.chat : null)
    if (!groupJid || !groupJid.endsWith('@g.us')) {
      return ctx.reply('⚠️ Pake di dalam grup, atau tambahin `--to <id@g.us>`.\n\n' + HELP)
    }

    const event = getEvent(ctx)
    const rawMessage = event?.message ?? event
    const ctxInfo = getContextInfo(rawMessage)
    const quoted = ctxInfo?.quotedMessage
    const mediaSource = quoted || rawMessage
    const payload = mediaSource && resolveMediaPayload(mediaSource)

    const quotedText = quoted?.conversation ?? quoted?.extendedTextMessage?.text ?? ''
    const hasMedia = payload && ['image', 'video', 'gif'].includes(payload.mediaType)

    if (payload && !hasMedia) {
      return ctx.reply('⚠️ Cuma dukung gambar, video, atau teks buat status.')
    }

    const text = argText || (!hasMedia ? quotedText : '')
    if (!hasMedia && !text) return ctx.reply(HELP)

    if (!hasMedia && text.length > MAX_TEXT) {
      return ctx.reply(`⚠️ Teks status kepanjangan (${text.length}/${MAX_TEXT} karakter).`)
    }

    await ctx.react('⏳')

    try {
      let content
      if (hasMedia) {
        const media = await streamToBuffer(await downloadMediaMessage(mediaSource))
        if (media.length > MAX_MEDIA_BYTES) {
          await ctx.react('❎')
          return ctx.reply(`⚠️ Media kegedean (${(media.length / 1024 / 1024).toFixed(1)} MB, maks ${MAX_MEDIA_BYTES / 1024 / 1024} MB).`)
        }
        const isVideo = payload.mediaType !== 'image'
        content = {
          type: isVideo ? 'video' : 'image',
          media,
          mimetype: payload.mimetype || (isVideo ? 'video/mp4' : 'image/jpeg'),
          ...(text ? { caption: text } : {}),
          contextInfo: { isGroupStatus: true }
        }
      } else {
        const tpl = opts.tpl ? TEMPLATES[opts.tpl.toLowerCase()] : null
        if (opts.tpl && !tpl) {
          await ctx.react('❎')
          return ctx.reply(`⚠️ Template *${opts.tpl}* gak ada. Cek *.swgc list*.`)
        }
        const base = tpl ?? DEFAULT_STYLE

        const bg = opts.bg ? toArgb(opts.bg) : toArgb(base.bg)
        const fg = opts.color ? toArgb(opts.color) : toArgb(base.text)
        if (opts.bg && bg === null) { await ctx.react('❎'); return ctx.reply(`⚠️ Warna latar *${opts.bg}* gak valid. Cek *.swgc list*.`) }
        if (opts.color && fg === null) { await ctx.react('❎'); return ctx.reply(`⚠️ Warna teks *${opts.color}* gak valid. Cek *.swgc list*.`) }

        const fontKey = (opts.font ?? base.font).toLowerCase()
        const font = FONTS[fontKey]
        if (!font) { await ctx.react('❎'); return ctx.reply(`⚠️ Font *${fontKey}* gak ada. Cek *.swgc list*.`) }

        content = {
          extendedTextMessage: {
            text,
            backgroundArgb: bg,
            textArgb: fg,
            font: font.id,
            contextInfo: { isGroupStatus: true }
          }
        }
      }

      await ctx.client.message.send(groupJid, content)

      await ctx.react('✅')
      return ctx.reply('✅ Status Grup (SWGC) berhasil dikirim, Kak!')
    } catch (e) {
      await ctx.react('❎')
      return ctx.reply('❌ Gagal posting status: ' + String(e.message || e).slice(0, 200))
    }
  }
}