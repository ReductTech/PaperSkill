import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  clearField,
  drawSheet,
  drawContours,
  drawRoute,
  drawPin,
  drawSheetLabel,
  EMPH,
  ROUTE,
  CONTOUR,
  MUTED,
  LINE,
} from './chartkit';
import type { WidgetProps } from './registry';

// m81 — 换一种变化，押注哪条轴。五种位移共用一个画布：左为「原图 → 目标图」的位移，
// 中为三条迁移通道，右为注意事项。推荐通道蓝色点亮，其余灰。数值只作示意。

const W = 1080;
const H = 280;
const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

interface Shift {
  name: string;
  lane: number;
  methods: string[];
  caveat: string[];
  fb: string;
  cls: string;
}

const LANES = ['视频先验', '基座', '动作抽象'];

const SHIFTS: Shift[] = [
  {
    name: '新任务',
    lane: 0,
    methods: ['GR-1 / GR-2'],
    caveat: ['连接动作需逆模型', '或子目标生成器'],
    fb: '大规模语言条件视频预训练能在未见场景里帮上忙（GR-1/GR-2），但连接动作通常要付一个逆模型或子目标生成器的成本。',
    cls: 'good',
  },
  {
    name: '新物体',
    lane: 1,
    methods: ['Im2Flow2Act', 'MWM'],
    caveat: ['执行器仍要解决', '抓取与碰撞'],
    fb: '把迁移交给基座：光流/掩码/特征抑制纹理与光照（Im2Flow2Act、MWM、FRAPPE），但执行器仍要自己解决抓取与碰撞。',
    cls: 'good',
  },
  {
    name: '新外观',
    lane: 1,
    methods: ['MWM', 'FRAPPE'],
    caveat: ['外观被抽象洗掉', '标签仍按任务定义'],
    fb: "同样的基座抽象最对症：掩码与自监督特征让外观变化'洗掉'（MWM、FRAPPE/LDA-1B）。",
    cls: 'good',
  },
  {
    name: '新本体',
    lane: 2,
    methods: ['LDA-1B', 'DUST'],
    caveat: ['需动作抽象 + 本机解码器', '形态差尺度未解决'],
    fb: '动作空间本身变了：需要动作抽象 + 本机解码器（LDA-1B、DUST）；DreamZero 报告短视频适配即可迁移，但"需要适配"这件事本身就说明尺度没解决形态差。',
    cls: 'bad',
  },
  {
    name: '新动作空间',
    lane: 2,
    methods: ['LDA-1B', 'ALAM'],
    caveat: ['基座带任务与环境动力学', '动作解码器吸收本机运动学'],
    fb: "先把'该迁移什么'和'该留在本机什么'分开：基座带任务与环境动力学，动作解码器吸收本体运动学（LDA-1B、ALAM）。",
    cls: 'good',
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

export const M81: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ shift: 1 });
  const [shift, setShift] = useState(1);
  const [fb, setFb] = useState<{ text: string; cls: string }>({
    text: SHIFTS[1].fb,
    cls: SHIFTS[1].cls,
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

    const render = (now: number): void => {
      const s = stateRef.current;
      const sh = SHIFTS[s.shift];
      clearField(ctx, W, H);

      // ── 左区：原图 → 位移 → 目标图 ───────────────────────────────
      const ax = 48;
      const bx = 214;
      const my = 64;
      const mw = 130;
      const mh = 150;

      drawSheet(ctx, ax, my, mw, mh);
      drawContours(ctx, ax, my, mw, mh, 21, CONTOUR, 4);
      drawRoute(
        ctx,
        [
          [ax + 16, my + mh - 18],
          [ax + 52, my + mh - 62],
          [ax + 96, my + mh - 96],
        ],
        ROUTE,
        2
      );
      drawPin(ctx, ax + 16, my + mh - 18, ROUTE, false);

      drawSheet(ctx, bx, my, mw, mh);
      drawContours(ctx, bx, my, mw, mh, 22 + s.shift * 7, CONTOUR, 4);
      drawRoute(
        ctx,
        [
          [bx + 16, my + mh - 18],
          [bx + 50, my + mh - 54],
          [bx + 92, my + mh - 100],
        ],
        EMPH,
        2
      );
      drawPin(ctx, bx + 92, my + mh - 100, EMPH, false);

      // 位移箭头（橙色）。
      ctx.save();
      ctx.strokeStyle = EMPH;
      ctx.fillStyle = EMPH;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ax + mw + 12, my + mh / 2);
      ctx.lineTo(bx - 12, my + mh / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bx - 12, my + mh / 2);
      ctx.lineTo(bx - 22, my + mh / 2 - 7);
      ctx.lineTo(bx - 22, my + mh / 2 + 7);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // ── 中区：三条迁移通道 ──────────────────────────────────────
      const lx = 430;
      const lw = 320;
      const ly0 = 58;
      const lh = 52;
      const gap = 22;
      for (let i = 0; i < 3; i++) {
        const y = ly0 + i * (lh + gap);
        const on = i === sh.lane;
        ctx.save();
        ctx.fillStyle = on ? ROUTE : '#ffffff';
        ctx.globalAlpha = on ? 0.16 : 0.75;
        roundRect(ctx, lx, y, lw, lh, 9);
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = on ? ROUTE : LINE;
        ctx.lineWidth = on ? 2.5 : 1.5;
        roundRect(ctx, lx, y, lw, lh, 9);
        ctx.stroke();

        ctx.fillStyle = on ? ROUTE : MUTED;
        ctx.font = `${on ? 'bold ' : ''}16px ${FONT}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(LANES[i], lx + 16, y + lh / 2 + 6);

        if (on) {
          // 通道内的进度小标记（示意强度，非论文数值）。
          const strength = s.shift === 0 ? 0.7 : s.shift === 1 ? 0.85 : s.shift === 2 ? 0.8 : 0.6;
          ctx.fillStyle = ROUTE;
          ctx.globalAlpha = 0.5;
          roundRect(ctx, lx + lw - 120, y + lh / 2 - 4, 100 * strength, 8, 4);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(lx + lw - 14, y + lh / 2, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── 右区：代表方法与注意事项 ────────────────────────────────
      const rx = 820;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = MUTED;
      ctx.font = '14px ' + FONT;
      ctx.fillText('代表方法', rx, 74);
      ctx.fillStyle = ROUTE;
      ctx.font = 'bold 16px ' + FONT;
      for (let i = 0; i < sh.methods.length; i++) {
        ctx.fillText(sh.methods[i], rx, 100 + i * 22);
      }
      ctx.fillStyle = EMPH;
      ctx.font = '14px ' + FONT;
      ctx.fillText('注意事项', rx, 172);
      ctx.fillStyle = MUTED;
      ctx.font = '14px ' + FONT;
      for (let i = 0; i < sh.caveat.length; i++) {
        ctx.fillText(sh.caveat[i], rx, 198 + i * 22);
      }

      drawSheetLabel(ctx, '位移', 48, 40, EMPH);
      drawSheetLabel(ctx, '迁移通道', 430, 40, ROUTE);

      void now;
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
    stateRef.current.shift = i;
    setShift(i);
    setFb({ text: SHIFTS[i].fb, cls: SHIFTS[i].cls });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {SHIFTS.map((s, i) => (
          <button
            key={s.name}
            className={'chip' + (shift === i ? ' selected' : '')}
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

export default M81;
