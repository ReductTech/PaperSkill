import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawWorker,
  drawBox,
  drawCabinet,
  drawManual,
  drawVerdict,
  drawSceneLabel,
} from './flatKit';
import type { WidgetProps } from './registry';

// 模块 1.1（P3 双店检查台）：同一份改装清单在两家店逐项过检。
// 左：闭源黑箱柜店（红✗ + 短标签）；右：开源平板店（绿✓）。共享一个开始/重放按钮。
const W = 1080;
const H = 280;
const ITEMS = ['下载权重', '改结构', '微调新任务', '消费级显卡跑'];
const LEFT_TAGS = ['不支持', '闭锁', '无API', '需大算力'];
const STEP_MS = 450;

type Phase = 'idle' | 'running' | 'done';

export const Ch1Access: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ phase: Phase; start: number; emitted: boolean }>({
    phase: 'idle',
    start: 0,
    emitted: false,
  });
  const [phase, setPhase] = useState<Phase>('idle');
  const [feedback, setFeedback] = useState({
    text: '按开始，对比两家店。',
    cls: '',
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
    let raf = 0;

    const render = (_ms: number) => {
      const ms = performance.now();
      const s = stateRef.current;
      let lit = 0;
      if (s.phase === 'running') {
        const el = ms - s.start;
        lit = Math.min(ITEMS.length, Math.floor(el / STEP_MS) + 1);
        if (el >= ITEMS.length * STEP_MS) {
          s.phase = 'done';
          if (!s.emitted) {
            s.emitted = true;
            setPhase('done');
            setFeedback({
              text: '下载、改造、微调、小显卡四项全通——<b>开源不只是公开权重，是整条流水线可用</b>：模型、代码、微调笔记本全放出来了。',
              cls: 'good',
            });
          }
          lit = ITEMS.length;
        }
      } else if (s.phase === 'done') {
        lit = ITEMS.length;
      }

      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);
      // divider between the two stores
      ctx.save();
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(540, 16);
      ctx.lineTo(540, 250);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // ---- LEFT: closed-source black-box store ----
      drawSceneLabel(ctx, '闭源黑箱店', 20, 26, { color: C.red });
      drawCabinet(ctx, 105, 210, 1.5, { assembled: true });
      ctx.save();
      ctx.strokeStyle = C.red;
      ctx.fillStyle = C.red;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(105, 164, 4.5, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(99, 164, 12, 10, 2);
      ctx.fill();
      ctx.restore();
      drawWorker(ctx, 215, 212, 1.4, { mode: 'locked', t: ms / 400, color: C.red });

      // ---- RIGHT: open-source flat-pack store ----
      drawSceneLabel(ctx, '开源平板店', 560, 26, { color: C.green });
      drawBox(ctx, 625, 212, 1.5);
      drawManual(ctx, 720, 224, 1.3);
      drawWorker(ctx, 800, 212, 1.4, { mode: 'build', t: ms / 400, color: C.green });

      // ---- synchronized checklist rows ----
      // each item word sits inside a framed box (dashed grey when off, solid
      // blue when lit) so the four checklist items read as distinct badges
      const drawItemBox = (x: number, y: number, item: string, on: boolean) => {
        ctx.save();
        ctx.font = '13px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
        const tw = ctx.measureText(item).width;
        const bw = tw + 18;
        if (on) {
          ctx.fillStyle = '#eef3fb';
          ctx.strokeStyle = C.blue;
          ctx.lineWidth = 1.75;
          ctx.setLineDash([]);
        } else {
          ctx.fillStyle = C.white;
          ctx.strokeStyle = C.border;
          ctx.lineWidth = 1.25;
          ctx.setLineDash([4, 3]);
        }
        ctx.beginPath();
        ctx.roundRect(x - 6, y - 14, bw, 28, 6);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = on ? C.blue : C.muted;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(item, x + 3, y + 1);
        ctx.restore();
        return bw;
      };
      ITEMS.forEach((item, i) => {
        const y = 64 + i * 52;
        const on = i < lit;
        // left: verdict + boxed item + short rejection tag
        if (on) {
          drawVerdict(ctx, 300, y, false, {
            r: 10,
            pulse: s.phase === 'done' ? (ms % 600) / 600 : i === lit - 1 ? (ms % 500) / 500 : 0,
          });
        } else {
          ctx.save();
          ctx.strokeStyle = C.border;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(300, y, 8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }
        drawItemBox(322, y, item, on);
        if (on) drawSceneLabel(ctx, LEFT_TAGS[i], 452, y, { color: C.red });
        // right: verdict + boxed item
        if (on) {
          drawVerdict(ctx, 880, y, true, {
            r: 10,
            pulse: s.phase === 'done' ? (ms % 600) / 600 : i === lit - 1 ? (ms % 500) / 500 : 0,
          });
        } else {
          ctx.save();
          ctx.strokeStyle = C.border;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(880, y, 8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }
        drawItemBox(902, y, item, on);
      });
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onStart = () => {
    stateRef.current = { phase: 'running', start: performance.now(), emitted: false };
    setPhase('running');
    setFeedback({ text: '逐项检查中……', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="tiny" onClick={onStart}>
          {phase === 'idle' ? '开始' : '重放'}
        </button>
      </div>
      <div
        className={`feedback ${feedback.cls}`}
        dangerouslySetInnerHTML={{ __html: feedback.text }}
      />
    </div>
  );
};

export default Ch1Access;
