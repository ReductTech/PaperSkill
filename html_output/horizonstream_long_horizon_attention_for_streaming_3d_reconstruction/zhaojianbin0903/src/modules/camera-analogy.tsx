import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawCamera(ctx: CanvasRenderingContext2D, x: number, y: number, color = '#1455d9') {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  roundedRect(ctx, -12, -7, 24, 14, 3);
  ctx.fill();
  ctx.fillRect(-7, -11, 9, 4);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(2, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#17202b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-6, 8);
  ctx.lineTo(-10, 14);
  ctx.moveTo(6, 8);
  ctx.lineTo(10, 14);
  ctx.stroke();
  ctx.restore();
}

function drawWorkbench(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#f7f8fa';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(94,105,120,0.12)';
  ctx.lineWidth = 1;
  for (let x = 4; x < W; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H - 15);
    ctx.stroke();
  }
  for (let y = 4; y < H - 15; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.strokeStyle = '#9ca9ba';
  ctx.beginPath();
  ctx.moveTo(8, H - 15);
  ctx.lineTo(W - 8, H - 15);
  ctx.stroke();
  for (let x = 12; x < W - 8; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, H - 15);
    ctx.lineTo(x, H - (x % 32 === 12 ? 9 : 12));
    ctx.stroke();
  }
  ctx.fillStyle = '#758195';
  ctx.font = '9px "Segoe UI", sans-serif';
  ctx.fillText('机制示意', 9, H - 3);
}

