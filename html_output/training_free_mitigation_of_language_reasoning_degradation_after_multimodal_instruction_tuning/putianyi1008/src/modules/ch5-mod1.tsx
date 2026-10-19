import React, { useEffect, useRef, useState } from 'react';
import { C, stage, dial, meter, label, num } from './studiokit';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

const PW = 540;
const PH = 260;

// Paper Figure 1(b) / Table 3 reading: language recovers while vision collapses.
const LANG = (a: number) => 0.62 + Math.min(0.12, a * 1.2);
const VIS = (a: number) => {
  if (a <= 0.1) return 0.58 + a * 3.1;
  return Math.max(0.03, 0.9 - Math.pow((a - 0.1) * 1.8, 1.35));
};

export const Ch5Mod1: React.FC = () => {
  const leftRef = useRef<HTMLCanvasElement>(null);
  const rightRef = useRef<HTMLCanvasElement>(null);
  const [alpha, setAlpha] = useState(0.1);
  const [running, setRunning] = useState(false);
  const [fb, setFb] = useState<{ t: string; c: string }>({
    t: '混合量还小的时候，语言在回升而视觉几乎没受影响——这正是论文推荐的区间方向。',
    c: 'good',
  });
  const stateRef = useRef({ alpha, progress: 1, running: false });
  stateRef.current.alpha = alpha;

  useEffect(() => {
    const a = stateRef.current;
    if (!running) {
      a.progress = 1;
      return;
    }
    a.progress = 0;
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / 1600);
      a.progress = p;
      if (p < 1) raf = requestAnimationFrame(step);
      else setRunning(false);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  useEffect(() => {
    const lc = leftRef.current;
    const rc = rightRef.current;
    if (!lc || !rc) return;
    let lctx: CanvasRenderingContext2D;
    let rctx: CanvasRenderingContext2D;
    try {
      lctx = setupCanvas(lc, PW, PH);
      rctx = setupCanvas(rc, PW, PH);
    } catch {
      return;
    }
    let raf: number | null = null;

    const drawPanel = (
      ctx: CanvasRenderingContext2D,
      value: number,
      color: string,
      name: string,
      base: number
    ) => {
      stage(ctx, PW, PH);
      const p = stateRef.current.progress;
      const shown = base + (value - base) * p;

      // time bar starting from one shared baseline
      ctx.fillStyle = C.axis;
      ctx.fillRect(60, 200, 420, 10);
      ctx.fillStyle = color;
      ctx.fillRect(60, 200, 420 * p, 10);
      ctx.beginPath();
      ctx.arc(60, 205, 6, 0, Math.PI * 2);
      ctx.fillStyle = C.orange;
      ctx.fill();

      dial(ctx, 270, 110, 72, -1.1 + shown * 2.1, color);
      meter(ctx, 60, 232, 340, 16, shown, color);
      label(ctx, 60, 30, name);
      num(ctx, 470, 240, shown, color);
    };

    const tick = () => {
      const { alpha: av, progress } = stateRef.current;
      void progress;
      drawPanel(lctx, LANG(av), C.blue, '语言', LANG(0));
      drawPanel(rctx, VIS(av), C.green, '视觉', VIS(0));
      if (!lc.classList.contains('is-ready')) lc.classList.add('is-ready');
      if (!rc.classList.contains('is-ready')) rc.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const disconnect = observeCanvas(lc, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onAlpha = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setAlpha(v);
    setFb(
      v <= 0.15
        ? {
            t: '小混合量：语言回升明显，视觉基本没被破坏——这是论文推荐的方向。',
            c: 'good',
          }
        : v < 0.5
        ? { t: '已经开始交换：语言继续靠近基座，视觉在加速下滑。', c: '' }
        : { t: '视觉能力崩了：这已经不是可用的多模态模型了。', c: 'bad' }
    );
  };

  const run = () => {
    if (running) return;
    setFb({ t: '两块面板用同一时间基准在跑，注意看哪一条先到终点。', c: '' });
    setRunning(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <canvas ref={leftRef} width={PW} height={PH} />
        <canvas ref={rightRef} width={PW} height={PH} />
      </div>
      <div className="ctrl">
        <label>
          合并权重 α <span className="val">{alpha.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={0.95} step={0.05} value={alpha} onChange={onAlpha} />
      </div>
      <div className="ctrl">
        <button className="chip" onClick={run} disabled={running}>
          {running ? '对比中…' : '开始对比'}
        </button>
      </div>
      <div className="ctrl" style={{ display: 'block', color: 'var(--slate)' }}>
        两面板的读数按论文 Table 2 / Table 3 的端点值标定（α = 0 / 0.05 / 0.1 / 0.5 / 0.9 / 0.95），
        中间的 α 位置为插值示意；语言与视觉指标量纲不同，只比较趋势，不相加。
      </div>
      <div className={`feedback ${fb.c}`}>{fb.t}</div>
    </div>
  );
};

export default Ch5Mod1;
