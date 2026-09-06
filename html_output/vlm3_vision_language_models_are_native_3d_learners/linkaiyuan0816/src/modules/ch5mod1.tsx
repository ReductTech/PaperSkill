import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawWindow, drawDot, label } from './vlm3Draw';
import type { WidgetProps } from './registry';

const W = 560;
const H = 240;

type Task = 'depth' | 'object' | 'corr' | 'pose';

const OUTS: Record<Task, string> = {
  depth: 'depth ≈ 4.6 m @ [1020,880]',
  object: 'width≈1.2m  dist≈6.0m  bbox[800,600,1200,1400]',
  corr: 'match A[900,700] → B[1120,740]',
  pose: 'Δt=0.8m  yaw=12° pitch=-3° roll=1°',
};

const MSGS: Record<Task, string> = {
  depth: '度量深度：文本像素坐标 → 到相机的米制距离；同图可打包多 QA。',
  object: '物体级：文本 bbox 引用物体，定性/定量共用接口，无需区域编码器。',
  corr: '像素对应：左图查询点 → 右图匹配点，皆为 [0,2000) 文本坐标。',
  pose: '相机位姿：平移距离 / 方向向量 / yaw-pitch-roll，文本 SFT 即可。',
};

function tasksForModule(moduleId: string): Task[] {
  if (moduleId === '6.1') return ['depth'];
  if (moduleId === '6.2') return ['object'];
  if (moduleId === '7.1') return ['corr', 'pose'];
  return ['depth', 'object', 'corr', 'pose'];
}

const LABELS: Record<Task, string> = {
  depth: '深度',
  object: '物体',
  corr: '对应',
  pose: '位姿',
};

export const Ch5Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const allowed = tasksForModule(moduleId);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ task: Task }>({ task: allowed[0] });
  const rafRef = useRef<number | null>(null);
  const [task, setTask] = useState<Task>(allowed[0]);
  const [feedback, setFeedback] = useState({ text: MSGS[allowed[0]], cls: 'good' });

  useEffect(() => {
    const first = tasksForModule(moduleId)[0];
    stateRef.current.task = first;
    setTask(first);
    setFeedback({ text: MSGS[first], cls: 'good' });
  }, [moduleId]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const render = () => {
      const t = stateRef.current.task;
      ctx.clearRect(0, 0, W, H); drawSceneBg(ctx, W, H);
      drawWindow(ctx, 40, 30, 220, 150, C.blue);
      if (t === 'depth') {
        drawDot(ctx, 130, 100, 6, C.orange);
        ctx.strokeStyle = C.orange; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(150, 55); ctx.lineTo(130, 100); ctx.stroke();
      }
      if (t === 'object') {
        ctx.strokeStyle = C.orange; ctx.lineWidth = 2;
        ctx.strokeRect(90, 70, 100, 80);
      }
      if (t === 'corr') {
        drawWindow(ctx, 40, 30, 100, 150, C.blue);
        drawWindow(ctx, 160, 30, 100, 150, C.green);
        drawDot(ctx, 80, 100, 5, C.orange);
        drawDot(ctx, 210, 110, 5, C.green);
        ctx.strokeStyle = C.green; ctx.beginPath(); ctx.moveTo(80, 100); ctx.lineTo(210, 110); ctx.stroke();
      }
      if (t === 'pose') {
        label(ctx, '视角A', 60, 50, C.red, 12);
        label(ctx, '视角B', 180, 50, C.green, 12);
        ctx.strokeStyle = C.purple; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(100, 140); ctx.lineTo(200, 120); ctx.stroke();
      }
      ctx.fillStyle = '#fff'; ctx.strokeStyle = C.blue; ctx.lineWidth = 2;
      ctx.fillRect(300, 50, 230, 120); ctx.strokeRect(300, 50, 230, 120);
      label(ctx, '提示 → 文本输出', 320, 80, C.blue, 13);
      label(ctx, OUTS[t], 310, 120, C.text, 11);
    };
    const tick = () => { render(); canvas.classList.add('is-ready'); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const d = observeCanvas(canvas, start, stop);
    return () => { stop(); d(); };
  }, []);

  const pick = (t: Task) => {
    stateRef.current.task = t; setTask(t);
    setFeedback({ text: MSGS[t], cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      {allowed.length > 1 ? (
        <div className="ctrl">
          {allowed.map((k) => (
            <button key={k} type="button" className={`chip ${task === k ? 'on' : ''}`} onClick={() => pick(k)}>
              {LABELS[k]}
            </button>
          ))}
        </div>
      ) : null}
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch5Mod1;