function drawScene(ctx: CanvasRenderingContext2D, chapterId: string, phase: number) {
  drawWorkbench(ctx);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (chapterId === 'chap-1') {
    const p = Math.min(1, phase * 1.35);
    ctx.strokeStyle = '#9ca9ba';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(22, 79);
    ctx.bezierCurveTo(72, 36, 152, 87, 222, 42);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#c43d37';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(22, 79);
    ctx.bezierCurveTo(72, 37, 150, 89 + 15 * p, 222, 43 + 24 * p);
    ctx.stroke();
    drawCamera(ctx, 22 + 198 * p, 79 - 30 * p + 24 * p * p, p > 0.7 ? '#c43d37' : '#1455d9');
    ctx.fillStyle = '#17202b';
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillText(p > 0.7 ? '长时偏差显现' : '短段看似平稳', 135, 18);
    return;
  }

  if (chapterId === 'chap-2') {
    const active = Math.min(3, Math.floor(phase * 4));
    ['t−2', 't−1', 't', 't+1'].forEach((label, index) => {
      const x = 15 + index * 48;
      ctx.fillStyle = index < 2 ? '#d5dbe3' : index === 2 ? '#1455d9' : '#f1f3f5';
      ctx.strokeStyle = index === 3 ? '#9ca9ba' : ctx.fillStyle;
      roundedRect(ctx, x, 20, 36, 28, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = index === 2 ? '#ffffff' : '#5e6978';
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillText(label, x + 9, 38);
      if (index === 3) {
        ctx.strokeStyle = '#9ca9ba';
        for (let s = 0; s < 32; s += 7) {
          ctx.beginPath();
          ctx.moveTo(x + s, 48);
          ctx.lineTo(x + s + 12, 20);
          ctx.stroke();
        }
      }
    });
    drawCamera(ctx, 115, 71, '#1455d9');
    ctx.strokeStyle = '#1455d9';
    ctx.beginPath();
    ctx.moveTo(128, 70);
    ctx.lineTo(169, 70);
    ctx.stroke();
    ctx.fillStyle = active >= 2 ? '#16875b' : '#d5dbe3';
    roundedRect(ctx, 171, 57, 55, 29, 4);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.fillText(active >= 2 ? '位姿+深度' : '固定状态', 177, 75);
    return;
  }

  if (chapterId === 'chap-3') {
    const cards = [
      { x: 18, title: '局部纹理', ttl: '短', color: '#1455d9' },
      { x: 88, title: '跨帧结构', ttl: '中', color: '#16875b' },
      { x: 158, title: '尺度基准', ttl: '长', color: '#7357c8' },
    ];
    cards.forEach((card, index) => {
      const lift = index === Math.floor(phase * 3) % 3 ? -3 : 0;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = card.color;
      ctx.lineWidth = 2;
      roundedRect(ctx, card.x, 27 + lift, 58, 55, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#17202b';
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillText(card.title, card.x + 8, 46 + lift);
      ctx.fillStyle = card.color;
      ctx.font = '700 18px "Segoe UI", sans-serif';
      ctx.fillText(card.ttl, card.x + 21, 71 + lift);
    });
    return;
  }

  if (chapterId === 'chap-4') {
    drawCamera(ctx, 30, 59);
    const reliability = 0.76;
    ctx.fillStyle = '#1455d9';
    ctx.globalAlpha = reliability;
    ctx.fillRect(54, 30, 12, 54);
    for (let n = 0; n < 8; n += 1) {
      ctx.globalAlpha = reliability * Math.pow(0.72, n);
      ctx.fillStyle = n < 3 ? '#1455d9' : '#16875b';
      ctx.fillRect(75 + n * 18, 37, 11, 40);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#17202b';
    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.fillText('可信度定起点', 50, 20);
    ctx.fillText('保留率定淡出速度', 126, 94);
    return;
  }

  if (chapterId === 'chap-5') {
    const dials = [
      { x: 47, v: 0.25, label: '短', color: '#1455d9' },
      { x: 121, v: 0.55, label: '中', color: '#16875b' },
      { x: 195, v: 0.86, label: '长', color: '#7357c8' },
    ];
    dials.forEach((dial, index) => {
      ctx.strokeStyle = '#d5dbe3';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(dial.x, 55, 21, Math.PI * 0.78, Math.PI * 2.22);
      ctx.stroke();
      ctx.strokeStyle = dial.color;
      ctx.beginPath();
      ctx.arc(dial.x, 55, 21, Math.PI * 0.78, Math.PI * (0.78 + 1.44 * dial.v));
      ctx.stroke();
      ctx.fillStyle = dial.color;
      ctx.font = '700 12px "Segoe UI", sans-serif';
      ctx.fillText(dial.label, dial.x - 6, 59);
      const blink = index === Math.floor(phase * 3) % 3 ? 1 : 0.55;
      ctx.globalAlpha = blink;
      ctx.fillRect(dial.x - 21, 90, 42 * dial.v, 5);
      ctx.globalAlpha = 1;
    });
    return;
  }

  if (chapterId === 'chap-6') {
    drawCamera(ctx, 35, 63);
    const marks = [
      { x: 88, y: 37, sharp: false },
      { x: 134, y: 66, sharp: true },
      { x: 190, y: 43, sharp: false },
    ];
    marks.forEach((mark, index) => {
      ctx.globalAlpha = mark.sharp ? 1 : 0.35;
      ctx.strokeStyle = mark.sharp ? '#16875b' : '#c43d37';
      ctx.lineWidth = mark.sharp ? 3 : 2;
      const r = mark.sharp && phase > 0.45 ? 13 : 9;
      ctx.strokeRect(mark.x - r, mark.y - r, r * 2, r * 2);
      ctx.beginPath();
      ctx.moveTo(48, 63);
      ctx.lineTo(mark.x, mark.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#5e6978';
      ctx.font = '9px "Segoe UI", sans-serif';
      ctx.fillText(`H${index + 1}`, mark.x - 7, 96);
    });
    ctx.fillStyle = '#16875b';
    ctx.font = '700 10px "Segoe UI", sans-serif';
    ctx.fillText('可靠头通过', 105, 18);
    return;
  }

  if (chapterId === 'chap-7') {
    drawCamera(ctx, 28, 59, '#7357c8');
    ctx.fillStyle = '#f1edff';
    ctx.strokeStyle = '#7357c8';
    roundedRect(ctx, 56, 21, 55, 69, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#7357c8';
    ctx.font = '700 11px "Segoe UI", sans-serif';
    ctx.fillText('MRT 标定卡', 61, 40);
    ctx.font = '18px "Cambria Math", serif';
    ctx.fillText('ŝ', 78, 69);
    [['位移', 128, 39], ['深度', 128, 72]].forEach(([label, x, y]) => {
      ctx.fillStyle = '#17202b';
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillText(String(label), Number(x), Number(y));
      ctx.fillStyle = '#7357c8';
      ctx.fillRect(Number(x) + 31, Number(y) - 7, 56 + 18 * Math.sin(phase * Math.PI), 6);
    });
    return;
  }

  if (chapterId === 'chap-8') {
    drawCamera(ctx, 24, 58);
    const checkpoints = [
      { x: 68, n: 'L', c: '#1455d9' },
      { x: 112, n: 'S', c: '#16875b' },
      { x: 156, n: 'M', c: '#7357c8' },
      { x: 201, n: '3D', c: '#16875b' },
    ];
    ctx.strokeStyle = '#9ca9ba';
    ctx.beginPath();
    ctx.moveTo(37, 58);
    ctx.lineTo(210, 58);
    ctx.stroke();
    checkpoints.forEach((point, index) => {
      const active = index <= Math.floor(phase * checkpoints.length);
      ctx.fillStyle = active ? point.c : '#d5dbe3';
      ctx.beginPath();
      ctx.arc(point.x, 58, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = active ? '#ffffff' : '#5e6978';
      ctx.font = '700 9px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(point.n, point.x, 61);
      ctx.fillStyle = '#5e6978';
      ctx.font = '9px "Segoe UI", sans-serif';
      ctx.fillText(['局部', '状态', '尺度', '输出'][index], point.x, 91);
    });
    ctx.textAlign = 'left';
    return;
  }

  if (chapterId === 'chap-9') {
    drawCamera(ctx, 22 + phase * 190, 35 + 24 * Math.sin(phase * Math.PI), '#16875b');
    const points = [
      { x: 58, label: '80', value: '0.42' },
      { x: 126, label: '200', value: '0.71' },
      { x: 205, label: '1000', value: '1.20' },
    ];
    ctx.strokeStyle = '#9ca9ba';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(18, 75);
    ctx.lineTo(224, 75);
    ctx.stroke();
    ctx.setLineDash([]);
    points.forEach((point) => {
      ctx.fillStyle = '#16875b';
      ctx.beginPath();
      ctx.arc(point.x, 75, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#17202b';
      ctx.font = '9px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${point.label}帧`, point.x, 91);
      ctx.fillStyle = '#16875b';
      ctx.font = '700 11px "Segoe UI", sans-serif';
      ctx.fillText(point.value, point.x, 105);
    });
    ctx.textAlign = 'left';
    ctx.fillStyle = '#5e6978';
    ctx.font = '9px "Segoe UI", sans-serif';
    ctx.fillText('Table 6 · vKITTI2 · ATE↓', 10, 18);
    return;
  }

  if (chapterId === 'chap-10') {
    ctx.fillStyle = '#e7ebef';
    ctx.strokeStyle = '#9ca9ba';
    [22, 132].forEach((x) => {
      roundedRect(ctx, x, 20, 91, 65, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#5e6978';
      ctx.fillRect(x + 12, 35, 15, 34);
      ctx.fillRect(x + 38, 35, 15, 34);
      ctx.fillRect(x + 64, 35, 15, 34);
      ctx.fillStyle = '#e7ebef';
    });
    drawCamera(ctx, phase < 0.5 ? 65 : 176, 96, '#c66a16');
    ctx.fillStyle = '#c66a16';
    ctx.font = '700 18px "Segoe UI", sans-serif';
    ctx.fillText('?', 116, 61);
    ctx.fillStyle = '#17202b';
    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.fillText('相似巷道 · 重访歧义', 74, 17);
    return;
  }

  drawCamera(ctx, 122, 61, '#9ca9ba');
  ctx.fillStyle = '#5e6978';
  ctx.font = '10px "Segoe UI", sans-serif';
  ctx.fillText('未识别的章节场景', 84, 96);
}

export const CameraAnalogy: React.FC<WidgetProps> = ({ chapterId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const render = (time: number) => {
      const phase = reduced ? 0.72 : (time % 4200) / 4200;
      ctx.clearRect(0, 0, W, H);
      drawScene(ctx, chapterId, phase);
      canvas.classList.add('is-ready');
    };
    const tick = (time: number) => {
      render(time);
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (reduced) {
        render(0);
      } else if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [chapterId]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      role="img"
      aria-label={`跨城长镜头相机标定机制示意，当前为 ${chapterId}`}
    />
  );
};

export default CameraAnalogy;
