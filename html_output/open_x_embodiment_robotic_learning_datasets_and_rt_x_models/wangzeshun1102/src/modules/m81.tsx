import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  clearScene,
  drawRoad,
  drawVehicle,
  drawSceneLabel,
  drawLegend,
  seeded,
  GUIDE,
  BAD,
  OK,
  EMPH,
  PAINT,
  MUTED,
  LINE,
} from './drivingKit';
import type { WidgetProps } from './registry';

// 8.1 四个未解问题：点击条目，看每一处缺口具体卡在哪里。

const W = 1080;
const H = 280;

interface OpenItem {
  label: string;
  feedback: string;
  cls: string;
}

const ITEMS: OpenItem[] = [
  {
    label: '判定准则',
    feedback:
      '论文明确承认：目前还没有判定“什么时候会发生正迁移、什么时候不会”的准则。同样是把别的本体经验搬过来，有的任务提升明显，有的毫无起色，事先说不准。',
    cls: 'bad',
  },
  {
    label: '数据不平衡',
    feedback:
      '60 个数据集合并后，本体分布极不均衡：Franka 的占比最高、覆盖场景也最多，很多本体只有少量数据。模型学到的“通用”经验，天然偏向数据多的那一侧。',
    cls: '',
  },
  {
    label: '评估成本',
    feedback:
      '全套评估做了 3600 次试验，覆盖 6 种机器人。换一个本体、换一个任务都要重新上真实机器人跑，成本极高，很难把每种迁移组合都系统试一遍。',
    cls: '',
  },
  {
    label: '语义对齐',
    feedback:
      '不同本体的动作空间与观测模态并不一一对应：有的多一路深度相机、有的只有 RGB，动作维度也不一致。统一成 RLDS 只是把数据放进同一张表，并没有解决“动作语义如何对应”的问题。',
    cls: 'bad',
  },
];

const imbRnd = seeded(7);
const IMB_HEIGHTS: number[] = [178];
for (let i = 0; i < 11; i++) IMB_HEIGHTS.push(22 + Math.round(imbRnd() * 56));

