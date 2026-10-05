import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import {
  CanvasStage, ChipRow, StepControls, COLORS, W, H,
  studioBase, label, drawCamera, drawFilter, drawFrame, drawArrow, drawBar, drawLayers, drawAnalogy, roundedRect,
} from './c1-camera-kit';

const Analogy = ({ chapter }: { chapter: number }) => (
  <CanvasStage labelText={`第 ${chapter} 章相机滤镜类比动画`} animate draw={(ctx, _w, _h, phase) => drawAnalogy(ctx, chapter, phase)} />
);

export const C1HeroOld: React.FC<WidgetProps> = () => (
  <CanvasStage labelText="全量微调随任务增加复制整台相机" animate draw={(ctx, _w, _h, phase) => {
    studioBase(ctx, W, H);
    const count = 1 + Math.floor(phase * 3);
    for (let i = 0; i < count; i += 1) drawCamera(ctx, 80 + i * 230, 112, 0.78, COLORS.red);
    drawBar(ctx, 80, 228, 760, count / 3, COLORS.red, `${count} 个任务 · ${count} 套完整权重`);
  }} />
);

export const C1HeroNew: React.FC<WidgetProps> = () => (
  <CanvasStage labelText="适配器共享一台相机并增加任务滤镜" animate draw={(ctx, _w, _h, phase) => {
    studioBase(ctx, W, H);
    drawCamera(ctx, 100, 108, 0.86);
    const progress = (1 - Math.cos(phase * Math.PI * 2)) / 2;
    const cards = [
      { x: 390, color: COLORS.green, start: 0 },
      { x: 510, color: COLORS.orange, start: 0.34 },
      { x: 630, color: COLORS.purple, start: 0.68 },
    ];
    cards.forEach((card) => {
      const local = Math.max(0, Math.min(1, (progress - card.start) / 0.32));
      if (local > 0) drawFilter(ctx, card.x, 110 - (1 - local) * 34, 38, card.color, local);
    });
    drawBar(ctx, 80, 228, 760, 0.34 + progress * 0.18, COLORS.green, '1 个共享主干 · 小型任务套件逐步增加', 26);
  }} />
);

export const C1Analogy: React.FC<WidgetProps> = () => <Analogy chapter={1} />;
export const C2Analogy: React.FC<WidgetProps> = () => <Analogy chapter={2} />;
export const C3Analogy: React.FC<WidgetProps> = () => <Analogy chapter={3} />;
export const C4Analogy: React.FC<WidgetProps> = () => <Analogy chapter={4} />;

type TaskCount = '1' | '3' | '9' | '17';
export const C1StorageCompare: React.FC<WidgetProps> = () => {
  const [count, setCount] = useState<TaskCount>('1');
  const [running, setRunning] = useState(false);
  const n = Number(count);
  const feedback = n === 1
    ? '一个任务时，两种方法都能工作；差异会在任务累积时显现。'
    : '全量微调随任务数复制整套权重；Adapter 只增加每任务小模块。';
  return (
    <div>
      <CanvasStage labelText="全量微调和适配器的多任务存储对比" animate={running} draw={(ctx, _w, _h, phase) => {
        studioBase(ctx, W, H);
        label(ctx, '全量微调', 250, 30, COLORS.red, 18, 'center');
        label(ctx, 'Adapter', 810, 30, COLORS.green, 18, 'center');
        const reveal = running ? Math.min(1, phase * 2.4) : 1;
        const visible = Math.max(1, Math.ceil(n * reveal));
        for (let i = 0; i < Math.min(visible, 5); i += 1) drawCamera(ctx, 50 + i * 94, 82 + (i % 2) * 82, 0.52, COLORS.red);
        drawCamera(ctx, 610, 92, 0.82);
        for (let i = 0; i < Math.min(visible, 8); i += 1) drawFilter(ctx, 775 + (i % 4) * 58, 75 + Math.floor(i / 4) * 104, 30, COLORS.green);
        drawBar(ctx, 45, 238, 440, n / 17, COLORS.red, `${n}× 完整模型单位`);
        drawBar(ctx, 595, 238, 440, Math.min(1, 0.28 + n * 0.035), COLORS.green, `共享主干 + ${n} 个任务套件`);
      }} />
      <ChipRow options={['1', '3', '9', '17'].map((v) => ({ value: v as TaskCount, label: `${v} 个任务` }))} value={count} onChange={(v) => { setCount(v); setRunning(false); }} />
      <div className="step-ctrl"><button type="button" className="tiny" onClick={() => setRunning((v) => !v)}>{running ? '暂停比较' : '开始比较'}</button></div>
      <div className={`feedback ${n > 1 ? 'good' : ''}`}>{feedback}</div>
    </div>
  );
};

