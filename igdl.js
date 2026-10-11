/**
 * igdl.js
 * Instagram media + metadata scraper — 3 LAPIS, diurutin dari paling cepet:
 *
 *   1. scrapeViaGraphQL → PRIMARY. Plain POST ke www.instagram.com/api/graphql,
 *      NGGAK BUTUH COOKIE/LOGIN. Ini yang paling reliable buat dapet video_url
 *      Reels (confirmed working dari reference ahmedrangel/instagram-media-scraper).
 *   2. scrapeViaEmbed  → fallback cepet kalau GraphQL gagal (misal doc_id-nya
 *      ke-invalidate suatu saat sama Meta). Juga plain HTTP, no cookie.
 *   3. scrapeViaSession → fallback terakhir, Puppeteer + sessionid + proxy,
 *      kalau dua-duanya di atas gagal (biasanya kena login-wall).
 *
 * Install dulu:
 *   npm install axios puppeteer
 *
 * WAJIB DIISI biar fallback mode 3 jalan:
 *   const IG_SESSIONID = 'xxx';
 */

import axios from 'axios';

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const SAFARI_MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

// Konstanta publik yg dipakai web client Instagram sendiri (bukan rahasia per-akun)
const IG_APP_ID = '936619743392459';
const FB_LSD = 'AVqbxe3J_YA'; // token statis yg dipakai banyak implementasi publik; kalau GraphQL mulai gagal total, ini kandidat pertama yg perlu di-refresh
const GRAPHQL_DOC_ID = '10015901848480474'; // ID query GraphQL buat ambil shortcode_media; Meta bisa ganti ini sewaktu-waktu

function getCleanUrl(url) {
  return url.trim().split('?')[0];
}

function cleanSlashes(s) {
  return typeof s === 'string' ? s.replace(/\\\//g, '/') : s;
}

/**
 * Bangun downloads[] + metadata dari media object berskema GraphQL
 * (field2 kayak video_url, display_url, edge_sidecar_to_children, dll).
 * Dipakai bareng sama scrapeViaGraphQL & scrapeViaEmbed krn skemanya sama persis.
 */
function buildFromGraphqlMedia(media) {
  const caption = media.edge_media_to_caption?.edges?.[0]?.node?.text || '';

  const metadata = {
    shortcode: media.shortcode,
    caption,
    owner_username: media.owner?.username,
    is_video: !!media.is_video,
    is_carousel: !!media.edge_sidecar_to_children,
    like_count: media.edge_liked_by?.count ?? media.edge_media_preview_like?.count,
    comment_count: media.edge_media_to_comment?.count ?? media.edge_media_to_parent_comment?.count,
    video_view_count: media.video_view_count ?? media.video_play_count,
    video_duration: media.video_duration,
    dimensions: media.dimensions,
    taken_at_timestamp: media.taken_at_timestamp,
  };

  const downloads = [];
  let missingVideoUrl = false;

  if (media.edge_sidecar_to_children?.edges?.length) {
    media.edge_sidecar_to_children.edges.forEach((edge, i) => {
      const n = edge.node;
      const realVideoUrl = cleanSlashes(n.video_url);
      if (n.is_video && !realVideoUrl) missingVideoUrl = true;

      const mediaUrl = realVideoUrl || cleanSlashes(n.display_url);
      if (mediaUrl) {
        downloads.push({
          url: mediaUrl,
          type: realVideoUrl ? 'VIDEO' : 'IMAGE',
          quality: realVideoUrl ? `HD Video ${i + 1}` : `HD Photo ${i + 1}`,
          thumbnail: cleanSlashes(n.display_url) || mediaUrl,
        });
      }
    });
  } else {
    const realVideoUrl = cleanSlashes(media.video_url);
    if (media.is_video && !realVideoUrl) missingVideoUrl = true;

    const mediaUrl = realVideoUrl || cleanSlashes(media.display_url);
    if (mediaUrl) {
      downloads.push({
        url: mediaUrl,
        type: realVideoUrl ? 'VIDEO' : 'IMAGE',
        quality: realVideoUrl ? 'HD Video' : 'HD Photo',
        thumbnail: cleanSlashes(media.display_url) || mediaUrl,
      });
    }
  }

  return { downloads, metadata, missingVideoUrl };
}

function resultFromBuild({ downloads, metadata, missingVideoUrl }, igUrl, source) {
  if (!downloads.length) {
    return { success: false, error: 'Nggak ada media url yang bisa diambil dari hasil parse.', metadata };
  }
  if (missingVideoUrl) {
    return {
      success: false,
      error: `Post ini video tapi ${source} cuma ngasih thumbnail (video_url kosong).`,
      metadata,
      _onlyGotThumbnail: downloads,
    };
  }
  return {
    success: true,
    title: metadata.caption ? metadata.caption.slice(0, 80) : 'Instagram Media',
    thumbnail: downloads[0].thumbnail,
    downloads,
    metadata,
    sourceUrl: igUrl,
    source,
  };
}

// ================== METODE 1 (PRIMARY): GraphQL, no cookie ==================

async function scrapeViaGraphQL(igUrl, shortcode) {
  const url = new URL('https://www.instagram.com/api/graphql');
  const body = new URLSearchParams({
    variables: JSON.stringify({ shortcode }),
    doc_id: GRAPHQL_DOC_ID,
    lsd: FB_LSD,
  });

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'User-Agent': CHROME_UA,
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-IG-App-ID': IG_APP_ID,
        'X-FB-LSD': FB_LSD,
        'X-ASBD-ID': '129477',
        'Sec-Fetch-Site': 'same-origin',
        Accept: '*/*',
      },
      body: body.toString(),
    });
  } catch (e) {
    return { success: false, error: `Request GraphQL gagal: ${e.message}` };
  }

  if (!res.ok) {
    return { success: false, error: `GraphQL balikin status ${res.status}` };
  }

  let json;
  try {
    json = await res.json();
  } catch (e) {
    return { success: false, error: `Gagal parse JSON GraphQL: ${e.message}` };
  }

  const media = json?.data?.xdt_shortcode_media;
  if (!media) {
    return {
      success: false,
      error: 'xdt_shortcode_media kosong — shortcode salah/post dihapus/private, atau doc_id GraphQL udah ke-invalidate Meta.',
      debug: { topLevelKeys: Object.keys(json?.data || {}), rawSample: JSON.stringify(json).slice(0, 300) },
    };
  }

  return resultFromBuild(buildFromGraphqlMedia(media), igUrl, 'graphql');
}

