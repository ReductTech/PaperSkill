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

// 10.2 迁移到视频与文生图（Table 5 / Table 6 / Table 11）
const GROUPS = {
  cpt: {
    label: '视频持续预训练',
    note: '8 个下游视频基准平均准确率（%），越高越好',
    bars: [
      { name: 'GPT-4o 标注 · 4B', v: 39.6, max: 50.2 },
      { name: 'CapRL++ · 4B', v: 45.9, max: 50.2 },
    ],
  },
  temporal: {
    label: '时间定位',
    note: 'TimeLens-Bench 平均分，越高越好；专用 TimeLens-8B 在该单项仍更高',
    bars: [
      { name: 'Qwen3-VL-4B', v: 10.4, max: 23.4 },
      { name: 'CapRL++', v: 21.4, max: 23.4 },
    ],
  },
  t2i: {
    label: '文生图（CapRL-T2I）',
    note: 'UniGenBench 总分，越高越好',
    bars: [
      { name: 'FLUX.1-dev', v: 59.92, max: 80.86 },
      { name: '+ CapRL-T2I', v: 71.77, max: 80.86 },
    ],
  },
};

export const Mod102: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ group: 'cpt' as keyof typeof GROUPS });
  const [group, setGroup] = useState<keyof typeof GROUPS>('cpt');
  const [fb, setFb] = useState({ text: '切换三组证据，看同一个原则在不同任务上是否都成立，以及它的代价。', cls: '' });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    let raf: number | null = null;
    const render = (s: { group: keyof typeof GROUPS }) => {
      gameField(ctx, W, H);
      const g = GROUPS[s.group];
      for (let i = 0; i < g.bars.length; i++) {
        const b = g.bars[i];
        drawBar(ctx, 120, 60 + i * 70, 520, 32, b.v / b.max, i === 0 ? C.red : C.green);
        drawLabel(ctx, b.name.slice(0, 8), 120, 48 + i * 70, C.muted, 16);
        drawLabel(ctx, String(b.v), 660, 76 + i * 70, i === 0 ? C.red : C.green, 22);
      }
      drawLegend(ctx, [{ label: '旧', color: C.red }, { label: 'CapRL++', color: C.green }], 120, 220);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(() => render(stateRef.current));
    };
    raf = requestAnimationFrame(() => render(stateRef.current));
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = null; };
    const start = () => { if (!raf) raf = requestAnimationFrame(() => render(stateRef.current)); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const pick = (k: keyof typeof GROUPS) => {
    stateRef.current.group = k;
    setGroup(k);
    setFb(
      k === 'cpt'
        ? { text: '换成 CapRL++ 的描述后平均分从 39.6 升到 45.9，提升集中在时间定位类基准。', cls: 'good' }
        : k === 'temporal'
        ? { text: '时间定位近乎翻倍，但专门的 TimeLens-8B 在该单项上仍然更高。', cls: '' }
        : { text: '把方向反过来也成立：生成图能答对提示词相关的问题就得到奖励，总分从 59.92 升到 71.77。', cls: 'good' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>证据组 <span className="val">{GROUPS[group].label}</span></label>
        <div className="chip-row">
          <button className={`chip ${group === 'cpt' ? 'selected' : ''}`} onClick={() => pick('cpt')}>视频持续预训练</button>
          <button className={`chip ${group === 'temporal' ? 'selected' : ''}`} onClick={() => pick('temporal')}>时间定位</button>
          <button className={`chip ${group === 't2i' ? 'selected' : ''}`} onClick={() => pick('t2i')}>文生图（CapRL-T2I）</button>
        </div>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Mod102;
