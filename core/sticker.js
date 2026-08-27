/**
 * sticker.js — engine stiker BotZapo (gambar / GIF / video).
 *
 * Coded by JamvanHax0r
 * - Gambar  → sharp (WebP statis 512×512)
 * - GIF     → sharp animated, effort rendah biar ngebut
 * - Video   → ffmpeg SATU pass (512px, 12fps, q40)
 */
import sharp from 'sharp'
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { logger } from './logger.js'

/** Batas praktis upload stiker WA (413 teramati di ~1MB). */
export const MAX_STICKER_BYTES = 950_000

const packJson = (packName, author) => JSON.stringify({
  'sticker-pack-id': `fiony-${Date.now()}`,
  'sticker-pack-name': packName,
  'sticker-pack-publisher': author,
  emojis: []
})

/** EXIF TIFF strict (pemenang kalibrasi Var B). */
export function buildStrictExif(packName, author) {
  const data = Buffer.from(packJson(packName, author), 'utf8')
  const head = Buffer.alloc(26)
  head.write('II', 0, 'ascii')
  head.writeUInt16LE(42, 2)
  head.writeUInt32LE(8, 4)
  head.writeUInt16LE(1, 8)
  head.writeUInt16LE(0x5741, 10)
  head.writeUInt16LE(7, 12)
  head.writeUInt32LE(data.length, 14)
  head.writeUInt32LE(26, 18)
  head.writeUInt32LE(0, 22)
  return Buffer.concat([head, data])
}

/* ---------- utilitas container RIFF/WebP ---------- */

function parseChunks(webp) {
  const chunks = []
  let offset = 12
  while (offset + 8 <= webp.length) {
    const fourcc = webp.toString('ascii', offset, offset + 4)
    const size = webp.readUInt32LE(offset + 4)
    const start = offset + 8
    const end = start + size
    if (end > webp.length) return null
    chunks.push({ fourcc, payload: Buffer.from(webp.subarray(start, end)) })
    offset = end + (size % 2)
  }
  return chunks
}

export function isValidWebp(buf) {
  if (buf.length < 12) return false
  if (buf.toString('ascii', 0, 4) !== 'RIFF') return false
  if (buf.toString('ascii', 8, 12) !== 'WEBP') return false
  return Array.isArray(parseChunks(buf))
}

function serialize(chunks) {
  let size = 4
  for (const c of chunks) size += 8 + c.payload.length + (c.payload.length % 2)
  const buf = Buffer.alloc(8 + size)
  buf.write('RIFF', 0, 'ascii')
  buf.writeUInt32LE(size, 4)
  buf.write('WEBP', 8, 'ascii')
  let o = 12
  for (const c of chunks) {
    buf.write(c.fourcc, o, 'ascii')
    buf.writeUInt32LE(c.payload.length, o + 4)
    c.payload.copy(buf, o + 8)
    o += 8 + c.payload.length + (c.payload.length % 2)
  }
  return buf
}

