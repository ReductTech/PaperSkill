import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §8 Module 8.2 — 能力覆盖对照：不是成绩单。只比较覆盖面，画面内不出现任何性能指标。
const W = 1080;
const H = 280;
const BG = '#f5f8f0';
const LIGHT = '#b8c9a7';
const DARK = '#76906a';
const ORANGE = '#f07e47';
const MUTED = '#68778f';
const BORDER = '#d7deea';

type Dim = 'tasks' | 'models' | 'datasets';

const DIMS: { id: Dim; label: string; traditional: number; pots: number; max: number; unit: string }[] = [
  { id: 'tasks', label: '任务数', traditional: 1, pots: 5, max: 5, unit: '个核心任务' },
  { id: 'models', label: '模型数', traditional: 0, pots: 50, max: 50, unit: '个以上模型' },
  { id: 'datasets', label: '数据集', traditional: 0, pots: 172, max: 172, unit: '个开源数据集' },
];

const NOTE = '生态事实统计，非性能实验结果；本论文未报告实验数据。';

export const Ch8Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ dim: 'tasks' as Dim, run: false, start: 0 });
  const rafRef = useRef<number | null>(null);
  const [dim, setDim] = useState<Dim>('tasks');
  const [feedback, setFeedback] = useState({
    text: '按下开始对照，查看覆盖面差异。本条对照只比较能力覆盖，不比较性能；本论文未报告任何实验数据。',
    cls: '',
  });

  const speak = (d: Dim, run: boolean) => {
    const spec = DIMS.find((x) => x.id === d) || DIMS[0];
    const head: Record<Dim, string> = {
      tasks:
        '任务覆盖：传统工具链只解决「数据修补」这一件事，PyPOTS 覆盖五个核心任务（论文口径）。',
      models:
        '模型覆盖：插补 49、预测 17、分类 12、聚类 2、异常检测 21——计数口径是各任务模型清单的长度（含 4 个 naive 插补方法）。这是覆盖面，不是准确率。',
      datasets:
        '数据集覆盖：TSDB 支持 172 个开源数据集，传统修补类工具通常自带的数据加载能力有限。这是能力统计，不是实验结果。',
    };
    const opener = run ? head[d] : `按下开始对照，查看${spec.label}的覆盖面差异。`;
    setFeedback({
      text: `${opener}本条对照只比较能力覆盖，不比较性能；本论文未报告任何实验数据。`,
      cls: '',
    });
  };

  const pick = (d: Dim) => {
    stateRef.current.dim = d;
    stateRef.current.run = true;
    setDim(d);
    speak(d, true);
  };

  const runCompare = () => {
    stateRef.current.run = true;
    stateRef.current.start = performance.now();
    speak(stateRef.current.dim, true);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (time: number, s: { dim: Dim; run: boolean; start: number }) => {
      const spec = DIMS.find((x) => x.id === s.dim) || DIMS[0];
      let progress = 0;
      if (s.run) {
        const elapsed = s.start > 0 ? time - s.start : 2000;
        progress = easeOutCubic(Math.max(0, Math.min(1, elapsed / 1600)));
      }

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = LIGHT;
      ctx.fillRect(0, 248, W, 16);
      ctx.strokeStyle = DARK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 248);
      ctx.lineTo(W, 248);
      ctx.stroke();

      // shared baseline axis
      const axisX = 220;
      const axisW = 740;
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(axisX, 60);
      ctx.lineTo(axisX, 190);
      ctx.stroke();

      const bars: { label: string; value: number; color: string }[] = [
        { label: '传统库', value: spec.traditional, color: MUTED },
        { label: 'PyPOTS', value: spec.pots, color: ORANGE },
      ];
      bars.forEach((b, i) => {
        const y = 76 + i * 54;
        const full = (b.value / spec.max) * axisW;
        const w = Math.max(0, full * progress);
        ctx.fillStyle = 'rgba(215,222,234,0.6)';
        ctx.fillRect(axisX, y, axisW * progress, 30);
        ctx.fillStyle = b.color;
        ctx.fillRect(axisX, y, w, 30);
        ctx.fillStyle = '#21324a';
        ctx.font = 'bold 16px "Segoe UI", sans-serif';
        ctx.fillText(b.label, 60, y + 22);
        ctx.font = 'bold 18px "Segoe UI", sans-serif';
        ctx.fillText(`${Math.round(b.value * progress)}`, axisX + axisW + 12, y + 22);
      });

      // permanent note strip
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(60, 206, 960, 34);
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(60, 206, 960, 34);
      ctx.fillStyle = MUTED;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText(NOTE, 78, 228);

      // in-canvas labels (max 2)
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.fillText(spec.label, 60, 40);
      ctx.fillText('覆盖面', 140, 40);
    };

    const tick = () => {
      render(performance.now(), stateRef.current);
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

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {DIMS.map((d) => (
          <button
            key={d.id}
            type="button"
            className={`chip ${dim === d.id ? 'selected' : ''}`}
            onClick={() => pick(d.id)}
          >
            {d.label}
          </button>
        ))}
      </div>
      <div className="ctrl">
        <button className="tiny" type="button" onClick={runCompare}>
          开始对照
        </button>
        <label>对照维度 <span className="val">{(DIMS.find((d) => d.id === dim) || DIMS[0]).label}</span></label>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch8Mod2;
