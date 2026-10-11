/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * PINDL.js — Scraper Pinterest Downloader
 */

export async function JHPinDL(inputUrl) {
  const axios = (await import('axios')).default || await import('axios');

  const baseRes = { 
    status: true,
    author_skrep: 'JH a.k.a Dhika', 
    kesayangan: 'Fiony Alveria♡',
    data: {}
  };

  if (!inputUrl) {
    return { ...baseRes, status: false, error: "URL Pinterest tidak valid." };
  }

  const jantung = {
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "accept-language": "en-US,en;q=0.9",
    "referer": "https://www.pinterest.com/"
  };

  try {
    let currentUrl = inputUrl;
    let pinId = (currentUrl.match(/\/pin\/(\d+)/i) || [])[1];

    const initialRes = await axios.get(currentUrl, { 
      headers: jantung, 
      maxRedirects: 5,
      validateStatus: () => true 
    });

    const finalUrl = initialRes.request?.res?.responseUrl || initialRes.config?.url || currentUrl;
    pinId = pinId || (finalUrl.match(/\/pin\/(\d+)/i) || [])[1];

    if (pinId) {
      const cleanUrl = `https://www.pinterest.com/pin/${pinId}/`;
      const apiUrl = `https://www.pinterest.com/resource/PinResource/get/?data=${encodeURIComponent(JSON.stringify({
        options: { id: pinId, field_set_key: "detailed" }
      }))}`;

      const apiRes = await axios.get(apiUrl, {
        headers: {
          ...jantung,
          "x-pinterest-pws-handler": "www/pin/[id].js",
          "accept": "application/json, text/javascript, */*, q=0.01",
          "referer": cleanUrl
        },
        validateStatus: () => true
      });

      const pinData = apiRes.data?.resource_response?.data;

      if (pinData) {
        const title = (pinData.title || pinData.grid_title || pinData.closeup_unified_description || "Pinterest Media").trim();
        const videoList = pinData.videos?.video_list || pinData.story_pin_data?.pages?.[0]?.blocks?.[0]?.video?.video_list;

        if (videoList) {
          const qualityOrder = ['V_1080P', 'V_720P', 'V_EXP4', 'V_EXP3', 'V_EXP7', 'V_480P', 'V_HLSV4'];
          let chosenVideo = null;
          let chosenQuality = '720p';

          for (const q of qualityOrder) {
            if (videoList[q]?.url) {
              chosenVideo = videoList[q].url;
              chosenQuality = q.replace(/^V_/, '').toLowerCase();
              break;
            }
          }

          if (!chosenVideo) {
            const anyKey = Object.keys(videoList).find(k => videoList[k]?.url);
            if (anyKey) {
              chosenVideo = videoList[anyKey].url;
              chosenQuality = anyKey.replace(/^V_/, '').toLowerCase();
            }
          }

          if (chosenVideo) {
            if (chosenVideo.endsWith('.m3u8')) {
              chosenVideo = chosenVideo.replace('/hls/', '/720p/').replace('.m3u8', '.mp4');
              chosenQuality = '720p';
            }

            baseRes.data = {
              type: 'video',
              title: title,
              quality: chosenQuality,
              media_url: chosenVideo,
              source: cleanUrl
            };
            return baseRes;
          }
        }

        const rawImages = pinData.images || {};
        const bestImg = rawImages.orig?.url || rawImages['736x']?.url || rawImages['564x']?.url || rawImages['474x']?.url;

        if (bestImg) {
          baseRes.data = {
            type: 'image',
            title: title,
            media_url: bestImg,
            source: cleanUrl
          };
          return baseRes;
        }
      }
    }

    const html = initialRes.data;
    const cleanMediaUrl = u => {
      try {
        let cl = String(u).trim();
        const em = cl.match(/^(.+?\.(?:jpg|jpeg|png|webp|mp4|m3u8))/i);
        if (em) cl = em[1];
        cl = cl.replace(/\\u002F/g, "/").replace(/\\u0026/g, "&").replace(/\\\//g, "/");
        const ur = new URL(cl);
        ur.search = "";
        return ur.toString();
      } catch {
        const em = String(u).match(/https:\/\/[a-z0-9.-]*pinimg\.com\/.+?\.(?:jpg|jpeg|png|webp|mp4|m3u8)/i);
        return em ? em[0] : u;
      }
    };

    const extractMatches = (str, regex) => [...str.matchAll(regex)].map(v => cleanMediaUrl(v[0]));
    const videoMatches = [...new Set([
      ...extractMatches(html, /https:\/\/[a-z0-9.-]*pinimg\.com\/videos\/[^"'\\\s<>]+\.mp4/gi),
      ...extractMatches(html, /https:\/\/[a-z0-9.-]*pinimg\.com\/videos\/[^"'\\\s<>]+\.m3u8/gi)
    ])];

    if (videoMatches.length > 0) {
      let chosen = videoMatches[0];
      if (chosen.endsWith('.m3u8')) {
        chosen = chosen.replace('/hls/', '/720p/').replace('.m3u8', '.mp4');
      }

      baseRes.data = {
        type: 'video',
        title: 'Pinterest Video',
        quality: '720p',
        media_url: chosen,
        source: finalUrl
      };
      return baseRes;
    }

    const imageMatches = [...new Set([
      ...extractMatches(html, /https:\/\/i\.pinimg\.com\/originals\/[^"'\\\s<>()]+?\.(?:jpg|jpeg|png|webp)/gi),
      ...extractMatches(html, /https:\/\/i\.pinimg\.com\/736x\/[^"'\\\s<>()]+?\.(?:jpg|jpeg|png|webp)/gi)
    ])].filter(u => !/logo|favicon|default|75x75|60x60/i.test(u));

    if (imageMatches.length > 0) {
      baseRes.data = {
        type: 'image',
        title: 'Pinterest Image',
        media_url: imageMatches[0],
        source: finalUrl
      };
      return baseRes;
    }

    throw new Error("Gagal menemukan media video maupun gambar yang valid.");

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

export default JHPinDL;
