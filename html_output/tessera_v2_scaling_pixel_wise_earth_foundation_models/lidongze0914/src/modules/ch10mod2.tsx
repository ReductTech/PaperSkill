import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, map } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const FX0 = 120;
const FX1 = 600;
const FY_TOP = 48;
const FY_BASE = 232;
const D_VALUES = [16, 32, 64, 128];
const STORAGE = [22, 44, 89, 178];
const SCORES = [0.546, 0.574, 0.588, 0.593];
const RETENTION = [92.1, 96.8, 99.2, 100];
const STORAGE_FRAC = ['1/8', '1/4', '1/2', '1'];

type Fb = { text: string; cls: '' | 'good' | 'bad' };

const FB_INIT: Fb = { text: '点选 d 芯片，前沿选中点、存储条与读数同步更新；访问四个维度后解锁局限。', cls: '' };
const FB_D: Record<number, Fb> = {
  16: { text: '存储 1/8、保留约 92.1% 下游任务性能：适合端侧与边缘部署。', cls: '' },
  32: { text: '存储 1/4；区域存储受限管线的折中点（约 44 TiB）。', cls: '' },
  64: { text: '存储 1/2 拿到 99.2% 的下游性能，分类与回归均衡时的推荐默认。', cls: 'good' },
  128: { text: '满存储 178 TiB 换完整性能 0.593；研究或最大性能工作流。', cls: '' },
};
const FB_CONST: Fb = {
  text: '在 ALPHAEARTH 一半存储下，v2-L 的 0.574 已超过它的 0.560；从零训练的 44M 只有 0.527。',
  cls: 'good',
};
const FB_LIMIT: Fb = {
  text: '缩放律是经验性的，只适用于像素级 Sentinel-1/2、单一自监督目标与单一 15 任务套件；昂贵教师需大量算力；欠代表气候与未见季节未评估。',
  cls: 'bad',
};

const xOf = (s: number) => map(Math.log10(s), Math.log10(20), Math.log10(200), FX0, FX1);
const yOf = (v: number) => map(v, 0.54, 0.6, FY_BASE, FY_TOP);

function clearScene(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, H - 16, W, 16);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, H - 16);
  ctx.lineTo(W, H - 16);
  ctx.stroke();
}

