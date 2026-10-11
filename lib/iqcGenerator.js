/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass.
 * Hargai sebagaimana u mau dihargai.
 * iqcGenerator.js — Render "iPhone Quote Chat" (meme long-press context)
 */
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { measureTextWithEmojis, drawTextWithEmojis } from './emojiRenderer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(__dirname, 'assets');
mkdirSync(ASSETS_DIR, { recursive: true });

const FONT_REGULAR_URL = 'https://github.com/rsms/inter/raw/refs/heads/master/docs/font-files/Inter-Regular.woff2';
const FONT_BOLD_URL = 'https://github.com/rsms/inter/raw/refs/heads/master/docs/font-files/Inter-Bold.woff2';
const FONT_REGULAR_PATH = path.join(ASSETS_DIR, 'Inter-Regular.woff2');
const FONT_BOLD_PATH = path.join(ASSETS_DIR, 'Inter-Bold.woff2');

async function downloadFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gagal download font: HTTP ${res.status}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

let fontsRegistered = false;
async function ensureFonts() {
  if (fontsRegistered) return;
  if (!existsSync(FONT_REGULAR_PATH)) await downloadFile(FONT_REGULAR_URL, FONT_REGULAR_PATH);
  if (!existsSync(FONT_BOLD_PATH)) await downloadFile(FONT_BOLD_URL, FONT_BOLD_PATH);
  GlobalFonts.registerFromPath(FONT_REGULAR_PATH, 'UIFont');
  GlobalFonts.registerFromPath(FONT_BOLD_PATH, 'UIFont-Bold');
  fontsRegistered = true;
}

const W = 900;
const H = 1806;

function roundRect(ctx, x, y, w, h, r) {
  const rr = typeof r === 'number' ? { tl: r, tr: r, br: r, bl: r } : r;
  ctx.beginPath();
  ctx.moveTo(x + rr.tl, y);
  ctx.lineTo(x + w - rr.tr, y);
  ctx.arcTo(x + w, y, x + w, y + rr.tr, rr.tr);
  ctx.lineTo(x + w, y + h - rr.br);
  ctx.arcTo(x + w, y + h, x + w - rr.br, y + h, rr.br);
  ctx.lineTo(x + rr.bl, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr.bl, rr.bl);
  ctx.lineTo(x, y + rr.tl);
  ctx.arcTo(x, y, x + rr.tl, y, rr.tl);
  ctx.closePath();
}

function iconArrow(ctx, cx, cy, s, color, direction) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = s * 0.1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const halfLen = s * 0.32;
  const tipX = cx - direction * halfLen;
  const tailX = cx + direction * halfLen;

  ctx.beginPath();
  ctx.moveTo(tailX, cy - s * 0.16);
  ctx.quadraticCurveTo(cx, cy + s * 0.1, tipX, cy);
  ctx.stroke();

  const headLen = s * 0.2;
  ctx.beginPath();
  ctx.moveTo(tipX, cy);
  ctx.lineTo(tipX + direction * headLen, cy - headLen);
  ctx.moveTo(tipX, cy);
  ctx.lineTo(tipX + direction * headLen * 0.65, cy + headLen * 0.95);
  ctx.stroke();

  ctx.restore();
}

function iconReply(ctx, cx, cy, s, color) {
  iconArrow(ctx, cx, cy, s, color, -1);
}

function iconForward(ctx, cx, cy, s, color) {
  iconArrow(ctx, cx, cy, s, color, 1);
}

function iconCopy(ctx, cx, cy, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = s * 0.08;
  ctx.lineJoin = 'round';
  roundRect(ctx, cx - s * 0.32, cy - s * 0.4, s * 0.5, s * 0.62, s * 0.1);
  ctx.stroke();
  roundRect(ctx, cx - s * 0.1, cy - s * 0.18, s * 0.5, s * 0.62, s * 0.1);
  ctx.stroke();
  ctx.restore();
}

