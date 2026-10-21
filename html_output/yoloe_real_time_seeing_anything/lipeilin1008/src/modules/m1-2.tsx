import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { PALETTE, clearScene, drawBirder, drawBird, drawCard, drawSceneLabel } from './birdKit';

// m1-2 (core-loop) — YOLOE 的看见循环：提示→嵌入→对比→标签，四步步进。

const W = 1080;
const H = 280;
const STAGES = ['① 提示', '② 嵌入', '③ 对比', '④ 标签'];
const FEEDBACK = [
  { text: '① 给出提示：用文字描述要找的目标。', cls: '' },
  { text: '② 提示被翻译成模型懂的嵌入向量。', cls: '' },
  { text: '③ 拿嵌入和每个锚点比对相似度。', cls: '' },
  { text: '④ 最像的就是答案——类别名由此而来。', cls: 'good' },
];

export const M1_2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 1 });
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

    const render = (t: number) => {
      const s = stateRef.current;
      clearScene(ctx, W, H);

      // 上方场景：观鸟者与一只待认的鸟
      drawBirder(ctx, 130, 190);
      drawBird(ctx, 760, 120, t, { state: s.step >= 4 ? 'named' : 'plain', body: PALETTE.orange, label: '白鹭' });

      if (s.step === 1) {
        // 描述气泡
        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = PALETTE.blue;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(180, 60, 170, 56, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = PALETTE.ink;
        ctx.font = '13px sans-serif';
        ctx.fillText('白色头顶', 200, 84);
        ctx.fillText('红喙、长腿', 200, 104);
        ctx.restore();
      } else if (s.step === 2) {
        // 描述被抄成卡片 + 嵌入向量小条
        drawCard(ctx, 420, 92, { lines: 2, w: 44, h: 32, glow: PALETTE.blue });
        for (let i = 0; i < 8; i++) {
          const h = 6 + 14 * Math.abs(Math.sin(i * 1.7));
          ctx.fillStyle = PALETTE.purple;
          ctx.fillRect(480 + i * 12, 110 - h, 8, h);
        }
      } else if (s.step === 3) {
        // 卡片与鸟之间的相似度连线 + 分数
        drawCard(ctx, 420, 92, { lines: 2, w: 44, h: 32 });
        ctx.save();
        ctx.strokeStyle = PALETTE.green;
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(452, 108);
        ctx.quadraticCurveTo(600, 70, 748, 116);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = PALETTE.green;
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('0.87', 590, 78);
        ctx.restore();
      }

      // 底部 4 个阶段块
      for (let i = 0; i < 4; i++) {
        const x = 110 + i * 230;
        const y = 218;
        const cur = s.step === i + 1;
        const done = s.step > i + 1;
        ctx.save();
        ctx.fillStyle = cur ? '#eef4ff' : done ? '#eef8f1' : '#f3f5f9';
        ctx.strokeStyle = cur ? PALETTE.blue : done ? PALETTE.green : PALETTE.border;
        ctx.lineWidth = cur ? 3 : 1.5;
        ctx.beginPath();
        ctx.roundRect(x, y, 190, 40, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = cur ? PALETTE.blue : done ? PALETTE.green : PALETTE.muted;
        ctx.font = (cur ? 'bold ' : '') + '15px sans-serif';
        ctx.fillText(STAGES[i] + (done ? ' ✓' : ''), x + 18, y + 26);
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
