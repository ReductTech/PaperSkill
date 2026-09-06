import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, lerp } from '../lib/canvasKit';
import * as K from './roadKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 260;
const N_MIN = 4096;
const N_MAX = 18480;

export const Mod41: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tokens, setTokens] = useState(N_MIN);
  const tokRef = useRef(N_MIN);
  tokRef.current = tokens;

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
    const t0 = performance.now();

    // pipeline geometry (top strip)
    const SRC_X = 40, SRC_W = 52;         // source token block (S)
    const FUN_X0 = 104, FUN_X1 = 180;     // downsample funnel
    const ATT_X0 = 192, ATT_X1 = 292;     // projection attention box
    const UPS_X1 = 380;                   // upsample spread end
    const TRUNK_X0 = 404, TRUNK_X1 = 534; // trunk attention output
    const LANES = 8;
    const MID = 84;
    const laneY = (k: number) => 46 + (k % LANES) * 11;

    const PARTS = 12;
    const PERIOD = 2.6; // seconds per token journey

    const frame = (now: number) => {
      const n = tokRef.current;
      const f = (n - N_MIN) / (N_MAX - N_MIN); // 0=E-PRoPE, 1=full PRoPE
      const eprope = f < 0.5;
      const t = (now - t0) / 1000;
      K.clearScene(ctx, W, H);

      // ---- top: animated E-PRoPE computation pipeline ----
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = K.C.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(16, 14, 528, 148, 6);
      ctx.fill();
      ctx.stroke();

      // source block: all tokens (S = 18480)
      ctx.fillStyle = 'rgba(39,68,110,0.08)';
      ctx.fillRect(SRC_X - 8, 36, SRC_W + 16, 98);
      for (let i = 0; i < LANES; i++)
        for (let j = 0; j < 4; j++) {
          ctx.fillStyle = K.C.guide;
          ctx.fillRect(SRC_X + j * 13, laneY(i) - 2, 8, 5);
        }
      K.drawLabel(ctx, 'S = 18480', SRC_X - 4, 30, K.C.ink, 10);

      // funnel (E-PRoPE: converge to a thin band; full PRoPE: straight channel)
      ctx.strokeStyle = eprope ? K.C.emph : K.C.axis;
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (eprope) {
        ctx.moveTo(FUN_X0, 42); ctx.lineTo(FUN_X1, MID - 16);
        ctx.moveTo(FUN_X0, 126); ctx.lineTo(FUN_X1, MID + 16);
      } else {
        ctx.moveTo(FUN_X0, 42); ctx.lineTo(FUN_X1, 42);
        ctx.moveTo(FUN_X0, 126); ctx.lineTo(FUN_X1, 126);
      }
      ctx.stroke();
      K.drawLabel(ctx, eprope ? '下采样 ×4.5' : '直通', FUN_X0 + 16, 148, eprope ? K.C.emph : K.C.muted, 10);

      // particles pass 1: compute positions along the journey
      const pts: { x: number; y: number; a: number; inBox: boolean }[] = [];
      for (let k = 0; k < PARTS; k++) {
        const pt = (t / PERIOD + k / PARTS) % 1;
        const survives = !eprope || k % 4 === 0; // ~1/4 tokens survive the funnel
        const y0 = laneY(k);
        const fanY = 52 + (k % 5) * 13;
        let x = -20, y = MID, a = 1, inBox = false;
        if (pt < 0.16) {                    // leave source block
          const u = pt / 0.16;
          x = SRC_X + SRC_W + 4 + u * (FUN_X0 - SRC_X - SRC_W - 4);
          y = y0;
        } else if (pt < 0.4) {              // through the funnel
          const u = (pt - 0.16) / 0.24;
          x = FUN_X0 + u * (FUN_X1 - FUN_X0);
          y = eprope ? y0 + (MID - y0) * u : y0;
          if (!survives) a = Math.max(0, 1 - u * 1.2); // dropped tokens fade out
        } else if (pt < 0.6) {              // projection attention
          if (!survives) continue;
          const u = (pt - 0.4) / 0.2;
          x = FUN_X1 + u * (ATT_X1 - FUN_X1);
          y = eprope ? MID : y0;
          inBox = true;
        } else if (pt < 0.8) {              // upsample: fan back out
          if (!survives) continue;
          const u = (pt - 0.6) / 0.2;
          x = ATT_X1 + u * (UPS_X1 - ATT_X1);
          y = eprope ? MID + (fanY - MID) * u : y0;
        } else {                            // merge into the trunk (⊕)
          if (!survives) continue;
          const u = (pt - 0.8) / 0.2;
          const yFrom = eprope ? fanY : y0;
          x = UPS_X1 + u * (TRUNK_X0 - UPS_X1);
          y = yFrom + (MID - yFrom) * u;
          if (u > 0.75) a = (1 - u) / 0.25;
        }
        pts.push({ x, y, a, inBox });
      }

      // projection attention box; glow grows with tokens inside
      const inside = pts.filter((p) => p.inBox).length;
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = eprope ? K.C.emph : K.C.guide;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(ATT_X0, 38, ATT_X1 - ATT_X0, 92, 8);
      ctx.fill();
      ctx.stroke();
      if (inside > 0) {
        ctx.fillStyle = `rgba(217,119,6,${Math.min(0.15, inside * 0.05)})`;
        ctx.beginPath();
        ctx.roundRect(ATT_X0 + 2, 40, ATT_X1 - ATT_X0 - 4, 88, 6);
        ctx.fill();
      }
      K.drawLabel(ctx, '投影注意力', ATT_X0 + 20, 124, K.C.ink, 10);
      K.drawLabel(ctx, `N = ${n}`, ATT_X0 + 20, 30, K.C.muted, 10);
      K.drawLabel(ctx, eprope ? '上采样回 S' : '无需上采样', ATT_X1 + 18, 148, eprope ? K.C.emph : K.C.muted, 10);

      // trunk: main attention output with marching flow + breathing ⊕ merge
      ctx.strokeStyle = K.C.ink;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(TRUNK_X0, MID);
      ctx.lineTo(TRUNK_X1 - 12, MID);
      ctx.stroke();
      ctx.fillStyle = K.C.ink;
      ctx.beginPath();
      ctx.moveTo(TRUNK_X1 - 12, MID - 6);
      ctx.lineTo(TRUNK_X1 - 12, MID + 6);
      ctx.lineTo(TRUNK_X1 - 2, MID);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 9]);
      ctx.lineDashOffset = -t * 26;
      ctx.beginPath();
      ctx.moveTo(TRUNK_X0, MID);
      ctx.lineTo(TRUNK_X1 - 12, MID);
      ctx.stroke();
      ctx.setLineDash([]);
      const mg = 0.5 + 0.5 * Math.sin(t * 4);
      ctx.fillStyle = `rgba(34,141,92,${0.18 + 0.12 * mg})`;
      ctx.beginPath();
      ctx.arc(TRUNK_X0, MID, 11 + 3 * mg, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = K.C.good;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(TRUNK_X0 - 5, MID); ctx.lineTo(TRUNK_X0 + 5, MID);
      ctx.moveTo(TRUNK_X0, MID - 5); ctx.lineTo(TRUNK_X0, MID + 5);
      ctx.stroke();
      K.drawLabel(ctx, '主干注意力输出', TRUNK_X0 - 8, 30, K.C.ink, 10);

      // particles pass 2: draw (matrix-frame flash inside the attention box)
      for (const p of pts) {
        ctx.globalAlpha = p.a;
        ctx.fillStyle = K.C.guide;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
        if (p.inBox) {
          ctx.strokeStyle = K.C.emph;
          ctx.lineWidth = 1;
          ctx.strokeRect(p.x - 6, p.y - 6, 12, 12);
        }
        ctx.globalAlpha = 1;
      }

      // ---- bottom: Table 1 anchors (paper measurements) ----
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = K.C.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(16, 172, 528, 74, 6);
      ctx.fill();
      ctx.stroke();
      const latency = lerp(59, 80, f);
      const score = lerp(73.75, 73.89, f);
      K.drawLabel(ctx, '单段延迟（8×H20）', 30, 200, K.C.ink, 10);
      K.drawBar(ctx, 136, 190, 150, 11, latency / 100, latency <= 60 ? K.C.good : K.C.emph);
      K.drawLabel(ctx, `${latency.toFixed(0)} 秒`, 292, 200, K.C.muted, 10);
      K.drawLabel(ctx, '相机控制分', 30, 228, K.C.ink, 10);
      K.drawBar(ctx, 136, 218, 150, 11, score / 100, K.C.guide);
      K.drawLabel(ctx, score.toFixed(2), 292, 228, K.C.muted, 10);
      K.drawLabel(ctx, '锚点：Table 1', 392, 200, K.C.muted, 10);
      K.drawLabel(ctx, 'PRoPE 80s / 73.89', 392, 216, K.C.muted, 10);
      K.drawLabel(ctx, 'E-PRoPE 59s / 73.75', 392, 232, eprope ? K.C.good : K.C.muted, 10);
      if (eprope) K.drawLabel(ctx, '★', 520, 232, K.C.emph, 11);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const zone =
    tokens === N_MIN
      ? { cls: 'good', text: 'E-PRoPE 工作点（Table 1 实测）：控制分几乎不变（73.75），延迟降到约 59 秒（绿）。' }
      : { cls: '', text: '完整 PRoPE（Table 1 实测）：控制 73.89 分略高，但延迟约 80 秒，训练成本近乎翻倍（橙）。' };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>token 预算</label>
        <button
          className={`chip ${tokens === N_MIN ? 'active' : ''}`}
          onClick={() => setTokens(N_MIN)}
        >
          E-PRoPE（N={N_MIN}）
        </button>
        <button
          className={`chip ${tokens === N_MAX ? 'active' : ''}`}
          onClick={() => setTokens(N_MAX)}
        >
          完整 PRoPE（N={N_MAX}）
        </button>
      </div>
      <div className={`feedback ${zone.cls}`}>{zone.text}</div>
    </div>
  );
};

export default Mod41;
