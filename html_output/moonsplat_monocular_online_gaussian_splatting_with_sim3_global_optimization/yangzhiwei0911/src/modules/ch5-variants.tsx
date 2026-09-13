import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from '../modules/registry';

// 模块 5.1：切换配置芯片，看锚点密度与三条取舍条同步过渡。

const W = 1080;
const H = 280;

const BX0 = 40;
const BX1 = 660;
const BY0 = 86;
const BY1 = 210;

const PX = 680;
const PY = 40;
const PW = 380;
const PH = 200;

type Variant = 'native' | 'voxel' | 'voxel-crl';

type Conf = { count: number; memory: number; speed: number; quality: number };
type Fb = { text: string; cls: '' | 'good' | 'bad' };

const CONF: Record<Variant, Conf> = {
  native: { count: 420, memory: 0.95, speed: 0.35, quality: 0.88 },
  voxel: { count: 180, memory: 0.32, speed: 0.22, quality: 0.72 },
  'voxel-crl': { count: 180, memory: 0.32, speed: 0.92, quality: 0.92 },
};

const FB: Record<Variant, Fb> = {
  native: { text: '图元随序列快速膨胀，长序列会直接显存溢出。', cls: 'bad' },
  voxel: {
    text: '显存压下来了，但锚点特征与共享 MLP 联合优化很慢，吞吐被卡住。',
    cls: '',
  },
  'voxel-crl': {
    text: '给锚点一个基准色先验、只学残差，收敛速度与渲染质量同时回到高位。',
    cls: 'good',
  },
};

const CHIPS: { id: Variant; label: string }[] = [
  { id: 'native', label: '原始 3DGS' },
  { id: 'voxel', label: '体素化 3DGS' },
  { id: 'voxel-crl', label: '体素化 + CRL' },
];

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= w; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

function drawBand(ctx: CanvasRenderingContext2D, x0: number, x1: number, y0: number, y1: number) {
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.fillStyle = '#76906a';
  ctx.fillRect(x0, y1 - 6, x1 - x0, 6);
}

function barColor(good: number): string {
  const g = clamp(good, 0, 1);
  return g < 0.5
    ? lerpColor('#c43f52', '#f07e47', g * 2)
    : lerpColor('#f07e47', '#228d5c', (g - 0.5) * 2);
}

export const Ch5Variants: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const dispRef = useRef<Conf>({ ...CONF['voxel-crl'] });
  const targetRef = useRef<Conf>(CONF['voxel-crl']);

  const [variant, setVariant] = useState<Variant>('voxel-crl');
  const [feedback, setFeedback] = useState<Fb>(FB['voxel-crl']);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = () => {
      const d = dispRef.current;
      const tg = targetRef.current;
      d.count += (tg.count - d.count) * 0.15;
      d.memory += (tg.memory - d.memory) * 0.15;
      d.speed += (tg.speed - d.speed) * 0.15;
      d.quality += (tg.quality - d.quality) * 0.15;
      const count = Math.round(d.count);
      const memory = d.memory;
      const speed = d.speed;
      const quality = d.quality;

      clearScene(ctx, W, H);
      drawBand(ctx, BX0, BX1, BY0, BY1);

      const badness = clamp((memory - 0.3) / 0.6, 0, 1);
      const anchorColor = lerpColor('#27446e', '#c43f52', badness);
      const cols = 22;
      ctx.fillStyle = anchorColor;
      for (let i = 0; i < count; i++) {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const ax = 72 + c * 25.5 + ((i * 37) % 5) - 2;
        const ay = 106 + r * 7.4 + ((i * 53) % 3) - 1;
        ctx.beginPath();
        ctx.arc(ax, ay, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(PX, PY, PW, PH);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.strokeRect(PX + 0.5, PY + 0.5, PW - 1, PH - 1);

      const rows = [
        { label: '显存占用', good: 1 - memory },
        { label: '收敛速度', good: speed },
        { label: '渲染质量', good: quality },
      ];
      const bw = 236;
      const bx = PX + 116;
      ctx.font = '14px "Segoe UI", "Microsoft YaHei", sans-serif';
      rows.forEach((rw, i) => {
        const ry = PY + 40 + i * 52;
        ctx.fillStyle = '#68778f';
        ctx.fillText(rw.label, PX + 16, ry + 12);
        ctx.fillStyle = '#d7deea';
        ctx.fillRect(bx, ry, bw, 14);
        ctx.fillStyle = barColor(rw.good);
        ctx.fillRect(bx, ry, bw * clamp(rw.good, 0, 1), 14);
      });

      ctx.fillStyle = '#21324a';
      ctx.font = '16px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText('锚点', 56, 40);
    };

    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };

    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (v: Variant) => {
    targetRef.current = CONF[v];
    setVariant(v);
    setFeedback(FB[v]);
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', height: 'auto' }}
      />
      <div className="chips">
        {CHIPS.map((c) => (
          <button
            key={c.id}
            className={variant === c.id ? 'chip is-active' : 'chip'}
            onClick={() => pick(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch5Variants;
