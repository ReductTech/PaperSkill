import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  clearField,
  drawSheet,
  drawContours,
  seeded,
  drawLegend,
  drawSheetLabel,
  CONTOUR,
  ROUTE,
  OK,
  EMPH,
  AUX,
  INK,
  MUTED,
  LINE,
} from './chartkit';
import type { WidgetProps } from './registry';

// m42 — 抽象阶梯：从写真到骨架。拖动滑块（5 个停点）或点击刻度按钮，
// 左画面稿随级别变化，右侧三条（可检查性 / 生成成本 / 控制相关性）实时改变。

const W = 1080;
const H = 280;
const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

const LEVELS = ['RGB', 'RGB-D/法线', '光流', '语义掩码', '特征/隐变量'];
const METHODS: string[][] = [
  [],
  ['X-WAM', 'TesserAct'],
  ['Im2Flow2Act', '3DFlowAction'],
  ['MWM'],
  ['VPP', 'FLARE'],
];
// [可检查性, 生成成本, 控制相关性]
const BARS: number[][] = [
  [1.0, 1.0, 0.25],
  [0.85, 0.85, 0.45],
  [0.55, 0.5, 0.9],
  [0.6, 0.4, 0.85],
  [0.2, 0.2, 0.6],
];

const FEEDBACK = [
  '最像照片，也最贵：很多细节控制器根本用不到；消融里常有模型在推理时直接跳过渲染而不掉能力。',
  '加上显式几何（X-WAM、TesserAct 一线）：比 RGB 更贴近可执行性。',
  '只留运动（Im2Flow2Act、3DFlowAction 一线）：跨人、跨机、跨仿真的迁移性最好，但执行器要自己解决抓取与接触。',
  '只留任务相关的几何（MWM 一线）：背景、光照、颜色变化被挡掉。',
  '未来不再被渲染（VPP、S-VAM、FLARE 一线）：最省，但没有直接的视觉指标，只能靠下游任务检验。',
];

