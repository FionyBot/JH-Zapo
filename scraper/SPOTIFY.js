/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * SPOTIFY.js — Scraper Spotify Searcher + Downloader by JAMVANHAX0R
 */

import puppeteer from 'puppeteer';

const axios = (await import('axios')).default;
const FormData = (await import('form-data')).default;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

function deepFindByUriPrefix(obj, prefix, found = new Map(), depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 20) return found;
  if (typeof obj.uri === 'string' && obj.uri.startsWith(prefix) && obj.name) {
    if (!found.has(obj.uri)) found.set(obj.uri, obj);
  }
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val && typeof val === 'object') deepFindByUriPrefix(val, prefix, found, depth + 1);
  }
  return found;
}

function extractFromBodies(bodies, prefix) {
  const merged = new Map();
  for (const text of bodies) {
    try {
      const parsed = JSON.parse(text);
      deepFindByUriPrefix(parsed, prefix, merged);
    } catch (_) {}
  }
  return [...merged.values()];
}

function mapTrack(t) {
  const tryExtract = () => {
    if (Array.isArray(t.artists?.items)) return t.artists.items.map((a) => a.profile?.name || a.name).filter(Boolean);
    if (Array.isArray(t.artists)) return t.artists.map((a) => a.profile?.name || a.name).filter(Boolean);
    if (Array.isArray(t.firstArtist?.items)) return t.firstArtist.items.map((a) => a.profile?.name || a.name).filter(Boolean);
    if (t.artist?.name) return [t.artist.name];
    return [];
  };
  const artistsList = tryExtract();

  return {
    id: t.uri?.split(':')[2],
    uri: t.uri,
    name: t.name,
    artists: artistsList.join(', ') || undefined,
    album: t.albumOfTrack?.name || t.album?.name,
    duration_ms: t.duration?.totalMilliseconds || t.duration_ms,
    cover: t.albumOfTrack?.coverArt?.sources?.[0]?.url || t.album?.images?.[0]?.url,
    preview_url: t.previewUrl || t.preview_url || null,
    spotify_url: `https://open.spotify.com/track/${t.uri?.split(':')[2]}`
  };
}

export async function JHSpotSearch(query) {
  const baseRes = { status: true, author_skrep: 'JH a.k.a Dhika', kesayangan: 'Fiony Alveria♡', data: {} };
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.setUserAgent(UA);
    await page.setViewport({ width: 1366, height: 900 });

    const capturedBodies = [];
    page.on('response', async (res) => {
      try {
        const ct = res.headers()['content-type'] || '';
        if (ct.includes('application/json')) {
          const text = await res.text();
          if (text && text.length < 3000000) capturedBodies.push(text);
        }
      } catch (_) {}
    });

    const searchUrl = `https://open.spotify.com/search/${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise((r) => setTimeout(r, 2000));

    if (capturedBodies.length === 0) {
      throw new Error('Gagal menangkap response JSON dari server Spotify.');
    }

    const tracks = extractFromBodies(capturedBodies, 'spotify:track:').map(mapTrack);

    if (!tracks.length) {
      throw new Error('Tidak ditemukan hasil lagu untuk query tersebut.');
    }

    baseRes.data = { tracks: tracks.slice(0, 5) };
    return baseRes;

  } catch (error) {
    return { ...baseRes, status: false, error: error.message };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

export async function JHSpotDL(targetUrl) {
  const baseRes = { status: true, author_skrep: 'JH a.k.a Dhika', kesayangan: 'Fiony Alveria♡', data: {} };
  const jantung = {
    "content-type": "application/json",
    "accept": "application/json, text/plain, */*",
    "user-agent": UA,
    "referer": "https://www.spotify-downloads.com/"
  };

  try {
    const initReq = await axios.post('https://www.spotify-downloads.com/api/download', {
      url: targetUrl,
      quality: "320k"
    }, { headers: jantung });

    if (!initReq.data || !initReq.data.job_id) {
      throw new Error("Gagal membuat antrean download di server.");
    }

    const jobId = initReq.data.job_id;
    let finalData = null;

    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const checkReq = await axios.get(`https://www.spotify-downloads.com/api/status/${jobId}`, { headers: jantung });
      
      if (checkReq.data && checkReq.data.status === 'ready') {
        finalData = checkReq.data;
        break;
      } else if (checkReq.data && checkReq.data.error) {
        throw new Error(checkReq.data.error);
      }
    }

    if (!finalData) {
      throw new Error("Waktu tunggu habis, proses download gagal.");
    }

    const firstTrack = finalData.songs && finalData.songs.length > 0 ? finalData.songs[0] : {};

    baseRes.data = {
      job_id: finalData.job_id,
      title: finalData.name || firstTrack.name,
      artist: finalData.artist || firstTrack.artist,
      track_id: firstTrack.track_id || "",
      download_url: `https://www.spotify-downloads.com/api/file/${finalData.job_id}`
    };

    return baseRes;

  } catch (error) {
    return { ...baseRes, status: false, error: error.response?.data || error.message };
  }
}