export const M81: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ sel: 0 });
  const [sel, setSel] = useState(0);
  const [feedback, setFeedback] = useState({ text: ITEMS[0].feedback, cls: ITEMS[0].cls });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const drawCheck = (x: number, y: number, s: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - 6 * s, y);
      ctx.lineTo(x - 1 * s, y + 5 * s);
      ctx.lineTo(x + 8 * s, y - 7 * s);
      ctx.stroke();
    };

    const drawCross = (x: number, y: number, s: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - 6 * s, y - 6 * s);
      ctx.lineTo(x + 6 * s, y + 6 * s);
      ctx.moveTo(x + 6 * s, y - 6 * s);
      ctx.lineTo(x - 6 * s, y + 6 * s);
      ctx.stroke();
    };

    const qPoint = (u: number) => {
      const x = (1 - u) * (1 - u) * 320 + 2 * (1 - u) * u * 530 + u * u * 740;
      const y = (1 - u) * (1 - u) * 190 + 2 * (1 - u) * u * -10 + u * u * 190;
      return { x, y };
    };

    const render = (now: number) => {
      clearScene(ctx, W, H);
      const current = stateRef.current.sel;
      const pulse = (Math.sin(now / 420) + 1) / 2;

      if (current === 0) {
        // 没有判定准则：同样的迁移箭头，结果时好时坏
        drawRoad(ctx, 60, 176, 300, 56, false);
        drawRoad(ctx, 720, 176, 300, 56, false);
        drawVehicle(ctx, 150, 222, 'sedan', 0.85, PAINT);
        drawVehicle(ctx, 820, 222, 'truck', 0.85, PAINT);
        drawSceneLabel(ctx, '已学经验', 60, 156);
        drawSceneLabel(ctx, '新本体', 720, 156);

        ctx.save();
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 3;
        ctx.setLineDash([9, 8]);
        ctx.beginPath();
        ctx.moveTo(320, 190);
        ctx.quadraticCurveTo(530, -10, 740, 190);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = MUTED;
        ctx.beginPath();
        ctx.moveTo(740, 190);
        ctx.lineTo(718, 180);
        ctx.lineTo(718, 200);
        ctx.closePath();
        ctx.fill();

        const outcomes = [
          { u: 0.28, ok: true },
          { u: 0.5, ok: false },
          { u: 0.72, ok: true },
        ];
        for (const o of outcomes) {
          const p = qPoint(o.u);
          ctx.save();
          ctx.globalAlpha = 0.75 + 0.25 * pulse;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 17, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = o.ok ? OK : BAD;
          ctx.lineWidth = 2;
          ctx.stroke();
          if (o.ok) drawCheck(p.x, p.y, 1.2, OK);
          else drawCross(p.x, p.y, 1.2, BAD);
          ctx.restore();
        }

        ctx.save();
        ctx.globalAlpha = 0.55 + 0.45 * pulse;
        ctx.strokeStyle = EMPH;
        ctx.fillStyle = EMPH;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(530, 30, 15, Math.PI * 0.95, Math.PI * 2.15);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(539, 41);
        ctx.lineTo(530, 54);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(530, 67, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        drawLegend(
          ctx,
          [
            { color: OK, text: '迁移成功' },
            { color: BAD, text: '迁移失败' },
          ],
          60,
          262
        );
      } else if (current === 1) {
        // 数据不平衡：一根柱子独大
        const baseY = 236;
        const barW = 56;
        for (let i = 0; i < IMB_HEIGHTS.length; i++) {
          const h = IMB_HEIGHTS[i];
          const x = 70 + i * 70;
          if (i === 0) {
            ctx.save();
            ctx.globalAlpha = 0.28 + 0.3 * pulse;
            ctx.fillStyle = EMPH;
            ctx.fillRect(x - 6, baseY - h - 6, barW + 12, h + 12);
            ctx.restore();
            ctx.fillStyle = EMPH;
          } else {
            ctx.fillStyle = '#c3cddd';
          }
          ctx.fillRect(x, baseY - h, barW, h);
        }
        drawSceneLabel(ctx, '本体分布', 70, 46);
        drawLegend(
          ctx,
          [
            { color: EMPH, text: '主导本体' },
            { color: MUTED, text: '其余本体' },
          ],
          70,
          268
        );
      } else if (current === 2) {
        // 评估昂贵：6 种机器人，3600 次试验
        for (let i = 0; i < 6; i++) {
          const x = 130 + i * 160;
          ctx.strokeStyle = GUIDE;
          ctx.lineWidth = 6;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x, 205);
          ctx.lineTo(x - 14, 168);
          ctx.lineTo(x + 18, 145);
          ctx.stroke();
          ctx.fillStyle = MUTED;
          ctx.fillRect(x - 20, 205, 40, 12);
          ctx.fillStyle = PAINT;
          ctx.beginPath();
          ctx.arc(x, 205, 6, 0, Math.PI * 2);
          ctx.arc(x - 14, 168, 6, 0, Math.PI * 2);
          ctx.arc(x + 18, 145, 5, 0, Math.PI * 2);
          ctx.fill();

          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 5; c++) {
              const alpha = 0.35 + 0.65 * ((Math.sin(now / 500 + i + r * 0.4) + 1) / 2);
              ctx.save();
              ctx.globalAlpha = alpha;
              ctx.fillStyle = EMPH;
              ctx.beginPath();
              ctx.arc(x - 24 + c * 12, 232 + r * 11, 3, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }
        }
        drawSceneLabel(ctx, '3600 次试验', 70, 46);
        drawSceneLabel(ctx, '6 种机器人', 70, 78);
        drawLegend(ctx, [{ color: EMPH, text: '评估试验' }], 70, 272);
      } else {
        // 语义对齐：8 个动作维度对不上 6 个
        drawSceneLabel(ctx, '动作空间', 120, 92);
        drawSceneLabel(ctx, '难以对齐', 700, 92);

        const leftN = 8;
        const rightN = 6;
        for (let i = 0; i < leftN; i++) {
          const x = 120 + i * 38;
          const h = 40 + ((i * 37) % 50);
          ctx.fillStyle = '#dbe3ef';
          ctx.fillRect(x, 210 - h, 26, h);
        }
        for (let i = 0; i < rightN; i++) {
          const x = 700 + i * 44;
          const h = 46 + ((i * 53) % 48);
          ctx.fillStyle = '#dbe3ef';
          ctx.fillRect(x, 210 - h, 30, h);
        }

        for (let i = 0; i < rightN; i++) {
          const x1 = 120 + i * 38 + 13;
          const y1 = 120 + (i % 3) * 8;
          const x2 = 700 + i * 44 + 15;
          const y2 = 120 + (i % 3) * 8;
          ctx.save();
          ctx.strokeStyle = OK;
          ctx.lineWidth = 2.5;
          ctx.globalAlpha = 0.6 + 0.4 * pulse;
          ctx.setLineDash([6, 5]);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.bezierCurveTo(x1 + 160, y1 - 40, x2 - 160, y2 - 40, x2, y2);
          ctx.stroke();
          ctx.restore();
        }

        for (let i = rightN; i < leftN; i++) {
          const x = 120 + i * 38 + 13;
          ctx.save();
          ctx.globalAlpha = 0.65 + 0.35 * pulse;
          ctx.strokeStyle = BAD;
          ctx.lineWidth = 2.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(x, 120);
          ctx.lineTo(x + 34, 72);
          ctx.stroke();
          drawCross(x + 40, 64, 1, BAD);
          ctx.restore();
        }

        drawLegend(
          ctx,
          [
            { color: OK, text: '可对应' },
            { color: BAD, text: '对不上' },
          ],
          120,
          262
        );
      }
    };

    const tick = (now: number) => {
      render(now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const select = (i: number) => {
    stateRef.current.sel = i;
    setSel(i);
    setFeedback({ text: ITEMS[i].feedback, cls: ITEMS[i].cls });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>点击条目查看具体缺口</label>
        <div className="chip-row">
          {ITEMS.map((it, i) => (
            <button
              key={it.label}
              className={'chip' + (sel === i ? ' selected' : '')}
              onClick={() => select(i)}
            >
              {it.label}
            </button>
          ))}
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M81;
