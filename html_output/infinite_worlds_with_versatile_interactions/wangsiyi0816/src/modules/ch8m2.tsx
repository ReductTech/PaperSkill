import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas } from '../lib/canvasKit';
import { PAL, clearPanel, drawLegend, drawSceneLabel, wrapText, setupCrispCanvas } from './knitKit';
import type { WidgetProps } from './registry';

const W = 720;
const H = 300;

type Mode = 'A' | 'B' | 'intervene';

interface Spec {
  chip: string;
  accent: string;
  events: string[];
  note: string;
  feedback: string;
}

const SPECS: Record<Mode, Spec> = {
  A: {
    chip: '模式 A · 直接语义',
    accent: PAL.blue,
    events: ['开门', '开灯', '离开'],
    note: '导演直接分析当前帧并生成事件卡，无需显式物体掩码。',
    feedback:
      '模式 A · 直接语义交互：导演直接看当前帧就生成事件卡，不需要显式的物体掩码，适合与环境整体互动。',
  },
  B: {
    chip: '模式 B · SAM 跟踪',
    accent: PAL.purple,
    events: ['把门把手向下压并向前推开门', '转动手中的球查看黑白面板'],
    note: '导演认出可交互物体，SAM 跨块持续跟踪并维持空间一致性，导演再推断其状态变化。',
    feedback:
      '模式 B · 跟踪辅助：导演先认出可交互物体，SAM 跨块持续跟踪它以维持空间一致性，导演再推断该物体的状态变化交给飞行员执行。',
  },
  intervene: {
    chip: '世界干预 · 文本',
    accent: PAL.orange,
    events: ['把白天切换到夜晚', '召来一场暴雪', '让一群鸟突然出现'],
    note: '用户以文本充当创作者，直接改写世界状态；导演负责把它合理整合进正在进行的叙事。',
    feedback:
      '世界干预：用户用文本直接改写世界——全局状态切换（昼夜、暴雪）或局部实体注入（一群鸟）；由导演决定最合理的时空入场点。',
  },
};

const ORDER: Mode[] = ['A', 'B', 'intervene'];
const FRAME = { x: 40, y: 60, w: 336, h: 214 };

export const Ch8M2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ mode: Mode }>({ mode: 'A' });
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<Mode>('A');
  const [feedback, setFeedback] = useState({ text: SPECS.A.feedback, cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    let detachCrisp: () => void;
    try {
      const crisp = setupCrispCanvas(canvas, W, H);
      ctx = crisp.ctx;
      detachCrisp = crisp.detach;
    } catch {
      return;
    }

    const render = (s: { mode: Mode }, time: number) => {
      const spec = SPECS[s.mode];
      clearPanel(ctx, W, H);

      // the scene frame with two schematic interactive objects
      ctx.fillStyle = PAL.paper;
      ctx.strokeStyle = PAL.axis;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(FRAME.x, FRAME.y, FRAME.w, FRAME.h);
      ctx.fill();
      ctx.stroke();

      // door
      ctx.strokeStyle = PAL.envDark;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(FRAME.x + 40, FRAME.y + 58, 68, 116);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(FRAME.x + 96, FRAME.y + 118, 4, 0, Math.PI * 2);
      ctx.stroke();
      // ball
      const ballX = FRAME.x + 226;
      const ballY = FRAME.y + 128;
      ctx.beginPath();
      ctx.arc(ballX, ballY, 30, 0, Math.PI * 2);
      ctx.stroke();

      if (s.mode === 'A') {
        ctx.fillStyle = 'rgba(39,68,110,0.10)';
        ctx.fillRect(FRAME.x + 1, FRAME.y + 1, FRAME.w - 2, FRAME.h - 2);
        ctx.fillStyle = PAL.blue;
        ctx.font = '600 13px "Segoe UI", sans-serif';
        ctx.fillText('整帧语义', FRAME.x + 12, FRAME.y + 24);
      } else if (s.mode === 'B') {
        ctx.save();
        ctx.strokeStyle = PAL.purple;
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        for (const dx of [16, 32]) {
          ctx.globalAlpha = dx === 16 ? 0.4 : 0.22;
          ctx.beginPath();
          ctx.rect(ballX - 34 + dx, ballY - 34, 68, 68);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(ballX - 34, ballY - 34, 68, 68);
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = PAL.purple;
        ctx.font = '600 13px "Segoe UI", sans-serif';
        ctx.fillText('跨块跟踪', ballX - 34, ballY - 42);
      } else {
        ctx.fillStyle = 'rgba(217,119,6,0.16)';
        ctx.fillRect(FRAME.x + 1, FRAME.y + 1, FRAME.w - 2, 28);
        ctx.fillStyle = PAL.orange;
        ctx.font = '600 13px "Segoe UI", sans-serif';
        ctx.fillText('文本干预', FRAME.x + 12, FRAME.y + 20);
        ctx.fillStyle = PAL.orange;
        for (let k = 0; k < 14; k++) {
          const sx = FRAME.x + 20 + ((k * 37) % (FRAME.w - 40));
          const sy = FRAME.y + 40 + (((time / 26 + k * 31) % (FRAME.h - 56)) | 0);
          ctx.globalAlpha = 0.55;
          ctx.beginPath();
          ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // event proposal cards
      ctx.fillStyle = PAL.muted;
      ctx.font = '600 12px "Segoe UI", sans-serif';
      ctx.font = '600 13px "Segoe UI", sans-serif';
      ctx.fillText('事件方案', 400, 52);
      const tall = spec.events.length <= 2;
      spec.events.forEach((t, i) => {
        const ch = tall ? 58 : 44;
        const cy = 64 + i * (ch + 12);
        ctx.fillStyle = PAL.paper;
        ctx.strokeStyle = PAL.axis;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(400, cy, 296, ch);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = spec.accent;
        ctx.beginPath();
        ctx.arc(414, cy + 20, 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PAL.ink;
        ctx.font = '13px "Segoe UI", sans-serif';
        wrapText(ctx, t, 428, cy + 26, 256, 17);
      });

      ctx.fillStyle = PAL.muted;
      ctx.font = '13px "Segoe UI", sans-serif';
      wrapText(ctx, spec.note, 400, 250, 296, 18);

      drawSceneLabel(ctx, 40, 40, spec.chip);
      drawLegend(ctx, 40, 296, [
        { color: PAL.blue, label: '语义' },
        { color: PAL.purple, label: '跟踪' },
        { color: PAL.orange, label: '干预' },
      ]);
    };

    const tick = (t: number) => {
      render(stateRef.current, t);
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
      detachCrisp();
    };
  }, []);

  const select = (m: Mode) => {
    stateRef.current.mode = m;
    setMode(m);
    setFeedback({ text: SPECS[m].feedback, cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {ORDER.map((m) => (
          <button
            key={m}
            className={`chip${mode === m ? ' selected' : ''}`}
            onClick={() => select(m)}
          >
            {SPECS[m].chip}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch8M2;
