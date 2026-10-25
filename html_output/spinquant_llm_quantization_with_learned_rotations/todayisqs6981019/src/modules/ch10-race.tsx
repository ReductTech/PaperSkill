import React, { useRef, useState } from 'react';
import { useCanvas } from './useCanvas';
import { C, clearScene, rrect, text } from './kit';

const W = 720;
const H = 300;
const GX = 42;
const GW = 336;
const VMAX = 70;
const STAG = 120;
const GROW = 600;

const xOf = (v: number) => GX + (v / VMAX) * GW;

type Row = { name: string; v: number; color: string; ppl?: string; readme?: boolean; fp?: boolean };

const D444: Row[] = [
  { name: 'RTN', v: 37.1, color: '#b98d95', ppl: '2×10³' },
  { name: 'GPTQ', v: 36.8, color: C.red, ppl: '9×10³' },
  { name: 'QuaRot+RTN', v: 62.5, color: C.purple, ppl: '6.4', readme: true },
  { name: 'SpinQuant_Had', v: 64.0, color: C.green, ppl: '5.9' },
  { name: '全精度 FP', v: 66.9, color: C.ink, ppl: '5.5', fp: true },
];
const D16: Row[] = [
  { name: 'GPTQ', v: 64.5, color: C.red },
  { name: 'QuaRot', v: 65.8, color: C.purple },
  { name: 'SpinQuant', v: 65.9, color: C.green },
  { name: '全精度 FP', v: 66.9, color: C.ink, fp: true },
];

const ease = (k: number) => 1 - Math.pow(1 - k, 3);

