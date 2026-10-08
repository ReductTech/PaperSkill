import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { PALETTE, clearScene, drawSceneLabel, bar } from './birdKit';

// m8-2 (scale-chips) — 选型指南：S/M/L × v8/11 六型号三指标对比（Tab 1 文本提示列）。

const W = 1080;
const H = 280;

interface Model {
  key: string;
  name: string;
  params: number;
  fps: number;
  ap: number;
}
const MODELS: Model[] = [
  { key: 'v8s', name: 'YOLOE-v8-S', params: 12, fps: 305.8, ap: 27.9 },
  { key: 'v8m', name: 'YOLOE-v8-M', params: 27, fps: 156.7, ap: 32.6 },
  { key: 'v8l', name: 'YOLOE-v8-L', params: 45, fps: 102.5, ap: 35.9 },
  { key: '11s', name: 'YOLOE-11-S', params: 10, fps: 301.2, ap: 27.5 },
  { key: '11m', name: 'YOLOE-11-M', params: 21, fps: 168.3, ap: 33.0 },
  { key: '11l', name: 'YOLOE-11-L', params: 26, fps: 130.5, ap: 35.2 },
];
const FEEDBACK: Record<string, { text: string; cls: string }> = {
  v8s: { text: '12M 参数、305.8 FPS：口袋里的开放词汇检测。', cls: 'good' },
  v8m: { text: '27M、32.6 AP、156.7 FPS：精度与速度的折中点。', cls: '' },
  v8l: { text: '45M、35.9 AP：精度优先的选择。', cls: '' },
  '11s': { text: '10M、301.2 FPS：新架构下最小巧的一档。', cls: '' },
  '11m': { text: '21M、33.0 AP、168.3 FPS：均衡之选。', cls: '' },
  '11l': { text: '26M、35.2 AP、130.5 FPS：新一代架构的更均衡点。', cls: '' },
};

export const M8_2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ model: 'v8s', prev: 'v8s', animStart: 0 });
  const rafRef = useRef<number | null>(null);
  const [model, setModel] = useState('v8s');
  const [feedback, setFeedback] = useState(FEEDBACK.v8s);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = () => {
      const s = stateRef.current;
      const cur = MODELS.find((m) => m.key === s.model)!;
      const prev = MODELS.find((m) => m.key === s.prev)!;
      const anim = easeOutCubic(clamp((performance.now() - s.animStart) / 350, 0, 1));
      const lerp = (a: number, b: number) => a + (b - a) * anim;
      clearScene(ctx, W, H);

      const rows = [
        { name: '参数量 (M)', val: lerp(prev.params, cur.params), max: 50, color: '#7f93ad', label: cur.params + 'M' },
        { name: 'FPS（T4）', val: lerp(prev.fps, cur.fps), max: 320, color: PALETTE.blue, label: cur.fps.toFixed(1) },
        { name: 'LVIS AP', val: lerp(prev.ap, cur.ap), max: 40, color: PALETTE.green, label: cur.ap.toFixed(1) },
      ];
      rows.forEach((r, i) => {
        const y = 66 + i * 70;
        drawSceneLabel(ctx, r.name, 110, y + 16, PALETTE.ink);
        bar(ctx, 280, y, 540, 24, r.val / r.max, r.color, r.label);
      });
      drawSceneLabel(ctx, '数据：论文 Tab 1 文本提示列', 280, 256, PALETTE.muted);
    };

    const tick = () => {
      render();
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

  const onChip = (key: string) => {
    stateRef.current.prev = stateRef.current.model;
    stateRef.current.model = key;
    stateRef.current.animStart = performance.now();
    setModel(key);
    setFeedback(FEEDBACK[key]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {MODELS.map((m) => (
          <button
            key={m.key}
            type="button"
            className={model === m.key ? 'chip selected' : 'chip'}
            onClick={() => onChip(m.key)}
          >
            {m.name}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M8_2;
