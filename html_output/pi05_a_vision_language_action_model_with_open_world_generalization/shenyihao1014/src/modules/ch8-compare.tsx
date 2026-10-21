import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawNotebook,
  drawVerdict,
  drawSceneLabel,
  drawLegend,
} from './movingKit';
import type { WidgetProps } from './registry';

// Ch.8 module 8.1 — π0.5 vs π0-FAST+Flow vs π0 (same data, same compute) with
// two chip views: overall score (three lanes, Fig 12) and training efficiency
// (FAST token vs pure diffusion compute, per Pertsch et al.). Qualitative bars.
const W = 1080;
const H = 300;

const CHIPS = ['总成绩', '训练效率'];
const TAGS = ['MM', 'ME', 'CE', 'HL', 'WD'];
const NCOLORS = [C.blue, C.blue, C.blue, C.orange, C.purple];

// View 0: three vertical bars (qualitative heights).
const CX = [300, 540, 780];
const BW = 112;
const BASE = 254;
const MAXH = 172;
const VALS = [0.92, 0.58, 0.38];
const BCOLORS = [C.green, C.blue, C.red];
const NAMES = ['π0.5', 'π0-FAST+Flow', 'π0'];
const SUBS = ['五路功课 + 两段式', '同两段式 · 无 HL/WD', '纯扩散'];

const FDBK = [
  {
    text: '差距不在动作能力（π0 本就强），而在 <b>HL+WD 共训数据 + 两段式</b>——这印证了知识迁移才是泛化的钥匙（Fig 12）。',
    cls: 'good',
  },
  {
    text: '<b>FAST token 训练的算力效率高于纯扩散</b>（per Pertsch et al.）——离散 token 先把『做什么』便宜地学会，流匹配再精修动作：算力花在刀刃上。',
    cls: 'good',
  },
];

function drawVBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  value: number,
  color: string
) {
  const h = Math.max(4, value * MAXH);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, BASE - h, BW, h, 4);
  ctx.fill();
}

export const Ch8Compare: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ view: 0 });
  const [view, setView] = useState(0);

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

    const render = (ms: number) => {
      const v = clamp(stateRef.current.view, 0, CHIPS.length - 1) | 0;
      const t = (ms % 2400) / 2400;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });

      if (v === 0) {
        // ---- overall score: three lanes ----
        drawSceneLabel(ctx, '同数据 · 同算力', 36, 34, { color: C.muted });
        ctx.strokeStyle = C.muted;
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(CX[0] - 80, BASE);
        ctx.lineTo(CX[2] + 80, BASE);
        ctx.stroke();
        ctx.globalAlpha = 1;
        CX.forEach((cx, i) => {
          drawVBar(ctx, cx - BW / 2, VALS[i], BCOLORS[i]);
          ctx.fillStyle = C.text;
          ctx.font =
            'bold 14px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(NAMES[i], cx, 274);
          ctx.fillStyle = C.muted;
          ctx.font = '11px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
          ctx.fillText(SUBS[i], cx, 290);
        });
        // the five study notebooks ride above the π0.5 bar
        TAGS.forEach((tag, k) => {
          drawNotebook(ctx, CX[0] - 52 + k * 26, 48, 0.5, tag, { color: NCOLORS[k] });
        });
        drawVerdict(ctx, CX[0], 22, true, { r: 12, pulse: t * 3 });
        // π0 trained-longer note: it still loses even at 300k steps
        const piTop = BASE - Math.max(4, VALS[2] * MAXH);
        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(CX[2] - 62, piTop - 30, 124, 21, 6);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(CX[2] - 5, piTop - 9);
        ctx.lineTo(CX[2] + 5, piTop - 9);
        ctx.lineTo(CX[2], piTop - 2);
        ctx.closePath();
        ctx.fillStyle = C.red;
        ctx.fill();
        ctx.fillStyle = C.red;
        ctx.font = '11px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('含 300k 步加练', CX[2], piTop - 20);
        ctx.restore();
        drawLegend(
          ctx,
          [
            ['读过功课', C.green],
            ['没读功课', C.red],
          ],
          36,
          286
        );
      } else {
        // ---- training efficiency: two qualitative compute bars ----
        drawSceneLabel(ctx, '达成相近水平所需算力（示意）', 36, 34, { color: C.muted });
        const rows: { name: string; frac: number; color: string }[] = [
          { name: 'FAST 离散 token 训练', frac: 0.36, color: C.green },
          { name: '纯扩散训练', frac: 0.95, color: C.red },
        ];
        rows.forEach((row, i) => {
          const y = 112 + i * 64;
          ctx.fillStyle = C.text;
          ctx.font = '13px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(row.name, 36, y + 13);
          const w = row.frac * 640;
          ctx.fillStyle = row.color;
          ctx.beginPath();
          ctx.roundRect(300, y, Math.max(10, w), 26, 5);
          ctx.fill();
          // tick ruler under the bars
          ctx.strokeStyle = C.border;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(300, y + 40);
          ctx.lineTo(300 + 640, y + 40);
          ctx.stroke();
        });
        drawLegend(
          ctx,
          [
            ['算力少', C.green],
            ['算力多', C.red],
          ],
          300,
          252
        );
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

  const pick = (i: number) => {
    stateRef.current.view = i;
    setView(i);
  };

  return (
    <div>
      <div className="chip-row" role="tablist" aria-label="对比视角">
        {CHIPS.map((label, i) => (
          <button
            key={label}
            type="button"
            className={`chip${i === view ? ' selected' : ''}`}
            onClick={() => pick(i)}
          >
            {label}
          </button>
        ))}
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <p style={{ margin: '2px 0 6px', textAlign: 'center', fontSize: 12, color: C.muted }}>
        示意 · 结论以论文图 12 为准
      </p>
      {view === 1 && (
        <div
          style={{
            margin: '6px 0',
            padding: '10px 14px',
            background: '#e9f4ee',
            borderLeft: '4px solid ' + C.green,
            borderRadius: '0 8px 8px 0',
            fontSize: 13,
            color: C.text,
          }}
        >
          <b>FAST token 训练的算力效率高于纯扩散</b>（per Pertsch et al.）：π0-FAST+Flow
          与 π0.5 同为两段式，差距来自 HL+WD 共训数据；π0 纯扩散加练到 300k 步仍落后——同样的水平，离散
          token 训练花的算力更少。
        </div>
      )}
      <div
        className={`feedback ${FDBK[view].cls}`}
        dangerouslySetInnerHTML={{ __html: FDBK[view].text }}
      />
    </div>
  );
};

export default Ch8Compare;
