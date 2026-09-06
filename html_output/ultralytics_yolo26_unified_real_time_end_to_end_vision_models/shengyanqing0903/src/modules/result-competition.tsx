import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clear, dot, label, metric } from './yolo-shared';

type Goal = 'latency' | 'accuracy' | 'nmsfree';
type Protocol = 'nonE2E' | 'E2E';
const W = 760;
const H = 420;
const data = [
  { m: 'n', non: 40.9, e2e: 40.1, ms: 1.7 },
  { m: 's', non: 48.6, e2e: 47.8, ms: 2.5 },
  { m: 'm', non: 53.1, e2e: 52.5, ms: 4.7 },
  { m: 'l', non: 55.0, e2e: 54.4, ms: 6.2 },
  { m: 'x', non: 57.5, e2e: 56.9, ms: 11.8 },
];

export const ResultCompetition: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [goal, setGoal] = useState<Goal>('latency');
  const [protocol, setProtocol] = useState<Protocol>('nonE2E');
  const [progress, setProgress] = useState(1);
  const [running, setRunning] = useState(false);

  const chooseGoal = (nextGoal: Goal) => {
    setGoal(nextGoal);
    if (nextGoal === 'nmsfree') setProtocol('E2E');
    setProgress(0);
  };

  useEffect(() => {
    if (!running) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgress(1);
      setRunning(false);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const nextProgress = Math.min(1, (now - start) / 1800);
      setProgress(nextProgress);
      if (nextProgress < 1) frame = requestAnimationFrame(tick);
      else setRunning(false);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    clear(ctx, W, H);
    ctx.fillStyle = '#fff';
    ctx.fillRect(38, 36, 510, 315);
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(78, 315);
    ctx.lineTo(522, 315);
    ctx.moveTo(78, 315);
    ctx.lineTo(78, 70);
    ctx.stroke();
    label(ctx, 'T4 TensorRT10 延迟（ms）→', 305, 338, C.muted, 11, 600);
    ctx.save();
    ctx.translate(22, 220);
    ctx.rotate(-Math.PI / 2);
    label(ctx, 'COCO val50–95 AP ↑', 0, 0, C.muted, 11, 600);
    ctx.restore();

    const selected = goal === 'latency' ? 'n' : 'x';
    data.forEach(item => {
      const ap = protocol === 'E2E' ? item.e2e : item.non;
      const x = 82 + (item.ms / 12) * 425;
      const y = 312 - ((ap - 38) / 22) * 230 * progress;
      const active = item.m === selected;
      dot(ctx, x, y, active ? C.green : protocol === 'E2E' ? C.blue : C.orange, active ? 9 : 6);
      label(ctx, `26${item.m}`, x - 12, y - 16, active ? C.green : C.muted, 11, 700);
    });

    metric(ctx, 575, 74, 160, '当前协议', protocol === 'E2E' ? '端到端 · 无 NMS' : '带 NMS', protocol === 'E2E' ? C.blue : C.orange);
    metric(ctx, 575, 145, 160, '推荐型号', goal === 'latency' ? 'YOLO26n' : 'YOLO26x', C.green);
    metric(ctx, 575, 216, 160, goal === 'latency' ? '最低延迟' : '最高 AP', goal === 'latency' ? '1.7 ms' : protocol === 'E2E' ? '56.9' : '57.5', C.green);
    label(ctx, '输入 640 · Table 7', 585, 303, C.muted, 11, 600);
    canvas.classList.add('is-ready');
  }, [goal, protocol, progress]);

  const feedback = goal === 'nmsfree'
    ? '选择无 NMS 部署目标后，比较器使用端到端 AP。'
    : goal === 'latency'
      ? '在同一 T4 TensorRT10 协议下，YOLO26n 的 1.7 ms 延迟最低。'
      : `在${protocol === 'E2E' ? '端到端' : '带 NMS'}协议下，YOLO26x 的 AP 最高。`;

  return (
    <div>
      <canvas ref={ref} width={W} height={H} aria-label="YOLO26 精度与延迟比较" />
      <div className="ctrl">
        <span>部署目标</span>
        <button className={`chip ${goal === 'latency' ? 'active' : ''}`} onClick={() => chooseGoal('latency')}>最低延迟</button>
        <button className={`chip ${goal === 'accuracy' ? 'active' : ''}`} onClick={() => chooseGoal('accuracy')}>最高 AP</button>
        <button className={`chip ${goal === 'nmsfree' ? 'active' : ''}`} onClick={() => chooseGoal('nmsfree')}>无 NMS</button>
        <button onClick={() => { setProgress(0); setRunning(true); }} disabled={running}>开始比较</button>
      </div>
      <div className="ctrl">
        <span>推理协议</span>
        <button
          className={`chip ${protocol === 'nonE2E' ? 'active' : ''}`}
          disabled={goal === 'nmsfree'}
          title={goal === 'nmsfree' ? '无 NMS 目标使用端到端协议' : ''}
          onClick={() => { setProtocol('nonE2E'); setProgress(1); }}
        >
          带 NMS
        </button>
        <button className={`chip ${protocol === 'E2E' ? 'active' : ''}`} onClick={() => { setProtocol('E2E'); setProgress(1); }}>
          端到端（无 NMS）
        </button>
      </div>
      <div className={`feedback ${goal === 'nmsfree' ? '' : 'good'}`}>{feedback}</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr><th>型号</th><th>带 NMS 的 AP ↑</th><th>端到端 AP ↑</th><th>T4 延迟 ms ↓</th></tr></thead>
          <tbody>{data.map(item => <tr key={item.m}><td>YOLO26{item.m}</td><td>{item.non}</td><td>{item.e2e}</td><td>{item.ms}</td></tr>)}</tbody>
        </table>
      </div>
      <p style={{ color: C.muted, fontSize: 13 }}>
        <b>结果边界：</b>Table 7 中端到端 AP 比带 NMS 的 AP 低 0.6–0.8；DFL-free 的最终效果包含 L1、STAL 等配套设计；STAL 针对极小标注框缺少候选点的问题；论文后续计划扩展到更多数据集。
      </p>
    </div>
  );
};
