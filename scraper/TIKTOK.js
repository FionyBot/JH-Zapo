/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * TIKTOK.js — TikTok Downloader Scraper
 */

export async function JHTTDL(url) {
  const axios = (await import('axios')).default || await import('axios')
  const crypto = await import('crypto')

  const baseRes = {
    status: true,
    author_skrep: 'JH a.k.a Dhika',
    kesayangan: 'Fiony Alveria♡',
    data: {}
  }

  async function getXVerify() {
    const { data: tokenData } = await axios.post(
      'https://snaptik.app/api/token',
      {},
      {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.7871.181 Mobile Safari/537.36'
        }
      }
    )

    const tokenId = tokenData?.id
    const pValue = tokenData?.p
    if (!tokenId || !pValue) throw new Error('Gagal dapetin ID token')

    const keyString = "sn4pt1k_v3r1fy2026:" + tokenId
    const key = crypto.createHash('sha256').update(keyString).digest()

    const buf = Buffer.from(pValue, 'base64')
    const iv = buf.slice(0, 16)
    const encrypted = buf.slice(16)

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    let decrypted = decipher.update(encrypted, undefined, 'utf8')
    decrypted += decipher.final('utf8')

    const parsedData = JSON.parse(decrypted)
    const _e = parsedData._e
    const _h = parsedData._h
    
    let solved = 0
    switch (parsedData.t) {
      case "b":
        solved = ((parsedData.a ^ parsedData.b) >> parsedData.s) & 255
        break
      case "r":
        solved = parsedData.n.reduce((h, f) => h + f, 0) * 2 + 1
        break
      case "c":
        solved = parsedData.w.charCodeAt(parsedData.i) * parsedData.m
        break
      case "m":
        solved = ((parsedData.a + parsedData.b) % 100) * parsedData.c
        break
      case "n":
        solved = parsedData.a * parsedData.b + parsedData.b * parsedData.c + parsedData.c * parsedData.a - parsedData.a
        break
      default:
        throw new Error("Unknown challenge")
    }

    return `${tokenId}:${solved}:${_e}:${_h}`
  }

  try {
    const xVerifyExtract = await getXVerify()

    const { data: extractData } = await axios.get(
      `https://snaptik.app/api/extract?url=${encodeURIComponent(url)}`,
      {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-Verify': xVerifyExtract,
          'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.7871.181 Mobile Safari/537.36',
          'Referer': 'https://snaptik.app/'
        }
      }
    )

    const result = extractData.data

    if (!result) {
        throw new Error("Gagal mengambil data dari server")
    }

    if (result?.hdDownloadUrl) {
      const hdApiUrl = result.hdDownloadUrl.startsWith('/') 
        ? `https://snaptik.app${result.hdDownloadUrl}` 
        : result.hdDownloadUrl

      try {
        const xVerifyHD = await getXVerify()
        
        const { data: hdData } = await axios.get(hdApiUrl, {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-Verify': xVerifyHD,
            'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.7871.181 Mobile Safari/537.36',
            'Referer': 'https://snaptik.app/'
          }
        })

        if (!hdData.error && hdData.url) {
          result.hdDownloadUrl = hdData.url
        }
      } catch (err) {}
    }

    baseRes.data = result
    return baseRes

  } catch (e) {
    return { ...baseRes, status: false, error: e.response?.data || e.message }
  }
}

export default JHTTDL
