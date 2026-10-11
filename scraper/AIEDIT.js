/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * AIEDIT.js — Scraper AI Image Editor
 */

import axios from 'axios';
import crypto from 'crypto';
import FormData from 'form-data';

export async function JHPEAI(imgBuffer, promptText) {
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

        const randomSerial = crypto.randomBytes(16).toString('hex');
        const jantung = {
          'Accept': 'application/json, text/plain, */*',
          'Product-Serial': randomSerial,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Origin': 'https://photoeditorai.io',
          'Referer': 'https://photoeditorai.io/'
        };

        const { data: creditRes } = await axios.post('https://api.photoeditorai.io/api/wl/credit/get-credits', null, { 
          headers: jantung, 
          proxy 
        });

        if (creditRes.code !== 100000 || !creditRes.result) throw new Error("Gagal inisiasi sesi render AI.");
        if (creditRes.result.free_credits < 1 && creditRes.result.credits < 1) {
           throw new Error("Node server limit! Silakan ulangi command untuk rotasi IP.");
        }

        const form = new FormData();
        form.append('model_name', 'photoeditor_4.0');
        form.append('feature', 'photo_editor');
        form.append('target_images', Buffer.from(imgBuffer), 'image.jpg');
        form.append('prompt', promptText);
        form.append('ratio', 'match_input_image');
        form.append('image_resolution', '1K');

        const { data: createRes } = await axios.post('https://api.photoeditorai.io/pe/photo-editor/create-job', form, {
          headers: { ...jantung, ...form.getHeaders() },
          proxy
        });

        if (createRes.code !== 100000 || !createRes.result?.job_id) throw new Error("Gagal membuat antrean di server AI.");
        const jobId = createRes.result.job_id;

        for (let i = 0; i < 30; i++) {
          await new Promise(r => setTimeout(r, 2500)); 
          const { data: pollRes } = await axios.get(`https://api.photoeditorai.io/pe/photo-editor/get-job/${jobId}?feature=photo_editor`, { 
            headers: jantung,
            proxy
          });

          if (pollRes.code === 100000 && pollRes.result) {
            if (pollRes.result.status === 2 && pollRes.result.output?.length > 0) {
              baseRes.data.result_url = pollRes.result.output[0];
              return baseRes;
            } else if (pollRes.result.status !== 1) {
              throw new Error("Render AI gagal diproses server.");
            }
          }
        }
        throw new Error("Timeout saat menunggu hasil render AI.");
        
      } catch (err) {
        lastError = err.response?.data?.message || err.message;
        continue;
      }
    }
    
    throw new Error(`Gagal memproses setelah ${maxRetries}x rotasi IP otomatis. Error terakhir: ${lastError}`);

  } catch (error) {
    const rawMsg = error.response?.data?.message || error.message;
    const cleanMsg = rawMsg.replace(/photoeditorai/gi, 'FionyAI'); 
    return { ...baseRes, status: false, error: cleanMsg };
  }
}
