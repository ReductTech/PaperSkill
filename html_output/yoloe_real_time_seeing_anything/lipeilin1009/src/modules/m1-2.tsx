import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { PALETTE, clearScene, drawBirder, drawBird, drawCard } from './birdKit';

// m1-2 (core-loop) — YOLOE 的看见循环：提示→嵌入→对比→标签，四步步进。
// 动画约定：每次换步记录 enteredAt，元素以缓动过渡进场；阶段块与连线用平滑插值跟随。

const W = 1080;
const H = 280;
const STAGES = ['① 提示', '② 嵌入', '③ 对比', '④ 标签'];
const FEEDBACK = [
  { text: '① 给出提示：用文字描述要找的目标。', cls: '' },
  { text: '② 提示被翻译成模型懂的嵌入向量。', cls: '' },
  { text: '③ 拿嵌入和每个锚点比对相似度。', cls: '' },
  { text: '④ 最像的就是答案——类别名由此而来。', cls: 'good' },
];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
const easeOutBack = (p: number) => 1 + 2.2 * Math.pow(p - 1, 3) + 1.2 * Math.pow(p - 1, 2);
const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

/** 颜色插值，兼容 '#rrggbb' 与 'rgb(r, g, b)' 两种输入 */
function lerpColor(c1: string, c2: string, f: number) {
  const p = (c: string): [number, number, number] => {
    if (c[0] === '#') return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
    const m = c.match(/\d+/g) || ['0', '0', '0'];
    return [Number(m[0]), Number(m[1]), Number(m[2])];
  };
  const [r1, g1, b1] = p(c1);
  const [r2, g2, b2] = p(c2);
  return `rgb(${Math.round(lerp(r1, r2, f))},${Math.round(lerp(g1, g2, f))},${Math.round(lerp(b1, b2, f))})`;
}

/** 阶段块三态（未开始/进行中/已完成）的平滑跟随值 */
interface StageAnim { cur: number; done: number }

