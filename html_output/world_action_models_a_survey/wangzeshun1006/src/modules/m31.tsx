import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  clearField,
  drawLegend,
  SHEET,
  ROUTE,
  EMPH,
  AUX,
  INK,
  MUTED,
  LINE,
} from './chartkit';
import type { WidgetProps } from './registry';

// m31 — 四坐标定位卡。点击左侧定位卡的四行之一（画布热点）或四个 DOM chip，
// 右栏切换到该轴的选项面板，并显示 F1 在这一轴上的取值与「训练时固定 / 推理时可调」。

const W = 1080;
const H = 280;
const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

interface AxisDef {
  chip: string;
  full: string;
  opts: string[];
  f1: number;
  f1Label: string;
  fixed: boolean;
}

const AXES: AxisDef[] = [
  {
    chip: '基座',
    full: '预测基座 Φ',
    opts: ['像素', '特征', '几何', '可供性'],
    f1: 0,
    f1Label: '像素可解码隐变量',
    fixed: true,
  },
  {
    chip: '耦合',
    full: '动作耦合 F',
    opts: ['动作条件推演', '联合生成', '预测后动作头'],
    f1: 1,
    f1Label: '联合生成',
    fixed: false,
  },
  {
    chip: '骨架',
    full: '骨架 B',
    opts: ['扩散', '自回归', 'JEPA', '混合', 'LLM/VLM'],
    f1: 3,
    f1Label: '混合',
    fixed: true,
  },
  {
    chip: '部署',
    full: '部署方式 D',
    opts: ['开环', '分块', '单步', '交互'],
    f1: 1,
    f1Label: '分块',
    fixed: false,
  },
];

const FEEDBACK = [
  '未来用什么形态表示——像素、特征、几何、可供性；F1 用像素可解码隐变量，训练时固定。',
  '动作怎么与未来绑在一起——先进入、联合生成、或从未来解出；F1 是联合生成，推理侧仍可调整。',
  '用什么函数族产生预测——扩散、自回归、JEPA、混合、LLM/VLM；F1 是混合，训练时固定。',
  '模型什么时候被调用、以多长的窗口——开环、分块、单步、交互；F1 用分块，推理时可变。',
];

function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.arcTo(x + w, y, x + w, y + rad, rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.arcTo(x + w, y + h, x + w - rad, y + h, rad);
  ctx.lineTo(x + rad, y + h);
  ctx.arcTo(x, y + h, x, y + h - rad, rad);
  ctx.lineTo(x, y + rad);
  ctx.arcTo(x, y, x + rad, y, rad);
  ctx.closePath();
}

export const M31: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ axis: 0 });
  const rafRef = useRef<number | null>(null);
  const [axis, setAxis] = useState(0);
  const [feedback, setFeedback] = useState({ text: FEEDBACK[0], cls: '' });

  const selectAxis = (i: number): void => {
    const idx = clamp(i, 0, 3);
    stateRef.current.axis = idx;
    setAxis(idx);
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

    const render = (): void => {
      const ax = stateRef.current.axis;
      const def = AXES[ax];
      clearField(ctx, W, H);

      // 左侧定位卡
      ctx.save();
      ctx.fillStyle = SHEET;
      rr(ctx, 60, 34, 360, 196, 12);
      ctx.fill();
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = INK;
      ctx.font = 'bold 22px ' + FONT;
      ctx.fillText('F1', 84, 74);
      ctx.fillStyle = MUTED;
      ctx.font = '12px ' + FONT;
      ctx.fillText('示例四坐标', 122, 72);

      const rowY = 108;
      const dy = 34;
      for (let i = 0; i < 4; i++) {
        const y = rowY + i * dy;
        if (i === ax) {
          ctx.fillStyle = 'rgba(240,126,71,0.14)';
          ctx.fillRect(74, y - 22, 332, 30);
          ctx.fillStyle = EMPH;
          ctx.fillRect(74, y - 22, 4, 30);
        }
        ctx.fillStyle = i === ax ? EMPH : MUTED;
        ctx.font = '13px ' + FONT;
        ctx.fillText(AXES[i].chip, 88, y);
        ctx.fillStyle = i === ax ? INK : '#4b5a70';
        ctx.font = 'bold 15px ' + FONT;
        ctx.fillText(AXES[i].f1Label, 134, y);
      }

      // 卡下方两个小示例
      ctx.fillStyle = MUTED;
      ctx.font = '12px ' + FONT;
      ctx.fillText('WorldVLA', 84, 252);
      ctx.fillText('FLARE', 210, 252);

      // 右侧选项面板
      ctx.fillStyle = INK;
      ctx.font = 'bold 17px ' + FONT;
      ctx.fillText(def.full, 500, 74);

      // 固定 / 可调标记
      const mColor = def.fixed ? AUX : EMPH;
      const mText = def.fixed ? '训练时固定' : '推理时可调';
      ctx.strokeStyle = mColor;
      ctx.fillStyle = mColor;
      ctx.lineWidth = 2;
      if (def.fixed) {
        ctx.strokeRect(884, 56, 13, 9);
        ctx.beginPath();
        ctx.arc(890.5, 56, 4.5, Math.PI, 0);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(890, 61, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.font = '13px ' + FONT;
      ctx.fillText(mText, 906, 68);

      const n = def.opts.length;
      const panelX = 500;
      const panelW = 520;
      const gap = 12;
      const bw = (panelW - gap * (n - 1)) / n;
      const by = 104;
      const bh = 48;
      for (let i = 0; i < n; i++) {
        const bx = panelX + i * (bw + gap);
        const sel = i === def.f1;
        ctx.save();
        ctx.fillStyle = sel ? ROUTE : SHEET;
        rr(ctx, bx, by, bw, bh, 10);
        ctx.fill();
        ctx.strokeStyle = sel ? ROUTE : LINE;
        ctx.lineWidth = sel ? 2.5 : 1.5;
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = sel ? '#ffffff' : INK;
        ctx.font = (sel ? 'bold ' : '') + '14px ' + FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(def.opts[i], bx + bw / 2, by + bh / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }

      drawLegend(
        ctx,
        [
          { color: ROUTE, text: 'F1 取值' },
          { color: LINE, text: '其他选项' },
        ],
        panelX,
        236
      );
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

  const onCanvasDown = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    if (x >= 60 && x <= 420 && y >= 86 && y <= 226) {
      selectAxis(clamp(Math.round((y - 108) / 34), 0, 3));
    }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={onCanvasDown}
      />
      <div className="ctrl">
        {AXES.map((a, i) => (
          <button
            key={a.chip}
            type="button"
            className={'chip' + (i === axis ? ' selected' : '')}
            onClick={() => selectAxis(i)}
          >
            {a.chip}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M31;
