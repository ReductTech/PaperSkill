import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawDog,
  drawTrail,
  drawLegend,
  drawSceneLabel,
  drawValueChip,
  type Pt,
} from './dogKit';
import type { WidgetProps } from './registry';

// §7 module 7.1 训练台 — LoRA-rank chips + VAE toggle drive the rehearsal loop
// (trail jitter ∝ rank, clearly illustrative) and the verified AJ bars
// 0.5025 / 0.5399 / 0.5609 / 0.5639 on a 0.60 axis. Validity rule from the
// paper: VAE tuning only exists at rank 1024 (stage 2); at 64/256 the chip is
// disabled and the feedback carries the inline note (no silent no-op).
const W = 1080;
const H = 280;
const SPLIT = 486; // left 45% rehearsal loop | right 55% evidence bars
const BARS = [
  { label: '64', v: 0.5025 },
  { label: '256', v: 0.5399 },
  { label: '1024', v: 0.5609 },
  { label: '1024+VAE', v: 0.5639 },
];
const RANKS = [64, 256, 1024];

interface LoraState {
  rank: number;
  vaeOn: boolean;
}

const barIndex = (s: LoraState) => (s.vaeOn ? 3 : s.rank === 64 ? 0 : s.rank === 256 ? 1 : 2);
const jitter = (s: LoraState) => (s.rank === 64 ? 9 : s.rank === 256 ? 4.5 : s.vaeOn ? 1.0 : 1.6);

export const Ch7Lora: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<LoraState>({ rank: 64, vaeOn: false });
  const [rank, setRank] = useState(64);
  const [vaeOn, setVaeOn] = useState(false);
  const [fb, setFb] = useState({ text: 'Rank 越大，低秩更新的表达力越强——切切看。', cls: '' });

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
    const CX = 243;
    const CY = 142;
    const RX = 150;
    const RY = 54;

    const render = (s: LoraState, ms: number) => {
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(SPLIT, 14);
      ctx.lineTo(SPLIT, H - 14);
      ctx.stroke();

      // ---- left 45%: rehearsal loop around two cones ----
      const jit = jitter(s);
      const a = (ms / 2800) * Math.PI * 2 - Math.PI / 2;
      const lapPoint = (ang: number): Pt => ({
        x: CX + (RX + Math.sin(ang * 3) * jit) * Math.cos(ang),
        y: CY + (RY + Math.sin(ang * 3) * jit * 0.5) * Math.sin(ang),
      });
      ctx.save();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.ellipse(CX, CY, RX, RY, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      [CX - 56, CX + 56].forEach((x) => {
        ctx.fillStyle = C.orange;
        ctx.strokeStyle = C.support;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(x, CY - 11);
        ctx.lineTo(x - 8, CY + 9);
        ctx.lineTo(x + 8, CY + 9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
      const pts: Pt[] = [];
      for (let i = 0; i <= 30; i++) pts.push(lapPoint(a - (1 - i / 30) * Math.PI * 1.35));
      drawTrail(ctx, pts, C.green, false);
      const p = lapPoint(a);
      drawDog(ctx, p.x, p.y + 8, 0.95, { mood: 'walk', t: ms / 460, flip: -Math.sin(a) < 0 });
      drawSceneLabel(ctx, '陪练（示意）', 16, 26);

      // ---- right 55%: verified AJ bars (axis to 0.60) ----
      const sel = barIndex(s);
      const baseY = H - 52;
      ctx.strokeStyle = C.muted;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(SPLIT + 30, baseY);
      ctx.lineTo(W - 30, baseY);
      ctx.stroke();
      ctx.globalAlpha = 1;
      BARS.forEach((b, i) => {
        const bx = SPLIT + 74 + i * 132;
        const bh = (b.v / 0.6) * (H - 108);
        const by = baseY - bh;
        ctx.fillStyle = i === sel ? C.green : C.blue;
        ctx.globalAlpha = i === sel ? 1 : 0.75;
        ctx.beginPath();
        ctx.roundRect(bx, by, 72, bh, 4);
        ctx.fill();
        ctx.globalAlpha = 1;
        drawValueChip(ctx, bx + 36, by - 16, b.v.toFixed(4), i === sel ? C.green : C.blue);
        drawSceneLabel(ctx, b.label, bx + 36, baseY + 18, { color: C.muted, align: 'center' });
      });
      drawLegend(ctx, [['当前设定', C.green], ['其他设定', C.blue]], SPLIT + 34, H - 16);
    };

    const tick = (ms: number) => {
      render(stateRef.current, ms);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pickRank = (r: number) => {
    const s = stateRef.current;
    const leftStage2 = s.vaeOn && r !== 1024;
    s.rank = r;
    if (r !== 1024) s.vaeOn = false;
    setRank(r);
    setVaeOn(s.vaeOn);
    if (r === 64) {
      setFb({
        text: leftStage2
          ? 'AJ 0.5025：回到第一阶段（VAE 冻结）——论文只在秩 1024 后进入第二阶段解冻 VAE。'
          : 'AJ 0.5025：低秩表达力有限。VAE 微调需秩 1024——论文只在秩 1024 后进入第二阶段解冻 VAE。',
        cls: '',
      });
    } else if (r === 256) {
      setFb({
        text: leftStage2
          ? 'AJ 0.5399：回到第一阶段（VAE 冻结）——论文只在秩 1024 后进入第二阶段解冻 VAE。'
          : 'AJ 0.5025→0.5399：秩越大越好。VAE 微调需秩 1024——论文只在秩 1024 后进入第二阶段解冻 VAE。',
        cls: '',
      });
    } else {
      setFb({ text: 'AJ 0.5025→0.5609：秩越大越好。', cls: 'good' });
    }
  };

  const toggleVae = () => {
    const s = stateRef.current;
    if (s.rank !== 1024) return; // guarded; the chip is disabled at 64/256
    s.vaeOn = !s.vaeOn;
    setVaeOn(s.vaeOn);
    setFb(
      s.vaeOn
        ? { text: '解冻 VAE 端到端再训 2 天：AJ 0.5609→0.5639，两个阶段都有收益。', cls: 'good' }
        : { text: 'AJ 0.5609：回到第一阶段设定（VAE 冻结）。', cls: '' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>LoRA 秩</label>
        {RANKS.map((r) => (
          <button key={r} className={`chip ${rank === r ? 'selected' : ''}`} onClick={() => pickRank(r)}>
            秩 {r}
          </button>
        ))}
        <label>VAE 微调</label>
        <button
          className={`chip ${vaeOn ? 'selected' : ''}`}
          disabled={rank !== 1024}
          style={rank !== 1024 ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
          onClick={toggleVae}
        >
          {vaeOn ? '开' : '关'}
        </button>
        <span className="val" style={{ minWidth: 150 }}>
          L = MSE + 0.1·BCE
        </span>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch7Lora;
