import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch9 Module 9.2 (P4): three task heads on the same backbone — instance
// segmentation, pose estimation and rotated boxes, each with its own design
// and a consistent gain over YOLO11.
const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', route: '#92400e', orange: '#f07e47', purple: '#7c3aed',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', text: '#21324a', muted: '#68778f',
};

const TASKS = {
  seg: {
    label: '实例分割',
    design: '多尺度原型 + 辅助语义损失（推理时移除）',
    gain: 'mask AP +2.4 ~ +3.7',
    gainFrac: 0.66,
    fb: { text: '多尺度原型融合 + 训练期辅助语义损失（推理时移除）：mask AP +2.4~+3.7。', cls: 'good' },
  },
  pose: {
    label: '姿态估计',
    design: 'RLE 不确定度 + OKS：遮挡关节自动降权',
    gain: 'pose AP +2.1 ~ +7.2',
    gainFrac: 1.0,
    fb: { text: 'RLE 不确定度 + OKS：遮挡关节自动降权，pose AP +2.1~+7.2。', cls: 'good' },
  },
  obb: {
    label: '旋转框 OBB',
    design: '长边角度 + 方形目标角度损失',
    gain: 'mAP +2.5~+3.4 · AP75 +4.6~+6.0',
    gainFrac: 0.55,
    fb: { text: '长边角度 + 方形目标角度损失：DOTA mAP +2.5~+3.4，AP75 +4.6~+6.0。', cls: 'good' },
  },
};

type TaskId = keyof typeof TASKS;

export const Ch9Tasks: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ task: 'seg' as TaskId });
  const [task, setTask] = useState<TaskId>('seg');
  const [fb, setFb] = useState(TASKS.seg.fb);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = () => {
      const tk = TASKS[stateRef.current.task];
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      // ---- left: rider in three equipment looks ----
      ctx.fillStyle = C.light; ctx.fillRect(0, 226, 460, 54);
      ctx.strokeStyle = C.route; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 232); ctx.lineTo(460, 232); ctx.stroke();
      const px = 220; const py = 200;
      ctx.strokeStyle = C.blue; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(px - 20, py, 16, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(px + 22, py, 16, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px - 20, py); ctx.lineTo(px - 2, py - 18); ctx.lineTo(px + 22, py); ctx.lineTo(px - 20, py);
      ctx.moveTo(px - 2, py - 18); ctx.lineTo(px + 5, py - 23);
      ctx.stroke();
      ctx.fillStyle = C.blue;
      ctx.beginPath(); ctx.arc(px + 2, py - 34, 7, 0, Math.PI * 2); ctx.fill();
      if (stateRef.current.task === 'seg') {
        // helmet + pads (proto masks)
        ctx.strokeStyle = C.green; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(px + 2, py - 36, 11, Math.PI, 0); ctx.stroke();
        ctx.fillStyle = 'rgba(34,141,92,0.35)';
        ctx.fillRect(px - 34, py - 14, 16, 12);
        ctx.fillRect(px + 22, py - 14, 16, 12);
        // mask blob beside
        ctx.fillStyle = 'rgba(34,141,92,0.25)';
        ctx.beginPath(); ctx.ellipse(360, 190, 42, 30, 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = C.green; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(360, 190, 42, 30, 0.3, 0, Math.PI * 2); ctx.stroke();
      } else if (stateRef.current.task === 'pose') {
        // skeleton keypoints
        const pts: [number, number][] = [
          [px + 2, py - 34], [px - 2, py - 18], [px + 5, py - 23],
          [px - 20, py], [px + 22, py], [px - 34, py + 8], [px + 36, py + 8],
        ];
        ctx.strokeStyle = C.orange; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[1][0], pts[1][1]);
        ctx.moveTo(pts[1][0], pts[1][1]); ctx.lineTo(pts[3][0], pts[3][1]);
        ctx.moveTo(pts[1][0], pts[1][1]); ctx.lineTo(pts[4][0], pts[4][1]);
        ctx.moveTo(pts[3][0], pts[3][1]); ctx.lineTo(pts[5][0], pts[5][1]);
        ctx.moveTo(pts[4][0], pts[4][1]); ctx.lineTo(pts[6][0], pts[6][1]);
        ctx.stroke();
        ctx.fillStyle = C.orange;
        pts.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill(); });
      } else {
        // rotated box around rider
        ctx.strokeStyle = C.purple; ctx.lineWidth = 2.5;
        ctx.save();
        ctx.translate(px, py - 14); ctx.rotate(-0.4);
        ctx.strokeRect(-66, -56, 132, 84);
        ctx.restore();
      }
      // ---- right inset: design + gain bar ----
      ctx.fillStyle = '#fff'; ctx.fillRect(500, 20, 560, 240);
      ctx.strokeStyle = '#d7deea'; ctx.lineWidth = 2; ctx.strokeRect(500, 20, 560, 240);
      ctx.fillStyle = C.text; ctx.font = '16px sans-serif';
      ctx.fillText('设计要点', 540, 64);
      ctx.font = '15px sans-serif';
      ctx.fillText(tk.design, 540, 96);
      ctx.fillStyle = C.text; ctx.font = '16px sans-serif';
      ctx.fillText('相对 YOLO11 增益', 540, 146);
      ctx.fillStyle = '#e8edf5'; ctx.fillRect(540, 160, 420, 26);
      ctx.fillStyle = C.green; ctx.fillRect(540, 160, 420 * tk.gainFrac, 26);
      ctx.fillStyle = C.text; ctx.font = '15px sans-serif';
      ctx.fillText(tk.gain, 548, 179);
      ctx.fillStyle = C.muted; ctx.font = '12px sans-serif';
      ctx.fillText('同一底座，跨尺度一致', 540, 222);
    };

    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const pick = (k: TaskId) => {
    stateRef.current.task = k;
    setTask(k);
    setFb(TASKS[k].fb);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          {(Object.keys(TASKS) as TaskId[]).map((k) => (
            <button key={k} className={`chip ${task === k ? 'selected' : ''}`} onClick={() => pick(k)}>{TASKS[k].label}</button>
          ))}
        </div>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch9Tasks;
