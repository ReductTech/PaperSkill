import { useEffect, useRef, useState } from 'react';
import { clearScene, roundRect, drawLabel, palette, useDrawing, Feedback } from './vit-kit';

export const vitPaperResults = {
  ImageNet: {
    label: 'ImageNet', values: [88.55, 87.76, 87.54], deviations: [0.04, 0.03, 0.02],
    feedback: 'H/14比BiT-L的均值高1.01个百分点，L/16高0.22个百分点。本行ViT-L用512分辨率、H用518，并使用0.9999系数的Polyak参数平均；不是统一384的消融设置。',
  },
  CIFAR100: {
    label: 'CIFAR-100', values: [94.55, 93.90, 93.51], deviations: [0.04, 0.05, 0.08],
    feedback: 'H与L分别比BiT-L高1.04、0.39个百分点；这是CIFAR-100迁移top-1，不是训练集准确率。',
  },
  VTAB: {
    label: 'VTAB-19', values: [77.63, 76.28, 76.29], deviations: [0.23, 0.46, 1.70],
    feedback: 'H均值高1.34个百分点；L为76.28%，略低于BiT-L的76.29%。不能说L在所有任务上都超过BiT，也不能把0.01个百分点差异当稳定优势。',
  },
  coreDays: {
    label: '预训练核日', values: [2500, 680, 9900], deviations: [] as number[],
    feedback: '预训练算力为2500、680、9900 TPUv3核日，越低越少；核日=核数×训练天数，不是日历部署时长，也不是单张图推理延迟。流程差异使这里不是只改变架构的严格因果对照。',
  },
};
type Metric = keyof typeof vitPaperResults;
type Status = 'idle' | 'running' | 'paused' | 'done';
const modelNames = ['ViT-H/14（JFT）', 'ViT-L/16（JFT）', 'BiT-L（JFT）'];
const modelColors = [palette.green, palette.blue, palette.purple];
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function Widget10() {
  const [metric, setMetric] = useState<Metric>('ImageNet');
  const [status, setStatus] = useState<Status>('idle');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timer = useRef({ elapsed: 0, last: null as number | null, runId: 0, doneQueued: false });
  const data = vitPaperResults[metric];
  const maxValue = metric === 'coreDays' ? 10000 : 100;
  const unit = metric === 'coreDays' ? 'TPUv3核日' : '%';
  const reset = () => {
    timer.current = { elapsed: 0, last: null, runId: timer.current.runId + 1, doneQueued: false };
    setStatus('idle');
  };
  const start = () => {
    timer.current.last = null;
    timer.current.doneQueued = false;
    timer.current.runId += 1;
    if (reducedMotion()) {
      timer.current.elapsed = 1200;
      setStatus('done');
    } else setStatus('running');
  };
  const pause = () => {
    timer.current.last = null;
    timer.current.runId += 1;
    setStatus('paused');
  };
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handle = () => {
      if (media.matches && (status === 'running' || status === 'paused')) {
        timer.current.elapsed = 1200;
        timer.current.last = null;
        timer.current.runId += 1;
        setStatus('done');
      }
    };
    media.addEventListener('change', handle);
    return () => media.removeEventListener('change', handle);
  }, [status]);
  useDrawing(canvasRef, (ctx, time) => {
    const clock = timer.current;
    if (status === 'running') {
      if (clock.last !== null) {
        const delta = time - clock.last;
        // Offscreen gaps must not count as visible animation time.
        if (delta >= 0 && delta <= 100) clock.elapsed = Math.min(1200, clock.elapsed + delta);
      }
      clock.last = time;
    }
    const progress = clock.elapsed / 1200;
    clearScene(ctx, 1080, 280);
    ctx.save();
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(160, 40); ctx.lineTo(160, 242); ctx.lineTo(1010, 242);
    ctx.stroke();
    ctx.font = '18px sans-serif';
    ctx.fillStyle = palette.muted;
    ctx.textAlign = 'left';
    ctx.fillText('0', 160, 267);
    ctx.textAlign = 'right';
    ctx.fillText(metric === 'coreDays' ? '10000' : '100%', 1010, 267);
    ctx.restore();
    data.values.forEach((value, index) => {
      const y = 53 + index * 65;
      roundRect(ctx, 160, y, 850, 37, 7, '#e8edeb');
      const width = 850 * value / maxValue * progress;
      if (width > 0) roundRect(ctx, 160, y, width, 37, 7, modelColors[index]);
      ctx.save();
      ctx.fillStyle = modelColors[index];
      ctx.beginPath();
      if (index === 0) { ctx.moveTo(113, y + 5); ctx.lineTo(125, y + 28); ctx.lineTo(101, y + 28); ctx.closePath(); }
      else if (index === 1) ctx.rect(102, y + 7, 22, 22);
      else ctx.arc(113, y + 18, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    drawLabel(ctx, '论文原表', 35, 27, palette.blue);
    drawLabel(ctx, metric === 'coreDays' ? '越低越好' : '越高越好', 870, 27, palette.blue);
    if (status === 'running' && clock.elapsed >= 1200 && !clock.doneQueued) {
      clock.doneQueued = true;
      const runId = clock.runId;
      queueMicrotask(() => {
        if (timer.current.runId === runId) setStatus('done');
      });
    }
  }, 1080, 280, status === 'running');
  useEffect(() => () => { timer.current.runId += 1; }, []);
  const summary = data.values.map((value, index) => modelNames[index] + ':' + value + unit).join('；');
  return (
    <div>
      <div className="ctrl" aria-label="选择论文结果指标">
        {(Object.keys(vitPaperResults) as Metric[]).map((key) => <button type="button" key={key} className={'chip' + (metric === key ? ' selected' : '')} aria-pressed={metric === key} onClick={() => { reset(); setMetric(key); }}>{vitPaperResults[key].label}</button>)}
      </div>
      <canvas ref={canvasRef} aria-label={data.label + '，三条按表中模型顺序排列，统一从0开始。' + summary} />
      <div className="step-ctrl">
        <button type="button" className="chip" onClick={start} disabled={status === 'running' || status === 'done'}>{status === 'paused' ? '继续比较' : '开始比较'}</button>
        <button type="button" className="chip" onClick={pause} disabled={status !== 'running'}>暂停比较</button>
        <button type="button" className="chip" onClick={reset}>重置</button>
        <span className="step-label">{status === 'idle' ? '等待开始' : status === 'running' ? '正在显示结果' : status === 'paused' ? '已暂停' : '显示完成'}</span>
      </div>
      <Feedback>{data.feedback} 条形动画只显示已有论文数值，不表示训练、部署或推理速度。</Feedback>
      <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
        <table className="paper" aria-label={'论文Table2的' + data.label + '结果'}>
          <thead><tr><th scope="col">模型（图中从上至下）</th><th scope="col">{metric === 'coreDays' ? '预训练算力' : '均值±标准差'}</th><th scope="col">单位与方向</th></tr></thead>
          <tbody>{modelNames.map((name, index) => <tr key={name}><th scope="row"><span aria-hidden="true" style={{ color: modelColors[index] }}>{['▲', '■', '●'][index]} </span>{name}</th><td>{metric === 'coreDays' ? data.values[index].toLocaleString('en-US') : data.values[index].toFixed(2) + ' ± ' + data.deviations[index].toFixed(2)}</td><td>{metric === 'coreDays' ? 'TPUv3核日，越低越好' : '%，越高越好'}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="step-desc">准确率为三次微调均值与标准差，不是置信区间。百分点差是两项百分数直接相减；JFT预训练相同不意味着优化器、训练日程和预算等条件完全相同。</p>
    </div>
  );
}
