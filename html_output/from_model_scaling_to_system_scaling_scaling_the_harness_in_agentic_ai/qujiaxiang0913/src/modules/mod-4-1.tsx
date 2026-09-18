import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { clearScene, drawBars, C } from './lighthouseKit';
import type { WidgetProps } from './registry';

// §4 Module 4.1 — 点击六个部件（P5 点击热点）。
// Canvas 内六个可点击矩形热点 + 下方六个等价键盘按钮。

const W = 1080;
const H = 300;

const COMPONENTS = [
  { sym: 'ℛ', name: '推理基座', resp: '基础推理质量（模型规模化主要提升它）。', off: '关掉它，外壳再完整也没有真正的推理。' },
  { sym: 'ℳ', name: '记忆', resp: '记忆质量；保存跨轮次可复用的内容。', off: '换掉它，同一个模型会表现成另一个智能体。' },
  { sym: '𝒞', name: '上下文', resp: '上下文构造质量；决定每轮送进模型什么。', off: '换掉它，同一个模型会表现成另一个智能体。' },
  { sym: '𝒮', name: '技能路由', resp: '技能选择与组合质量；把任务派给谁。', off: '换掉它，同一个模型会表现成另一个智能体。' },
  { sym: '𝒪', name: '编排', resp: '编排质量；把六部件串成一整夜的流程。', off: '换掉它，同一个模型会表现成另一个智能体。' },
  { sym: '𝒢', name: '校验治理', resp: '治理质量；门控中间推理与外部动作。', off: '换掉它，同一个模型会表现成另一个智能体。' },
] as const;

const RECT_W = 150;
const RECT_H = 120;
const RECT_Y = 15;
const GAP = 24;
const START_X = 30;
const rectX = (i: number) => START_X + i * (RECT_W + GAP);

export const Mod41: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selRef = useRef(-1);
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState(-1);
  const [feedback, setFeedback] = useState({ text: '点选一个部件，看看它归谁管。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { sel: number }) => {
      clearScene(ctx, W, H);
      const t = performance.now() / 1000;
      COMPONENTS.forEach((c, i) => {
        const x = rectX(i);
        const y = RECT_Y;
        const isSel = i === s.sel;
        if (isSel) {
          const a = 0.3 + 0.3 * Math.sin(t * 3);
          ctx.save();
          ctx.strokeStyle = C.beam;
          ctx.globalAlpha = a;
          ctx.lineWidth = 10;
          ctx.strokeRect(x - 5, y - 5, RECT_W + 10, RECT_H + 10);
          ctx.restore();
          ctx.strokeStyle = C.beam;
          ctx.lineWidth = 4;
          ctx.strokeRect(x, y, RECT_W, RECT_H);
          ctx.fillStyle = C.ink;
          ctx.textAlign = 'center';
          ctx.font = '30px "Segoe UI", "Microsoft YaHei", sans-serif';
          ctx.fillText(c.sym, x + RECT_W / 2, y + 52);
          ctx.font = '17px "Segoe UI", "Microsoft YaHei", sans-serif';
          ctx.fillText(c.name, x + RECT_W / 2, y + 96);
          ctx.textAlign = 'left';
        } else {
          ctx.strokeStyle = C.line;
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, RECT_W, RECT_H);
          ctx.fillStyle = C.inkMuted;
          ctx.textAlign = 'center';
          ctx.font = '28px "Segoe UI", "Microsoft YaHei", sans-serif';
          ctx.fillText(c.sym, x + RECT_W / 2, y + 52);
          ctx.font = '15px "Segoe UI", "Microsoft YaHei", sans-serif';
          ctx.fillText(c.name, x + RECT_W / 2, y + 96);
          ctx.textAlign = 'left';
        }
      });
      const modelVal = s.sel === 0 ? 1.0 : 0.2;
      const sysVal = s.sel === 0 ? 0.1 : 1.0;
      drawBars(ctx, 40, 170, 1000, [
        { label: '模型规模化是否直接提升', value: modelVal, color: C.beam },
        { label: '系统规模化是否直接提升', value: sysVal, color: C.aux },
      ]);
    };

    const tick = () => {
      render({ sel: selRef.current });
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

  const select = (idx: number) => {
    selRef.current = idx;
    setSel(idx);
    if (idx === 0) {
      setFeedback({ text: '只有这一项主要由模型规模化提升。', cls: '' });
    } else {
      setFeedback({
        text: '这一项由系统规模化提升：换掉它，同一个模型会表现成另一个智能体。',
        cls: 'good',
      });
    }
  };

  const onClickCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (y < RECT_Y || y > RECT_Y + RECT_H) return;
    for (let i = 0; i < COMPONENTS.length; i++) {
      const rx = rectX(i);
      if (x >= rx && x <= rx + RECT_W) {
        select(i);
        return;
      }
    }
  };

  const cur = sel >= 0 ? COMPONENTS[sel] : null;

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} onClick={onClickCanvas} style={{ cursor: 'pointer' }} />
      <div className="ctrl">
        {COMPONENTS.map((c, i) => (
          <button
            key={c.sym}
            className="chip"
            aria-pressed={sel === i}
            onClick={() => select(i)}
          >
            {c.sym} {c.name}
          </button>
        ))}
      </div>
      <div className="detail">
        {cur ? (
          <span>
            <strong>
              {cur.sym} {cur.name}
            </strong>
            <span> 职责：{cur.resp}</span>
            <span> 关掉/换掉它会怎样：{cur.off}</span>
          </span>
        ) : (
          <span>点选一个部件以查看详情。</span>
        )}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Mod41;
