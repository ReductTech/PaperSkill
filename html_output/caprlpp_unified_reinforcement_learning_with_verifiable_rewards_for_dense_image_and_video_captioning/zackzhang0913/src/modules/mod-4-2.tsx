import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C, gameField, drawPictureCard, drawDescriber, drawGuesser, drawQuestionCard,
  drawScoreboard, drawScoreCell, drawHourglass, drawTimeBadge, drawBiasCoin,
  drawCurveAxis, drawCurve, drawBar, drawBars, drawLabel, drawLegend,
} from '../canvas-scene';

const W = 1080;
const H = 280;

// 4.2 三关的权重怎么配：左侧三条分项条，右侧总分与「缺哪一关」的明确提示。
const PRESETS = [
  { id: 'acc-only', label: '只看答得对', w: [1, 0, 0], vals: [0.72, 0, 0], missing: '少了长度这一关', risk: '缺长度' },
  { id: 'acc-len', label: '答得对 + 别太长', w: [1, 0, 0.5], vals: [0.72, 0, 1], missing: '少了时间戳这一关', risk: '缺时间戳' },
  { id: 'default', label: '三关全开（论文默认）', w: [1, 0.5, 0.5], vals: [0.72, 0.5, 1], missing: '三关都在', risk: '无缺口' },
] as const;

export const Mod42: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ preset: 'default' as string });
  const [preset, setPreset] = useState('default');
  const [fb, setFb] = useState({ text: '切换配比，看总分怎么变、以及缺掉的是哪一关。', cls: '' });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const render = (s: { preset: string }) => {
      gameField(ctx, W, H);
      const p = PRESETS.find((x) => x.id === s.preset) || PRESETS[2];
      const total = p.w[0] * p.vals[0] + p.w[1] * p.vals[1] + p.w[2] * p.vals[2];
      const names = ['答得对', '时间戳', '别太长'];
      const cols = [C.green, C.purple, C.orange];
      for (let i = 0; i < 3; i++) {
        const y = 52 + i * 66;
        const on = p.w[i] > 0;
        ctx.save();
        ctx.globalAlpha = on ? 1 : 0.3;
        drawBar(ctx, 320, y, 340, 28, p.w[i] * p.vals[i], cols[i]);
        ctx.restore();
        drawLabel(ctx, names[i], 200, y + 14, on ? C.ink : C.muted, 16);
      }
      // 右侧：总分 + 缺口提示（用颜色+形状，而不是一个含义不明的圆点）
      drawLabel(ctx, total.toFixed(2), 760, 100, C.green, 22);
      drawLabel(ctx, '总分', 760, 134, C.muted, 16);
      drawLabel(ctx, p.risk, 700, 190, p.w[2] === 0 ? C.red : C.green, 16);
      ctx.save();
      ctx.strokeStyle = p.w[2] === 0 ? C.red : C.green;
      ctx.lineWidth = 3;
      if (p.w[2] === 0) {
        ctx.beginPath();
        ctx.moveTo(660, 176);
        ctx.lineTo(676, 200);
        ctx.moveTo(676, 176);
        ctx.lineTo(660, 200);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(660, 188);
        ctx.lineTo(668, 198);
        ctx.lineTo(682, 176);
        ctx.stroke();
      }
      ctx.restore();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(() => render(stateRef.current));
    };
    raf = requestAnimationFrame(() => render(stateRef.current));
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(() => render(stateRef.current));
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (id: string) => {
    stateRef.current.preset = id;
    setPreset(id);
    setFb(
      id === 'acc-only'
        ? { text: '只管答得对：讲解稿会越长越乱，训练里还会被截断——长度这一关没有人在守。', cls: 'bad' }
        : id === 'acc-len'
        ? { text: '补上了长度，但时间戳没人管：视频讲解里的顺序很容易乱。', cls: 'bad' }
        : { text: '三关都在：总分在「讲得全」与「讲得省」之间取得平衡。', cls: 'good' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          权重配比 <span className="val">{PRESETS.find((p) => p.id === preset)?.label}</span>
        </label>
        <div className="chip-row">
          {PRESETS.map((p) => (
            <button key={p.id} className={`chip ${preset === p.id ? 'selected' : ''}`} onClick={() => pick(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Mod42;