// ch10-race：P8 结果竞赛——真实分数错峰生长，W4A16 对照打平
export const Ch10Race: React.FC = () => {
  const [metric, setMetric] = useState<'444' | 'w4a16'>('444');
  const [phase, setPhase] = useState<'idle' | 'run' | 'done'>('idle');
  const t0 = useRef(0);
  const timer = useRef<number | null>(null);

  const rows = metric === '444' ? D444 : D16;

  const start = () => {
    if (phase === 'run') return;
    t0.current = performance.now();
    setPhase('run');
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPhase('done'), STAG * (rows.length - 1) + GROW);
  };
  const pick = (m: '444' | 'w4a16') => {
    if (m !== metric) {
      setMetric(m);
      setPhase('idle');
    }
  };

  const ref = useCanvas(W, H, (ctx) => {
    clearScene(ctx, W, H);
    const now = performance.now();
    const rowH = 34;
    const top = 52;

    text(ctx, 'LLaMA-2 7B', GX, 30, C.muted, 12);
    text(ctx, metric === '444' ? 'W4A4KV4 · 0-shot 均值' : 'W4A16KV16 对照 · 0-shot 均值（README 口径）', GX, 252, C.muted, 12);

    // FP 标线（先画，置底）
    const fpRow = rows.find((r) => r.fp);
    if (fpRow) {
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(xOf(fpRow.v), top - 10);
      ctx.lineTo(xOf(fpRow.v), top + rows.length * rowH + 6);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, `FP ${fpRow.v.toFixed(1)}`, xOf(fpRow.v) + 4, top - 16, C.ink, 11.5);
    }

    rows.forEach((r, i) => {
      const y = top + i * rowH;
      const p = phase === 'idle' ? 0 : phase === 'done' ? 1 : ease(Math.min(1, Math.max(0, (now - t0.current - i * STAG) / GROW)));
      const bw = Math.max(2, ((r.v / VMAX) * GW) * p);
      if (r.fp) {
        // FP 行只画标线标记
        ctx.fillStyle = C.ink;
        ctx.beginPath();
        ctx.moveTo(xOf(r.v) - 5, y + rowH / 2);
        ctx.lineTo(xOf(r.v) + 5, y + rowH / 2 - 5);
        ctx.lineTo(xOf(r.v) + 5, y + rowH / 2 + 5);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = r.color;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.roundRect(GX, y + 7, bw, rowH - 16, 4);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      text(ctx, r.name, GX - 6, y + rowH / 2 - 2, C.ink, 12, 'right');
      if (p > 0.95) {
        text(ctx, r.v.toFixed(1), GX + Math.max(bw, 8) + 6, y + rowH / 2 - 2, r.color, 12.5);
        if (r.readme && metric === '444') text(ctx, 'README口径', GX + Math.max(bw, 8) + 52, y + rowH / 2 - 2, C.orange, 10.5);
      }
      if (r.name.startsWith('SpinQuant') && phase === 'done') {
        const ta = Math.min(1, (now - t0.current - (STAG * (rows.length - 1) + GROW)) / 400);
        ctx.globalAlpha = ta;
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏆', GX + Math.max(bw, 8) + 16, y + rowH / 2 - 8 + (1 - ease(ta)) * 26);
        ctx.globalAlpha = 1;
      }
    });

    // 坐标轴
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(GX, top - 10);
    ctx.lineTo(GX, top + rows.length * rowH + 6);
    ctx.stroke();

    // 右侧数值表
    const tx = 424;
    rrect(ctx, tx, 28, 276, 224, C.white, C.axis, 1.5, 9);
    text(ctx, '方法', tx + 14, 50, C.muted, 12);
    text(ctx, '0-shot', tx + 150, 50, C.muted, 12, 'right');
    if (metric === '444') text(ctx, 'PPL', tx + 236, 50, C.muted, 12, 'right');
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tx + 12, 62);
    ctx.lineTo(tx + 264, 62);
    ctx.stroke();
    rows.forEach((r, i) => {
      const y = 82 + i * 30;
      const done = phase === 'done';
      const hi = done && r.name.startsWith('SpinQuant');
      if (hi) {
        ctx.fillStyle = '#e8f5ec';
        ctx.beginPath();
        ctx.roundRect(tx + 8, y - 12, 258, 24, 6);
        ctx.fill();
      }
      text(ctx, r.name, tx + 14, y, done ? C.ink : C.muted, 12.5);
      text(ctx, done ? r.v.toFixed(1) : '—', tx + 150, y, done ? r.color : C.muted, 12.5, 'right');
      if (metric === '444') text(ctx, done ? r.ppl || '' : '—', tx + 236, y, done ? C.ink : C.muted, 11.5, 'right');
    });
    if (metric === 'w4a16') text(ctx, '全部为官方 README 复现口径', tx + 138, 236, C.orange, 11, 'center');
  });

  const fb =
    phase === 'run'
    ? { text: metric === '444' ? 'W4A4KV4 成绩生长中……' : 'W4A16 对照生长中……', cls: '' }
    : phase === 'done' && metric === '444'
    ? { text: 'SpinQuant 64.0 分，距 FP 仅 2.9；GPTQ 只有 36.8', cls: 'good' }
    : phase === 'done' && metric === 'w4a16'
    ? { text: 'W4A16KV16 下 65.9 vs 65.8——学习旋转几乎不赚', cls: 'warn' }
    : { text: '五条赛道已就位，成绩单空着', cls: '' };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button className="chip" disabled={phase === 'run'} onClick={start}>
          {phase === 'run' ? '比赛中…' : phase === 'done' ? '重播' : '开始比赛'}
        </button>
        <button className={`chip${metric === '444' ? ' on' : ''}`} style={metric === '444' ? { background: C.blue, borderColor: C.blue } : undefined} onClick={() => pick('444')}>
          W4A4KV4
        </button>
        <button className={`chip${metric === 'w4a16' ? ' on' : ''}`} style={metric === 'w4a16' ? { background: C.blue, borderColor: C.blue } : undefined} onClick={() => pick('w4a16')}>
          W4A16 对照
        </button>
      </div>
      <div className={`feedback ${fb.cls}`} style={fb.cls === 'warn' ? { color: C.orange, borderColor: C.orange } : undefined}>
        {fb.text}
      </div>
      <p className="sq-note">
        <b>读图方式：</b>条长 ∝ 0-shot 均值（0–70 轴），黑色虚线 = 全精度标线。
        RTN/GPTQ/SpinQuant/FP 来自论文 Table 1（LLaMA-2 7B）；QuaRot 62.5 与 W4A16 对照组来自官方 README（HF 复现口径），
        表内 PPL 同口径标注；「2.9 分差距」来自论文 §4.2。
      </p>
    </div>
  );
};

export default Ch10Race;