type Owner = 'w' | 'v' | 'data';
export const C1Ownership: React.FC<WidgetProps> = () => {
  const [selected, setSelected] = useState<Owner>('w');
  const messages: Record<Owner, string> = {
    w: 'Adapter 共享并冻结 w；全量微调为每个任务改写 w。',
    v: '每个任务仍保存适配器、层归一化参数和任务头。',
    data: '论文允许任务顺序到达，不要求同时访问全部数据集。',
  };
  return (
    <div>
      <CanvasStage labelText="两种方法的参数所有权矩阵" draw={(ctx) => {
        studioBase(ctx, W, H);
        label(ctx, '全量微调', 435, 35, COLORS.red, 17, 'center');
        label(ctx, 'Adapter', 765, 35, COLORS.green, 17, 'center');
        const rows: Array<[Owner, string]> = [['w', '主干 w'], ['v', '任务参数 v'], ['data', '旧任务数据']];
        rows.forEach(([id, name], i) => {
          const y = 70 + i * 61;
          roundedRect(ctx, 80, y, 220, 44, 7, id === selected ? COLORS.paleOrange : COLORS.paper, id === selected ? COLORS.orange : COLORS.line);
          label(ctx, name, 190, y + 22, COLORS.ink, 15, 'center');
          roundedRect(ctx, 335, y, 200, 44, 7, id === 'w' ? COLORS.paleRed : COLORS.paleOrange, id === 'w' ? COLORS.red : COLORS.orange);
          label(ctx, id === 'data' ? '按任务单独训练' : '每任务改写', 435, y + 22, COLORS.ink, 14, 'center');
          roundedRect(ctx, 665, y, 200, 44, 7, id === 'w' ? COLORS.paleBlue : COLORS.paleGreen, id === 'w' ? COLORS.blue : COLORS.green);
          label(ctx, id === 'w' ? '共享且冻结' : id === 'v' ? '每任务保留' : '无需旧数据同时在场', 765, y + 22, COLORS.ink, 14, 'center');
        });
      }} />
      <ChipRow options={[{ value: 'w', label: '主干 w' }, { value: 'v', label: '任务参数 v' }, { value: 'data', label: '数据集' }]} value={selected} onChange={setSelected} />
      <div className="feedback good">{messages[selected]}</div>
    </div>
  );
};

type TransferMode = 'feature' | 'top' | 'full' | 'adapter';
export const C2TransferModes: React.FC<WidgetProps> = () => {
  const [method, setMethod] = useState<TransferMode>('feature');
  const info: Record<TransferMode, { text: string; active: number[]; storage: number; color: string }> = {
    feature: { text: '特征迁移只读取主干表示。', active: [], storage: 0.14, color: COLORS.blue },
    top: { text: '顶层微调只改上层，但论文显示同等参数量下可能明显落后。', active: [9, 10, 11], storage: 0.38, color: COLORS.orange },
    full: { text: '全量微调表达力强，却复制全部任务权重。', active: [...Array(12).keys()], storage: 1, color: COLORS.red },
    adapter: { text: 'Adapter 写入各层的小模块，同时保留共享主干。', active: [1, 3, 5, 7, 9, 11], storage: 0.22, color: COLORS.green },
  };
  return (
    <div>
      <CanvasStage labelText="四种迁移方法的可训练层与存储级别" draw={(ctx) => {
        studioBase(ctx, W, H);
        drawLayers(ctx, 70, 88, info[method].active);
        drawArrow(ctx, 675, 118, 765, 118, info[method].color);
        drawFrame(ctx, 800, 73, COLORS.purple, method === 'feature' ? 0.72 : 0.9);
        drawBar(ctx, 70, 220, 560, info[method].storage, info[method].color, `任务存储级别：${method === 'full' ? '整模' : method === 'top' ? '中' : '小'}`);
        label(ctx, method === 'adapter' ? '主干冻结 · 小模块可训练' : method === 'full' ? '全部主干可训练' : '局部读取 / 局部写入', 860, 215, info[method].color, 16, 'center');
      }} />
      <ChipRow options={[{ value: 'feature', label: '特征迁移' }, { value: 'top', label: '顶层微调' }, { value: 'full', label: '全量微调' }, { value: 'adapter', label: 'Adapter' }]} value={method} onChange={setMethod} />
      <div className={`feedback ${method === 'full' ? 'bad' : method === 'adapter' ? 'good' : ''}`}>{info[method].text}</div>
    </div>
  );
};

