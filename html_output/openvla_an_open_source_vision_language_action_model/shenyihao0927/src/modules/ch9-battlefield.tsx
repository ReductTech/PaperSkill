import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawCheckMark,
  drawSceneLabel,
  drawValueChip,
} from './flatKit';
import type { WidgetProps } from './registry';

// §9 module 9.1 — 战场柱状图: switch between the three evaluation fronts.
// Only paper-verified numbers get value chips; the Franka panel uses
// schematic bar heights (marked 示意) with the verified +20.4% delta.
const W = 1080;
const H = 280;
const BX = 200; // bar left edge
const BMAX = 690; // full-scale bar width

type BF = 'bridge' | 'google' | 'franka';

interface Row {
  name: string;
  frac: number;
  color: string;
  chip?: string;
  wide?: boolean;
  winner?: boolean;
}

interface View {
  rollouts: string; // label 1
  cat: string; // label 2
  rows: Row[];
  axis?: boolean; // 0-100 success-rate axis
  guides?: [number, number]; // franka delta guide rows
  delta?: string; // delta chip between guides
}

const FRANKA_DP = 0.5; // schematic DP bar; OpenVLA sits +20.4pp higher

const VIEWS: Record<BF, View> = {
  bridge: {
    rollouts: '170 次评测',
    cat: '总平均成功率',
    axis: true,
    rows: [
      { name: 'OpenVLA', frac: 0.706, color: C.green, chip: '70.6', winner: true },
      { name: 'RT-2-X', frac: 0.506, color: C.red, chip: '50.6' },
      { name: 'Octo', frac: 0.2, color: C.blue, chip: '20.0' },
      { name: 'RT-1-X', frac: 0.185, color: C.blue, chip: '18.5' },
    ],
  },
  google: {
    rollouts: '60 次评测',
    cat: '总平均成功率',
    axis: true,
    rows: [
      { name: 'OpenVLA', frac: 0.85, color: C.green, chip: '85.0', winner: true },
      { name: 'RT-2-X', frac: 0.783, color: C.red, chip: '78.3' },
      { name: 'RT-1-X', frac: 0.333, color: C.blue, chip: '33.3' },
      { name: 'Octo', frac: 0.267, color: C.blue, chip: '26.7' },
    ],
  },
  franka: {
    rollouts: '129 次评测',
    cat: '柱高示意',
    rows: [
      {
        name: 'OpenVLA',
        frac: FRANKA_DP + 0.204,
        color: C.green,
        chip: '全任务 ≥50%',
        wide: true,
        winner: true,
      },
      { name: 'DP', frac: FRANKA_DP, color: C.blue },
      { name: 'Octo', frac: 0.6, color: C.blue },
    ],
    guides: [0, 1],
    delta: '+20.4%',
  },
};

const FEEDBACK: Record<BF, { text: string; cls: string }> = {
  bridge: {
    cls: 'good',
    text: '170 次评测（17 任务 ×10）：总平均 70.6% vs 50.6%——除语义泛化（36.3 vs 38.8）外全类别压过 RT-2-X，语言接地 90 vs 85；RT-1-X/Octo 被干扰物搞懵。',
  },
  google: {
    cls: 'good',
    text: '60 次评测（12 任务 ×5）：总平均 85.0% vs 78.3%，误差棒重叠、论文称「相当」；两者均大幅领先 RT-1-X（33.3）与 Octo（26.7）——7B 对 55B。',
  },
  franka: {
    cls: 'good',
    text: '129 次评测：微调后总均比 Diffusion Policy 高 20.4%，且是唯一全任务 ≥50% 的方法；OpenX 预训练是关键（scratch 版差很多），窄单指令任务仍是 DP 更强。',
  },
};