// ================== METODE 2 (FALLBACK CEPAT): embed page, no cookie ==================

async function scrapeViaEmbed(igUrl, pathType, shortcode) {
  const embedUrl = `https://www.instagram.com/${pathType}/${shortcode}/embed/captioned/`;

  let res;
  try {
    res = await axios.get(embedUrl, {
      headers: {
        'User-Agent': SAFARI_MOBILE_UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 15000,
      validateStatus: () => true,
    });
  } catch (e) {
    return { success: false, error: `Request ke Instagram gagal: ${e.message}` };
  }

  if (res.status !== 200) {
    return { success: false, error: `Instagram balikin status ${res.status}.` };
  }

  const html = String(res.data);
  const unescaped = html.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  const idx = unescaped.indexOf('"shortcode_media":');

  if (idx === -1) {
    return { success: false, error: 'shortcode_media nggak ketemu di embed page.' };
  }

  const start = idx + '"shortcode_media":'.length;
  let depth = 0;
  let end = -1;
  for (let i = start; i < unescaped.length; i++) {
    if (unescaped[i] === '{') depth++;
    else if (unescaped[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end === -1) {
    return { success: false, error: 'Gagal parse JSON shortcode_media (unbalanced braces).' };
  }

  let media;
  try {
    media = JSON.parse(unescaped.slice(start, end));
  } catch (e) {
    return { success: false, error: `Gagal JSON.parse shortcode_media: ${e.message}` };
  }

  return resultFromBuild(buildFromGraphqlMedia(media), igUrl, 'embed');
}

// ================== METODE 3 (FALLBACK TERAKHIR): logged-in session ==================

import puppeteer from 'puppeteer';

const IG_SESSIONID = '63313023645%3AtRCgd2zi1egbpe%3A9%3AAYnUwpkWxopBC7CJh4mNwtBCTiGixuPr8WAXtq6zyg'; // isi sessionid akun burner lo
const PROXY_API_URL = 'https://proxy.jhx.my.id/jh-proxy';
const SESSION_UA = CHROME_UA;

async function fetchRandomProxy() {
  const res = await fetch(PROXY_API_URL);
  if (!res.ok) throw new Error(`Gagal ambil proxy list, status=${res.status}`);
  const list = await res.json();
  if (!Array.isArray(list) || list.length === 0) throw new Error('Proxy list kosong.');
  const picked = list[Math.floor(Math.random() * list.length)];
  const [host, port, username, password] = picked.split(':');
  return { host, port, username, password };
}

function extractDataSjsBlocks(rawHtml) {
  if (!rawHtml) return [];
  const blocks = [];
  const re = /<script[^>]*data-sjs[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(rawHtml)) !== null) blocks.push(m[1]);
  return blocks;
}

function looksLikePostMedia(obj, targetShortcode) {
  if (!obj || typeof obj !== 'object') return false;
  const identifier = obj.shortcode ?? obj.code;
  if (identifier === undefined || identifier === null) return false;
  if (String(identifier) !== String(targetShortcode)) return false;
  const hasGraphqlMedia = !!(obj.video_url || obj.display_url || obj.edge_sidecar_to_children);
  const hasMobileMedia = !!(obj.image_versions2 || obj.video_versions || obj.carousel_media);
  return hasGraphqlMedia || hasMobileMedia;
}

function deepFindPostMedia(obj, targetShortcode, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 15) return null;
  if (looksLikePostMedia(obj, targetShortcode)) return obj;
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val && typeof val === 'object') {
      const found = deepFindPostMedia(val, targetShortcode, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function findPostMediaFromSources(sources, targetShortcode) {
  for (const text of sources) {
    try {
      const parsed = JSON.parse(text);
      const found = deepFindPostMedia(parsed, targetShortcode);
      if (found) return found;
    } catch (_) {
      /* skip yg bukan JSON valid */
    }
  }
  return null;
}

function normalizePostMedia(media) {
  const toItem = (n, i) => {
    const isVideo = !!(n.video_url || n.video_versions?.length || n.is_video);
    const url =
      cleanSlashes(n.video_url) ||
      cleanSlashes(n.video_versions?.[0]?.url) ||
      cleanSlashes(n.display_url) ||
      cleanSlashes(n.image_versions2?.candidates?.[0]?.url);
    const thumb = cleanSlashes(n.display_url) || cleanSlashes(n.image_versions2?.candidates?.[0]?.url) || url;
    return url
      ? { url, type: isVideo ? 'VIDEO' : 'IMAGE', quality: isVideo ? `HD Video ${i}` : `HD Photo ${i}`, thumbnail: thumb }
      : null;
  };

  const downloads = [];
  const carouselEdges = media.edge_sidecar_to_children?.edges?.map((e) => e.node) || media.carousel_media || null;

  if (carouselEdges?.length) {
    carouselEdges.forEach((n, i) => {
      const item = toItem(n, i + 1);
      if (item) downloads.push(item);
    });
  } else {
    const item = toItem(media, 1);
    if (item) {
      item.quality = item.type === 'VIDEO' ? 'HD Video' : 'HD Photo';
      downloads.push(item);
    }
  }

  const caption = media.edge_media_to_caption?.edges?.[0]?.node?.text || media.caption?.text || '';

  return {
    downloads,
    metadata: {
      shortcode: media.shortcode || media.code,
      caption,
      owner_username: media.owner?.username || media.user?.username,
      is_video: downloads[0]?.type === 'VIDEO',
      is_carousel: !!carouselEdges?.length,
      like_count: media.edge_liked_by?.count ?? media.edge_media_preview_like?.count ?? media.like_count,
      comment_count: media.edge_media_to_comment?.count ?? media.comment_count,
      video_view_count: media.video_view_count,
      video_duration: media.video_duration,
    },
  };
}

async function scrapeViaSessionOnce(igUrl, pathType, shortcode) {
  if (!IG_SESSIONID || IG_SESSIONID === 'xxx') {
    return { success: false, error: 'IG_SESSIONID belum diisi di igdl.js — nggak bisa fallback ke mode logged-in.' };
  }

  let proxy = null;
  try {
    proxy = await fetchRandomProxy();
  } catch (e) {
    console.error(`[igdl] Gagal ambil proxy (${e.message}), lanjut tanpa proxy.`);
  }

  const launchArgs = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled'];
  if (proxy) launchArgs.push(`--proxy-server=${proxy.host}:${proxy.port}`);

  let browser;
  try {
    browser = await puppeteer.launch({ headless: 'new', args: launchArgs });
    const page = await browser.newPage();
    if (proxy?.username && proxy?.password) {
      await page.authenticate({ username: proxy.username, password: proxy.password });
    }
    await page.setUserAgent(SESSION_UA);
    await page.setViewport({ width: 1440, height: 900 });
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });
    await page.setCookie({
      name: 'sessionid',
      value: IG_SESSIONID,
      domain: '.instagram.com',
      path: '/',
      httpOnly: true,
      secure: true,
    });

    const capturedJsonBodies = [];
    page.on('response', async (res) => {
      try {
        const ct = res.headers()['content-type'] || '';
        if (ct.includes('application/json')) {
          const text = await res.text();
          if (text && text.length < 3_000_000) capturedJsonBodies.push(text);
        }
      } catch (_) {
        /* ignore */
      }
    });

    await page.goto(`https://www.instagram.com/${pathType}/${shortcode}/`, {
      waitUntil: 'networkidle2',
      timeout: 45000,
    });
    await new Promise((r) => setTimeout(r, 3000));

    const domHtml = await page.content();
    const sjsBlocks = extractDataSjsBlocks(domHtml);
    const media = findPostMediaFromSources([...capturedJsonBodies, ...sjsBlocks], shortcode);

    if (!media) {
      return {
        success: false,
        error: 'Media object nggak ketemu walau udah mode logged-in.',
        debug: { jsonBodiesCaptured: capturedJsonBodies.length, sjsBlocksFound: sjsBlocks.length, usedProxy: !!proxy },
      };
    }

    const { downloads, metadata } = normalizePostMedia(media);
    if (!downloads.length) {
      return { success: false, error: 'Media object ketemu tapi nggak ada URL yang bisa diambil.', metadata };
    }

    return {
      success: true,
      title: metadata.caption ? metadata.caption.slice(0, 80) : 'Instagram Media',
      thumbnail: downloads[0].thumbnail,
      downloads,
      metadata,
      sourceUrl: igUrl,
      source: 'session_fallback',
    };
  } catch (e) {
    return { success: false, error: `scrapeViaSession error: ${e.message}` };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

async function scrapeViaSession(igUrl, pathType, shortcode, { expectVideo = false, maxAttempts = 3 } = {}) {
  let lastResult = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    lastResult = await scrapeViaSessionOnce(igUrl, pathType, shortcode);

    if (!lastResult.success) {
      console.error(`[igdl] session attempt ${attempt}/${maxAttempts} gagal: ${lastResult.error}`);
      continue;
    }

    const gotRealVideo = lastResult.downloads?.some((d) => d.type === 'VIDEO');
    if (!expectVideo || gotRealVideo) {
      if (attempt > 1) console.error(`[igdl] session attempt ${attempt}/${maxAttempts} berhasil.`);
      return lastResult;
    }

    console.error(`[igdl] session attempt ${attempt}/${maxAttempts} cuma dapet thumbnail — retry...`);
  }

  return lastResult;
}

// ================== ORKESTRATOR ==================

async function igdl(igUrl) {
  if (!igUrl || !/instagram\.com/.test(igUrl)) {
    return { success: false, error: 'URL bukan link instagram yang valid' };
  }

  const cleanUrl = getCleanUrl(igUrl);
  const shortcodeMatch = cleanUrl.match(/(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
  if (!shortcodeMatch) {
    return { success: false, error: 'Format URL nggak dikenali — pastiin ini link post/reel/igtv, bukan story/profile.' };
  }
  const pathType = shortcodeMatch[1] === 'reels' ? 'reel' : shortcodeMatch[1];
  const shortcode = shortcodeMatch[2];

  // --- Lapis 1: GraphQL (paling reliable + no cookie) ---
  const graphqlResult = await scrapeViaGraphQL(igUrl, shortcode);
  if (graphqlResult.success) return graphqlResult;
  console.error(`[igdl] GraphQL gagal (${graphqlResult.error}), coba embed...`);

  // --- Lapis 2: embed (fallback cepet, no cookie) ---
  const embedResult = await scrapeViaEmbed(igUrl, pathType, shortcode);
  if (embedResult.success) return embedResult;
  console.error(`[igdl] embed juga gagal (${embedResult.error}), fallback ke mode logged-in...`);

  // --- Lapis 3: session (Puppeteer + cookie, paling lambat tapi paling reliable) ---
  const expectVideo = graphqlResult.metadata?.is_video === true || embedResult.metadata?.is_video === true;
  const sessionResult = await scrapeViaSession(igUrl, pathType, shortcode, { expectVideo });
  if (sessionResult.success) return sessionResult;

  console.error(`[igdl] session_fallback JUGA gagal: ${sessionResult.error}`, sessionResult.debug || '');

  // Jaring pengaman: kalau salah satu metode di atas minimal dapet thumbnail, kasih itu drpd kosong total
  const anyThumbnail = graphqlResult._onlyGotThumbnail || embedResult._onlyGotThumbnail;
  if (anyThumbnail?.length) {
    const metadata = graphqlResult.metadata || embedResult.metadata;
    return {
      success: true,
      title: metadata?.caption?.slice(0, 80) || 'Instagram Media',
      thumbnail: anyThumbnail[0].thumbnail,
      downloads: anyThumbnail,
      metadata,
      sourceUrl: igUrl,
      source: 'thumbnail_only',
      warning: 'Video asli nggak ketemu di semua metode — ini CUMA thumbnail, bukan video.',
    };
  }

  return {
    success: false,
    error: `graphql: ${graphqlResult.error} | embed: ${embedResult.error} | session_fallback: ${sessionResult.error}`,
  };
}

export { igdl };

import { fileURLToPath } from 'url';
import process from 'process';

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const url = process.argv[2];
  if (!url) {
    console.log('Usage: node igdl.js <instagram_post_or_reel_url>');
    process.exit(1);
  }
  igdl(url).then((res) => console.log(JSON.stringify(res, null, 2)));
}