function iconStar(ctx, cx, cy, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = s * 0.08;
  ctx.lineJoin = 'round';
  const spikes = 5;
  const outerR = s * 0.42;
  const innerR = s * 0.18;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / spikes) * i - Math.PI / 2;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function iconPin(ctx, cx, cy, s, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.15, s * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.08, cy);
  ctx.lineTo(cx + s * 0.08, cy);
  ctx.lineTo(cx, cy + s * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function iconReport(ctx, cx, cy, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = s * 0.09;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.42);
  ctx.lineTo(cx + s * 0.42, cy + s * 0.32);
  ctx.lineTo(cx - s * 0.42, cy + s * 0.32);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.1);
  ctx.lineTo(cx, cy + s * 0.08);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy + s * 0.2, s * 0.035, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function iconTrash(ctx, cx, cy, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = s * 0.075;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  roundRect(ctx, cx - s * 0.28, cy - s * 0.22, s * 0.56, s * 0.62, s * 0.06);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.38, cy - s * 0.3);
  ctx.lineTo(cx + s * 0.38, cy - s * 0.3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.12, cy - s * 0.3);
  ctx.lineTo(cx - s * 0.08, cy - s * 0.42);
  ctx.lineTo(cx + s * 0.08, cy - s * 0.42);
  ctx.lineTo(cx + s * 0.12, cy - s * 0.3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.1, cy - s * 0.08);
  ctx.lineTo(cx - s * 0.1, cy + s * 0.24);
  ctx.moveTo(cx + s * 0.1, cy - s * 0.08);
  ctx.lineTo(cx + s * 0.1, cy + s * 0.24);
  ctx.stroke();
  ctx.restore();
}

const MENU_ITEMS = [
  { label: 'Reply', icon: iconReply },
  { label: 'Forward', icon: iconForward },
  { label: 'Copy', icon: iconCopy },
  { label: 'Star', icon: iconStar },
  { label: 'Pin', icon: iconPin },
  { label: 'Report', icon: iconReport },
  { label: 'Delete', icon: iconTrash, danger: true }
];

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🤔'];