export const C3SequentialTasks: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const labels = ['共享预训练', '训练任务 A', '训练任务 B', '返回任务 A'];
  const feedback = [
    '先得到共享主干 w。',
    '只更新 v_A，w 保持冻结。',
    '新增 v_B，不访问 A 的数据，也不改 v_A。',
    '重新加载 v_A，旧任务参数未被 B 覆盖。',
  ];
  return (
    <div>
      <CanvasStage labelText="任务顺序加入时的参数账本" draw={(ctx) => {
        studioBase(ctx, W, H);
        drawCamera(ctx, 100, 94, 0.95);
        if (step > 0) drawFilter(ctx, 350, 96, 44, step === 2 ? COLORS.orange : COLORS.green);
        drawFrame(ctx, 500, 90, step === 2 ? COLORS.orange : COLORS.purple, step === 0 ? 0.65 : 0.92);
        label(ctx, '参数账本', 820, 42, COLORS.ink, 18, 'center');
        roundedRect(ctx, 690, 70, 260, 45, 8, COLORS.paleBlue, COLORS.blue);
        label(ctx, 'w 共享主干  🔒', 820, 92, COLORS.blue, 15, 'center');
        if (step >= 1) { roundedRect(ctx, 690, 128, 260, 38, 8, COLORS.paleGreen, COLORS.green); label(ctx, 'v_A 已保存', 820, 147, COLORS.green, 14, 'center'); }
        if (step >= 2) { roundedRect(ctx, 690, 179, 260, 38, 8, COLORS.paleOrange, COLORS.orange); label(ctx, 'v_B 已保存', 820, 198, COLORS.orange, 14, 'center'); }
      }} />
      <StepControls value={step} max={3} onChange={setStep} labels={labels} />
      <div className="feedback good">{feedback[step]}</div>
      <div className="feedback">这不是联合多任务学习：A 与 B 不共享适配器更新。</div>
    </div>
  );
};

type Width = '2' | '8' | '64' | '256';
export const C4Bottleneck: React.FC<WidgetProps> = () => {
  const widths: Width[] = ['2', '8', '64', '256'];
  const [m, setM] = useState<Width>('64');
  const d = 768;
  const width = Number(m);
  const params = 2 * width * d + d + width;
  const share = params / (d * d);
  const feedback = width <= 8
    ? '极窄瓶颈最省参数；容量判断必须看任务结果。'
    : width === 64
      ? '论文将 64 作为常用固定宽度，并报告稳健表现。'
      : '宽度更大，参数增加；论文并未保证所有任务都更好。';
  return (
    <div>
      <CanvasStage labelText="适配器瓶颈宽度与参数量" draw={(ctx) => {
        studioBase(ctx, W, H);
        drawFilter(ctx, 80, 88, 34 + width / 5, COLORS.orange);
        label(ctx, `m = ${m}`, 150, 205, COLORS.orange, 18, 'center');
        const ys = [88, 116, 144, 172];
        ys.forEach((y) => drawArrow(ctx, 330, y, 440, 130 + (y - 130) * 0.2, COLORS.blue));
        roundedRect(ctx, 450, 104, 100, 58, 8, COLORS.paleOrange, COLORS.orange);
        label(ctx, `m=${m}`, 500, 133, COLORS.orange, 16, 'center');
        ys.forEach((y) => drawArrow(ctx, 560, 130 + (y - 130) * 0.2, 670, y, COLORS.green));
        label(ctx, 'd → m → d', 500, 58, COLORS.ink, 19, 'center');
        drawArrow(ctx, 330, 212, 670, 212, COLORS.green);
        label(ctx, '内部跳连', 500, 232, COLORS.green, 14, 'center');
        drawBar(ctx, 750, 112, 260, Math.min(1, width / 256), COLORS.orange, `${params.toLocaleString()} 个投影参数`);
        label(ctx, `约为一个 d×d 矩阵的 ${(share * 100).toFixed(1)}%`, 880, 168, COLORS.muted, 14, 'center');
      }} />
      <div className="ctrl">
        <label>瓶颈宽度 m <span className="val">{m}</span></label>
        <input aria-label="瓶颈宽度" type="range" min={0} max={3} step={1} value={widths.indexOf(m)} onChange={(e) => setM(widths[Number(e.target.value)])} />
      </div>
      <ChipRow options={widths.map((v) => ({ value: v, label: `m=${v}` }))} value={m} onChange={setM} />
      <div className="feedback good">{feedback} 参数占比是基于 d=768 的解释性计算。</div>
    </div>
  );
};