export function injectExif(webp, exif) {
  if (!isValidWebp(webp)) return webp
  const chunks = parseChunks(webp)
  if (!chunks) return webp

  const out = []

  if (chunks[0].fourcc === 'VP8X') {
    const vp8x = Buffer.from(chunks[0].payload)
    vp8x[0] |= 0x08
    out.push({ fourcc: 'VP8X', payload: vp8x })
    for (let i = 1; i < chunks.length; i++) {
      if (chunks[i].fourcc === 'EXIF') continue
      out.push(chunks[i])
    }
  } else {
    const vp8 = chunks.find((c) => c.fourcc === 'VP8 ')
    const vp8l = chunks.find((c) => c.fourcc === 'VP8L')
    let canvas = null
    if (vp8 && vp8.payload.length >= 10 &&
        vp8.payload[3] === 0x9d && vp8.payload[4] === 0x01 && vp8.payload[5] === 0x2a) {
      canvas = {
        w: (vp8.payload[6] | (vp8.payload[7] << 8)) & 0x3fff,
        h: (vp8.payload[8] | (vp8.payload[9] << 8)) & 0x3fff
      }
    } else if (vp8l && vp8l.payload.length >= 5 && vp8l.payload[0] === 0x2f) {
      const b1 = vp8l.payload[1], b2 = vp8l.payload[2], b3 = vp8l.payload[3], b4 = vp8l.payload[4]
      canvas = {
        w: (((b2 & 0x3f) << 8) | b1) + 1,
        h: (((b2 >> 6) & 0x03) | (b3 << 2) | ((b4 & 0x0f) << 10)) + 1
      }
    }
    if (!canvas) return webp
    const hasAlpha = chunks.some((c) => c.fourcc === 'ALPH')
    const payload = Buffer.alloc(10)
    payload[0] = (hasAlpha ? 0x02 : 0) | 0x08
    const w1 = canvas.w - 1
    const h1 = canvas.h - 1
    payload[4] = w1 & 0xff
    payload[5] = (w1 >> 8) & 0xff
    payload[6] = (w1 >> 16) & 0xff
    payload[7] = h1 & 0xff
    payload[8] = (h1 >> 8) & 0xff
    payload[9] = (h1 >> 16) & 0xff
    out.push({ fourcc: 'VP8X', payload })
    out.push(...chunks)
  }

  out.push({ fourcc: 'EXIF', payload: exif })
  const result = serialize(out)
  return isValidWebp(result) ? result : webp
}

/* ---------- konverter per jenis media ---------- */

export async function imageToSticker(buffer) {
  return sharp(buffer)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 90 })
    .toBuffer()
}

/**
 * GIF → WebP animasi.
 * effort: 2 = encode ngebut (default 4). Buat stiker kecil di chat,
 * penurunan kualitasnya hampir gak kerasa tapi waktu turun drastis.
 */
export async function gifToSticker(buffer) {
  return sharp(buffer, { animated: true })
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 60, effort: 2, loop: 0 })
    .toBuffer()
}

/** Video → WebP animasi, SATU pass cepet. */
export async function videoToSticker(buffer, maxSeconds = 10) {
  const dir = await mkdtemp(join(tmpdir(), 'stiker-'))
  const inPath = join(dir, 'in.mp4')
  const outPath = join(dir, 'out.webp')

  try {
    await writeFile(inPath, buffer)
    const args = [
      '-y', '-loglevel', 'error', '-nostdin',
      '-i', inPath,
      '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,fps=12',
      '-t', String(maxSeconds),
      '-an',
      '-c:v', 'libwebp',
      '-quality', '40',
      '-compression_level', '4',
      '-loop', '0',
      '-pix_fmt', 'yuva420p',
      outPath
    ]
    await new Promise((resolve, reject) => {
      execFile('ffmpeg', args, { timeout: 60_000, maxBuffer: 10 * 1024 * 1024 }, (err, _o, stderr) => {
        if (err) reject(new Error(`ffmpeg: ${String(stderr).slice(-300) || err.message}`))
        else resolve()
      })
    })
    const out = await readFile(outPath)
    logger.info(`🎬 stiker video: ${(out.length / 1024).toFixed(0)}KB`)
    return out
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

/* ---------- entry point tunggal ---------- */

export async function buildSticker(media, { packName, author, withExif = true, maxVideoSeconds = 10 }) {
  let webp

  if (media.kind === 'video') {
    webp = await videoToSticker(media.buffer, maxVideoSeconds)
  } else if (media.kind === 'image' && /gif/i.test(media.mimetype)) {
    webp = await gifToSticker(media.buffer)
  } else if (media.kind === 'image') {
    webp = await imageToSticker(media.buffer)
  } else {
    throw new Error('Media tidak didukung untuk stiker')
  }

  if (!withExif) return webp

  try {
    const result = injectExif(webp, buildStrictExif(packName, author))
    if (result !== webp) logger.info('🧾 EXIF stiker terpasang (strict TIFF)')
    return result
  } catch (err) {
    logger.warn({ err: err.message }, '🧾 EXIF gagal, stiker dikirim polos')
    return webp
  }
}
