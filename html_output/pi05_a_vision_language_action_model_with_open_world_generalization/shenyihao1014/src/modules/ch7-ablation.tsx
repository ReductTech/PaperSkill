import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawNotebook,
  drawLegend,
  drawSceneLabel,
} from './movingKit';
import type { WidgetProps } from './registry';

// Ch.7 module 7.1 — co-training ablation bench (P4 chips). The left side shows
// the five study notebooks; removed ones turn dim + struck. The right side has
// TWO qualitative bar groups: mock-home four-task total (Fig 10) and OOD
// language following (Fig 11). Heights are illustrative only — no numbers.
const W = 1080;
const H = 340;

const CHIPS = ['完整配方', '无 WD', '无 ME', '无 CE', '无 ME且无 CE'];
const REMOVED: string[][] = [[], ['WD'], ['ME'], ['CE'], ['ME', 'CE']];
const TAGS = ['MM', 'ME', 'CE', 'HL', 'WD'];
const NCOLORS = [C.blue, C.blue, C.blue, C.orange, C.purple];
const CAPS = ['完整', '无WD', '无ME', '无CE', '双撤'];
// Qualitative heights (0..1): mock-home total / OOD language following.
const MOCK = [0.95, 0.88, 0.45, 0.48, 0.25];
const OOD = [0.9, 0.15, 0.68, 0.7, 0.58];
const GX = [396, 748];
const BASE = 272;
const MAXH = 180;
const BW = 36;
const PITCH = 58;

const FDBK = [
  {
    text: '五路功课齐备：模拟屋任务与 OOD 语言双双在线——这是图 10/11 中所有消融的<b>基准线</b>。',
    cls: 'good',
  },
  {
    text: '模拟屋任务影响不大，但<b>没见过的物体开始听不懂</b>（Fig 11）。',
    cls: 'bad',
  },
  {
    text: '别家经验（ME）撤走，<b>动作质量大降</b>——跨本体迁移双向有价值（Fig 10）。',
    cls: 'bad',
  },
  {
    text: '练习房（CE）撤走，<b>动作质量大降</b>——跨本体迁移双向有价值（Fig 10）。',
    cls: 'bad',
  },
  {
    text: 'ME、CE 两路都撤：<b>模拟屋总成绩全场最低</b>——两路跨本体迁移相互补充，缺一双降（Fig 10）。',
    cls: 'bad',
  },
];

function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  value: number,
  color: string,
  dim: boolean
) {
  const h = Math.max(4, value * MAXH);
  ctx.save();
  ctx.globalAlpha = dim ? 0.4 : 1;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, BASE - h, BW, h, 3);
  ctx.fill();
  ctx.restore();
}

export const Ch7Ablation: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ chip: 0 });
  const [chip, setChip] = useState(0);

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
      const ci = clamp(stateRef.current.chip, 0, CHIPS.length - 1) | 0;
      const pulse = 0.55 + 0.35 * Math.sin((ms / 900) * Math.PI * 2);
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });

      // ---- left: five study notebooks ----
      drawSceneLabel(ctx, '五路功课', 40, 86, { color: C.muted });
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(36, 172);
      ctx.lineTo(308, 172);
      ctx.stroke();
      TAGS.forEach((tag, k) => {
        const gone = REMOVED[ci].indexOf(tag) >= 0;
        drawNotebook(ctx, 48 + k * 58, 148, 0.95, tag, {
          color: NCOLORS[k],
          dim: gone,
          struck: gone,
        });
      });

      // ---- right: two qualitative bar groups ----
      const groups: { data: number[]; title: string; gx: number; colors: string[] }[] = [
        {
          data: MOCK,
          title: '模拟屋四任务（总）',
          gx: GX[0],
          colors: [C.green, C.green, C.red, C.red, C.red],
        },
        {
          data: OOD,
          title: 'OOD 语言跟随',
          gx: GX[1],
          colors: [C.green, C.red, C.green, C.green, C.green],
        },
      ];
      groups.forEach((g) => {
        // axis
        ctx.strokeStyle = C.muted;
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(g.gx - 12, BASE);
        ctx.lineTo(g.gx + 4 * PITCH + BW + 12, BASE);
        ctx.stroke();
        ctx.globalAlpha = 1;
        // group title
        ctx.fillStyle = C.text;
        ctx.font = '13px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(g.title, g.gx + (4 * PITCH + BW) / 2, 64);
        // bars + captions
        g.data.forEach((v, i) => {
          const x = g.gx + i * PITCH;
          const cur = i === ci;
          drawBar(ctx, x, v, g.colors[i], !cur);
          ctx.save();
          ctx.globalAlpha = cur ? 1 : 0.5;
          ctx.fillStyle = cur ? C.text : C.muted;
          ctx.font = '11px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(CAPS[i], x + BW / 2, 290);
          ctx.restore();
          if (cur) {
            // pulsing highlight frame on the selected condition
            const top = BASE - Math.max(4, v * MAXH);
            ctx.save();
            ctx.globalAlpha = pulse;
            ctx.strokeStyle = C.blue;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.roundRect(x - 6, top - 8, BW + 12, BASE - top + 14, 5);
            ctx.stroke();
            ctx.restore();
          }
        });
      });

      // ---- callout on the collapsed no-WD OOD bar ----
      const tagX = GX[1] + 1 * PITCH + BW / 2;
      const oodTop = BASE - Math.max(4, OOD[1] * MAXH);
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(tagX - 97, 204, 194, 20, 6);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tagX - 5, 224);
      ctx.lineTo(tagX + 5, 224);
      ctx.lineTo(tagX, 234);
      ctx.closePath();
      ctx.fillStyle = C.red;
      ctx.fill();
      // pointer to the collapsed bar top
      ctx.strokeStyle = C.red;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(tagX, 236);
      ctx.lineTo(tagX, oodTop - 3);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.red;
      ctx.font = '11px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('图鉴没了：没见过的东西听不懂了', tagX, 214);
      ctx.restore();

      drawLegend(
        ctx,
        [
          ['保持', C.green],
          ['大降', C.red],
        ],
        40,
        322
      );

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
    stateRef.current.chip = i;
    setChip(i);
  };

  return (
    <div>
      <div className="chip-row" role="tablist" aria-label="消融条件">
        {CHIPS.map((label, i) => (
          <button
            key={label}
            type="button"
            className={`chip${i === chip ? ' selected' : ''}`}
            onClick={() => pick(i)}
          >
            {label}
          </button>
        ))}
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <p style={{ margin: '2px 0 6px', textAlign: 'center', fontSize: 12, color: C.muted }}>
        柱高为示意 · 结论以论文图 10/11 为准
      </p>
      <div
        className={`feedback ${FDBK[chip].cls}`}
        dangerouslySetInnerHTML={{ __html: FDBK[chip].text }}
      />
    </div>
  );
};

export default Ch7Ablation;
