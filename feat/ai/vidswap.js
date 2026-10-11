/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass.
 * Hargai sebagaimana u mau dihargai.
 * vidswap.js — Video Face Swap AI
 */

import { downloadMediaMessage, resolveMediaPayload } from 'zapo-js'
import { JHVidSwap } from '../../scraper/VIDSWAP.js'

const MAX_BUF = 30 * 1024 * 1024
const SESSION_TTL = 5 * 60 * 1000
const SESSION_CAP = 10
const MEM = (globalThis.JH_VIDSWAP_MEM ??= new Map())

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

async function extractMedia(message) {
  if (!message) return null
  try {
    const payload = resolveMediaPayload(message)
    if (!payload || !payload.mimetype) return null
    const isVid = String(payload.mimetype).startsWith('video/')
    const isImg = String(payload.mimetype).startsWith('image/')
    if (!isVid && !isImg) return null
    const stream = await downloadMediaMessage(message)
    const buf = await streamToBuffer(stream)
    return buf?.length ? { type: isVid ? 'video' : 'image', buf } : null
  } catch (e) {
    return null
  }
}

function detectMime(buf) {
  if (buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x00 && buf[4] === 0x66) return 'video/mp4'
  if (buf[0] === 0x1A && buf[1] === 0x45 && buf[2] === 0xDF && buf[3] === 0xA3) return 'video/webm'
  return 'video/mp4'
}

function getSession(sender) {
  const s = MEM.get(sender)
  if (!s) return null
  if (Date.now() - s.ts > SESSION_TTL) {
    MEM.delete(sender)
    return null
  }
  return s
}

function setSession(sender, data) {
  if (MEM.size >= SESSION_CAP) {
    const oldest = MEM.keys().next().value
    MEM.delete(oldest)
  }
  data.ts = Date.now()
  MEM.set(sender, data)
}

async function processSwap(ctx, videoInput, imageInput) {
  await ctx.react('⏳')
  try {
    const res = await JHVidSwap(videoInput, imageInput)
    if (!res.status || !res.data?.result_url) {
      await ctx.react('❎')
      return ctx.reply('❌ Gagal proses Video Swap: ' + (res.error || 'Terjadi kesalahan di server AI.'))
    }
    const fetchRes = await fetch(res.data.result_url, { signal: AbortSignal.timeout(120000) })
    if (!fetchRes.ok) throw new Error('HTTP ' + fetchRes.status)
    const buf = Buffer.from(await fetchRes.arrayBuffer())
    if (!buf.length || buf.length > MAX_BUF) throw new Error('File hasil invalid atau terlalu besar')
    
    await ctx.client.message.send(ctx.chat, {
      type: 'video',
      media: buf,
      mimetype: detectMime(buf),
      caption: 'Ini dia hasil Video Face Swap-nya, Kak!'
    })
    await ctx.react('✅')
  } catch (e) {
    await ctx.react('❎')
    return ctx.reply('❌ Terjadi kesalahan saat memproses atau mengirim video.')
  }
}

const HELP =
  '🎬 *VIDEO FACE SWAP — AI*\n\n' +
  '*Mode 2 Langkah:*\n' +
  '1) Kirim/Reply Video target dengan caption `.vidswap`\n' +
  '2) Kirim/Reply Foto wajah dengan caption `.vidswap`\n\n' +
  '*Mode Sekali Tembak:*\n' +
  '• Reply Video + kirim Foto caption `.vidswap`\n' +
  '• Reply Foto + kirim Video caption `.vidswap`\n' +
  '• `.vidswap <url_video> <url_foto>`\n\n' +
  '`.vidswap reset` → hapus sesi tersimpan\n' +
  'Maksimal video 30MB. Pastikan wajah di foto tidak terhalang!'

export default {
  name: 'vidswap',
  aliases: ['vs', 'vswap'],
  tags: 'ai',
  description: 'Video Face Swap AI — tukar wajah karakter di video',

  async run(ctx) {
    const text = (ctx.text || '').trim()
    const firstWord = (text.split(/\s+/)[0] || '').toLowerCase()

    if (/^(reset|del|hapus|cancel|batal)$/.test(firstWord)) {
      MEM.delete(ctx.sender)
      return ctx.reply('🗑️ Session Video Swap dibuang.')
    }

    const urls = (text.match(/https?:\/\/[^\s]+/gi) || [])
    let vidInput = null
    let imgInput = null

    for (const u of urls) {
      if (/\.(mp4|mkv|webm|mov)(\?.*)?$/i.test(u)) vidInput = u
      else if (!imgInput) imgInput = u 
    }

    const event = getEvent(ctx)
    const rawMessage = event?.message ?? event
    const ctxInfo = getContextInfo(rawMessage)
    const quoted = ctxInfo?.quotedMessage ?? null

    const qMedia = await extractMedia(quoted)
    if (qMedia) {
      if (qMedia.type === 'video') vidInput = qMedia.buf
      else imgInput = qMedia.buf
    }

    const aMedia = await extractMedia(rawMessage)
    if (aMedia) {
      if (aMedia.type === 'video') vidInput = aMedia.buf
      else imgInput = aMedia.buf
    }

    const saved = getSession(ctx.sender) || { videoInput: null, imageInput: null }

    if (vidInput) saved.videoInput = vidInput
    if (imgInput) saved.imageInput = imgInput

    if (saved.videoInput && saved.imageInput) {
      MEM.delete(ctx.sender)
      return processSwap(ctx, saved.videoInput, saved.imageInput)
    }

    setSession(ctx.sender, saved)

    if (saved.videoInput && !saved.imageInput) {
      return ctx.reply(
        '✅ Video target tersimpan.\n' +
        'Sekarang kirim/reply foto wajahnya dengan caption `.vidswap`.\n' +
        '⏳ Sesi berlaku 5 menit.'
      )
    }
    if (!saved.videoInput && saved.imageInput) {
      return ctx.reply(
        '✅ Foto wajah tersimpan.\n' +
        'Sekarang kirim/reply video targetnya dengan caption `.vidswap`.\n' +
        '⏳ Sesi berlaku 5 menit.'
      )
    }
    return ctx.reply(HELP)
  }
}