import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 240;
const C = {
  bg: '#f5f8f0',
  envL: '#b8c9a7',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
};

type Proxy = 'affirm' | 'judge';

function finite(n: number, fallback: number): number {
  return Number.isFinite(n) ? n : fallback;
}

function drawDoor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  open: number,
  safeInside: boolean
) {
  const w = 92;
  const h = 130;
  ctx.fillStyle = '#2f4a6e';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = safeInside ? '#e8f6ee' : '#1b2430';
  ctx.fillRect(x + 8, y + 10, w - 16, h - 20);
  if (safeInside) {
    ctx.fillStyle = C.green;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 58, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + w / 2 - 7, y + 58);
    ctx.lineTo(x + w / 2 - 2, y + 64);
    ctx.lineTo(x + w / 2 + 8, y + 50);
    ctx.stroke();
    ctx.fillStyle = C.muted;
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillText('仍安全', x + 26, y + 92);
  }
  const doorW = (w - 8) * (1 - open);
  ctx.fillStyle = '#3d5a80';
  ctx.fillRect(x + 4, y + 6, Math.max(10, doorW), h - 12);
  ctx.fillStyle = C.orange;
  ctx.beginPath();
  ctx.arc(x + 18 + Math.max(0, doorW - 16), y + h / 2, 5, 0, Math.PI * 2);
  ctx.fill();
}

export const Ch4Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const thiefRef = useRef<HTMLImageElement | null>(null);
  const [proxy, setProxy] = useState<Proxy>('affirm');
  const [affirm, setAffirm] = useState(0.35);
  const [harm, setHarm] = useState(0.25);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({
    proxy: 'affirm' as Proxy,
    affirm: 0.35,
    harm: 0.25,
    shown: 0.35,
  });

  useEffect(() => {
    const img = new Image();
    img.src = `${import.meta.env.BASE_URL}images/thief.png`;
    thiefRef.current = img;
  }, []);

  useEffect(() => {
    const a = finite(affirm, 0.35);
    const h = finite(harm, 0.25);
    stateRef.current.proxy = proxy;
    stateRef.current.affirm = a;
    stateRef.current.harm = h;
    const target = proxy === 'affirm' ? a : h;
    if (!Number.isFinite(stateRef.current.shown)) {
      stateRef.current.shown = target;
    }
  }, [proxy, affirm, harm]);

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
      const s = stateRef.current;
      const affirmVal = finite(s.affirm, 0.35);
      const harmVal = finite(s.harm, 0.25);
      const target = s.proxy === 'affirm' ? affirmVal : harmVal;
      const from = finite(s.shown, target);
      s.shown = lerp(from, target, 0.12);
      const v = finite(s.shown, target);

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.envL;
      ctx.fillRect(0, H - 26, W, 26);

      if (s.proxy === 'affirm') {
        drawDoor(ctx, 48, 36, clamp(v, 0.08, 0.92), true);
        ctx.fillStyle = C.text;
        ctx.font = 'bold 15px "Segoe UI", sans-serif';
        ctx.fillText('肯定回答概率：门开了，但不代表有害', 170, 48);
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillStyle = C.muted;
        ctx.fillText('常见代理是“模型肯开口 / 不拒绝”的概率。', 170, 78);
        ctx.fillText('它对“回答到底有多有害”不敏感。', 170, 102);
        ctx.fillStyle = C.green;
        ctx.fillText(`P(affirmative) ≈ ${affirmVal.toFixed(2)}　柜门更开，里面仍安全`, 170, 136);
      } else {
        drawDoor(ctx, 48, 36, 0.72, false);
        const n = Math.round(clamp(harmVal, 0, 1) * 5);
        const img = thiefRef.current;
        const ready = Boolean(img && img.complete && img.naturalWidth > 0);
        for (let i = 0; i < n; i++) {
          if (ready && img) {
            ctx.drawImage(img, 168 + i * 52, 148, 46, 56);
          }
        }
        ctx.fillStyle = C.text;
        ctx.font = 'bold 15px "Segoe UI", sans-serif';
        ctx.fillText('Judge 有害分：门开了，还要看里面有多危险', 170, 48);
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillStyle = C.muted;
        ctx.fillText('直接优化评判模型给出的有害程度，更贴近真目标（H）。', 170, 78);
        ctx.fillStyle = C.red;
        ctx.fillText(`h(y) ≈ ${harmVal.toFixed(2)}　小偷 × ${n}`, 170, 110);
        ctx.fillStyle = C.muted;
        ctx.fillText('IHO：训练 Attacker 去拉高这个分数，而不是只刷“肯回答”。', 170, 136);
      }
    };
    const tick = () => {
      render();
      canvas.classList.add('is-ready');
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

  const switchProxy = (next: Proxy) => {
    const a = finite(affirm, 0.35);
    const h = finite(harm, 0.25);
    setProxy(next);
    stateRef.current.proxy = next;
    stateRef.current.shown = next === 'affirm' ? a : h;
  };

  const setAffirmSafe = (raw: number) => {
    if (!Number.isFinite(raw)) return;
    setAffirm(clamp(raw, 0, 1));
  };

  const setHarmSafe = (raw: number) => {
    if (!Number.isFinite(raw)) return;
    setHarm(clamp(raw, 0, 1));
  };

  const affirmShow = finite(affirm, 0.35);
  const harmShow = finite(harm, 0.25);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={() => switchProxy('affirm')}>
          肯定回答概率
        </button>
        <button type="button" onClick={() => switchProxy('judge')}>
          Judge 有害分
        </button>
        {proxy === 'affirm' ? (
          <>
            <label>
              肯定概率 <span className="val">{affirmShow.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min={5}
              max={95}
              value={Math.round(affirmShow * 100)}
              onChange={(e) => setAffirmSafe(Number(e.target.value) / 100)}
            />
          </>
        ) : (
          <>
            <label>
              有害分 <span className="val">{harmShow.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(harmShow * 100)}
              onChange={(e) => setHarmSafe(Number(e.target.value) / 100)}
            />
          </>
        )}
      </div>
      <div className={`feedback ${proxy === 'judge' ? 'good' : 'bad'}`}>
        {proxy === 'judge'
          ? '有害分越高，柜边的“小偷”越多：优化的是真正危害，而不只是过拒答。'
          : '概率再高也只是门开得更大，里面仍安全——“肯回答”对严重度不敏感。'}
      </div>
    </div>
  );
};

export default Ch4Mod1;
