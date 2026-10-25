// mod-5-1 (P4): chips select P3..P7; a medium board is assigned or rejected per thresholds.
import React, { useRef, useState, useEffect } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { palette, clearScene, drawBoard, drawNail } from './carpentry-kit';

const W = 1080, H = 280;
const LEVELS = [
  { id: 'P3', lo: 0, hi: 64, stride: 8 },
  { id: 'P4', lo: 64, hi: 128, stride: 16 },
  { id: 'P5', lo: 128, hi: 256, stride: 32 },
  { id: 'P6', lo: 256, hi: 512, stride: 64 },
  { id: 'P7', lo: 512, hi: Infinity, stride: 128 },
] as const;
const BOARD_MAX = 90; // demo board's max(l*,t*,r*,b*)

function drawLevel(canvas: HTMLCanvasElement, selId: string): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const sel = LEVELS.find((l) => l.id === selId)!;
  clearScene(ctx, W, H);
  LEVELS.forEach((l, i) => {
    const x = 60 + i * 200;
    const y = 150;
    const active = l.id === sel.id;
    ctx.fillStyle = active ? palette.nail : palette.envDark;
    ctx.globalAlpha = active ? 1 : 0.45;
    ctx.fillRect(x - 8, y - 6, 170, 12);
    ctx.globalAlpha = 1;
    ctx.fillStyle = active ? palette.ink : palette.inkMuted;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(l.id, x + 60, y + 42);
    ctx.font = '13px sans-serif';
    ctx.fillStyle = palette.inkMuted;
    ctx.fillText(`步长 ${l.stride}`, x + 52, y + 62);
    ctx.fillText(`${l.lo}–${l.hi === Infinity ? '∞' : l.hi}`, x + 48, y + 82);
  });
  const i = LEVELS.findIndex((l) => l.id === sel.id);
  const x = 60 + i * 200;
  const fits = BOARD_MAX >= sel.lo && BOARD_MAX < sel.hi;
  const bw = 130, bh = 86;
  drawBoard(ctx, x + 12, 150 - bh - 14, bw, bh, fits ? palette.good : palette.bad);
  drawNail(ctx, x + 12 + bw * 0.45, 150 - 14 - bh * 0.5, fits ? palette.nail : palette.inkMuted, 7);
  if (!fits) {
    ctx.strokeStyle = palette.bad;
    ctx.lineWidth = 5;
    const cx = x + 12 + bw / 2, cy = 150 - 14 - bh / 2;
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy - 18);
    ctx.lineTo(cx + 18, cy + 18);
    ctx.moveTo(cx + 18, cy - 18);
    ctx.lineTo(cx - 18, cy + 18);
    ctx.stroke();
  }
  ctx.fillStyle = palette.inkMuted;
  ctx.font = '13px sans-serif';
  ctx.fillText('阈值刻度：max(l*,t*,r*,b*)', 60, 240);
  const rx0 = 300, rx1 = 1000;
  ctx.fillStyle = palette.techBorder;
  ctx.fillRect(rx0, 232, rx1 - rx0, 10);
  [0, 64, 128, 256, 512].forEach((m) => {
    const px = rx0 + (Math.log2(m + 1) / Math.log2(513)) * (rx1 - rx0);
    ctx.fillStyle = palette.inkMuted;
    ctx.fillRect(px, 226, 2, 22);
    ctx.fillText(String(m), px - 8, 262);
  });
  const px = rx0 + (Math.log2(BOARD_MAX + 1) / Math.log2(513)) * (rx1 - rx0);
  ctx.fillStyle = palette.emphasis;
  ctx.beginPath();
  ctx.moveTo(px, 218);
  ctx.lineTo(px - 7, 206);
  ctx.lineTo(px + 7, 206);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = palette.ink;
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(String(BOARD_MAX), px - 10, 200);
  if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
}

export const Mod51: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [level, setLevel] = useState<string>('P4');

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    setupCanvas(canvas, W, H);
    drawLevel(canvas, level);
    const disconnect = observeCanvas(canvas, () => drawLevel(canvas, level), () => {});
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (canvas) drawLevel(canvas, level);
  }, [level]);

  const sel = LEVELS.find((l) => l.id === level)!;
  const fits = BOARD_MAX >= sel.lo && BOARD_MAX < sel.hi;
  const tone = fits ? 'good' : 'bad';
  const text = fits
    ? `${sel.id} 接 ${sel.lo}–${sel.hi === Infinity ? '∞' : sel.hi} 的目标框：这个目标框最大边距 ${BOARD_MAX}，对号入座。`
    : `${sel.id} 接 ${sel.lo}–${sel.hi === Infinity ? '∞' : sel.hi} 的目标框：这个目标框最大边距 ${BOARD_MAX} 对不上区间，在这层直接判负。`;

  return (
    <div>
      <canvas ref={ref} aria-label="选择工作台" />
      <div className="controls" role="group" aria-label="选择层级">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            type="button"
            className={`chip${l.id === level ? ' active' : ''}`}
            onClick={() => setLevel(l.id)}
          >
            {l.id}
          </button>
        ))}
      </div>
      <div className={`feedback ${tone}`}>{text}</div>
    </div>
  );
};
