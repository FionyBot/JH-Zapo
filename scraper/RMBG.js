/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * RMBG.js — Scraper Remove Background
 */

export async function JHRMBG(imgBuffer, mime = 'image/jpeg') {
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
  const randFileName = crypto.randomBytes(5).toString('hex') + '.' + ext;

  const jantung = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Origin': 'https://www.iloveimg.com',
    'Referer': 'https://www.iloveimg.com/id/hapus-latar-belakang'
  };

  try {
    const { data: html } = await axios.get('https://www.iloveimg.com/id/hapus-latar-belakang', { headers: jantung });
    const tokenExtractor = html.match(/"token"\s*:\s*"([^"]+)"/);
    if (!tokenExtractor) return { ...baseRes, status: false, error: 'Gagal ngejebol token rahasia dari server!' };

    jantung['Authorization'] = `Bearer ${tokenExtractor[1]}`;

    const { data: initData } = await axios.get('https://api.iloveimg.com/v1/start/removebackgroundimage', { headers: jantung });
    const jobId = initData.task;
    const apiNode = initData.server;

    if (!jobId || !apiNode) return { ...baseRes, status: false, error: 'Server menolak request.' };

    const formUpload = new FormData();
    formUpload.append('task', jobId);
    formUpload.append('file', imgBuffer, { filename: randFileName, contentType: mime });

    const { data: upData } = await axios.post(`https://${apiNode}/v1/upload`, formUpload, {
      headers: { ...jantung, ...formUpload.getHeaders() }
    });

    const srvFile = upData.server_filename;
    if (!srvFile) return { ...baseRes, status: false, error: 'Gagal nge-link gambar ke server.' };

    const exePayload = {
      task: jobId,
      tool: 'removebackgroundimage',
      files: [{ server_filename: srvFile, filename: randFileName }]
    };

    await axios.post(`https://${apiNode}/v1/process`, exePayload, { headers: jantung });

    const dlUrl = `https://${apiNode}/v1/download/${jobId}`;
    const { data: resultBuf } = await axios.get(dlUrl, { responseType: 'arraybuffer', headers: jantung });

    baseRes.data = { buffer: Buffer.from(resultBuf) };
    return baseRes;

  } catch (error) {
    const msg = error.response?.data?.error?.message || error.response?.data?.message || error.message;
    return { ...baseRes, status: false, error: msg };
  }
}

export default JHRMBG;
