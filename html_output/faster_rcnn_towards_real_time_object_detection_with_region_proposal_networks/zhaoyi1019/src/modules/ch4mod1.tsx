import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const SKY = '#0b1830';
const GLOW = '#122346';
const STAR = '#dfe7f5';
const DIM = '#7f8db0';
const GREEN = '#228d5c';
const RED = '#c43f52';
const ORANGE = '#f07e47';
const BORDER = '#d7deea';

type Setting = '1x1' | '1x3' | '3x1' | '3x3';

const MAP: Record<Setting, number> = { '1x1': 66.7, '1x3': 68.8, '3x1': 69.8, '3x3': 69.9 };

function iouOf(ax: number, ay: number, as: number, gx: number, gy: number, gw: number, gh: number) {
  const aL = ax - as / 2;
  const aR = ax + as / 2;
  const aT = ay - as / 2;
  const aB = ay + as / 2;
  const gL = gx - gw / 2;
  const gR = gx + gw / 2;
  const gT = gy - gh / 2;
  const gB = gy + gh / 2;
  const iw = Math.min(aR, gR) - Math.max(aL, gL);
  const ih = Math.min(aB, gB) - Math.max(aT, gT);
  const inter = iw > 0 && ih > 0 ? iw * ih : 0;
  const areaA = as * as;
  const areaG = gw * gh;
  return inter / (areaA + areaG - inter);
}

// Build the anchor bank for a setting: scales (70/100/140) × aspect ratios
// (0.5 = 1:2 tall, 1 = 1:1, 2 = 2:1 wide). Same area per scale, varying w/h.
function anchorDims(setting: Setting): { w: number; h: number }[] {
  const scales = setting[0] === '3' ? [70, 100, 140] : [100];
  const ratios = setting[2] === '3' ? [0.5, 1, 2] : [1];
  const out: { w: number; h: number }[] = [];
  for (const s of scales) {
    for (const r of ratios) {
      out.push({ w: Math.round(s * Math.sqrt(r)), h: Math.round(s / Math.sqrt(r)) });
    }
  }
  return out;
}

export const Ch4Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [setting, setSetting] = useState<Setting>('3x3');
  const [pos, setPos] = useState({ x: 320, y: 150 });
  const [feedback, setFeedback] = useState({ text: '拖拽锚框，观察它与真值框的 IoU。', cls: '' });
  const posRef = useRef(pos);
  posRef.current = pos;

  const GT = { x: 540, y: 140, w: 150, h: 116 };
  const baseSize = setting === '1x1' ? 116 : setting === '1x3' ? 116 : 116;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      ctxRef.current = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const toCanvas = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: clamp(((e.clientX - rect.left) / rect.width) * W, 60, 700),
        y: clamp(((e.clientY - rect.top) / rect.height) * H, 40, 230),
      };
    };
    let dragging = false;
    const down = (e: PointerEvent) => {
      dragging = true;
      setPos(toCanvas(e));
      canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      setPos(toCanvas(e));
    };
    const up = (e: PointerEvent) => {
      dragging = false;
      const iou = iouOf(posRef.current.x, posRef.current.y, baseSize, GT.x, GT.y, GT.w, GT.h);
      if (iou > 0.7) {
        setFeedback({ text: `IoU ${iou.toFixed(2)}：超过 0.7，判为正样本，参与回归。`, cls: 'good' });
      } else if (iou < 0.3) {
        setFeedback({ text: `IoU ${iou.toFixed(2)}：低于 0.3，判为负样本。`, cls: 'bad' });
      } else {
        setFeedback({ text: `IoU ${iou.toFixed(2)}：介于 0.3 与 0.7，训练时忽略。`, cls: '' });
      }
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
    };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    return () => {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
    };
  }, [baseSize]);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const iou = iouOf(pos.x, pos.y, baseSize, GT.x, GT.y, GT.w, GT.h);
    ctx.fillStyle = SKY;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = GLOW;
    ctx.fillRect(0, H - 50, W, 50);
    // legend: two kinds of boxes
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = DIM;
    ctx.strokeRect(46, 22, 22, 18);
    ctx.setLineDash([]);
    ctx.strokeStyle = ORANGE;
    ctx.lineWidth = 3;
    ctx.strokeRect(46, 50, 22, 18);
    ctx.fillStyle = DIM;
    ctx.font = '15px sans-serif';
    ctx.fillText('虚线：预设参考框（锚框库）', 78, 37);
    ctx.fillText('橙色实线：拖动的测试锚框', 78, 66);
    // GT box
    ctx.strokeStyle = GREEN;
    ctx.lineWidth = 3;
    ctx.strokeRect(GT.x - GT.w / 2, GT.y - GT.h / 2, GT.w, GT.h);
    ctx.fillStyle = STAR;
    ctx.beginPath();
    ctx.arc(GT.x, GT.y, 5, 0, Math.PI * 2);
    ctx.fill();
    // ghost anchors (reference bank for the current setting)
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = DIM;
    for (const d of anchorDims(setting)) {
      ctx.strokeRect(GT.x - d.w / 2, GT.y - d.h / 2, d.w, d.h);
    }
    ctx.setLineDash([]);
    // draggable anchor
    const c = iou > 0.7 ? GREEN : iou < 0.3 ? RED : ORANGE;
    ctx.strokeStyle = c;
    ctx.lineWidth = 4;
    ctx.strokeRect(pos.x - baseSize / 2, pos.y - baseSize / 2, baseSize, baseSize);
    // ioU readout
    ctx.fillStyle = '#122346';
    ctx.fillRect(780, 40, 250, 170);
    ctx.fillStyle = c;
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(iou.toFixed(2), 800, 100);
    ctx.fillStyle = DIM;
    ctx.font = '16px sans-serif';
    ctx.fillText('IoU', 800, 70);
    ctx.fillText('>0.7 正 · <0.3 负', 800, 140);
    // mAP bar
    ctx.fillStyle = '#122346';
    ctx.fillRect(780, 220, 250, 26);
    ctx.fillStyle = '#27446e';
    ctx.fillRect(780, 220, (MAP[setting] / 80) * 250, 26);
    ctx.fillStyle = '#21324a';
    ctx.font = '16px sans-serif';
    ctx.fillText(`${setting} → mAP ${MAP[setting]}%`, 780, 212);
    const canvas = canvasRef.current;
    if (canvas && !canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
  }, [pos, setting, baseSize]);

  const chips: Setting[] = ['1x1', '1x3', '3x1', '3x3'];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {chips.map((s) => (
          <button
            key={s}
            type="button"
            className={setting === s ? 'active' : ''}
            onClick={() => setSetting(s)}
          >
            {s}
          </button>
        ))}
        <span className="val">mAP {MAP[setting]}%</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch4Mod1;
