/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * MEDIAFIRE.js — Scraper Mediafire Downloader
 */

export async function JHMediaFire(url) {
  const axios = (await import('axios')).default;
  const cheerio = await import('cheerio');
  const baseRes = { status: true, author_skrep: 'JH a.k.a Dhika', kesayangan: 'Fiony Alveria♡', data: {} };

  try {
    if (!/^https?:\/\/(www\.)?mediafire\.com\/(file|download)\//i.test(url)) {
      throw new Error('Link MediaFire tidak valid');
    }

    const jantung = {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'max-age=0',
      'Referer': 'https://www.mediafire.com/',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    };

    const { data: html, request } = await axios.get(url, {
      headers: jantung,
      maxRedirects: 5,
      responseType: 'text',
      validateStatus: s => s >= 200 && s < 500
    });

    if (/File has been deleted|This file is currently unavailable|Permission Denied/i.test(html)) {
      throw new Error('File tidak tersedia, sudah dihapus, private, atau dibatasi');
    }

    const $ = cheerio.load(html);
    const downloadUrl = $('#downloadButton').attr('href');
    
    if (!downloadUrl || !/^https?:\/\//.test(downloadUrl)) {
      throw new Error('Direct download_url tidak ketemu dari halaman MediaFire');
    }

    let fileName = $('div.dl-btn-label').attr('title') || $('.dl-info .filename').first().text() || $('meta[property="og:title"]').attr('content') || 'Unknown';
    fileName = fileName.replace(/\s+/g, ' ').trim();

    let fileSize = 'Unknown';
    const btnMatch = $('#downloadButton').text().match(/\((.*?)\)/);
    if (btnMatch && btnMatch[1]) {
      fileSize = btnMatch[1].trim();
    } else {
      fileSize = $('ul.details li').filter((i, el) => $(el).text().includes('File size:')).find('span').text().trim();
    }
    
    baseRes.data = {
      source: url,
      final_url: request?.res?.responseUrl || url,
      file_name: fileName,
      file_size: fileSize,
      download_url: downloadUrl
    };

    return baseRes;

  } catch (e) {
    const errInfo = e.response?.data ? JSON.stringify(e.response.data) : e.message;
    return { ...baseRes, status: false, data: null, error: errInfo };
  }
}
