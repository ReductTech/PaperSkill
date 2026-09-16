import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §5 Module 5.1 — 五个任务，一套写法：点击任务，看输入字典、公开方法与 predict() 返回键。
const W = 1080;
const H = 280;
const BG = '#f5f8f0';
const LIGHT = '#b8c9a7';
const DARK = '#76906a';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const BORDER = '#d7deea';

type Task = 'imputation' | 'forecasting' | 'classification' | 'clustering' | 'anomaly';

const TASKS: {
  id: Task;
  label: string;
  resultKey: string;
  models: number;
  methods: string;
  extra: string;
}[] = [
  {
    id: 'imputation',
    label: '插补',
    resultKey: 'imputation',
    models: 49,
    methods: 'fit → predict → impute → save / load',
    extra: '另有 impute() 便捷方法',
  },
  {
    id: 'forecasting',
    label: '预测',
    resultKey: 'forecasting',
    models: 17,
    methods: 'fit → predict → save / load',
    extra: '输入字典多一个 X_pred 未来窗口',
  },
  {
    id: 'classification',
    label: '分类',
    resultKey: 'classification_proba',
    models: 12,
    methods: 'fit → predict → save / load',
    extra: '软分数用于 ROC / PR 曲线',
  },
  {
    id: 'clustering',
    label: '聚类',
    resultKey: 'clustering',
    models: 2,
    methods: 'fit → predict → save / load',
    extra: '推理时没有标签可用',
  },
  {
    id: 'anomaly',
    label: '异常检测',
    resultKey: 'anomaly_detection',
    models: 21,
    methods: 'fit → predict → save / load',
    extra: '重建误差可直接当异常分数',
  },
];

export const Ch5Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ task: 'imputation' as Task });
  const rafRef = useRef<number | null>(null);
  const [task, setTask] = useState<Task>('imputation');
  const [feedback, setFeedback] = useState({
    text: '插补：predict() 返回键是 imputation，另有 impute() 便捷方法。生态里这一类有 49 个模型。模型数量来自 PyPOTS 官方仓库的模型清单（截至 2026-09-14），是能力覆盖统计，不是实验结果。',
    cls: '',
  });

  const pick = (id: Task) => {
    stateRef.current.task = id;
    setTask(id);
    const spec = TASKS.find((t) => t.id === id);
    if (!spec) return;
    const head: Record<Task, string> = {
      imputation: '插补：predict() 返回键是 imputation，另有 impute() 便捷方法。',
      forecasting: '预测：输入字典多一个 X_pred 未来窗口，返回键是 forecasting。',
      classification: '分类：predict() 给出软分数，返回键是 classification_proba。',
      clustering: '聚类：推理时没有标签，返回键是 clustering。',
      anomaly: '异常检测：返回键是 anomaly_detection；同一个重建模型可以直接提供异常分数。',
    };
    setFeedback({
      text: `${head[id]}生态里这一类有 ${spec.models} 个模型。模型数量来自 PyPOTS 官方仓库的模型清单（截至 2026-09-14），是能力覆盖统计，不是实验结果。`,
      cls: '',
    });
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

    const render = (s: { task: Task }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = LIGHT;
      ctx.fillRect(0, 242, W, 22);
      ctx.strokeStyle = DARK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 242);
      ctx.lineTo(W, 242);
      ctx.stroke();

      const rowH = 38;
      const rowX = 60;
      const rowW = 420;
      let activeY = 0;
      TASKS.forEach((t, i) => {
        const y = 40 + i * rowH;
        const active = t.id === s.task;
        if (active) activeY = y + rowH / 2 - 8;
        ctx.fillStyle = active ? BLUE : '#ffffff';
        ctx.fillRect(rowX, y, rowW, rowH - 8);
        ctx.strokeStyle = active ? BLUE : BORDER;
        ctx.lineWidth = active ? 2 : 1;
        ctx.strokeRect(rowX, y, rowW, rowH - 8);
        ctx.fillStyle = active ? '#ffffff' : '#21324a';
        ctx.font = 'bold 15px "Segoe UI", sans-serif';
        ctx.fillText(t.label, rowX + 14, y + 21);
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillText(t.resultKey, rowX + 120, y + 21);
      });

      // connector from the active row to the detail panel
      const spec = TASKS.find((t) => t.id === s.task) || TASKS[0];
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(rowX + rowW, activeY);
      ctx.lineTo(560, activeY);
      ctx.lineTo(560, 140);
      ctx.lineTo(620, 140);
      ctx.stroke();

      // detail panel
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(620, 40, 400, 200);
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(620, 40, 400, 200);
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillText('{\"X\": …}', 644, 74);
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillStyle = '#68778f';
      ctx.fillText(spec.methods, 644, 106);
      ctx.fillText(spec.resultKey, 644, 138);
      ctx.fillText(spec.extra, 644, 170);
      ctx.fillStyle = BLUE;
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      ctx.fillText(`${spec.models}`, 644, 206);

      // in-canvas labels (max 2)
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.fillText('任务', 60, 30);
      ctx.fillText('返回键', 180, 30);
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

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {TASKS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`chip ${task === t.id ? 'selected' : ''}`}
            onClick={() => pick(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch5Mod1;