function drawStatusBar(ctx, time) {
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 34px UIFont-Bold';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(time, 46, 62);

  const barBaseX = W - 210;
  const barY = 74;
  for (let i = 0; i < 4; i++) {
    const bw = 8;
    const bh = 10 + i * 6;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, barBaseX + i * (bw + 4), barY - bh, bw, bh, 2);
    ctx.fill();
  }

  const wifiX = W - 156;
  const wifiY = 62;
  ctx.strokeStyle = '#ffffff';
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(wifiX, wifiY + 6, 8 + i * 8, Math.PI * 1.2, Math.PI * 1.8);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(wifiX, wifiY + 6, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  const battX = W - 118;
  const battY = 46;
  const battW = 54;
  const battH = 26;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  roundRect(ctx, battX, battY, battW, battH, 6);
  ctx.stroke();
  roundRect(ctx, battX + battW + 2, battY + 7, 4, battH - 14, 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  roundRect(ctx, battX + 3, battY + 3, battW - 6, battH - 6, 4);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.moveTo(battX + battW * 0.42, battY + 3);
  ctx.lineTo(battX + battW * 0.22, battY + battH * 0.6);
  ctx.lineTo(battX + battW * 0.42, battY + battH * 0.6);
  ctx.lineTo(battX + battW * 0.3, battY + battH - 2);
  ctx.lineTo(battX + battW * 0.62, battY + battH * 0.42);
  ctx.lineTo(battX + battW * 0.42, battY + battH * 0.42);
  ctx.closePath();
  ctx.fill();
}

function drawBlurredBackground(ctx) {
  const bg = createCanvas(W, H);
  const bgCtx = bg.getContext('2d');

  bgCtx.fillStyle = '#0b0b0d';
  bgCtx.fillRect(0, 0, W, H);

  const sentColors = ['#123024', '#0f2620', '#16352a'];
  const receivedColors = ['#232323', '#1c1c1e', '#262626'];

  let y = 110;
  let seed = 0;
  while (y < H - 60) {
    const isRight = seed % 2 === 0;
    const bw = 230 + (seed % 4) * 55;
    const bh = 64 + (seed % 3) * 16;
    const marginSide = 50;
    const x = isRight ? W - bw - marginSide - (seed % 2) * 20 : marginSide + (seed % 3) * 12;

    bgCtx.fillStyle = isRight
      ? sentColors[seed % sentColors.length]
      : receivedColors[seed % receivedColors.length];
    roundRect(bgCtx, x, y, bw, bh, 26);
    bgCtx.fill();

    y += bh + 28 + (seed % 3) * 12;
    seed++;
  }

  ctx.save();
  ctx.filter = 'blur(18px)';
  ctx.drawImage(bg, 0, 0);
  ctx.restore();

  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.fillRect(0, 0, W, H);
}

async function drawReactionBar(ctx, centerY) {
  const pillW = 780;
  const pillH = 96;
  const x = (W - pillW) / 2;
  const y = centerY - pillH / 2;

  ctx.fillStyle = 'rgba(30,30,32,0.92)';
  roundRect(ctx, x, y, pillW, pillH, pillH / 2);
  ctx.fill();

  const items = REACTIONS.length + 1;
  const slot = pillW / items;

  for (let i = 0; i < REACTIONS.length; i++) {
    const cx = x + slot * i + slot / 2 - 24;
    const cy = y + pillH / 2 - 24;
    await drawTextWithEmojis(ctx, REACTIONS[i], cx, cy, 48);
  }

  const plusCx = x + slot * REACTIONS.length + slot / 2;
  const plusCy = y + pillH / 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(plusCx, plusCy, 30, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(plusCx - 12, plusCy);
  ctx.lineTo(plusCx + 12, plusCy);
  ctx.moveTo(plusCx, plusCy - 12);
  ctx.lineTo(plusCx, plusCy + 12);
  ctx.stroke();
}

function wrapPlainText(ctx, text, maxWidth, fontSize) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const word of words) {
    const test = cur ? cur + ' ' + word : word;
    if (measureTextWithEmojis(ctx, test, fontSize) > maxWidth && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

async function drawMessageBubble(ctx, top, text, chatTime) {
  const padX = 44;
  const padY = 34;
  const maxWidth = 560;
  const fontSize = 40;

  ctx.font = `400 ${fontSize}px UIFont`;
  const lines = wrapPlainText(ctx, text, maxWidth, fontSize);
  const lineGap = 10;
  const textBlockH = lines.length * (fontSize + lineGap) - lineGap;

  const timeH = 34;
  const bubbleW = Math.min(
    maxWidth + padX * 2,
    Math.max(...lines.map((l) => measureTextWithEmojis(ctx, l, fontSize))) + padX * 2 + 20
  );
  const bubbleH = padY * 2 + textBlockH + timeH;
  const bubbleX = (W - bubbleW) / 2;

  ctx.fillStyle = 'rgba(38,38,40,0.97)';
  roundRect(ctx, bubbleX, top, bubbleW, bubbleH, 30);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'top';
  let ly = top + padY;
  for (const line of lines) {
    await drawTextWithEmojis(ctx, line, bubbleX + padX, ly, fontSize);
    ly += fontSize + lineGap;
  }

  ctx.font = '400 26px UIFont';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  const timeW = ctx.measureText(chatTime).width;
  ctx.fillText(chatTime, bubbleX + bubbleW - padX - timeW, top + bubbleH - padY - 6);

  return top + bubbleH;
}

function drawMenu(ctx, top, bottom) {
  const margin = 46;
  const x = margin;
  const menuW = W - margin * 2;
  const rowH = (bottom - top) / MENU_ITEMS.length;

  ctx.fillStyle = 'rgba(40,40,42,0.96)';
  roundRect(ctx, x, top, menuW, bottom - top, 28);
  ctx.fill();

  MENU_ITEMS.forEach((item, i) => {
    const rowY = top + i * rowH;
    const textColor = item.danger ? '#ff3b30' : '#ffffff';

    ctx.font = '400 38px UIFont';
    ctx.fillStyle = textColor;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(item.label, x + 44, rowY + rowH / 2);

    item.icon(ctx, x + menuW - 60, rowY + rowH / 2, 48, textColor);

    if (i < MENU_ITEMS.length - 1) {
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 30, rowY + rowH);
      ctx.lineTo(x + menuW - 30, rowY + rowH);
      ctx.stroke();
    }
  });
}

export async function generateIqc({ text, chatTime, statusBarTime } = {}) {
  if (!text || !text.trim()) throw new Error('Teks kosong');

  await ensureFonts();

  const now = new Date();
  const fallbackTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const finalChatTime = chatTime || fallbackTime;
  const finalStatusTime = statusBarTime || fallbackTime;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  drawBlurredBackground(ctx);
  drawStatusBar(ctx, finalStatusTime);

  const reactionCenterY = H * 0.508;
  await drawReactionBar(ctx, reactionCenterY);

  const bubbleTop = reactionCenterY + 96;
  const bubbleBottom = await drawMessageBubble(ctx, bubbleTop, text, finalChatTime);

  const menuTop = bubbleBottom + 50;
  const menuBottom = H - 40;
  drawMenu(ctx, menuTop, menuBottom);

  return canvas.encode('png');
}
