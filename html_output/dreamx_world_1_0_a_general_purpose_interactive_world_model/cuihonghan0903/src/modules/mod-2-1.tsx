import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, lerp } from '../lib/canvasKit';
import * as K from './roadKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 240;

type Src = 'ue' | 'real' | 'game';

// 三档定性分级：1=低 2=中 3=高（依据论文 §2 的文字描述，非论文数值）
const LEVEL_TEXT = ['低', '中', '高'];
const DATA: Record<Src, { label: string; bars: [number, number, number]; note: string }> = {
  ue: { label: 'UE 合成', bars: [3, 2, 1], note: '逐帧精确标注（WASD/IJKL 动作 + 相机位姿），但画面域有限。' },
  real: { label: '真实视频', bars: [1, 2, 3], note: '视觉多样性最高，但相机位姿要靠 MegaSaM 恢复。' },
  game: { label: '游戏实录', bars: [3, 3, 1], note: '动作最丰富，风格偏游戏化，位姿由引擎导出。' },
};
const BAR_LABELS = ['相机标注精度', '动作丰富度', '视觉多样性'];

export const Mod21: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [source, setSource] = useState<Src>('ue');
  const animRef = useRef<[number, number, number]>([3, 2, 1]);
  const srcRef = useRef<Src>('ue');
  srcRef.current = source;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;

    const frame = () => {
      const target = DATA[srcRef.current].bars;
      const cur = animRef.current;
      for (let i = 0; i < 3; i++) cur[i] = lerp(cur[i], target[i], 0.12);
      K.clearScene(ctx, W, H);
      const colors = [K.C.guide, K.C.emph, K.C.good];
      for (let i = 0; i < 3; i++) {
        const y = 52 + i * 52;
        K.drawLabel(ctx, BAR_LABELS[i], 30, y - 8, K.C.ink, 12);
        K.drawBar(ctx, 140, y - 16, 300, 14, cur[i] / 3, colors[i]);
        K.drawLabel(ctx, LEVEL_TEXT[Math.round(cur[i]) - 1], 450, y - 3, K.C.muted, 11);
      }
      K.drawLabel(ctx, '定性分级（高/中/低），依据论文 §2 描述，非论文数值', 30, 224, K.C.muted, 10);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <div>
      <div className="ctrl">
        {(Object.keys(DATA) as Src[]).map((k) => (
          <button
            key={k}
            className={`chip ${source === k ? 'active' : ''}`}
            onClick={() => setSource(k)}
          >
            {DATA[k].label}
          </button>
        ))}
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="feedback">
        {DATA[source].note} 三路混合 + 三段质检（基础过滤 → 几何清洗 → 属性打标）才是完整方案（绿）。
      </div>
    </div>
  );
};

export default Mod21;
