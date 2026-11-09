import React, { useEffect, useState } from 'react';
import { easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

type Scope = 'single-domain' | 'full-mixture';
type Task = 'tamp' | 'lt' | 'saycan';

// 定性对照：仅保留论文“完整混合优于单域”的趋势方向；不逐项复现未在蓝图登记的基准数值。
const VALUES: Record<Task, { single: number; full: number; label: string }> = {
  tamp: { single: 42, full: 92, label: 'TAMP 规划' },
  lt: { single: 20, full: 72, label: 'Language-Table' },
  saycan: { single: 48, full: 88, label: 'SayCan 可行动性' },
};

/**
 * §6 P3 单域 vs 完整混合对比 + P8 结果竞赛横条：切换训练范围与任务组，
 * 横条从共享基线缓动生长；原图 Fig 3 由模块 figure 挂载在上方。
 */
export const TransferEvidence: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [scope, setScope] = useState<Scope>('full-mixture');
  const [task, setTask] = useState<Task>('tamp');
  const [grow, setGrow] = useState(0);

  useEffect(() => {
    if (grow >= 1) return;
    const start = performance.now();
    let raf: number | null = null;
    const loop = (now: number) => {
      const t = Math.min(1, (now - start) / 650);
      setGrow(easeOutCubic(t));
      if (t < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [grow < 1]);

  const data = VALUES[task];
  const rows = [
    { label: '单域数据', value: data.single, color: '#76906a', on: scope === 'single-domain' },
    { label: '完整混合', value: data.full, color: '#228d5c', on: scope === 'full-mixture' },
  ];

  const isFull = scope === 'full-mixture';
  const feedback = isFull
    ? { text: '完整混合在三类任务上都更高；低数据下 ViT-4B 规划较单一机器人训练翻倍以上。', cls: 'good' }
    : { text: '这是论文报告的对比，学习者操作不能推出未测量的提升。', cls: '' };

  return (
    <div>
      <div className="bar-chart" id={`${chapterId}-${moduleId}`}>
        {rows.map((row) => (
          <div className="bar-row" key={row.label}>
            <span className="bar-label">{row.label}</span>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{ width: `${(row.value / 100) * 100 * grow}%`, background: row.on ? row.color : 'rgba(118,144,106,0.35)' }}
              />
            </div>
            <span className="bar-value">{Math.round(row.value * grow)}%</span>
          </div>
        ))}
      </div>

      <div className="chip-row" role="group" aria-label="训练范围">
        <button type="button" className={`chip ${scope === 'single-domain' ? 'selected' : ''}`} onClick={() => setScope('single-domain')}>
          单域数据
        </button>
        <button type="button" className={`chip ${scope === 'full-mixture' ? 'selected' : ''}`} onClick={() => setScope('full-mixture')}>
          完整混合
        </button>
      </div>
      <div className="chip-row" role="group" aria-label="任务组">
        {(Object.keys(VALUES) as Task[]).map((t) => (
          <button key={t} type="button" className={`chip ${task === t ? 'selected' : ''}`} onClick={() => setTask(t)}>
            {VALUES[t].label}
          </button>
        ))}
        <button type="button" className="chip" onClick={() => setGrow(0)}>
          重新生长
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default TransferEvidence;
