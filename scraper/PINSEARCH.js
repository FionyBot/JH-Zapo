/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * PINSEARCH.js — Scraper Pinterest Search
 */

export async function JHPin(query = 'Fiony JKT48', limit = 10) {
  const axios = (await import('axios')).default;
  
  const baseRes = { 
    status: true,
    author_skrep: 'JH a.k.a Dhika', 
    kesayangan: 'Fiony Alveria♡',
    data: {}
  };

  try {
    const encoded = encodeURIComponent(JSON.stringify({ options: { query } }));
    const url = `https://www.pinterest.com/resource/BaseSearchResource/get/?data=${encoded}`;

    const jantung = {
      "screen-dpr": "4",
      "x-pinterest-pws-handler": "www/search/[scope].js",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "accept-language": "en-US,en;q=0.9",
      "referer": "https://www.pinterest.com/"
    };

    const res = await axios.head(url, { 
      headers: jantung, 
      validateStatus: () => true 
    });

    const linkHeader = res.headers.link || res.headers['link'] || "";
    const regex = /<\s*(https:\/\/i\.pinimg\.com\/[^>]+)\s*>\s*;\s*rel=preload;\s*as=image/gi;
    
    const matches = [...linkHeader.matchAll(regex)].map(v => v[1]);
    const results = [...new Set(matches)].slice(0, limit);

    if (results.length === 0) {
        return { ...baseRes, status: false, error: "Zonk wak! Gagal nemu image dari header Pinterest." };
    }

    baseRes.data = {
      query: query,
      total: results.length,
      images: results
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

export default JHPin;