export async function JHSDown(targetUrl) {
  const baseRes = { status: true, author_skrep: 'JH a.k.a Dhika', kesayangan: 'Fiony Alveria♡', data: {} };

  try {
    const spoHtml = await axios.get(targetUrl);
    const titleMatch = spoHtml.data.match(/<title>(.*?)<\/title>/i)?.[1] || 'Spotify Track';
    const cleanTitle = titleMatch.replace(' - song and lyrics by ', ' - ').split(' | ')[0];
    const [song_name, artist] = cleanTitle.includes(' - ') ? cleanTitle.split(' - ') : [cleanTitle, 'Unknown'];

    const form = new FormData();
    form.append('post_id', '2');
    form.append('form_id', '394636d');
    form.append('referer_title', 'Spotify Music Downloader - Convert Spotify to MP3 Online Free');
    form.append('queried_id', '2');
    form.append('form_fields[music_url]', targetUrl);
    form.append('action', 'elementor_pro_forms_send_form');
    form.append('referrer', 'https://spotidown.net/en/');

    const req1 = await axios.post('https://spotidown.net/en/wp-admin/admin-ajax.php', form, {
      headers: {
        'accept': 'application/json, text/javascript, */*; q=0.01',
        'x-requested-with': 'XMLHttpRequest',
        'referer': 'https://spotidown.net/en/',
        ...form.getHeaders()
      }
    });

    let cookie = '';
    if (req1.headers['set-cookie']) {
      cookie = req1.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
    }

    const step2DataObj = { song_name: song_name.trim(), artist: artist.trim(), link: targetUrl };
    const step2Encoded = Buffer.from(JSON.stringify(step2DataObj)).toString('base64');

    const req2 = await axios.get(`https://spotidown.net/en/wp-admin/admin-ajax.php?action=check_download_status&data=${step2Encoded}`, {
      headers: {
        'accept': '*/*',
        'x-requested-with': 'XMLHttpRequest',
        'referer': 'https://spotidown.net/en/downloads/',
        'cookie': cookie
      }
    });

    if (!req2.data?.success || !req2.data?.data?.download_id) {
      throw new Error('Gagal inisiasi download ID Spotidown.');
    }

    const downloadId = req2.data.data.download_id;
    let finalData = null;
    let attempts = 0;

    while (attempts < 10) {
      await new Promise(r => setTimeout(r, 2000));
      const req3 = await axios.get(`https://spotidown.net/en/wp-admin/admin-ajax.php?action=get_download_status&download_id=${downloadId}`, {
        headers: {
          'accept': '*/*',
          'x-requested-with': 'XMLHttpRequest',
          'referer': 'https://spotidown.net/en/downloads/',
          'cookie': cookie
        }
      });

      if (req3.data?.success && req3.data?.data?.status === 'ready') {
        finalData = req3.data.data;
        break;
      }
      attempts++;
    }

    if (!finalData) throw new Error('Timeout saat menunggu status download.');

    baseRes.data = finalData;
    return baseRes;

  } catch (error) {
    return { ...baseRes, status: false, error: error.response?.data?.message || error.message };
  }
}
