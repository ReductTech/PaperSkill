import React, { useEffect, useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { useStage, rr, glow, txt, clamp, lerp, easeOut, rng, pill } from '../lib/stage';
import { C, rgba, TYPE_COLOR, type TokType } from '../lib/palette';
import { Seg, Slider, Tag } from '../ui/kit';
import { TimeBar, type Phase } from '../ui/TimeBar';
import { useTimeline } from '../lib/timeline';

// 封面舞台（教学示意）：12 层 × 18 个 token 的小模型，循环播放，可暂停、重播、拖动。
// 预填充光波逐层上升；VTW 模式下，越过第 K 层后视觉 token 在第 K+1 层入口爆散退去；
// 解码阶段新 token 逐层计算：浅层连向视觉缓存，深层只连文字缓存（因果：只能看之前的 token）。

const N = 12;
const COLS: TokType[] = ['sys', 'sys', ...Array<TokType>(10).fill('vis'), 'ins', 'ins', 'ins', 'out', 'out', 'out'];
const PROMPT = 15;
const PHASES: Phase[] = [
  { at: 0, label: '预填充' },
  { at: 0.5, label: '解码' },
];

export const HeroTide: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<'vtw' | 'base'>('vtw');
  const [K, setK] = useState(6);
  const tl = useTimeline(10, { loop: true });
  const sparks = useMemo(() => {
    const r = rng(3);
    return Array.from({ length: 70 }, () => ({ col: 2 + Math.floor(r() * 10), vx: (r() - 0.5) * 1.6, vy: -0.4 - r(), life: 0.5 + r() * 0.5, size: 1 + r() * 2 }));
  }, []);
  const motes = useMemo(() => {
    const r = rng(9);
    return Array.from({ length: 60 }, () => ({ col: Math.floor(r() * PROMPT), off: r(), speed: 0.15 + r() * 0.25 }));
  }, []);

  const s = useStage(
    {
      heightOf: (w) => clamp(w * 0.62, 260, 400),
      live: tl.playing,
      draw: ({ ctx, w, h, t, dt, final }) => {
        if (!final) tl.tick(dt);
        const p = tl.pRef.current;
        ctx.clearRect(0, 0, w, h);
        const bg = ctx.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, 'rgba(10,20,52,0.92)');
        bg.addColorStop(1, 'rgba(6,12,34,0.92)');
        ctx.fillStyle = bg;
        rr(ctx, 0, 0, w, h, 16);
        ctx.fill();

        const padL = w < 420 ? 30 : 46;
        const padR = 12;
        const padT = 28;
        const padB = 30;
        const cw = (w - padL - padR) / COLS.length;
        const rh = (h - padT - padB) / N;
        const cx = (c: number) => padL + cw * (c + 0.5);
        const ry = (r: number) => h - padB - rh * (r + 0.5);
        const kk = mode === 'vtw' ? K : N;
        const pre = clamp(p / 0.45, 0, 1);
        const front = pre * N;
        const decodeStep = p < 0.5 ? -1 : Math.min(2, Math.floor((p - 0.5) / 0.15));
        const decodeP = p < 0.5 ? 0 : ((p - 0.5) % 0.15) / 0.15;
        const crossed = mode === 'vtw' && front >= kk;
        const q = crossed ? clamp((front - kk) / 2.2, 0, 1) : 0;

        for (let r = 0; r < N; r++) if (r % 2 === 1 || r === 0) txt(ctx, `L${r + 1}`, padL - 8, ry(r), { size: 9, color: C.ink4, align: 'right' });
        const visLeft = cx(2) - cw / 2;
        const visRight = cx(11) + cw / 2;
        // 撤出后留下的“退潮区”
        if (mode === 'vtw' && crossed) {
          const yK = ry(kk) + rh / 2;
          const g = ctx.createLinearGradient(0, yK, 0, padT);
          g.addColorStop(0, rgba(C.vis, 0.12 * q));
          g.addColorStop(1, rgba(C.vis, 0));
          ctx.fillStyle = g;
          ctx.fillRect(visLeft, padT - 6, visRight - visLeft, yK - padT + 6);
        }
        for (let c = 0; c < COLS.length; c++) {
          const type = COLS[c];
          const isOut = c >= PROMPT;
          const outIdx = c - PROMPT;
          for (let r = 0; r < N; r++) {
            const x = cx(c);
            const y = ry(r);
            let lit = 0;
            if (!isOut) lit = clamp(front - r, 0, 1);
            else if (decodeStep > outIdx) lit = 1;
            else if (decodeStep === outIdx) lit = clamp(decodeP * N * 1.1 - r, 0, 1);
            const gone = type === 'vis' && r >= kk;
            let a = 0.12 + 0.68 * lit;
            let size = Math.min(cw, rh) * 0.58;
            if (gone) {
              if (!crossed) a = 0.12;
              else {
                a = 0.04;
                size *= 0.3;
              }
            }
            if (isOut && lit === 0) a = 0.05;
            ctx.fillStyle = rgba(TYPE_COLOR[type], a);
            rr(ctx, x - size / 2, y - size / 2, size, size, 2.5);
            ctx.fill();
          }
        }
        // 光点沿已计算的通道上升（视觉通道在撤出后不再有光点）
        for (const m of motes) {
          const type = COLS[m.col];
          const top = type === 'vis' ? Math.min(front, kk) : front;
          if (top <= 0.5) continue;
          const yy = (m.off + t * m.speed) % 1;
          const layerPos = yy * top;
          const x = cx(m.col) + Math.sin(t * 2 + m.off * 9) * cw * 0.15;
          const y = ry(0) + rh / 2 - layerPos * rh;
          glow(ctx, x, y, 4, TYPE_COLOR[type], 0.7 * (1 - yy * 0.6));
        }
        // 潮线
        if (mode === 'vtw') {
          const yK = ry(kk) + rh / 2;
          const g = ctx.createLinearGradient(visLeft, 0, visRight, 0);
          g.addColorStop(0, rgba(C.vis, 0));
          g.addColorStop(0.5, rgba(C.vis, crossed ? 0.95 : 0.5));
          g.addColorStop(1, rgba(C.vis, 0));
          ctx.strokeStyle = g;
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let x = visLeft - 10; x <= visRight + 10; x += 4) {
            const yy = yK + Math.sin(x * 0.08 + t * 3) * 2;
            if (x === visLeft - 10) ctx.moveTo(x, yy);
            else ctx.lineTo(x, yy);
          }
          ctx.stroke();
          ctx.lineWidth = 1;
          // 爆散
          if (crossed && q < 1) {
            glow(ctx, (visLeft + visRight) / 2, yK, (visRight - visLeft) * 0.7, '#bff7fa', 0.5 * (1 - q));
            for (const sp of sparks) {
              if (q > sp.life) continue;
              const k = q / sp.life;
              const x = cx(sp.col) + sp.vx * 60 * easeOut(k);
              const y = yK + sp.vy * 70 * easeOut(k) + 40 * k * k;
              glow(ctx, x, y, sp.size * 3, C.vis, 1 - k);
            }
          }
        }
        // 预填充光波
        if (pre < 1) {
          const yF = ry(front - 0.5) + rh / 2;
          const g2 = ctx.createLinearGradient(0, yF - 14, 0, yF + 14);
          g2.addColorStop(0, rgba(C.moon, 0));
          g2.addColorStop(0.5, rgba(C.moon, 0.28));
          g2.addColorStop(1, rgba(C.moon, 0));
          ctx.fillStyle = g2;
          ctx.fillRect(padL, yF - 14, cw * PROMPT, 28);
        }
        // 解码：新 token 在当前层读取哪些缓存
        if (decodeStep >= 0) {
          const c = PROMPT + decodeStep;
          const r = Math.min(N - 1, Math.floor(decodeP * N * 1.1));
          const x0 = cx(c);
          const y0 = ry(r);
          glow(ctx, x0, y0, 14, C.out, 0.9);
          for (let j = 0; j < c; j++) {
            const ty = COLS[j];
            if (ty === 'vis' && r >= kk) continue;
            if (ty === 'vis' && j % 3 !== 0) continue;
            const xj = cx(j);
            const lift = 8 + (c - j) * Math.min(4, rh * 0.25);
            ctx.strokeStyle = rgba(TYPE_COLOR[ty], ty === 'vis' ? 0.6 : 0.75);
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.quadraticCurveTo((x0 + xj) / 2, y0 - lift * (r < N / 2 ? 1 : -1), xj, y0);
            ctx.stroke();
          }
        }
        // 边界标签最后画，带深色底，不会被格子或连线挡住
        if (mode === 'vtw') pill(ctx, `第 ${kk + 1} 层入口撤出`, visRight, ry(kk) + rh / 2 - 13, { size: 10, color: C.vis, align: 'right', maxX: w - 6 });
        const phase = p < 0.45 ? '预填充：整段输入逐层计算' : p < 0.5 ? '预填充结束，各层写好缓存' : `解码第 ${decodeStep + 1} 个词：新 token 读之前的缓存`;
        txt(ctx, phase, padL, h - 12, { size: 11, color: C.ink2 });
        txt(ctx, '输入 →', padL, 14, { size: 9, color: C.ink4 });
        txt(ctx, '生成 →', cx(PROMPT) - cw / 2, 14, { size: 9, color: C.ink4 });
        return tl.playing;
      },
    },
    [mode, K, tl.playing ? -1 : tl.p, tl.playing]
  );

  useEffect(() => tl.onVisible(s.animate), [s.animate, tl]);

  return (
    <div className="hero-tide">
      <div className="stage-box" ref={s.wrapRef}>
        <canvas
          ref={s.canvasRef}
          role="img"
          aria-label={`示意：12 层小模型，${mode === 'vtw' ? `先完整处理 ${K} 层，在第 ${K + 1} 层入口撤出视觉 token` : '原模型，视觉 token 走完全部层'}`}
        />
      </div>
      <TimeBar tl={tl} phases={PHASES} label="封面动画进度" />
      <div className="hero-tide-ctrl">
        <Seg
          small
          label="对比"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'vtw', label: 'VTW' },
            { value: 'base', label: '原模型' },
          ]}
        />
        <Slider label="K：先完整处理几层" value={K} min={2} max={11} onChange={setK} display={`K = ${K}`} />
      </div>
      <p className="hero-tide-cap">
        <span className="legend-dots">
          <i style={{ background: C.sys }} />系统 <i style={{ background: C.vis }} />视觉 <i style={{ background: C.ins }} />指令 <i style={{ background: C.out }} />输出
        </span>
        <span>
          {mode === 'vtw' ? `示意小模型：前 ${K} 层每层算 15 个 token，之后每层只算 5 个。` : '示意小模型：12 层每层都算 15 个 token。'}
        </span>
        <Tag kind="demo" />
      </p>
    </div>
  );
};