export const M1_2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 1, enteredAt: 0 });
  const stageAnimRef = useRef<StageAnim[]>([
    { cur: 1, done: 0 },
    { cur: 0, done: 0 },
    { cur: 0, done: 0 },
    { cur: 0, done: 0 },
  ]);
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(1);
  const [feedback, setFeedback] = useState(FEEDBACK[0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    stateRef.current.enteredAt = performance.now() / 1000;

    /** 当前步的进场进度（0→1，0.55s 缓动） */
    const prog = (t: number, dur = 0.55) => easeOutCubic(clamp01((t - stateRef.current.enteredAt) / dur));

    /** ① 提示气泡：带回弹的缩放进场 + 待机浮动，文字逐行淡入 */
    const drawBubble = (t: number, p: number, fadingOut = 0) => {
      const alpha = p * (1 - fadingOut);
      if (alpha <= 0.01) return;
      const s = 0.6 + 0.4 * easeOutBack(p);
      const bob = Math.sin(t * 1.8) * 2 * p;
      const cx = 265;
      const cy = 88 + bob;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(cx, cy);
      ctx.scale(s, s);
      ctx.translate(-cx, -cy);
      // 思考小圆点：从观鸟者头部走向气泡
      for (let i = 0; i < 2; i++) {
        const dp = clamp01(p * 1.6 - i * 0.35);
        if (dp <= 0) continue;
        ctx.globalAlpha = alpha * dp;
        ctx.fillStyle = PALETTE.blue;
        ctx.beginPath();
        ctx.arc(168 + i * 18, 128 - i * 16 + bob * 0.4, 3.5 - i * 1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = PALETTE.blue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(180, 60, 170, 56, 10);
      ctx.fill();
      ctx.stroke();
      // 气泡小尾巴
      ctx.beginPath();
      ctx.moveTo(196, 114);
      ctx.lineTo(188, 128);
      ctx.lineTo(208, 116);
      ctx.closePath();
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.stroke();
      // 文字逐行淡入
      const lines = ['白色头顶', '红喙、长腿'];
      ctx.fillStyle = PALETTE.ink;
      ctx.font = '13px sans-serif';
      lines.forEach((ln, i) => {
        const lp = clamp01(p * 2 - 0.3 - i * 0.4);
        if (lp <= 0) return;
        ctx.globalAlpha = alpha * lp;
        ctx.fillText(ln, 200, 84 + i * 20);
      });
      ctx.restore();
    };

    /** ② 嵌入卡片：从气泡位置飞来 + 向量条逐根生长，随后轻微脉动 */
    const drawEmbed = (t: number, p: number, withGlow: boolean) => {
      const fx = lerp(265, 420, easeOutCubic(p));
      const fy = lerp(88, 92, easeOutCubic(p));
      const float = Math.sin(t * 2) * 1.5 * p;
      if (p > 0.02) drawCard(ctx, fx, fy + float, { lines: 2, w: 44, h: 32, glow: withGlow ? PALETTE.blue : undefined });
      for (let i = 0; i < 8; i++) {
        const bp = clamp01(p * 2.2 - i * 0.15);
        if (bp <= 0) continue;
        const target = 6 + 14 * Math.abs(Math.sin(i * 1.7));
        const pulse = bp >= 1 ? 1 + 0.12 * Math.sin(t * 3 + i * 0.9) : 1;
        const h = target * easeOutCubic(bp) * pulse;
        const a = lerp(0.4, 1, bp);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = PALETTE.purple;
        ctx.fillRect(480 + i * 12, 110 - h + float, 8, h);
        ctx.restore();
      }
    };

    /** ③ 相似度连线：先描线生长，再流动虚线；分数从 0 数到 0.87 */
    const drawCompare = (t: number, p: number) => {
      drawCard(ctx, 420, 92, { lines: 2, w: 44, h: 32 });
      const x0 = 452;
      const y0 = 108;
      const cx = 600;
      const cy = 70;
      const x1 = 748;
      const y1 = 116;
      ctx.save();
      ctx.strokeStyle = PALETTE.green;
      ctx.lineWidth = 3;
      const LEN = 420; // 近似曲线长度，用于进度描线
      if (p < 1) {
        ctx.setLineDash([LEN, LEN]);
        ctx.lineDashOffset = LEN * (1 - p);
      } else {
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -(t * 24) % 14; // 完成后的流动方向：卡片 → 鸟
      }
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(cx, cy, x1, y1);
      ctx.stroke();
      ctx.setLineDash([]);
      // 沿线游走的比对光点（描线完成后）
      if (p >= 1) {
        const ft = (t * 0.9) % 1;
        const qx = (1 - ft) * (1 - ft) * x0 + 2 * (1 - ft) * ft * cx + ft * ft * x1;
        const qy = (1 - ft) * (1 - ft) * y0 + 2 * (1 - ft) * ft * cy + ft * ft * y1;
        ctx.fillStyle = PALETTE.green;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(qx, qy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      // 分数滚动
      const sp = easeOutCubic(clamp01((p - 0.25) / 0.75));
      if (sp > 0) {
        const val = 0.87 * sp;
        const scale = p >= 1 ? 1 + 0.06 * Math.sin(t * 2.4) : 1;
        ctx.translate(610, 78);
        ctx.scale(scale, scale);
        ctx.fillStyle = PALETTE.green;
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(val.toFixed(2), 0, 0);
        ctx.textAlign = 'left';
      }
      ctx.restore();
    };

    /** ④ 标签：名牌带轻微回弹落下 + 鸟身周围绿色涟漪 */
    const drawNaming = (t: number, p: number, bx: number, by: number) => {
      // 涟漪：两圈扩散
      for (let k = 0; k < 2; k++) {
        const rp = clamp01(p * 1.4 - k * 0.3);
        if (rp <= 0 || rp >= 1) continue;
        ctx.save();
        ctx.globalAlpha = (1 - rp) * 0.5;
        ctx.strokeStyle = PALETTE.green;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(bx + 2, by - 4, 14 + rp * 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      // 名牌（复刻 birdKit 的 named 样式，但带 easeOutBack 落下）
      const s = easeOutBack(clamp01(p * 1.3));
      if (s <= 0.02) return;
      const label = '白鹭';
      ctx.save();
      ctx.translate(bx, by - 21);
      ctx.scale(s, s);
      ctx.fillStyle = PALETTE.green;
      ctx.font = '11px sans-serif';
      const w = ctx.measureText(label).width + 8;
      ctx.fillRect(-w / 2, -7, w, 14);
      ctx.fillStyle = '#fff';
      ctx.fillText(label, -w / 2 + 4, 4);
      ctx.restore();
    };

    const render = (t: number) => {
      const s = stateRef.current;
      clearScene(ctx, W, H);

      // 观鸟者待机呼吸感
      drawBirder(ctx, 130, 190 + Math.sin(t * 1.6) * 1.5);

      const p = prog(t);
      const birdX = 760;
      const birdY = 120;
      drawBird(ctx, birdX, birdY, t, { state: 'plain', body: PALETTE.orange });

      if (s.step === 1) {
        drawBubble(t, p);
      } else if (s.step === 2) {
        drawBubble(t, 1, p); // 气泡淡出
        drawEmbed(t, p, true);
      } else if (s.step === 3) {
        drawCompare(t, p);
      } else {
        // ④ 标签：保留对比结果作背景，主动作画在鸟上
        drawCompare(t, 1);
        drawNaming(t, p, birdX, birdY);
      }

      // 底部 4 个阶段块 + 平滑填充的连接线
      const anims = stageAnimRef.current;
      for (let i = 0; i < 4; i++) {
        const a = anims[i];
        const tgtCur = s.step === i + 1 ? 1 : 0;
        const tgtDone = s.step > i + 1 ? 1 : 0;
        a.cur += (tgtCur - a.cur) * 0.14;
        a.done += (tgtDone - a.done) * 0.14;
      }
      // 连接线：块间 40px 空隙，按上一步完成度填充
      for (let i = 0; i < 3; i++) {
        const gx0 = 110 + i * 230 + 190;
        const gx1 = gx0 + 40;
        const gy = 238;
        ctx.strokeStyle = PALETTE.border;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gx0, gy);
        ctx.lineTo(gx1, gy);
        ctx.stroke();
        const f = anims[i].done;
        if (f > 0.02) {
          ctx.strokeStyle = PALETTE.green;
          ctx.beginPath();
          ctx.moveTo(gx0, gy);
          ctx.lineTo(gx0 + 40 * f, gy);
          ctx.stroke();
        }
      }
      for (let i = 0; i < 4; i++) {
        const x = 110 + i * 230;
        const y = 218;
        const a = anims[i];
        const curPulse = a.cur * (0.5 + 0.5 * Math.sin(t * 4));
        ctx.save();
        ctx.fillStyle = lerpColor(lerpColor('#f3f5f9', '#eef4ff', a.cur), '#eef8f1', a.done);
        ctx.strokeStyle = lerpColor(lerpColor(PALETTE.border, PALETTE.blue, a.cur), PALETTE.green, a.done);
        ctx.lineWidth = 1.5 + 1.5 * a.cur + 0.8 * curPulse;
        ctx.beginPath();
        ctx.roundRect(x, y, 190, 40, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = lerpColor(lerpColor(PALETTE.muted, PALETTE.blue, a.cur), PALETTE.green, a.done);
        ctx.font = (a.cur > 0.5 ? 'bold ' : '') + '15px sans-serif';
        ctx.fillText(STAGES[i], x + 18, y + 26);
        // 完成勾：随 done 值缩放画出
        if (a.done > 0.03) {
          const ds = easeOutBack(clamp01(a.done));
          ctx.save();
          ctx.translate(x + 88, y + 20);
          ctx.scale(ds, ds);
          ctx.strokeStyle = PALETTE.green;
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(-4, 0);
          ctx.lineTo(-1, 4);
          ctx.lineTo(6, -4);
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }
    };

    const tick = () => {
      render(performance.now() / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const go = (next: number) => {
    const v = Math.max(1, Math.min(4, next));
    stateRef.current.step = v;
    stateRef.current.enteredAt = performance.now() / 1000;
    setStep(v);
    setFeedback(FEEDBACK[v - 1]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={() => go(step - 1)} disabled={step <= 1}>
          上一步
        </button>
        <button type="button" onClick={() => go(step + 1)} disabled={step >= 4}>
          下一步
        </button>
        {step >= 4 && (
          <button type="button" onClick={() => go(1)}>
            重新开始
          </button>
        )}
        <label>
          第 <span className="val">{step}</span> / 4 步
        </label>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M1_2;
