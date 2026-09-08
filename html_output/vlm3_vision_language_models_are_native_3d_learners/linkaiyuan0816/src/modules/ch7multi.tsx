import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawWindow, drawDot, label, drawCaption } from './vlm3Draw';
import type { WidgetProps } from './registry';

const W = 560;
const H = 270;

type Mode = 'corr1' | 'corr2' | 'transDist' | 'transDir' | 'rotYPR';

type ModeDef = {
  group: 'corr' | 'pose';
  name: string;
  question: string;
  answer: string;
  note: string;
  visual: {
    q?: { x: number; y: number };
    m?: { x: number; y: number };
    /** dist=平移距离 | dir=平移方向 | rot=旋转 */
    poseKind?: 'dist' | 'dir' | 'rot';
  };
};

/** 在 (x,y) 按朝向 ang（弧度）画实心箭头，贴合斜线/弧线 */
function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ang: number,
  size = 9,
  color: string = C.purple,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size * 0.55);
  ctx.lineTo(-size * 0.7, 0);
  ctx.lineTo(-size, size * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

const MODES: Record<Mode, ModeDef> = {
  corr1: {
    group: 'corr',
    name: '对应 · 点 A',
    question: 'Given two images, pixel (900,700) in image1 → ?',
    answer: 'The corresponding pixel is (1120, 740)',
    note: '像素对应：查询与答案皆为 [0,2000) 文本坐标。',
    visual: { q: { x: 75, y: 95 }, m: { x: 210, y: 105 } },
  },
  corr2: {
    group: 'corr',
    name: '对应 · 点 B',
    question: 'Given two images, pixel (640,1100) in image1 → ?',
    answer: 'The corresponding pixel is (820, 1180)',
    note: '换一个查询点，输出匹配坐标随之改变——仍是纯文本接口。',
    visual: { q: { x: 95, y: 130 }, m: { x: 195, y: 140 } },
  },
  transDist: {
    group: 'pose',
    name: '平移距离',
    question: 'Estimate the magnitude of camera translation.',
    answer: 'Translation distance: 0.82 meters',
    note: '位姿问①：平移距离（米）——只看位移大小，不旋转视角。',
    visual: { poseKind: 'dist' },
  },
  transDir: {
    group: 'pose',
    name: '平移方向',
    question: 'Describe displacement as unit vector (x,y,z).',
    answer: 'The camera moves right-forward, unit (0.71, 0.05, 0.70)',
    note: '位姿问②：平移方向——视角 B 沿方向平移（不旋转）。',
    visual: { poseKind: 'dir' },
  },
  rotYPR: {
    group: 'pose',
    name: '旋转角',
    question: 'Describe reorientation as yaw, pitch, roll.',
    answer: 'Yaw=12.0, Pitch=-3.2, Roll=1.1',
    note: '位姿问③：旋转角——视角 B 原地转向（yaw/pitch/roll）。',
    visual: { poseKind: 'rot' },
  },
};

/** 7.1：切换对应/位姿设置，输出随之变化 */
export const Ch7Multi: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const modeRef = useRef<Mode>('corr1');
  const [mode, setMode] = useState<Mode>('corr1');
  const [feedback, setFeedback] = useState({ text: MODES.corr1.note, cls: 'good' });

  useEffect(() => { modeRef.current = mode; }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const render = () => {
      const m = modeRef.current;
      const def = MODES[m];
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      if (def.group === 'corr') {
        drawWindow(ctx, 36, 36, 110, 130, C.blue);
        drawWindow(ctx, 160, 36, 110, 130, C.green);
        label(ctx, '图1', 74, 30, C.blue, 11);
        label(ctx, '图2', 198, 30, C.green, 11);
        const q = def.visual.q!;
        const mt = def.visual.m!;
        drawDot(ctx, q.x, q.y, 6, C.orange);
        drawDot(ctx, mt.x, mt.y, 6, C.green);
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(q.x, q.y);
        ctx.lineTo(mt.x, mt.y);
        ctx.stroke();
      } else {
        const kind = def.visual.poseKind ?? 'dist';
        label(ctx, '视角 A', 55, 30, C.red, 11);
        drawWindow(ctx, 40, 40, 85, 95, C.red);

        if (kind === 'dist') {
          // 平移距离：B 水平移开，标注间距
          label(ctx, '视角 B', 195, 30, C.green, 11);
          drawWindow(ctx, 175, 40, 85, 95, C.green);
          ctx.strokeStyle = C.purple;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(125, 88);
          ctx.lineTo(175, 88);
          ctx.stroke();
          // 两端短竖线
          ctx.beginPath();
          ctx.moveTo(125, 82); ctx.lineTo(125, 94);
          ctx.moveTo(175, 82); ctx.lineTo(175, 94);
          ctx.stroke();
          label(ctx, '‖Δt‖', 138, 80, C.purple, 11);
        } else if (kind === 'dir') {
          // 平移方向：B 沿右前方平移，箭头贴合斜线方向
          label(ctx, '视角 B', 210, 30, C.green, 11);
          drawWindow(ctx, 190, 55, 85, 95, C.green);
          const x0 = 125, y0 = 100, x1 = 190, y1 = 85;
          const ang = Math.atan2(y1 - y0, x1 - x0);
          ctx.strokeStyle = C.purple;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
          drawArrowHead(ctx, x1, y1, ang, 10, C.purple);
          label(ctx, '方向', 142, 72, C.purple, 11);
        } else {
          // 旋转角：B 原地旋转；弧线末端箭头沿切线
          label(ctx, '视角 B', 185, 30, C.green, 11);
          ctx.save();
          ctx.translate(215, 88);
          ctx.rotate(0.35);
          ctx.translate(-42, -48);
          drawWindow(ctx, 0, 0, 85, 95, C.green);
          ctx.restore();
          const cx = 160, cy = 110, r = 28;
          const a0 = -Math.PI * 0.7;
          const a1 = -Math.PI * 0.15;
          ctx.strokeStyle = C.purple;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, r, a0, a1);
          ctx.stroke();
          // 切线方向：逆时针弧的切线为 a1 + π/2
          const tipX = cx + Math.cos(a1) * r;
          const tipY = cy + Math.sin(a1) * r;
          const tangent = a1 + Math.PI / 2;
          drawArrowHead(ctx, tipX, tipY, tangent, 9, C.purple);
          label(ctx, 'yaw…', 148, 78, C.purple, 11);
        }
      }

      // 类型角标
      ctx.fillStyle = def.group === 'corr' ? C.orange : C.purple;
      ctx.fillRect(36, 178, 72, 18);
      ctx.fillStyle = '#fff';
      ctx.font = '11px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText(def.group === 'corr' ? '像素对应' : '相机位姿', 44, 191);

      // 右侧输出卡
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      ctx.fillRect(300, 28, 230, 160);
      ctx.strokeRect(300, 28, 230, 160);
      label(ctx, '提示 → 文本输出', 315, 52, C.blue, 13);

      // wrap question/answer roughly
      const wrap = (text: string, x: number, y0: number, maxW: number, color: string, size: number) => {
        ctx.fillStyle = color;
        ctx.font = size + 'px "Segoe UI", "Microsoft YaHei", sans-serif';
        let line = '';
        let y = y0;
        for (const ch of text) {
          const test = line + ch;
          if (ctx.measureText(test).width > maxW && line) {
            ctx.fillText(line, x, y);
            line = ch;
            y += size + 4;
            if (y > 170) break;
          } else line = test;
        }
        if (y <= 170) ctx.fillText(line, x, y);
        return y;
      };
      const qy = wrap('Q: ' + def.question, 312, 78, 205, C.muted, 11);
      wrap('A: ' + def.answer, 312, qy + 22, 205, def.group === 'corr' ? C.orange : C.purple, 12);

      drawCaption(
        ctx, W, H,
        def.group === 'corr'
          ? '设置：' + def.name + ' → 匹配坐标输出变化'
          : '设置：' + def.name + ' → 位姿文本输出变化',
        def.group === 'corr' ? C.orange : C.purple,
        12,
      );
    };
    const tick = () => { render(); canvas.classList.add('is-ready'); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const d = observeCanvas(canvas, start, stop);
    return () => { stop(); d(); };
  }, []);

  const pick = (m: Mode) => {
    modeRef.current = m;
    setMode(m);
    setFeedback({ text: MODES[m].note, cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <span style={{ color: 'var(--ink-2)', fontSize: 13 }}>对应</span>
        {(['corr1', 'corr2'] as Mode[]).map((k) => (
          <button key={k} type="button" className={`chip ${mode === k ? 'on' : ''}`} onClick={() => pick(k)}>
            {MODES[k].name}
          </button>
        ))}
        <span style={{ color: 'var(--ink-2)', fontSize: 13, marginLeft: 8 }}>位姿</span>
        {(['transDist', 'transDir', 'rotYPR'] as Mode[]).map((k) => (
          <button key={k} type="button" className={`chip ${mode === k ? 'on' : ''}`} onClick={() => pick(k)}>
            {MODES[k].name}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`} style={{ fontStyle: 'normal' }}>{feedback.text}</div>
    </div>
  );
};

export default Ch7Multi;
