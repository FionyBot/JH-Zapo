/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * IGSTORY.js — Scraper IGStory Downloader with Username
 */

export async function JHIGStory(targetUser) {
  const axios = (await import('axios')).default;
  const crypto = (await import('crypto')).default;
  const baseRes = { status: true, author_skrep: 'JH a.k.a Dhika', kesayangan: 'Fiony Alveria♡', data: { username: '', stories: [] } };

  if (!targetUser) {
    return { ...baseRes, status: false, error: 'Sertakan username IG yang mau diambil story-nya!' };
  }

  const getTurnstileToken = async () => {
    const { data: taskData } = await axios.post('https://cap.jhx.my.id/api/createTask', {
      url: "https://linkedradar.com/instagram-story-downloader",
      type: "turnstile-min",
      sitekey: "0x4AAAAAAD7KNvxLSgbGlYIM"
    }, { headers: { 'Content-Type': 'application/json' } });

    if (!taskData.success || !taskData.jobId) {
      throw new Error("Gagal membuat antrean bypass Turnstile dari server JHCap.");
    }

    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const { data: resData } = await axios.post('https://cap.jhx.my.id/api/getResult', {
        jobId: taskData.jobId
      }, { headers: { 'Content-Type': 'application/json' } });

      if (resData.status === 'ready' && resData.solution) {
        return resData.solution;
      } else if (resData.status === 'failed' || resData.error) {
        throw new Error(resData.error || "Gagal bypass Turnstile Cloudflare.");
      }
    }
    throw new Error("Timeout saat menunggu token Turnstile Cloudflare.");
  };

  try {
    const solution1 = await getTurnstileToken();
    const token1 = solution1.token;
    const ua1 = solution1.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    const taskId = crypto.randomUUID();
    
    const { data: userData } = await axios.post('https://soleads.ai/igweb/api/ins/userinfo/get-by-username', {
      username: targetUser,
      business_platform: "linkedradar",
      task_id: taskId,
      "cf-turnstile-response": token1,
      "turnstileToken": token1
    }, { 
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': ua1,
        'Origin': 'https://linkedradar.com',
        'Referer': 'https://linkedradar.com/',
        'cf-turnstile-response': token1
      } 
    });

    if (userData.code !== 100000 || !userData.data || !userData.data.pk) {
      throw new Error(`Gagal narik ID untuk user @${targetUser}. Akun mungkin private atau tidak ditemukan.`);
    }

    const userId = userData.data.pk;
    baseRes.data.username = userData.data.username;

    const solution2 = await getTurnstileToken();
    const token2 = solution2.token;
    const ua2 = solution2.userAgent || ua1;

    const { data: storyData } = await axios.post('https://soleads.ai/igweb/api/ins/stories', {
      user_id: String(userId),
      amount: "24",
      business_platform: "linkedradar",
      "cf-turnstile-response": token2,
      "turnstileToken": token2
    }, { 
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': ua2,
        'Origin': 'https://linkedradar.com',
        'Referer': 'https://linkedradar.com/',
        'cf-turnstile-response': token2
      } 
    });

    if (storyData.code !== 100000 || !storyData.data || !Array.isArray(storyData.data.result)) {
      throw new Error(`Gagal mengekstrak story untuk @${targetUser}.`);
    }

    const results = storyData.data.result;

    if (results.length === 0) {
      throw new Error(`Tidak ada story aktif yang ditemukan untuk @${targetUser}.`);
    }

    results.forEach(item => {
      let url = '';
      let isVideo = false;

      if (item.video_url && item.video_url.length > 0) {
        url = item.video_url[0];
        isVideo = true;
      } else if (item.media_url && item.media_url.length > 0) {
        url = item.media_url[0];
      }

      if (url) {
        baseRes.data.stories.push({
          type: isVideo ? 'video' : 'image',
          url: url,
          taken_at: item.taken_at || ''
        });
      }
    });

    return baseRes;

  } catch (error) {
    const errMsg = error.response?.data?.message || error.message;
    return { ...baseRes, status: false, error: errMsg };
  }
}