export const Ch9Battlefield: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bf, setBf] = useState<BF>('bridge');
  const [fb, setFb] = useState(FEEDBACK.bridge);
  const bfRef = useRef<BF>('bridge');
  const animRef = useRef(performance.now());

  useEffect(() => {
    bfRef.current = bf;
    animRef.current = performance.now();
    setFb(FEEDBACK[bf]);
  }, [bf]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;

    const wideChip = (x: number, y: number, text: string, color: string) => {
      ctx.save();
      ctx.font = '12px "Segoe UI", sans-serif';
      const w = Math.max(44, ctx.measureText(text).width + 16);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x - w / 2, y - 11, w, 22, 5);
      ctx.fill();
      ctx.fillStyle = C.white;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y + 1);
      ctx.restore();
      return w / 2;
    };

    const render = (ms: number) => {
      const view = VIEWS[bfRef.current];
      const p = easeOutCubic(clamp((ms - animRef.current) / 500, 0, 1));
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });
      drawSceneLabel(ctx, view.rollouts, 24, 34, { color: C.muted });
      drawSceneLabel(ctx, view.cat, 24, 58);

      view.rows.forEach((r, i) => {
        const y = 96 + i * 50;
        const w = Math.max(4, r.frac * BMAX * p);
        drawSceneLabel(ctx, r.name, BX - 18, y, { align: 'right' });
        ctx.fillStyle = r.color;
        ctx.globalAlpha = 0.92;
        ctx.beginPath();
        ctx.roundRect(BX, y - 15, w, 30, 6);
        ctx.fill();
        ctx.globalAlpha = 1;
        const chipX = BX + w + 28;
        let half = 22;
        if (r.chip) {
          if (r.wide) half = wideChip(chipX, y, r.chip, r.color);
          else drawValueChip(ctx, chipX, y, r.chip, r.color);
        }
        if (r.winner) {
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(BX - 4, y - 19, w + 8, 38, 9);
          ctx.stroke();
          drawCheckMark(ctx, chipX + half + 14, y, 7);
        }
      });

      if (view.guides && view.delta) {
        const [a, b] = view.guides;
        const xa = BX + view.rows[a].frac * BMAX * p;
        const xb = BX + view.rows[b].frac * BMAX * p;
        ctx.save();
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 1.75;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(xa, 66);
        ctx.lineTo(xa, 168);
        ctx.moveTo(xb, 66);
        ctx.lineTo(xb, 168);
        ctx.stroke();
        ctx.setLineDash([]);
        // double arrow between the two bar ends
        const ym = 121;
        ctx.beginPath();
        ctx.moveTo(xa + 3, ym);
        ctx.lineTo(xb - 3, ym);
        ctx.stroke();
        ctx.fillStyle = C.orange;
        ctx.beginPath();
        ctx.moveTo(xa + 1, ym);
        ctx.lineTo(xa + 9, ym - 4);
        ctx.lineTo(xa + 9, ym + 4);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(xb - 1, ym);
        ctx.lineTo(xb - 9, ym - 4);
        ctx.lineTo(xb - 9, ym + 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        wideChip((xa + xb) / 2, ym, view.delta, C.orange);
      }

      if (view.axis) {
        const ay = 238;
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(BX, ay);
        ctx.lineTo(BX + BMAX, ay);
        ctx.stroke();
        [0, 0.5, 1].forEach((f) => {
          const x = BX + f * BMAX;
          ctx.beginPath();
          ctx.moveTo(x, ay - 5);
          ctx.lineTo(x, ay + 5);
          ctx.stroke();
          drawSceneLabel(ctx, String(f === 0 ? 0 : f === 0.5 ? 50 : 100), x, ay + 19, {
            align: 'center',
            color: C.muted,
          });
        });
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const th: React.CSSProperties = {
    textAlign: 'left',
    padding: '4px 10px',
    borderBottom: '2px solid #d7deea',
    fontSize: 12.5,
    color: '#21324a',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  };
  const td: React.CSSProperties = {
    textAlign: 'left',
    padding: '5px 10px',
    borderBottom: '1px solid #e7ecf4',
    fontSize: 12.5,
    color: '#3c4a61',
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          {(
            [
              ['bridge', 'BridgeData V2'],
              ['google', 'Google Robot'],
              ['franka', 'Franka 微调'],
            ] as [BF, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              className={`chip${bf === k ? ' selected' : ''}`}
              onClick={() => setBf(k)}
            >
              {label}
            </button>
          ))}
          <button
            className="tiny ghost"
            onClick={() => {
              animRef.current = performance.now();
            }}
          >
            重播
          </button>
        </div>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
        <thead>
          <tr>
            <th style={th}>战场</th>
            <th style={th}>评测规模</th>
            <th style={th}>实测要点（成功率，越高越好）</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...td, fontWeight: 600 }}>BridgeData V2</td>
            <td style={td}>17 任务 ×10 = 170 rollouts</td>
            <td style={td}>
              总平均 70.6 vs 50.6（RT-2-X）；语言接地 90 vs 85；唯一落后类别：语义泛化 36.3
              vs 38.8；RT-1-X/Octo 被干扰物搞懵
            </td>
          </tr>
          <tr>
            <td style={{ ...td, fontWeight: 600 }}>Google Robot</td>
            <td style={td}>12 任务 ×5 = 60 rollouts</td>
            <td style={td}>总平均 85.0 vs 78.3（误差棒重叠≈相当）；均大幅领先 RT-1-X 33.3 / Octo 26.7</td>
          </tr>
          <tr>
            <td style={{ ...td, fontWeight: 600 }}>Franka 微调</td>
            <td style={td}>129 rollouts</td>
            <td style={td}>
              总均比 Diffusion Policy 高 20.4%；唯一全任务 ≥50%；窄单指令任务 DP 更强
            </td>
          </tr>
        </tbody>
      </table>
      <div style={{ fontSize: 12, color: '#68778f', marginTop: 6 }}>
        A/B 同状态评测 · 170 / 60 / 129 rollouts · 成功率越高越好 · Franka
        柱高为示意，+20.4% 为实测差值
      </div>
    </div>
  );
};

export default Ch9Battlefield;
