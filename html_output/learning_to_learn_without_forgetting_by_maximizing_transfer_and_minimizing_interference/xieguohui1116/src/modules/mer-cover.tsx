import React, { useEffect, useRef } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { useCoverPlayback } from '../components/CoverPlayback';

const W = 620;
const H = 320;
const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const ORANGE = '#f07e47';
const INK = '#21324a';
const MUTED = '#68778f';
const LINE = '#d7deea';
const BG = '#f5f8f0';
const TRACK = '#b8c9a7';

function drawRunner(ctx: CanvasRenderingContext2D, x: number, y: number, lean: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // head
  ctx.beginPath();
  ctx.arc(0, -46, 11, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  // torso (lean forward)
  ctx.beginPath();
  ctx.moveTo(0, -35);
  ctx.lineTo(lean * 10, -2);
  ctx.stroke();
  // arms
  ctx.beginPath();
  ctx.moveTo(0, -30);
  ctx.lineTo(-14 - lean * 6, -14);
  ctx.moveTo(0, -30);
  ctx.lineTo(16 - lean * 6, -16);
  ctx.stroke();
  // legs
  ctx.beginPath();
  ctx.moveTo(lean * 10, -2);
  ctx.lineTo(-16, 26);
  ctx.moveTo(lean * 10, -2);
  ctx.lineTo(18, 26);
  ctx.stroke();
  ctx.restore();
}

function drawBar(ctx: CanvasRenderingContext2D, label: string, x: number, y: number, w: number, val: number, color: string) {
  ctx.fillStyle = MUTED;
  ctx.font = '20px "Segoe UI", "PingFang SC", sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(label, x, y - 6);
  ctx.fillStyle = LINE;
  ctx.fillRect(x, y, w, 16);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, val / 100)), 16);
  ctx.fillStyle = INK;
  ctx.font = 'bold 20px "Segoe UI", sans-serif';
  ctx.fillText(`${Math.round(val)}`, x + w + 12, y + 14);
}

export function MerCover({ moduleId }: { chapterId: string; moduleId: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { progress } = useCoverPlayback();
  const isOld = moduleId === 'oldMethod';

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = setupCanvas(c, W, H);
    const t = progress;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    // track
    ctx.fillStyle = TRACK;
    ctx.fillRect(0, H - 60, W, 60);
    ctx.strokeStyle = '#76906a';
    ctx.lineWidth = 2;
    for (let i = 0; i < W; i += 44) {
      ctx.beginPath();
      ctx.moveTo(i, H - 60);
      ctx.lineTo(i - 22, H);
      ctx.stroke();
    }
    // runner moves left->right
    const rx = 70 + t * (W - 140);
    const pose = isOld ? (t < 0.5 ? 0.4 : 1.1) : 0.55;
    drawRunner(ctx, rx, H - 68, pose, isOld ? RED : GREEN);
    // notebook for MER
    if (!isOld) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 2;
      ctx.fillRect(60, 26, 52, 40);
      ctx.strokeRect(60, 26, 52, 40);
      ctx.beginPath();
      ctx.moveTo(60, 40);
      ctx.lineTo(112, 40);
      ctx.stroke();
      ctx.fillStyle = BLUE;
      ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText('旧样本', 68, 58);
    }
    // skill bars
    const sprint = isOld ? 88 - 48 * t : 88 - 5 * t;
    const endure = 40 + 48 * t;
    drawBar(ctx, '短跑', 150, 40, 240, sprint, isOld ? RED : GREEN);
    drawBar(ctx, '耐力', 150, 90, 240, endure, GREEN);
    // verdict
    ctx.fillStyle = isOld ? RED : GREEN;
    ctx.font = 'bold 26px "Segoe UI", "PingFang SC", sans-serif';
    ctx.fillText(isOld ? '旧技能退化' : '新旧技能一起保持', 150, 150);
    ctx.fillStyle = MUTED;
    ctx.font = '20px "Segoe UI", "PingFang SC", sans-serif';
    ctx.fillText(isOld ? '只练新任务 → 忘了旧任务' : '穿插旧样本并做梯度对齐', 150, 184);
  }, [progress, isOld]);

  return <canvas ref={ref} style={{ width: '100%', height: 'auto' }} aria-label={isOld ? '只学新任务导致遗忘' : 'MER 保持新旧任务'} />;
}
