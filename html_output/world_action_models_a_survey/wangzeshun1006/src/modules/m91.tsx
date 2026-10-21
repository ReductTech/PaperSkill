import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import {
  clearField,
  drawSheet,
  drawSheetLabel,
  EMPH,
  OK,
  ROUTE,
  AUX,
  INK,
  MUTED,
  LINE,
} from './chartkit';
import type { WidgetProps } from './registry';

// m91 — 五类数据源：素材账本。左为账本封面（图章 + 来源名），中为四根取舍条
// （标签质量/规模/物理接地/获取难度），右为代表资源与一行注意。条长为示意，非论文数值。

const W = 1080;
const H = 280;
const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

interface Source {
  name: string;
  bars: number[];
  missing: boolean;
  res: string[];
  note: string;
  fb: string;
  cls: string;
}

const BAR_NAMES = ['标签质量', '规模', '物理接地', '获取难度'];
const BAR_COLORS = [OK, ROUTE, AUX, EMPH];

const SOURCES: Source[] = [
  {
    name: '真机遥操作',
    bars: [0.95, 0.45, 0.95, 0.9],
    missing: false,
    res: ['Open X-Embodiment'],
    note: '跨本体标准资源',
    fb: '标签最干净（Open X-Embodiment 是跨本体标准资源）；代价是每一小时都要占机器人时间与操作员时间。',
    cls: 'good',
  },
  {
    name: '便携人体演示',
    bars: [0.7, 0.6, 0.6, 0.6],
    missing: false,
    res: ['EgoMimic', 'EgoVerse', 'EgoDex'],
    note: '本体温差需先补',
    fb: '穿戴/手持采集换规模（EgoMimic、EgoVerse、EgoDex）；代价是本体温差，得先补上。',
    cls: 'good',
  },
  {
    name: '互联网视频',
    bars: [0.0, 1.0, 0.25, 0.3],
    missing: true,
    res: ['Ego4D', 'EPIC-KITCHENS'],
    note: '无机器人动作标签',
    fb: '规模最大、没有机器人动作标签（Ego4D、EPIC-KITCHENS 一线）；要么预训练视频骨干，要么接逆动力学/隐动作恢复控制代理。',
    cls: '',
  },
  {
    name: '仿真',
    bars: [0.9, 0.85, 0.55, 0.2],
    missing: false,
    res: ['Robosuite', 'ManiSkill', 'LIBERO'],
    note: 'sim-to-real 差',
    fb: '标签精确、课程可控、边际成本低（Robosuite、ManiSkill、LIBERO、RoboCasa 一线）；代价是 sim-to-real 差。',
    cls: 'good',
  },
  {
    name: '合成轨迹',
    bars: [0.6, 0.8, 0.4, 0.4],
    missing: false,
    res: ['DreamGen', 'RIGVid', 'IRASim'],
    note: '需真实动力学接地',
    fb: '把 WAM 自己当数据引擎（DreamGen、RIGVid、IRASim）；继承生成器的失败模式，仍需真实动力学接地。',
    cls: '',
  },
];

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

export const M91: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ source: 0, barStart: 0 });
  const [source, setSource] = useState(0);
  const [fb, setFb] = useState<{ text: string; cls: string }>({
    text: SOURCES[0].fb,
    cls: SOURCES[0].cls,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    stateRef.current.barStart = performance.now() - 500;

    const render = (now: number): void => {
      const s = stateRef.current;
      const src = SOURCES[s.source];
      clearField(ctx, W, H);
      ctx.textBaseline = 'alphabetic';

      // ── 左区：账本封面 ──────────────────────────────────────────
      const cx = 48;
      const cy = 52;
      const cw = 200;
      const ch = 176;
      drawSheet(ctx, cx, cy, cw, ch);
      // 图章
      ctx.save();
      ctx.strokeStyle = AUX;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx + cw / 2, cy + 58, 34, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = AUX;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(cx + cw / 2, cy + 58, 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = AUX;
      ctx.font = 'bold 20px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText('账', cx + cw / 2, cy + 65);
      // 来源名
      ctx.fillStyle = INK;
      ctx.font = 'bold 19px ' + FONT;
      ctx.fillText(src.name, cx + cw / 2, cy + 130);
      ctx.fillStyle = MUTED;
      ctx.font = '13px ' + FONT;
      ctx.fillText('数据来源', cx + cw / 2, cy + 156);

      // ── 中区：四根取舍条 ────────────────────────────────────────
      const labelRight = 470;
      const trackX = 490;
      const trackW = 270;
      const barH = 24;
      const y0 = 52;
      const gap = 32;
      for (let i = 0; i < 4; i++) {
        const y = y0 + i * (barH + gap);
        const anim = easeOutCubic(clamp((now - s.barStart - i * 60) / 380, 0, 1));

        // 标签
        ctx.fillStyle = MUTED;
        ctx.font = '15px ' + FONT;
        ctx.textAlign = 'right';
        ctx.fillText(BAR_NAMES[i], labelRight, y + barH - 6);

        // 轨道
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, trackX, y, trackW, barH, 6);
        ctx.fill();
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (src.missing && i === 0) {
          // 动作标签缺失：灰色虚线，不填长度。
          ctx.save();
          ctx.setLineDash([7, 5]);
          ctx.strokeStyle = MUTED;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(trackX + 6, y + barH / 2);
          ctx.lineTo(trackX + trackW - 6, y + barH / 2);
          ctx.stroke();
          ctx.restore();
          ctx.fillStyle = MUTED;
          ctx.font = '13px ' + FONT;
          ctx.textAlign = 'left';
          ctx.fillText('缺', trackX + trackW + 10, y + barH - 6);
        } else {
          const bw = trackW * src.bars[i] * anim;
          if (bw > 0.5) {
            ctx.fillStyle = BAR_COLORS[i];
            ctx.globalAlpha = 0.85;
            roundRect(ctx, trackX, y, bw, barH, 6);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
          if (anim > 0.9) {
            ctx.fillStyle = BAR_COLORS[i];
            ctx.font = '13px ' + FONT;
            ctx.textAlign = 'left';
            ctx.fillText(String(Math.round(src.bars[i] * 100)), trackX + trackW + 10, y + barH - 6);
          }
        }
      }

      // ── 右区：代表资源与注意 ────────────────────────────────────
      const rx = 812;
      ctx.textAlign = 'left';
      ctx.fillStyle = MUTED;
      ctx.font = '14px ' + FONT;
      ctx.fillText('代表资源', rx, 78);
      ctx.fillStyle = ROUTE;
      ctx.font = 'bold 15px ' + FONT;
      for (let i = 0; i < src.res.length; i++) {
        ctx.fillText(src.res[i], rx, 104 + i * 24);
      }
      ctx.fillStyle = EMPH;
      ctx.font = '14px ' + FONT;
      ctx.fillText('注意', rx, 210);
      ctx.fillStyle = MUTED;
      ctx.font = '14px ' + FONT;
      ctx.fillText(src.note, rx, 234);

      drawSheetLabel(ctx, '素材账本', cx, 40, ROUTE);
      drawSheetLabel(ctx, '取舍条', trackX, 40, MUTED);
    };

    const tick = (now: number): void => {
      render(now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (i: number): void => {
    stateRef.current.source = i;
    stateRef.current.barStart = performance.now();
    setSource(i);
    setFb({ text: SOURCES[i].fb, cls: SOURCES[i].cls });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {SOURCES.map((s, i) => (
          <button
            key={s.name}
            className={'chip' + (source === i ? ' selected' : '')}
            onClick={() => pick(i)}
          >
            {s.name}
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default M91;
