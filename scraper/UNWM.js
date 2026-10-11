/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * UNWM.js — Scraper Penghapus WM dari Gambar
 */

export async function JHUNWM(imgBuffer, mime = 'image/jpeg') {
  const axios = (await import('axios')).default;
  const FormData = (await import('form-data')).default;
  const crypto = (await import('crypto')).default;

  const baseRes = {
    status: true,
    author_skrep: 'JH a.k.a Dhika',
    kesayangan: 'Fiony Alveria♡',
    data: {}
  };

  if (!imgBuffer || !Buffer.isBuffer(imgBuffer)) {
    return { ...baseRes, status: false, error: 'Input harus berupa Buffer gambar.' };
  }

  const ext = mime.split('/')[1] || 'png';
  const filename = `${Math.floor(1000000000 + Math.random() * 9000000000)}.${ext}`;
  const productCode = crypto.randomBytes(3).toString('hex');
  const productSerial = crypto.randomBytes(16).toString('hex');

  const form = new FormData();
  form.append('original_image_file', imgBuffer, { filename, contentType: mime });

  const listUA = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/147.0.7727.55 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Version/16.0 Mobile Safari/604.1"
  ];
  const ua = listUA[Math.floor(Math.random() * listUA.length)];

  const jantung = {
    ...form.getHeaders(),
    'User-Agent': ua,
    'Referer': 'https://unwatermark.ai/',
    'Origin': 'https://unwatermark.ai',
    'Accept': '*/*',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Connection': 'keep-alive',
    'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24"',
    'sec-ch-ua-mobile': ua.includes('Mobile') ? '?1' : '?0',
    'sec-ch-ua-platform': ua.includes('Windows') ? '"Windows"' : ua.includes('Mac') ? '"macOS"' : ua.includes('Linux') ? '"Linux"' : '"Android"',
    'Product-Code': productCode,
    'Product-Serial': productSerial
  };

  try {
    const { data } = await axios.post(
      'https://api.unwatermark.ai/api/unwatermark/v5/ai-remove/easy-remove',
      form,
      {
        headers: jantung,
        maxBodyLength: Infinity,
        validateStatus: () => true
      }
    );

    if (typeof data === 'string' && data.includes('<html')) {
       return { ...baseRes, status: false, error: 'Kena proteksi Cloudflare/Blocked.' };
    }

    const outUrl = data?.result?.output_image_url;
    if (!outUrl) {
       return { ...baseRes, status: false, error: data || 'Gagal mendapatkan output URL.' };
    }

    baseRes.data = { url: outUrl };
    return baseRes;

  } catch (error) {
    return { ...baseRes, status: false, error: error.response?.data || error.message };
  }
}

export default JHUNWM;
