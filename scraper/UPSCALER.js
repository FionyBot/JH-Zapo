/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * UPSCALER.js — Scraper HD Image/Photo
 */

export async function JHImgUps(imgBuffer) {
  const axios = (await import('axios')).default || await import('axios');
  const FormData = (await import('form-data')).default || await import('form-data');

  const baseRes = { 
    status: true,
    author_skrep: 'JH a.k.a Dhika', 
    kesayangan: 'Fiony Alveria♡',
    data: {}
  };

  if (!imgBuffer || !Buffer.isBuffer(imgBuffer)) {
    return { ...baseRes, status: false, error: "Input harus berupa Buffer gambar." };
  }

  const jantung = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    'Origin': 'https://imgupscaler.ai',
    'Referer': 'https://imgupscaler.ai/',
    'Accept': '*/*',
    'Accept-Language': 'id-ID'
  };

  try {
    const fileName = `Fiony_${Math.floor(1000 + Math.random() * 9000)}.jpg`;
    const form1 = new FormData();
    form1.append('file_name', fileName);

    const { data: uploadInit } = await axios.post('https://api-v2.imgupscaler.ai/api/common/upload/upload-image', form1, {
      headers: { ...jantung, ...form1.getHeaders() }
    });

    const putUrl = uploadInit?.result?.url;
    const objectName = uploadInit?.result?.object_name;

    if (!putUrl || !objectName) throw new Error("Gagal mendapatkan URL upload dari server.");

    await axios.put(putUrl, imgBuffer, {
      headers: { ...jantung, 'Content-Type': 'image/jpeg' }
    });

    const form2 = new FormData();
    form2.append('object_name', objectName);

    const { data: signData } = await axios.post('https://api-v2.imgupscaler.ai/api/common/upload/sign-object', form2, {
      headers: { ...jantung, ...form2.getHeaders() }
    });

    const signedUrl = signData?.result?.url;
    if (!signedUrl) throw new Error("Gagal melakukan sign object gambar.");

    const productSerial = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });

    const form3 = new FormData();
    form3.append('target_pixel', '3.6');
    form3.append('original_image_file', signedUrl);
    form3.append('output_format', 'jpg');

    const { data: jobData } = await axios.post('https://api-v2.imgupscaler.ai/api/runtime/jobs/create-job', form3, {
      headers: {
        ...jantung,
        ...form3.getHeaders(),
        'product-code': 'magiceraser',
        'product-serial': productSerial,
        'router-key': 'image_enhance_v1',
        'timezone': 'Asia/Jakarta'
      }
    });

    const jobId = jobData?.result?.job_id;
    if (!jobId) throw new Error("Gagal membuat antrean job upscaler.");

    let outputUrl = null;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const { data: pollData } = await axios.get(`https://api-v2.imgupscaler.ai/api/runtime/jobs/get-job/${jobId}`, {
        headers: jantung
      });

      if (pollData?.result?.status === 1 && pollData?.result?.output_url) {
        outputUrl = pollData.result.output_url;
        break;
      }
      if (pollData?.result?.status === -1) {
        throw new Error('Job upscaler gagal diproses oleh server.');
      }
    }

    if (!outputUrl) throw new Error('Waktu tunggu habis, proses upscaler belum selesai.');

    const { data: resultBuffer } = await axios.get(outputUrl, {
      responseType: 'arraybuffer',
      headers: jantung
    });

    baseRes.data = {
      buffer: Buffer.from(resultBuffer),
      url: outputUrl
    };

    return baseRes;

  } catch (error) {
    let errInfo;
    try { 
      errInfo = JSON.parse(error.message); 
    } catch { 
      errInfo = error.response ? error.response.data : (error.stack || error.message); 
    }
    return { ...baseRes, status: false, error: errInfo };
  }
}

export default JHImgUps;