export const M42: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ rung: 0 });
  const rafRef = useRef<number | null>(null);
  const dragging = useRef(false);
  const [rung, setRung] = useState(0);
  const [feedback, setFeedback] = useState({ text: FEEDBACK[0], cls: '' });

  const setRungBoth = (i: number): void => {
    const idx = clamp(Math.round(i), 0, 4);
    if (stateRef.current.rung === idx) return;
    stateRef.current.rung = idx;
    setRung(idx);
    setFeedback({ text: FEEDBACK[idx], cls: '' });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const drawRoughSheet = (levels: number, texture: boolean): void => {
      drawContours(ctx, 44, 44, 472, 192, 13, CONTOUR, levels);
      if (!texture) return;
      const rnd = seeded(9);
      ctx.fillStyle = 'rgba(118,144,106,0.28)';
      for (let i = 0; i < 120; i++) {
        ctx.fillRect(48 + rnd() * 460, 48 + rnd() * 180, 2, 2);
      }
      ctx.fillStyle = 'rgba(33,50,74,0.05)';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(80 + rnd() * 400, 66 + rnd() * 150, 16 + rnd() * 20, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawNormals = (): void => {
      const rnd = seeded(31);
      ctx.strokeStyle = 'rgba(39,68,110,0.5)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 46; i++) {
        const x = 60 + rnd() * 440;
        const y = 56 + rnd() * 168;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 9, y - 11);
        ctx.stroke();
      }
    };

    const drawFlow = (): void => {
      ctx.strokeStyle = ROUTE;
      ctx.fillStyle = ROUTE;
      ctx.lineWidth = 2;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 6; c++) {
          const x = 82 + c * 72;
          const y = 66 + r * 46;
          const a = Math.sin(r * 1.2 + c * 0.7) * 0.7;
          const dx = Math.cos(a) * 16;
          const dy = Math.sin(a) * 16;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + dx, y + dy);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x + dx, y + dy);
          ctx.lineTo(x + dx - 6 * Math.cos(a - 0.4), y + dy - 6 * Math.sin(a - 0.4));
          ctx.lineTo(x + dx - 6 * Math.cos(a + 0.4), y + dy - 6 * Math.sin(a + 0.4));
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.strokeStyle = AUX;
      ctx.fillStyle = AUX;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= 9; i++) {
        const x = 80 + i * 48;
        const y = 130 + Math.sin(i * 0.8) * 42;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    const drawMask = (): void => {
      const blocks: number[][] = [
        [70, 70, 150, 70, 0],
        [250, 90, 130, 90, 1],
        [80, 165, 120, 55, 2],
        [245, 190, 150, 40, 1],
        [405, 80, 80, 120, 0],
      ];
      const cols = ['rgba(39,68,110,0.35)', 'rgba(34,141,92,0.35)', 'rgba(240,126,71,0.35)'];
      for (const b of blocks) {
        ctx.fillStyle = cols[b[4]];
        ctx.fillRect(b[0], b[1], b[2], b[3]);
      }
    };

    const drawFeat = (): void => {
      const rnd = seeded(41);
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 8; c++) {
          const on = rnd() > 0.45;
          ctx.fillStyle = on ? ROUTE : LINE;
          ctx.beginPath();
          ctx.arc(70 + c * 58, 62 + r * 40, on ? 3.4 : 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const render = (): void => {
      const rg = stateRef.current.rung;
      clearField(ctx, W, H);
      drawSheet(ctx, 40, 40, 480, 200);

      if (rg === 0) drawRoughSheet(6, true);
      else if (rg === 1) {
        drawRoughSheet(4, true);
        drawNormals();
      } else if (rg === 2) drawFlow();
      else if (rg === 3) drawMask();
      else drawFeat();

      // 三条变化条
      const bx = 600;
      const bw = 440;
      const colors = [ROUTE, EMPH, OK];
      const vals = BARS[rg];
      for (let i = 0; i < 3; i++) {
        const y = 74 + i * 56;
        ctx.fillStyle = LINE;
        ctx.fillRect(bx, y, bw, 26);
        ctx.fillStyle = colors[i];
        ctx.fillRect(bx, y, bw * vals[i], 26);
      }
      drawLegend(
        ctx,
        [
          { color: ROUTE, text: '可检查性' },
          { color: EMPH, text: '生成成本' },
          { color: OK, text: '控制相关性' },
        ],
        bx,
        258
      );

      // 底部：当前级别名 + 代表方法
      drawSheetLabel(ctx, LEVELS[rg], 48, 268, INK);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = MUTED;
      ctx.font = '13px ' + FONT;
      const m = METHODS[rg].join(' / ');
      if (m) ctx.fillText(m, 180, 266);
    };

    const loop = (): void => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(loop);
    };
    const stop = (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(loop);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pickFromClient = (clientX: number): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (W / rect.width);
    const u = (x - 60) / 440;
    setRungBoth(u * 4);
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={(e) => {
          dragging.current = true;
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            /* ignore */
          }
          pickFromClient(e.clientX);
        }}
        onPointerMove={(e) => {
          if (dragging.current) pickFromClient(e.clientX);
        }}
        onPointerUp={(e) => {
          dragging.current = false;
          try {
            e.currentTarget.releasePointerCapture(e.pointerId);
          } catch {
            /* ignore */
          }
        }}
        onPointerLeave={() => {
          dragging.current = false;
        }}
      />
      <div className="ctrl">
        <label>
          抽象级别
          <input
            type="range"
            min={0}
            max={4}
            step={1}
            value={rung}
            onChange={(e) => setRungBoth(Number(e.target.value))}
          />
        </label>
        <span className="val">{LEVELS[rung]}</span>
        {LEVELS.map((l, i) => (
          <button
            key={l}
            type="button"
            className={'chip' + (i === rung ? ' selected' : '')}
            onClick={() => setRungBoth(i)}
          >
            {l}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M42;
