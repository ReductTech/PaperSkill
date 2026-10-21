import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { PALETTE, clearScene, drawSceneLabel, insetBox } from './birdKit';

// m9-1 (roadmap-steps) — 六步路线图：从 YOLO-Worldv2 到 YOLOE（Tab 5，v8-L、30 轮口径）。

const W = 1080;
const H = 280;

const NODES = [
  { name: 'Worldv2-L 基线', ap: 33.0, fps: 80.0 },
  { name: '砍到 30 轮', ap: 31.0, fps: 80.0 },
  { name: '+全局负例字典', ap: 31.9, fps: 80.0 },
  { name: '−跨模态融合', ap: 30.0, fps: 102.5 },
  { name: '+MobileCLIP', ap: 31.5, fps: 102.5 },
  { name: '+RepRTA', ap: 33.5, fps: 102.5 },
  { name: '+分割头 = YOLOE', ap: 33.3, fps: 102.5 },
];
const FEEDBACK = [
  { text: '基线 33.0 AP / 80 FPS：强大但昂贵。', cls: '' },
  { text: '砍到 30 轮：省时间，AP 付 2.0 学费。', cls: 'bad' },
  { text: '全局负例字典：+0.9，白赚。', cls: 'good' },
  { text: '去掉跨模态融合：−1.9 AP，但提速 1.28×——本章最贵的一次交换。', cls: 'bad' },
  { text: '换 MobileCLIP：+1.5，把亏空补回大半。', cls: 'good' },
  { text: 'RepRTA：+2.3 AP，推理一分不多花。', cls: 'good' },
  { text: '加分割头：−0.2 AP 换来分割万物的能力。', cls: 'good' },
];
const X0 = 90;
const DX = 96;

export const M9_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const apY = (ap: number) => 150 - ((ap - 29) / 5.5) * 100;
    const fpsY = (fps: number) => 246 - ((fps - 75) / 32) * 62;

    const render = (t: number) => {
      const s = stateRef.current;
      clearScene(ctx, W, H);
      drawSceneLabel(ctx, 'AP', 30, 56, PALETTE.ink);
      drawSceneLabel(ctx, 'FPS', 30, 200, PALETTE.ink);

      // AP 折线（点亮到当前步）
      for (let i = 0; i < NODES.length - 1; i++) {
        const a = NODES[i];
        const b = NODES[i + 1];
        const lit = i < s.step - 1;
        const up = b.ap >= a.ap;
        ctx.save();
        ctx.strokeStyle = lit ? (up ? PALETTE.green : PALETTE.red) : '#d5dbe4';
        ctx.lineWidth = lit ? 3 : 2;
        ctx.beginPath();
        ctx.moveTo(X0 + i * DX, apY(a.ap));
        ctx.lineTo(X0 + (i + 1) * DX, apY(b.ap));
        ctx.stroke();
        ctx.restore();
      }
      // FPS 阶梯
      for (let i = 0; i < NODES.length - 1; i++) {
        const a = NODES[i];
        const b = NODES[i + 1];
        const lit = i < s.step - 1;
        ctx.save();
        ctx.strokeStyle = lit ? PALETTE.blue : '#d5dbe4';
        ctx.lineWidth = lit ? 3 : 2;
        ctx.beginPath();
        ctx.moveTo(X0 + i * DX, fpsY(a.fps));
        ctx.lineTo(X0 + (i + 1) * DX, fpsY(a.fps));
        ctx.stroke();
        if (b.fps !== a.fps) {
          ctx.beginPath();
          ctx.moveTo(X0 + (i + 1) * DX, fpsY(a.fps));
          ctx.lineTo(X0 + (i + 1) * DX, fpsY(b.fps));
          ctx.stroke();
          if (lit) {
            ctx.fillStyle = PALETTE.blue;
            ctx.font = 'bold 13px sans-serif';
            ctx.fillText('1.28×', X0 + (i + 1) * DX - 18, fpsY(b.fps) - 8);
          }
        }
        ctx.restore();
      }
      // 节点
      NODES.forEach((n, i) => {
        const x = X0 + i * DX;
        const cur = i === s.step - 1;
        const reached = i <= s.step - 1;
        const isEnd = i === NODES.length - 1;
        // 终点 YOLOE 绿色光环
        if (isEnd && reached) {
          ctx.save();
          ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 4);
          ctx.strokeStyle = PALETTE.green;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, apY(n.ap), 13, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        ctx.save();
        ctx.fillStyle = cur ? PALETTE.orange : reached ? PALETTE.green : '#c3ccd9';
        ctx.beginPath();
        ctx.arc(x, apY(n.ap), cur ? 8 : 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PALETTE.ink;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(n.ap.toFixed(1), x, apY(n.ap) - 12);
        ctx.fillText(n.fps.toFixed(0), x, fpsY(n.fps) + 18);
        ctx.textAlign = 'left';
        ctx.restore();
      });

      // 右下 inset：当前步名称与得失
      insetBox(ctx, 740, 60, 300, 170);
      drawSceneLabel(ctx, '第 ' + s.step + ' / 7 步', 764, 94, PALETTE.muted);
      ctx.save();
      ctx.fillStyle = PALETTE.ink;
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(NODES[s.step - 1].name, 764, 128);
      ctx.font = '14px sans-serif';
      ctx.fillStyle = PALETTE.muted;
      ctx.fillText('AP ' + NODES[s.step - 1].ap.toFixed(1) + ' · FPS ' + NODES[s.step - 1].fps.toFixed(1), 764, 160);
      ctx.restore();
      drawSceneLabel(ctx, '谁买单？谁受益？', 764, 200, PALETTE.blue);
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
    const v = Math.max(1, Math.min(7, next));
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
        <button type="button" onClick={() => go(step + 1)} disabled={step >= 7}>
          下一步
        </button>
        <label>
          第 <span className="val">{step}</span> / 7 步
        </label>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M9_1;
