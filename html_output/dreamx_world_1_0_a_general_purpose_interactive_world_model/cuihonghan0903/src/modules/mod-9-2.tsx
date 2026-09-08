import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import * as K from './roadKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 260;

// §9.2 推理加速（论文 §4.2）：异步流水线动画。
// D 块 = DiT 去噪（注意力 INT8 SageAttention + FFN FP8 AngelSlim，双色块）；
// C 块 = VAE 解码（75% 剪枝 + ParaVAE 8 卡空间分片，八格瓦片）。
// 异步模式：C_k 与 D_{k+1} 时间重叠（绿色重叠带）；串行对照：气泡空转。
// 16 FPS @ 8×RTX 5090 为论文实测；串行基线无论文数值，仅作定性对照。

export const Mod92: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [asyncMode, setAsyncMode] = useState(true);
  const modeRef = useRef(true);
  modeRef.current = asyncMode;

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

    const TX0 = 100; // timeline left edge
    const PXU = 92; // pixels per chunk unit
    const DY = 46, CY = 110, BH = 34; // lane tops, block height

    const block = (x: number, y: number, w: number, kind: 'D' | 'C', label: string) => {
      const x0 = Math.max(x, TX0);
      const x1 = Math.min(x + w, W - 16);
      if (x1 <= x0) return;
      if (kind === 'D') {
        // two-tone: attention (INT8) + FFN (FP8)
        ctx.fillStyle = K.C.aux;
        ctx.fillRect(x0, y, (x1 - x0) * 0.55, BH);
        ctx.fillStyle = K.C.guide;
        ctx.fillRect(x0 + (x1 - x0) * 0.55, y, (x1 - x0) * 0.45, BH);
      } else {
        ctx.fillStyle = K.C.emph;
        ctx.fillRect(x0, y, x1 - x0, BH);
        // ParaVAE: 8 spatial shards across 8 GPUs
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 1;
        for (let i = 1; i < 8; i++) {
          const sx = x + (w / 8) * i;
          if (sx > x0 && sx < x1) {
            ctx.beginPath();
            ctx.moveTo(sx, y + 2);
            ctx.lineTo(sx, y + BH - 2);
            ctx.stroke();
          }
        }
      }
      ctx.strokeStyle = K.C.ink;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x0 + 0.5, y + 0.5, x1 - x0 - 1, BH - 1);
      if (x1 - x0 > 34) K.drawLabel(ctx, label, x0 + 6, y + BH / 2 + 4, '#fff', 11);
    };

    const frame = (now: number) => {
      const isAsync = modeRef.current;
      const t = (now - t0) / 1000;
      const off = t / 1.3; // chunk units scrolled
      K.clearScene(ctx, W, H);

      // panel
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = K.C.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(16, 16, 528, 180, 6);
      ctx.fill();
      ctx.stroke();

      // lane labels + baselines
      K.drawLabel(ctx, 'DiT 去噪', 26, DY + BH / 2 + 4, K.C.ink, 11);
      K.drawLabel(ctx, 'VAE 解码', 26, CY + BH / 2 + 4, K.C.ink, 11);
      ctx.strokeStyle = K.C.axis;
      ctx.lineWidth = 1;
      [DY + BH + 8, CY + BH + 8].forEach((y) => {
        ctx.beginPath();
        ctx.moveTo(TX0 - 6, y);
        ctx.lineTo(W - 22, y);
        ctx.stroke();
      });

      const span = 5.2;
      // 串行模式每个 chunk 占 2 个时间单位（位置为 2k），k 的范围必须按可见
      // 时间窗 [off, off+span] 折算；否则块位置以 2 倍速漂移，十几秒后时间轴被拉空。
      const k0 = isAsync ? Math.max(0, Math.floor(off) - 2) : Math.max(0, Math.floor((off - 2) / 2));
      const kEnd = isAsync ? off + span + 2 : (off + span) / 2 + 1;

      // overlap shading first (async steady state: C_{k} overlaps D_{k+1})
      if (isAsync) {
        ctx.fillStyle = 'rgba(34,141,92,0.08)';
        for (let k = k0; k < off + span; k++) {
          ctx.fillRect(TX0 + (k + 1 - off) * PXU, DY, PXU, CY + BH - DY);
        }
      }

      // blocks
      for (let k = k0; k < kEnd; k++) {
        const ds = isAsync ? k : 2 * k;
        const cs = isAsync ? k + 1 : 2 * k + 1;
        block(TX0 + (ds - off) * PXU, DY, PXU, 'D', `D${k + 1}`);
        block(TX0 + (cs - off) * PXU, CY, PXU, 'C', `C${k + 1}`);
      }

      K.drawLabel(
        ctx,
        isAsync ? '绿色带：每段解码与下一段去噪完美重叠' : '空档即气泡：解码等待去噪结束',
        TX0 + 6, 190, isAsync ? K.C.good : K.C.emph, 10
      );

      // status strip: 8 GPUs + FPS
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = isAsync ? K.C.good : K.C.axis;
        ctx.beginPath();
        ctx.roundRect(30 + i * 18, 212, 14, 14, 2);
        ctx.fill();
      }
      K.drawLabel(ctx, '8×RTX 5090', 30 + 8 * 18 + 10, 224, K.C.muted, 10);
      if (isAsync) {
        K.drawLabel(ctx, '16 FPS', 320, 228, K.C.good, 20);
        K.drawLabel(ctx, '实时无缝交互渲染（§4.2 实测）', 408, 226, K.C.muted, 10);
      } else {
        K.drawLabel(ctx, '—', 320, 228, K.C.muted, 20);
        K.drawLabel(ctx, '串行基线：论文未给数值，仅示意更慢', 408, 226, K.C.muted, 10);
      }

      // legend
      K.drawLabel(ctx, 'D 块：注意力 INT8 SageAttention + FFN FP8 AngelSlim    C 块：VAE 75% 剪枝 + ParaVAE 8 卡分片', 20, 254, K.C.muted, 10);

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

  return (
    <div>
      <div className="ctrl">
        <button className={`chip ${asyncMode ? 'active' : ''}`} onClick={() => setAsyncMode(true)}>
          异步流水线（论文方案）
        </button>
        <button className={`chip ${!asyncMode ? 'active' : ''}`} onClick={() => setAsyncMode(false)}>
          串行（对照）
        </button>
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className={`feedback ${asyncMode ? 'good' : ''}`}>
        {asyncMode
          ? '当前分块的解码与下一分块的去噪完美重叠：配合 INT8/FP8 极致量化与 75% 剪枝 VAE，8×RTX 5090 上达 16 FPS 实时渲染（绿）。'
          : '串行对照：解码必须等去噪结束，时间轴布满气泡，吞吐被拉低（示意，无论文数值）（橙）。'}
      </div>
    </div>
  );
};

export default Mod92;
