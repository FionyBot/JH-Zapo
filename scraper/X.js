/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * X.js — Scraper Twitter/X Downloader
 */

export async function JHTwitter(targetUrl) {
  const axios = (await import('axios')).default;
  const baseRes = { status: true, author_skrep: 'JH a.k.a Dhika', kesayangan: 'Fiony Alveria♡', data: { title: '', videos: [], images: [] } };

  try {
    const { data: taskData } = await axios.post('https://cap.jhx.my.id/api/createTask', {
      url: "https://x2twitter.com/en4",
      type: "turnstile-min",
      sitekey: "0x4AAAAAAA4XPM1s-KWsI2rm"
    }, { headers: { 'Content-Type': 'application/json' } });

    if (!taskData.success || !taskData.jobId) {
      throw new Error("Gagal membuat antrean bypass Turnstile.");
    }

    let cfToken = "";
    let ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const { data: resData } = await axios.post('https://cap.jhx.my.id/api/getResult', {
        jobId: taskData.jobId
      }, { headers: { 'Content-Type': 'application/json' } });

      if (resData.status === 'ready' && resData.solution) {
        cfToken = resData.solution.token;
        ua = resData.solution.userAgent || ua;
        break;
      } else if (resData.status === 'failed' || resData.error) {
        throw new Error(resData.error || "Gagal bypass Turnstile.");
      }
    }

    if (!cfToken) throw new Error("Timeout saat menunggu token.");

    const payload = new URLSearchParams();
    payload.append('q', targetUrl);
    payload.append('lang', 'en');
    payload.append('cftoken', cfToken);

    const { data: xData } = await axios.post('https://x2twitter.com/api/ajaxSearch', payload.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': '*/*',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': ua,
        'Referer': 'https://x2twitter.com/en4'
      }
    });

    if (xData.status !== 'ok' || !xData.data) {
      throw new Error("Gagal mendapatkan response valid dari server.");
    }

    const html = xData.data;
    
    const titleMatch = html.match(/<h3>(.*?)<\/h3>/);
    if (titleMatch) {
      baseRes.data.title = titleMatch[1].replace(/&#x[0-9A-F]+;/gi, '').trim();
    }

    const thumbMatch = html.match(/<img src="([^"]+)">/);
    const thumbnail = thumbMatch ? thumbMatch[1] : '';

    const vidRegex = /href="([^"]+)".*?Download MP4 \(([^)]+)\)/g;
    let matchV;
    while ((matchV = vidRegex.exec(html)) !== null) {
      baseRes.data.videos.push({
        quality: matchV[2],
        url: matchV[1],
        thumbnail: thumbnail
      });
    }

    const imgRegex = /href="([^"]+)".*?Download Photo/g;
    let matchI;
    while ((matchI = imgRegex.exec(html)) !== null) {
      baseRes.data.images.push({ url: matchI[1] });
    }

    if (!baseRes.data.videos.length && !baseRes.data.images.length) {
      throw new Error("Tweet ini cuma teks atau media gagal diekstrak.");
    }

    return baseRes;

  } catch (error) {
    const errMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message;
    return { ...baseRes, status: false, error: errMsg };
  }
}
