import React, { useEffect, useMemo, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const MINI_W = 244;
const MINI_H = 130;

type Task = 'semantic' | 'instance' | 'referring';

interface BenchmarkRow {
  setting: '非零样本迁移' | '零样本迁移';
  model: string;
  values: string[];
  method?: boolean;
}

interface BenchmarkTable {
  title: string;
  source: string;
  metrics: string[];
  rows: BenchmarkRow[];
  note: string;
}

interface TaskRecord {
  label: string;
  figures: Array<{ src: string; label: string; alt: string }>;
  figureNumber: string;
  promptExamples: Array<{ label: string; text: string }>;
  prompt: string;
  output: string;
  boundary: string;
  feedback: string;
  benchmarks: BenchmarkTable[];
}

const TASKS: Record<Task, TaskRecord> = {
  semantic: {
    label: '语义分割',
    figures: [
      { src: '/images/paper-semantic-input.png', label: '输入图像', alt: '论文图 2：橱窗中的猫' },
      { src: '/images/paper-semantic-natural.png', label: '自然语言颜色提示', alt: '论文图 2：自然语言颜色提示生成的语义分割结果' },
      { src: '/images/paper-semantic-structured.png', label: '结构化 RGB 提示', alt: '论文图 2：结构化 RGB 提示生成的语义分割结果' },
    ],
    figureNumber: '图 2',
    promptExamples: [
      { label: '自然语言', text: '把猫标成红色、门锁标成粉色、出口标志标成紫色，其余背景标成黄色。' },
      { label: '结构化写法', text: '{ "cat": "red", "door lock": "pink", "exit sign": "purple", "background": "yellow" }' },
    ],
    prompt: '按类别指定颜色；既可写自然语言，也可写 JSON、RGB 三元组或十六进制色值。',
    output: '生成逐像素彩色图，再把每个像素归到 RGB 空间中最近的目标色。',
    boundary: 'Vision Banana 单模型；Cityscapes 零样本 mIoU 为 69.9。',
    feedback: '高分辨率局部图从左到右依次为输入、自然语言颜色提示结果和结构化 RGB 提示结果。猫、锁和出口标志由提示动态指定，而不是固定在一个类别表里。',
    benchmarks: [
      {
        title: '语义分割｜Cityscapes val',
        source: '论文表 2；指标为 mIoU，越高越好。',
        metrics: ['mIoU ↑'],
        rows: [
          { setting: '非零样本迁移', model: 'SegMan-L', values: ['84.2'] },
          { setting: '零样本迁移', model: 'APE-D', values: ['44.2'] },
          { setting: '零样本迁移', model: 'OpenSeeD', values: ['47.8'] },
          { setting: '零样本迁移', model: 'X-Decoder', values: ['52.0'] },
          { setting: '零样本迁移', model: 'SAM 3', values: ['65.2'] },
          { setting: '零样本迁移', model: 'Vision Banana', values: ['69.9'], method: true },
        ],
        note: 'Vision Banana 在零样本迁移组中取得最高 mIoU；84.2 的 SegMan-L 使用了域内训练数据，因此单独列为非零样本迁移。',
      },
    ],
  },
  instance: {
    label: '实例分割',
    figures: [
      { src: '/images/paper-instance-input.png', label: '输入图像', alt: '论文图 3：砂锅与牛肉拼盘的输入图像' },
      { src: '/images/paper-instance-prompt-a.png', label: '提示：每瓣大蒜', alt: '论文图 3：大蒜实例被分别着色' },
      { src: '/images/paper-instance-prompt-b.png', label: '提示：每块牛肉', alt: '论文图 3：牛肉实例被分别着色' },
    ],
    figureNumber: '图 3',
    promptExamples: [
      { label: '左侧结果', text: '将每瓣大蒜分别涂成不同颜色。' },
      { label: '右侧结果', text: '将每块牛肉分别涂成不同颜色。' },
    ],
    prompt: '只给目标名词短语与背景色，例如“每瓣大蒜分别使用不同颜色”。',
    output: '模型为数量未知的实例动态配色，再通过去噪聚类恢复离散掩码。',
    boundary: 'SA-Co/Gold 的 47.5 cgF1 来自 Vision Banana 与 Gemini 3.1 Flash-Lite 的组合系统。',
    feedback: '高分辨率局部图展示牛肉块实例：模型事先不知道实例数量，只接收目标类别和背景色，再为每个实例动态选择不同颜色。',
    benchmarks: [
      {
        title: '实例分割｜SA-Co/Gold',
        source: '论文表 3；三项指标均为越高越好。',
        metrics: ['cgF₁ ↑', 'IL_MCC ↑', 'pmF₁ ↑'],
        rows: [
          { setting: '非零样本迁移', model: 'SAM 3', values: ['54.1', '0.82', '66.1'] },
          { setting: '非零样本迁移', model: 'SAM 3 + Llama 3.2（微调）', values: ['61.2', '0.86', '70.8'] },
          { setting: '零样本迁移', model: 'gDino-T', values: ['3.3', '0.15', '16.2'] },
          { setting: '零样本迁移', model: 'LLMDet-L', values: ['6.5', '0.21', '27.3'] },
          { setting: '零样本迁移', model: 'Gemini 2.5', values: ['13.0', '0.29', '46.1'] },
          { setting: '零样本迁移', model: 'APE-D', values: ['16.4', '0.40', '36.9'] },
          { setting: '零样本迁移', model: 'DINO-X', values: ['21.3', '0.38', '55.2'] },
          { setting: '零样本迁移', model: 'OWLv2', values: ['24.6', '0.57', '42.0'] },
          { setting: '零样本迁移', model: 'Vision Banana + Gemini 3.1 Flash-Lite', values: ['47.5', '0.84', '56.0'], method: true },
        ],
        note: 'Vision Banana 只处理被 Gemini 3.1 Flash-Lite 判断为正例的查询，因此突出行是组合系统结果，不能全部归因于 Vision Banana 单体。',
      },
    ],
  },
  referring: {
    label: '指代表达分割',
    figures: [
      { src: '/images/paper-referring-input.png', label: '输入图像', alt: '论文图 4：广场上的两名男子' },
      { src: '/images/paper-referring-output.png', label: '“穿粉色 T 恤的男子”', alt: '论文图 4：自由文本指代分割输出' },
    ],
    figureNumber: '图 4',
    promptExamples: [
      { label: '指代查询', text: '将穿粉色 T 恤的男子标为白色，另一名男子标为绿色。' },
    ],
    prompt: '直接描述目标，例如“穿粉色 T 恤的男子”。',
    output: '生成与自由文本所指对象对应的掩码，不依赖固定类别名。',
    boundary: 'Vision Banana 单模型；RefCOCOg UMD val 零样本 cIoU 为 73.8。',
    feedback: '左图中的两名男子外观相近，提示要求定位“穿粉色 T 恤的男子”；右侧掩码只将对应人物涂成白色，另一人保持绿色。文字与图中目标严格一致。',
    benchmarks: [
      {
        title: '指代表达分割｜RefCOCOg UMD val',
        source: '论文表 4；指标为 cIoU，越高越好。',
        metrics: ['cIoU ↑'],
        rows: [
          { setting: '非零样本迁移', model: 'HyperSeg-Phi2-2.7B', values: ['79.4'] },
          { setting: '非零样本迁移', model: 'X-SAM-Phi3-3.8B', values: ['83.8'] },
          { setting: '零样本迁移', model: 'HybridGL', values: ['51.3'] },
          { setting: '零样本迁移', model: 'LocalizationHeads-LLaVA-1.5-13B', values: ['67.7'] },
          { setting: '零样本迁移', model: 'SAM 3 + Gemini 2.5 Pro', values: ['73.4'] },
          { setting: '零样本迁移', model: 'Vision Banana', values: ['73.8'], method: true },
        ],
        note: 'Vision Banana 是单模型结果，在零样本迁移组中略高于 SAM 3 + Gemini 2.5 Pro；使用 RefCOCOg 训练集的方法单独列为非零样本迁移。',
      },
      {
        title: '指代表达分割｜ReasonSeg val',
        source: '论文表 5；指标为 gIoU，越高越好。',
        metrics: ['gIoU ↑'],
        rows: [
          { setting: '非零样本迁移', model: 'X-SAM-Phi-3-3.8B', values: ['56.6'] },
          { setting: '非零样本迁移', model: 'LISA-13B-LLaVA1.5', values: ['65.0'] },
          { setting: '零样本迁移', model: 'SegZero-Qwen2.5-VL-7B', values: ['62.6'] },
          { setting: '零样本迁移', model: 'RSVP-GPT-4o', values: ['64.7'] },
          { setting: '零样本迁移', model: 'SAM 3 + Gemini 2.5 Pro', values: ['77.0'] },
          { setting: '零样本迁移', model: 'Vision Banana + Gemini 2.5 Pro', values: ['79.3'], method: true },
        ],
        note: 'ReasonSeg 属于指代表达分割的推理式评测。Gemini 2.5 Pro 先把查询改写为描述性指代，再由 Vision Banana 生成掩码；79.3 是单轮组合流水线结果。',
      },
    ],
  },
};

function isCompact(moduleId: string) {
  return !/^\d+(\.\d+)?$/.test(moduleId);
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 8,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function drawMini(ctx: CanvasRenderingContext2D, now: number, reducedMotion: boolean) {
  const phase = reducedMotion ? 1 : (now % 2800) / 2800;
  ctx.clearRect(0, 0, MINI_W, MINI_H);
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, MINI_W, MINI_H);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#b8c9a7';
  ctx.lineWidth = 2;
  roundedRect(ctx, 10, 15, 224, 100);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff7ed';
  ctx.strokeStyle = '#d97706';
  roundedRect(ctx, 20, 34, 67, 43, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#21324a';
  ctx.font = '9px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('找谁？', 53, 51);
  ctx.fillText('涂什么色？', 53, 66);
  ctx.fillStyle = '#e8f0e1';
  ctx.strokeStyle = '#76906a';
  ctx.fillRect(105, 29, 112, 66);
  ctx.strokeRect(105, 29, 112, 66);
  ctx.fillStyle = '#27446e';
  ctx.fillRect(111, 70, 100, 19);
  ctx.fillStyle = '#b8c9a7';
  ctx.beginPath();
  ctx.arc(191, 48, 13, 0, Math.PI * 2);
  ctx.fill();
  const progress = Math.max(0, Math.min(1, (phase - 0.25) / 0.45));
  ctx.globalAlpha = progress;
  ctx.fillStyle = '#eab308';
  ctx.beginPath();
  ctx.arc(157, 64, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#228d5c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(90, 70);
  ctx.lineTo(101, 70);
  ctx.stroke();
  if (phase > 0.7 || reducedMotion) {
    ctx.fillStyle = '#228d5c';
    ctx.font = '700 9px "Segoe UI", sans-serif';
    ctx.fillText('提示 → 可读掩码', 165, 109);
  }
}

export const PromptColor: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const compact = isCompact(moduleId);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [task, setTask] = useState<Task>('semantic');
  const current = useMemo(() => TASKS[task], [task]);

  useEffect(() => {
    if (!compact) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, MINI_W, MINI_H);
    } catch {
      return undefined;
    }
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let animationFrame: number | null = null;
    const draw = (now = 0) => {
      drawMini(ctx, now, reducedMotion);
      canvas.classList.add('is-ready');
      if (!reducedMotion) animationFrame = requestAnimationFrame(draw);
    };
    const start = () => {
      if (animationFrame === null) animationFrame = requestAnimationFrame(draw);
    };
    const stop = () => {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      animationFrame = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [compact]);

  if (compact) {
    return (
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={MINI_W} height={MINI_H} aria-label="制图师按提示卡在同一张底图上生成可读的彩色掩码" />
    );
  }

  return (
    <div>
      <div className="paper-choice-group" role="tablist" aria-label="选择二维视觉任务">
        {(Object.keys(TASKS) as Task[]).map((key) => (
          <button key={key} type="button" role="tab" aria-selected={task === key} onClick={() => setTask(key)}>
            {TASKS[key].label}
          </button>
        ))}
      </div>
      <section className="paper-prompt-card" aria-live="polite">
        <span className="paper-prompt-kicker">当前任务的输入提示（中文意译）</span>
        <div className="paper-prompt-examples">
          {current.promptExamples.map((example) => (
            <p key={`${task}-${example.label}`}>
              <strong>{example.label}</strong>
              <q>{example.text}</q>
            </p>
          ))}
        </div>
      </section>
      <figure className="paper-evidence-figure" aria-live="polite">
        <div className="paper-task-evidence-grid">
          {current.figures.map((figure) => (
            <div className="paper-task-evidence-panel" key={figure.src}>
              <img src={figure.src} alt={figure.alt} loading="lazy" />
              <span>{figure.label}</span>
            </div>
          ))}
        </div>
        <figcaption><strong>{current.figureNumber}｜{current.label}</strong><span>{current.feedback}</span></figcaption>
      </figure>
      <dl className="paper-fact-grid">
        <dt>提示规则</dt><dd>{current.prompt}</dd>
        <dt>解码方式</dt><dd>{current.output}</dd>
        <dt>系统与指标边界</dt><dd>{current.boundary}</dd>
      </dl>
      <details className="paper-technical-details paper-benchmark-details">
        <summary>查看论文完整评测与模型对比</summary>
        <div className="paper-technical-details-body">
          {current.benchmarks.map((benchmark) => (
            <section className="paper-benchmark-section" key={benchmark.title}>
              <h4>{benchmark.title}</h4>
              <p className="paper-benchmark-source">{benchmark.source}</p>
              <div className={benchmark.metrics.length > 1 ? 'paper-table-scroll wide' : 'paper-table-scroll'} role="region" aria-label={`${benchmark.title}评测表，可横向滚动`} tabIndex={0}>
                <table className="paper" aria-label={`${benchmark.title}模型对比`}>
                  <thead>
                    <tr>
                      <th>迁移设置</th>
                      <th>模型或系统</th>
                      {benchmark.metrics.map((metric) => <th key={metric}>{metric}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {benchmark.rows.map((row) => (
                      <tr className={row.method ? 'paper-benchmark-method' : undefined} key={`${row.setting}-${row.model}`}>
                        <td>{row.setting}</td>
                        <td>{row.model}</td>
                        {row.values.map((value, index) => <td key={`${row.model}-${benchmark.metrics[index]}`}>{value}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="paper-benchmark-note">{benchmark.note}</p>
            </section>
          ))}
          <p className="note">各表仅在相同数据集、划分和指标内比较；不同表中的 mIoU、cgF₁、cIoU 与 gIoU 不能直接横向换算。</p>
        </div>
      </details>
      <p className="note">三类任务共用生成 RGB 图像的接口，但提示约定、解码规则和系统组成不同；切换上方任务时，论文证据与解释会同步变化。</p>
    </div>
  );
};

export default PromptColor;