function label(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  color: string,
  size: number,
  align: CanvasTextAlign = 'left'
) {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

interface FrontierState {
  d: number;
  animS: number;
  animScore: number;
  limits: number;
  limitsTarget: number;
}

function render(ctx: CanvasRenderingContext2D, st: FrontierState, now: number) {
  clearScene(ctx);

  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 1;
  for (let v = 0.55; v < 0.6; v += 0.02) {
    ctx.beginPath();
    ctx.moveTo(FX0, yOf(v));
    ctx.lineTo(FX1, yOf(v));
    ctx.stroke();
  }
  ctx.strokeStyle = '#21324a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(FX0, FY_BASE);
  ctx.lineTo(FX1, FY_BASE);
  ctx.moveTo(FX0, FY_BASE);
  ctx.lineTo(FX0, FY_TOP);
  ctx.stroke();
  [20, 50, 100, 200].forEach((s) => label(ctx, String(s), xOf(s), FY_BASE + 2, '#68778f', 14, 'center'));
  [0.54, 0.56, 0.58, 0.6].forEach((v) => label(ctx, v.toFixed(2), FX0 - 8, yOf(v), '#68778f', 14, 'right'));

  ctx.strokeStyle = '#228d5c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  D_VALUES.forEach((_, i) => {
    const x = xOf(STORAGE[i]);
    const y = yOf(SCORES[i]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.fillStyle = '#228d5c';
  D_VALUES.forEach((_, i) => {
    ctx.beginPath();
    ctx.arc(xOf(STORAGE[i]), yOf(SCORES[i]), 4.5, 0, Math.PI * 2);
    ctx.fill();
  });
  const px = xOf(st.animS);
  const py = yOf(st.animScore);
  ctx.strokeStyle = '#f07e47';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(px, py, 10 + 3 * Math.sin(now / 220), 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#228d5c';
  ctx.beginPath();
  ctx.arc(px, py, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#228d5c';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = '#d7deea';
  ctx.fillRect(660, 60, 140, 24);
  ctx.fillStyle = '#f07e47';
  ctx.fillRect(660, 60, 140 * (st.animS / 178), 24);
  label(ctx, String(Math.round(st.animS)), 810, 72, '#21324a', 18);
  label(ctx, STORAGE_FRAC[D_VALUES.indexOf(st.d)], 660, 100, '#68778f', 15);

  const depH = [26, 42, 58, 88];
  const depV = ['0.3', '0.9', '2', '100'];
  const depX = [680, 760, 840, 920];
  depH.forEach((h, i) => {
    ctx.fillStyle = i === 3 ? '#c43f52' : '#27446e';
    ctx.fillRect(depX[i], 248 - h, 52, h);
    if (i === 3) {
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = '#c43f52';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(depX[i] - 6, 248 - h);
      ctx.lineTo(depX[i] + 58, 248 - h);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    label(ctx, depV[i], depX[i] + 26, 248 - h - 12, '#21324a', 16, 'center');
  });

  ctx.fillStyle = '#c43f52';
  ctx.fillRect(850, 122, 56, 16);
  ctx.fillStyle = '#228d5c';
  ctx.fillRect(930, 82, 56, 56);
  label(ctx, '0.527', 878, 114, '#21324a', 16, 'center');
  label(ctx, '0.593', 958, 74, '#21324a', 16, 'center');

  (
    [
      [250, 170],
      [400, 120],
      [540, 90],
    ] as [number, number][]
  ).forEach(([x, y], i) => {
    const a = clamp(st.limits * 3 - i, 0, 1);
    if (a <= 0.01) return;
    ctx.globalAlpha = a;
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#c43f52';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  });

  label(ctx, '复合分', 62, 26, '#21324a', 18);
  label(ctx, '存储 TiB', 500, 264, '#21324a', 18);
  let lx = 180;
  (
    [
      ['#228d5c', '蒸馏学生'],
      ['#c43f52', '从零/教师对照'],
      ['#f07e47', '当前选择'],
    ] as [string, string][]
  ).forEach(([color, text]) => {
    ctx.fillStyle = color;
    ctx.fillRect(lx, 24, 12, 12);
    label(ctx, text, lx + 18, 30, '#21324a', 16);
    lx += 20 + ctx.measureText(text).width + 22;
  });
}

export const Ch10Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<FrontierState>({ d: 64, animS: 89, animScore: 0.588, limits: 0, limitsTarget: 0 });
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const flashTimer = useRef<number | null>(null);
  const [selectedD, setSelectedD] = useState(64);
  const [visited, setVisited] = useState<number[]>([64]);
  const [limitsVisible, setLimitsVisible] = useState(false);
  const [flash, setFlash] = useState(false);
  const [feedback, setFeedback] = useState<Fb>(FB_INIT);

  const limitsUnlocked = visited.length === 4;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const tick = () => {
      const st = stateRef.current;
      st.animS = lerp(st.animS, STORAGE[D_VALUES.indexOf(st.d)], 0.15);
      st.animScore = lerp(st.animScore, SCORES[D_VALUES.indexOf(st.d)], 0.15);
      st.limits = lerp(st.limits, st.limitsTarget, 0.12);
      render(ctx, st, performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    };
  }, []);

  const pick = (d: number) => {
    if (d === selectedD) return;
    stateRef.current.d = d;
    setSelectedD(d);
    setFeedback(FB_D[d]);
    if (!visited.includes(d)) {
      const nv = [...visited, d];
      setVisited(nv);
      if (nv.length === 4) {
        setFlash(true);
        if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
        flashTimer.current = window.setTimeout(() => setFlash(false), 900);
      }
    }
  };

  const toggleLimits = () => {
    if (!limitsUnlocked) return;
    const on = !limitsVisible;
    setLimitsVisible(on);
    stateRef.current.limitsTarget = on ? 1 : 0;
    setFeedback(on ? FB_LIMIT : FB_CONST);
  };

  const chipKeys: (number | 'limits')[] = [...D_VALUES, 'limits'];
  const chipNav = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const usable = chipKeys.map((k, idx) => ({ k, idx })).filter((c) => c.k !== 'limits' || limitsUnlocked);
    const pos = usable.findIndex((c) => c.idx === i);
    const nextP = e.key === 'ArrowLeft' ? (pos + usable.length - 1) % usable.length : (pos + 1) % usable.length;
    chipRefs.current[usable[nextP].idx]?.focus();
  };

  const idx = D_VALUES.indexOf(selectedD);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {D_VALUES.map((d, i) => (
          <button
            key={d}
            ref={(el) => {
              chipRefs.current[i] = el;
            }}
            className={`chip ${selectedD === d ? 'selected' : ''}`}
            onClick={() => pick(d)}
            onKeyDown={(e) => chipNav(e, i)}
          >
            d={d}
          </button>
        ))}
        <button
          ref={(el) => {
            chipRefs.current[4] = el;
          }}
          className={`chip ${limitsVisible ? 'selected' : ''}`}
          disabled={!limitsUnlocked}
          style={flash ? { boxShadow: '0 0 0 2px #228d5c' } : undefined}
          onClick={toggleLimits}
          onKeyDown={(e) => chipNav(e, 4)}
        >
          局限
        </button>
      </div>
      <div className="ctrl">
        <label>
          复合得分 <span className="val">{SCORES[idx].toFixed(3)}</span>
        </label>
        <label>
          下游任务性能保留率 <span className="val">{RETENTION[idx]}%</span>
        </label>
        <label>
          存储 <span className="val">{STORAGE[idx]} TiB</span>
        </label>
        <label>
          相对存储 <span className="val">{STORAGE_FRAC[idx]}</span>
        </label>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch10Mod2;
