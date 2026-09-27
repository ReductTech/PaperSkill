import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawCheckMark,
  drawCrossMark,
  drawSceneLabel,
} from './flatKit';
import type { WidgetProps } from './registry';

// 模块 2.1（P4 chips）：切换 仅 SigLIP / 仅 DINOv2 / 双眼融合，
// 左侧工作台场景不变，右侧读数卡随「眼睛」变化——单眼缺一条读数，双眼拼接通道。
const W = 1080;
const H = 280;
const HOLES = [120, 180, 240];

type Mode = 'sig' | 'dino' | 'both';

const CHIPS: { id: Mode; label: string }[] = [
  { id: 'sig', label: '仅 SigLIP' },
  { id: 'dino', label: '仅 DINOv2' },
  { id: 'both', label: '双眼融合' },
];

const FEEDBACK: Record<Mode, { text: string; cls: string }> = {
  sig: {
    text: '认得出是什么，<b>量不准在哪</b>——抓取会偏。',
    cls: 'bad',
  },
  dino: {
    text: '位置准，但<b>分不清目标与干扰物</b>。',
    cls: 'bad',
  },
  both: {
    text: '语义+空间并排读数按通道拼接——论文实测这双眼睛让策略比单眼强约 10%。',
    cls: 'good',
  },
};

export const Ch2Eyes: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<Mode>('both');
  const [mode, setMode] = useState<Mode>('both');
  const [feedback, setFeedback] = useState(FEEDBACK.both);

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

    const drawCard = (
      x: number,
      y: number,
      title: string,
      body: string,
      color: string,
      empty: boolean
    ) => {
      const w = 200;
      const h = 96;
      if (empty) {
        ctx.save();
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 8);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        drawCrossMark(ctx, x + w / 2, y + h / 2, 9);
        return;
      }
      ctx.save();
      ctx.fillStyle = C.white;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = '11px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(title, x + 16, y + 22);
      ctx.font = 'bold 16px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(body, x + 16, y + 56);
      ctx.restore();
    };

    const render = () => {
      const m = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);
      // divider
      ctx.save();
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(594, 16);
      ctx.lineTo(594, 250);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // ---- LEFT 55%: workbench scene (board with holes + distractor cup) ----
      ctx.save();
      ctx.fillStyle = '#d9c7a7';
      ctx.strokeStyle = C.support;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(60, 150, 300, 20, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.deep;
      HOLES.forEach((hx) => {
        ctx.beginPath();
        ctx.arc(hx, 160, 5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
      // distractor cup
      ctx.save();
      ctx.fillStyle = '#8fa6c4';
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(452, 170, 36, 40, 4);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(474, 170);
      ctx.lineTo(484, 148);
      ctx.stroke();
      ctx.restore();
      // semantic eye: knows it is a shelf (blue outline), cannot locate holes
      if (m === 'sig' || m === 'both') {
        ctx.save();
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 2;
        ctx.setLineDash([7, 4]);
        ctx.beginPath();
        ctx.roundRect(52, 140, 316, 40, 6);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
      // spatial eye: precise hole ring
      if (m === 'dino' || m === 'both') {
        ctx.save();
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(180, 160, 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(180, 146);
        ctx.lineTo(180, 174);
        ctx.moveTo(166, 160);
        ctx.lineTo(194, 160);
        ctx.stroke();
        ctx.restore();
      }
      // single-eye red emphasis (what is missing)
      if (m === 'sig') {
        ctx.save();
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.roundRect(102, 138, 176, 44, 6);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        drawCrossMark(ctx, 292, 132, 7);
      } else if (m === 'dino') {
        ctx.save();
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.roundRect(444, 140, 54, 76, 6);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        drawCrossMark(ctx, 508, 134, 7);
      }

      // ---- RIGHT 45%: reading cards ----
      if (m === 'both') {
        ctx.save();
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(616, 74, 448, 136, 10);
        ctx.stroke();
        ctx.restore();
        drawSceneLabel(ctx, '通道拼接', 840, 90, { color: C.green, align: 'center' });
        drawCard(628, 104, '语义卡', '木搁板·非杯子', C.blue, false);
        drawCard(852, 104, '空间卡', '孔位 34,128', C.orange, false);
        drawCheckMark(ctx, 646, 122, 8);
      } else if (m === 'sig') {
        drawCard(640, 110, '语义卡', '木搁板·非杯子', C.blue, false);
        drawCard(860, 110, '空间卡', '—', C.orange, true);
      } else {
        drawCard(640, 110, '语义卡', '—', C.blue, true);
        drawCard(860, 110, '空间卡', '孔位 34,128', C.orange, false);
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

  const pick = (m: Mode) => {
    stateRef.current = m;
    setMode(m);
    setFeedback(FEEDBACK[m]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          {CHIPS.map((c) => (
            <button
              key={c.id}
              className={`chip ${mode === c.id ? 'selected' : ''}`}
              onClick={() => pick(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div
        className={`feedback ${feedback.cls}`}
        dangerouslySetInnerHTML={{ __html: feedback.text }}
      />
    </div>
  );
};

export default Ch2Eyes;
