/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * UNBLUR.js — Scraper AI Unblur Image
 */

import axios from 'axios';
import crypto from 'crypto';
import FormData from 'form-data';

export async function JHUnblur(imgBuffer) {
  const baseRes = { status: true, author_skrep: 'JH a.k.a Dhika', kesayangan: 'Fiony Alveria♡', data: { result_url: '' } };
  
  try {
    const { data: proxyList } = await axios.get('https://proxy.jhx.my.id/jh-proxy');
    if (!proxyList || !proxyList.length) throw new Error("List proxy kosong dari server utama.");

    let proxies = [...proxyList];
    const maxRetries = 3;
    let lastError = "";

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (proxies.length === 0) break;
        
        const randIndex = Math.floor(Math.random() * proxies.length);
        const randPx = proxies.splice(randIndex, 1)[0];
        const [ip, port, uname, pass] = randPx.split(':');
        const proxy = { protocol: 'http', host: ip, port: parseInt(port), auth: { username: uname, password: pass } };

        const randomSerial = crypto.randomBytes(3).toString('hex');
        const jantung = {
          'accept': '*/*',
          'product-code': '067003',
          'product-serial': randomSerial,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Origin': 'https://unblurimage.ai',
          'Referer': 'https://unblurimage.ai/'
        };

        const form = new FormData();
        form.append('original_image_file', Buffer.from(imgBuffer), 'image.jpg');

        const { data: createRes } = await axios.post('https://api.unwatermark.ai/api/web/unblurimage/v1/image-unblur-v2/create-job', form, {
          headers: { ...jantung, ...form.getHeaders() },
          proxy
        });

        if (createRes.code !== 300000 || !createRes.result?.job_id) {
           throw new Error("Node server limit atau gagal antre: " + JSON.stringify(createRes));
        }

        const jobId = createRes.result.job_id;

        for (let i = 0; i < 30; i++) {
          await new Promise(r => setTimeout(r, 2500)); 
          
          const { data: pollRes } = await axios.get(`https://api.unwatermark.ai/api/web/unblurimage/v1/image-unblur-v2/get-job/${jobId}`, { 
            headers: jantung,
            proxy
          });

          if (pollRes.code === 100000 && pollRes.result && pollRes.result.status === 1) {
            if (pollRes.result.output_url && pollRes.result.output_url.length > 0) {
              baseRes.data.result_url = pollRes.result.output_url[0];
              return baseRes;
            }
          } else if (pollRes.code !== 300006 && pollRes.code !== 100000 && pollRes.code !== 300000) {
            throw new Error("Render gagal di server AI.");
          }
        }
        throw new Error("Timeout saat menunggu hasil render AI.");
        
      } catch (err) {
        lastError = err.response?.data?.message || err.message;
        continue;
      }
    }
    
    throw new Error(`Gagal memproses setelah ${maxRetries}x rotasi IP otomatis. Error: ${lastError}`);

  } catch (error) {
    const rawMsg = error.response?.data?.message || error.message;
    const cleanMsg = rawMsg.replace(/unblurimage|unwatermark/gi, 'FionyAI'); 
    return { ...baseRes, status: false, error: cleanMsg };
  }
}
