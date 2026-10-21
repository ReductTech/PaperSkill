import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第10章 模块2：文本 → 掩码（CLIP 文本嵌入作提示），失败时补点修正
const W = 1080;
const H = 300;

const MODES = [
  { key: 'wheel', label: '“a wheel”', fb: '简单文本提示：SAM 用 CLIP 文本嵌入直接抠出车轮。', cls: 'good' },
  { key: 'grille', label: '“beaver tooth grille”', fb: '细腻文本提示：也能定位“海狸牙格栅”这类复杂目标。', cls: 'good' },
  { key: 'fix', label: '文本+点修正', fb: '仅文本失败时，再补一个点提示即可修正预测。', cls: 'good' },
];

export const Ch10TextMask: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ mode: 'wheel' });
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState('wheel');
  const [feedback, setFeedback] = useState({ text: MODES[0].fb, cls: MODES[0].cls });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { mode: string }) => {
      ctx.clearRect(0, 0, W, H);
      const bgGrad = ctx.createLinearGradient(40, 20, W - 40, H - 20);
      bgGrad.addColorStop(0, '#f8fbf4');
      bgGrad.addColorStop(1, '#eef3fb');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(40, 30, W - 80, H - 70);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 30, W - 80, H - 70);
      // 一辆车的侧影（含车轮与格栅）
      ctx.fillStyle = '#76906a';
      ctx.beginPath();
      ctx.moveTo(200, H - 100);
      ctx.lineTo(260, H - 160);
      ctx.lineTo(430, H - 160);
      ctx.lineTo(470, H - 100);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#b8c9a7';
      ctx.beginPath();
      ctx.arc(300, H - 80, 30, 0, Math.PI * 2);
      ctx.arc(420, H - 80, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#21324a';
      ctx.font = '20px "Segoe UI", sans-serif';
      if (s.mode === 'wheel') {
        ctx.fillStyle = 'rgba(34,141,92,0.55)';
        ctx.beginPath();
        ctx.arc(300, H - 80, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#228d5c';
        ctx.fillText('✓ 车轮掩码', 700, H - 110);
      } else if (s.mode === 'grille') {
        ctx.fillStyle = 'rgba(124,58,237,0.55)';
        ctx.beginPath();
        ctx.roundRect(400, H - 150, 50, 44, 6);
        ctx.fill();
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#7c3aed';
        ctx.fillText('✓ 格栅掩码', 700, H - 110);
      } else {
        ctx.fillStyle = 'rgba(34,141,92,0.55)';
        ctx.beginPath();
        ctx.arc(300, H - 80, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#f07e47';
        ctx.beginPath();
        ctx.arc(410, H - 60, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#228d5c';
        ctx.fillText('文本 + 补点 → 修正掩码', 700, H - 110);
      }
      ctx.fillStyle = '#21324a';
      ctx.font = '17px "Segoe UI", sans-serif';
      ctx.fillText('text prompt → CLIP embedding → SAM', 120, 58);
    };
    const tick = () => {
      render(stateRef.current);
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

  const choose = (k: string) => {
    stateRef.current.mode = k;
    setMode(k);
    const m = MODES.find((x) => x.key === k)!;
    setFeedback({ text: m.fb, cls: m.cls });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {MODES.map((m) => (
          <button
            key={m.key}
            className={mode === m.key ? 'btn on' : 'btn'}
            onClick={() => choose(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch10TextMask;
