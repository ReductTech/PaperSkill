import { useState } from 'react';
import { C, Scene, Chips, Panel, Feedback, paint, brush, line, text } from './nusa-kit';

type Mode = 'ft' | 'replay' | 'experts' | 'nusa';
const modes = [
  { value: 'ft', label: '全量微调' }, { value: 'replay', label: '历史回放' },
  { value: 'experts', label: '累积专家' }, { value: 'nusa', label: 'NuSA-CL' },
];
const explanations: Record<Mode, string> = {
  ft: '全部权重都可改变，新任务的梯度会触及承载已有知识的方向。',
  replay: '保留旧任务的样本，在学习当前任务时重新使用；历史样本随任务数累积。',
  experts: '为任务保留独立分支，已学习的任务越多，保留的专家也越多。',
  nusa: '从当前权重提取尾部子空间，只训练中间矩阵 M；训练结束后把更新合并回同一个骨干。',
};

export function NusaStorage() {
  const [mode, setMode] = useState<Mode>('ft');
  const [tasks, setTasks] = useState(11);
  const experts = mode === 'experts' ? tasks : 0;
  const samples = mode === 'replay' ? tasks - 1 : 0;
  const reset = () => { setMode('ft'); setTasks(11); };
  return <div onKeyDown={event => { if (event.key.startsWith('Arrow')) event.stopPropagation(); }}>
    <Chips label="学习方式" value={mode} options={modes} onChange={v => setMode(v as Mode)} />
    <Chips label="任务数" value={String(tasks)} options={[1, 5, 11, 50].map(v => ({ value: String(v), label: String(v) }))} onChange={v => setTasks(Number(v))} />
    <Scene label={`${tasks} 个任务下的${modes.find(v => v.value === mode)?.label}存储示意`} draw={(ctx) => {
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 1080, 280);
      text(ctx, '同一画布', 100, 29, 18, C.text);
      text(ctx, '存储账本', 585, 29, 18, C.text);
      paint(ctx, 100, 52, 342, 184, mode === 'nusa' ? .55 : .35, mode === 'nusa' ? .7 : 0);
      if (mode === 'ft') {
        ctx.strokeStyle = C.red; ctx.globalAlpha = .72; ctx.lineWidth = 12;
        ctx.beginPath(); ctx.moveTo(136, 102); ctx.bezierCurveTo(204, 156, 301, 90, 401, 176); ctx.stroke(); ctx.globalAlpha = 1;
        brush(ctx, 370, 158, -.65, C.red);
      } else {
        brush(ctx, 363, 187, -.65, C.orange);
      }
      line(ctx, 520, 44, 520, 247, C.axis);
      ctx.fillStyle = C.blue; ctx.fillRect(585, 70, 112, 138);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        ctx.strokeRect(605, 91 + i * 25, 70, 15);
      }
      text(ctx, '1', 631, 239, 20, C.blue);
      const count = mode === 'experts' ? Math.max(0, experts - 1) : samples;
      if (count) {
        const cols = 10, size = 22, gap = 6;
        for (let i = 0; i < count; i++) {
          const x = 736 + (i % cols) * (size + gap);
          const y = 71 + Math.floor(i / cols) * (size + gap);
          ctx.fillStyle = mode === 'experts' ? C.purple : C.light;
          ctx.fillRect(x, y, size, size);
          ctx.strokeStyle = mode === 'experts' ? C.purple : C.dark;
          ctx.strokeRect(x + .5, y + .5, size - 1, size - 1);
          if (mode === 'replay') line(ctx, x + 5, y + 8, x + 17, y + 8, C.dark, 1);
        }
        text(ctx, String(count), 858, 239, 20, mode === 'experts' ? C.purple : C.dark);
      } else {
        ctx.setLineDash([5, 5]); ctx.strokeStyle = C.axis; ctx.lineWidth = 2;
        ctx.strokeRect(736, 71, 274, 137); ctx.setLineDash([]);
        text(ctx, '0', 863, 148, 34, C.muted);
      }
    }} />
    <Panel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, width: '100%' }}>
        <div>保存模型或分支<strong style={{ display: 'block', fontSize: 26, color: C.blue }}>{mode === 'experts' ? tasks : 1} 份</strong></div>
        <div>旧任务样本<strong style={{ display: 'block', fontSize: 26, color: C.dark }}>{samples} 个任务份</strong></div>
        <div>保留专家<strong style={{ display: 'block', fontSize: 26, color: C.purple }}>{experts} 份</strong></div>
      </div>
    </Panel>
    <Feedback tone={mode === 'nusa' ? 'good' : ''}>{explanations[mode]}当前已经经历 {tasks} 个任务，{mode === 'experts' ? `保留 ${experts} 个任务专家。` : mode === 'replay' ? `保留 ${samples} 个旧任务的样本份。` : '骨干份数保持为 1。'}</Feedback>
    <p style={{ fontSize: 14, color: C.muted }}>教学账本：每个任务的样本或分支记为一份。依据论文 §1、§3.3；实际训练显存和参数成本见第 10 章。</p>
    <details><summary>固定容量中如何积累新知识</summary><p>NuSA-CL 在当前任务保留一个临时适配分支。任务完成时执行 Wₜ = Wₜ₋₁ + ΔWₜ，下一任务重新分解合并后的权重。长期保存的骨干尺寸维持不变，学习时仍需存放当前任务的奇异基、更新矩阵及优化器状态。</p></details>
    <div className="ctrl"><button type="button" className="tiny ghost" style={{ minHeight: 44 }} onClick={reset}>重置存储比较</button></div>
  </div>;
}
