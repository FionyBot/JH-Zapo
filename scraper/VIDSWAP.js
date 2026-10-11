/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * VIDSWAP.js — Scraper FaceSwap Video
 */

async function JHVidSwap(target, face) {
  const axios = (await import('axios')).default;
  const crypto = (await import('crypto')).default;
  const FormData = (await import('form-data')).default;

  const baseRes = { status: true, author_skrep: 'JH a.k.a Dhika', kesayangan: 'Fiony Alveria♡', data: { result_url: '' } };

  if (!target || !face) {
    return { ...baseRes, status: false, error: 'Mohon sertakan parameter target dan face (Bisa Buffer atau URL)' };
  }

  try {
    const getBuffer = async (input) => {
      if (Buffer.isBuffer(input)) return input;
      if (typeof input === 'string' && input.startsWith('http')) {
        const res = await axios.get(input, { responseType: 'arraybuffer' });
        return Buffer.from(res.data);
      }
      throw new Error('Input tidak valid (harus URL atau Buffer)');
    };

    const [targetBuf, faceBuf] = await Promise.all([
      getBuffer(target),
      getBuffer(face)
    ]);

    const jantung = {
      "accept": "application/json, text/plain, */*",
      "accept-language": "id-ID,id;q=0.9",
      "sec-ch-ua": "\"Chromium\";v=\"147\", \"Not.A/Brand\";v=\"8\"",
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": "\"Android\"",
      "x-workbench-kind": "face-video",
      "x-workbench-trace-id": crypto.randomUUID(),
      "origin": "https://easyfaceswap.com",
      "referer": "https://easyfaceswap.com/video-face-swap/",
      "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36"
    };

    const updateJantung = (res) => {
      if (res.headers['set-cookie']) {
        const newCookies = res.headers['set-cookie'].map(c => c.split(';')[0]);
        jantung.cookie = [...new Set([...(jantung.cookie ? jantung.cookie.split('; ') : []), ...newCookies])].join('; ');
      }
    };

    const postApi = async (path, payload, isForm = false) => {
      const headers = { ...jantung };
      if (isForm) Object.assign(headers, payload.getHeaders());
      else headers['content-type'] = 'application/json';
      
      const res = await axios.post(`https://easyfaceswap.com/api/face-video/${path}`, payload, { headers });
      updateJantung(res);
      return res.data;
    };

    const s1 = await axios.get("https://easyfaceswap.com/api/device/session", { headers: jantung });
    updateJantung(s1);
    
    const anonId = s1.data.anonymousDeviceId;
    if (!anonId) throw new Error("Gagal mendapatkan session server.");

    const s2 = await postApi("authorize", { anonymousDeviceId: anonId, requestId: crypto.randomUUID() });
    if (!s2.success || !s2.data?.ticket) throw new Error("Otorisasi ditolak oleh server.");
    
    jantung["x-anonymous-device-id"] = anonId;
    jantung["x-anonymous-ticket"] = s2.data.ticket;

    const s3 = await postApi("upload-sign", {
      functionTag: "videofaceswap",
      files: [
        { filename: "target.mp4", contentType: "video/mp4", size: targetBuf.length },
        { filename: "face.jpg", contentType: "image/jpeg", size: faceBuf.length }
      ]
    });
    if (!s3.uploads || s3.uploads.length < 2) throw new Error("Gagal request sign S3 AWS.");

    const [upTarget, upFace] = s3.uploads;
    await Promise.all([
      axios.put(upTarget.uploadUrl, targetBuf, { headers: { "content-type": "video/mp4" } }),
      axios.put(upFace.uploadUrl, faceBuf, { headers: { "content-type": "image/jpeg" } })
    ]);

    const uIdRes = await postApi("uuid", { functionTag: "videofaceswap" });
    const uId = String(uIdRes.data || uIdRes);

    const s7 = await postApi("sign", {
      modelfile: upTarget.cdnUrl, imagefile: [upFace.cdnUrl], imagefile2: [], priority: "2",
      uId, aiFunAction: "videofaceswap", platFormId: "", check: "0", pointId: anonId, consumeType: "Customizeswapvideo", requestType: "1"
    });
    if (!s7.decrypt || !s7.sign) throw new Error("Gagal generate sign task dari backend.");

    const form = new FormData();
    form.append("decrypt", s7.decrypt);
    form.append("pkgName", "com.enjoy.facejoy.web");
    form.append("sign", s7.sign);
    form.append("content", JSON.stringify({ enhancerEnable: true }));
    form.append("uId", uId);
    form.append("version", "3");
    form.append("anonymousDeviceId", anonId);
    form.append("uuId", anonId);
    form.append("pointId", anonId);

    const s8 = await postApi("submit", form, true);
    if (!s8.obtainKey) throw new Error("Gagal submit rendering ke AI.");

    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 2500));
      const resData = await postApi("result", { obtainKey: s8.obtainKey });
      
      if (resData.code === 0 && resData.state === "done") {
        baseRes.data.result_url = resData.url;
        return baseRes;
      }
      
      if (resData.code !== 409 && resData.state !== "pending") {
        throw new Error("Proses error di server AI: " + JSON.stringify(resData));
      }
    }

    throw new Error("Timeout rendering video di server AI.");
  } catch (error) {
    const errMsg = error.response?.data?.message || error.response?.data?.error || error.message;
    return { ...baseRes, status: false, error: errMsg };
  }
}

export { JHVidSwap };
