import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  CH,
  COLORS,
  CW,
  TECH_H,
  chipClass,
  clear,
  clearSized,
  feedbackClass,
  label,
  panel,
  useSizedStaticCanvas,
  useStaticCanvas,
} from './canvasUtils';

type Benchmark = 'LongVideoBench' | 'MLVU' | 'Video-MME';
type Context = '8k' | '16k' | '32k' | '64k';

const resultTable: Record<Benchmark, Record<Context, { mrope: number; video: number }>> = {
  LongVideoBench: {
    '8k': { mrope: 53.42, video: 54.46 },
    '16k': { mrope: 52.8, video: 55.29 },
    '32k': { mrope: 53.11, video: 57.15 },
    '64k': { mrope: 54.35, video: 57.26 },
  },
  MLVU: {
    '8k': { mrope: 60.41, video: 65.19 },
    '16k': { mrope: 60.68, video: 66.29 },
    '32k': { mrope: 61.56, video: 66.02 },
    '64k': { mrope: 61.1, video: 65.56 },
  },
  'Video-MME': {
    '8k': { mrope: 60.67, video: 61.33 },
    '16k': { mrope: 59.67, video: 61.0 },
    '32k': { mrope: 61.0, video: 61.67 },
    '64k': { mrope: 59.67, video: 61.33 },
  },
};

export const ExperimentExplorer: React.FC<WidgetProps> = () => {
  const [benchmark, setBenchmark] = useState<Benchmark>('LongVideoBench');
  const [context, setContext] = useState<Context>('64k');
  const data = resultTable[benchmark][context];
  const ref = useSizedStaticCanvas(CW, TECH_H, (ctx) => {
    clearSized(ctx, CW, TECH_H);
    panel(ctx, 42, 28, 996, 366);
    const contexts: Context[] = ['8k', '16k', '32k', '64k'];
    const xFor = (index: number) => 150 + index * 205;
    const yFor = (value: number) => 320 - (value - 48) * 10.2;
    [50, 55, 60, 65, 70].forEach((tick) => {
      const y = yFor(tick);
      ctx.strokeStyle = COLORS.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(110, y);
      ctx.lineTo(820, y);
      ctx.stroke();
      label(ctx, `${tick}`, 66, y + 5, COLORS.muted, 14);
    });
    const series = [
      { key: 'mrope' as const, name: 'M-RoPE', color: COLORS.red },
      { key: 'video' as const, name: 'VideoRoPE', color: COLORS.green },
    ];
    series.forEach((line) => {
      ctx.strokeStyle = line.color;
      ctx.lineWidth = 5;
      ctx.beginPath();
      contexts.forEach((item, index) => {
        const value = resultTable[benchmark][item][line.key];
        const x = xFor(index);
        const y = yFor(value);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      contexts.forEach((item, index) => {
        const value = resultTable[benchmark][item][line.key];
        const x = xFor(index);
        const y = yFor(value);
        ctx.fillStyle = item === context ? COLORS.orange : line.color;
        ctx.beginPath();
        ctx.arc(x, y, item === context ? 10 : 7, 0, Math.PI * 2);
        ctx.fill();
      });
    });
    contexts.forEach((item, index) => label(ctx, item, xFor(index) - 13, 354, item === context ? COLORS.orange : COLORS.muted, 16));
    panel(ctx, 850, 78, 155, 245);
    label(ctx, '当前差值', 878, 115, COLORS.text, 17);
    const gain = data.video - data.mrope;
    label(ctx, `+${gain.toFixed(2)}`, 882, 168, COLORS.green, 28);
    ctx.fillStyle = COLORS.red;
    ctx.fillRect(882, 205, 40, 78);
    ctx.fillStyle = COLORS.green;
    ctx.fillRect(938, 185, 40, 98);
    label(ctx, data.mrope.toFixed(1), 882, 306, COLORS.red, 14);
    label(ctx, data.video.toFixed(1), 938, 306, COLORS.green, 14);
  }, [benchmark, context, data.mrope, data.video]);
  return (
    <div>
      <canvas ref={ref} width={CW} height={TECH_H} />
      <div className="ctrl">
        {(Object.keys(resultTable) as Benchmark[]).map((item) => <button key={item} className={chipClass(benchmark === item)} onClick={() => setBenchmark(item)}>{item}</button>)}
        {(['8k', '16k', '32k', '64k'] as Context[]).map((item) => <button key={item} className={chipClass(context === item)} onClick={() => setContext(item)}>{item}</button>)}
      </div>
      <div className={feedbackClass('good')}>
        表 2：{benchmark}、{context} 上 VideoRoPE 为 {data.video.toFixed(2)}，M-RoPE 为 {data.mrope.toFixed(2)}，高分更好；这里只比较同一协议下的数值。
      </div>
    </div>
  );
};

const ablations = [
  { name: 'Baseline', lvb: 54.35, mlvu: 61.1 },
  { name: '+ DL', lvb: 53.63, mlvu: 62.75 },
  { name: '+ DL & LTA', lvb: 55.6, mlvu: 63.26 },
  { name: '+ DL & LTA & ATS', lvb: 57.26, mlvu: 65.56 },
];

export const AblationExplorer: React.FC<WidgetProps> = () => {
  const [metric, setMetric] = useState<'LongVideoBench' | 'MLVU'>('LongVideoBench');
  const [selected, setSelected] = useState(3);
  const ref = useSizedStaticCanvas(CW, TECH_H, (ctx) => {
    clearSized(ctx, CW, TECH_H);
    panel(ctx, 45, 28, 990, 366);
    ablations.forEach((row, index) => {
      const value = metric === 'LongVideoBench' ? row.lvb : row.mlvu;
      const previous = index === 0 ? value : metric === 'LongVideoBench' ? ablations[index - 1].lvb : ablations[index - 1].mlvu;
      const x = 125 + index * 235;
      const h = ((value - 48) / 20) * 245;
      ctx.fillStyle = index === selected ? COLORS.green : COLORS.light;
      ctx.fillRect(x, 330 - h, 138, h);
      ctx.strokeStyle = index === selected ? COLORS.text : COLORS.line;
      ctx.lineWidth = index === selected ? 4 : 2;
      ctx.strokeRect(x, 330 - h, 138, h);
      label(ctx, value.toFixed(2), x + 35, 320 - h, index === selected ? COLORS.green : COLORS.muted, 17);
      if (index > 0) {
        const delta = value - previous;
        label(ctx, `${delta >= 0 ? '+' : ''}${delta.toFixed(2)}`, x + 42, 365, delta >= 0 ? COLORS.green : COLORS.red, 15);
      }
    });
    label(ctx, '逐步加入组件', 455, 60, COLORS.text, 18);
  }, [metric, selected]);
  const row = ablations[selected];
  return (
    <div>
      <canvas ref={ref} width={CW} height={TECH_H} />
      <div className="ctrl">
        {(['LongVideoBench', 'MLVU'] as const).map((item) => <button key={item} className={chipClass(metric === item)} onClick={() => setMetric(item)}>{item} 64k</button>)}
        {ablations.map((item, index) => <button key={item.name} className={chipClass(selected === index)} onClick={() => setSelected(index)}>{item.name}</button>)}
      </div>
      <div className={feedbackClass(selected === 3 ? 'good' : 'neutral')}>
        表 5：{row.name} 在 {metric} 64k 上为 {(metric === 'LongVideoBench' ? row.lvb : row.mlvu).toFixed(2)}。DL 单独并非处处提升，完整组合才同时达到两项最高值。
      </div>
    </div>
  );
};

type Scenario = '长视频检索' | '高分辨率图像' | '变帧率视频';
const guide: Record<Scenario, { lta: boolean; dl: boolean; ats: boolean; note: string }> = {
  长视频检索: { lta: true, dl: true, ats: true, note: '论文已评测：长视频检索直接检验长程时间定位，并比较了 VideoRoPE 与其他 RoPE 变体。' },
  高分辨率图像: { lta: false, dl: true, ats: false, note: '迁移推断，论文未直接评测：可探索对角居中布局对静态图像与文本的位置关系是否有益，需另做实验验证。' },
  变帧率视频: { lta: true, dl: true, ats: true, note: '迁移推断，论文未直接评测：ATS 或可帮助处理采样间隔变化，但实际效果需在变帧率数据上验证。' },
};

export const DesignGuide: React.FC<WidgetProps> = () => {
  const [scenario, setScenario] = useState<Scenario>('长视频检索');
  const config = guide[scenario];
  const ref = useStaticCanvas((ctx) => {
    clear(ctx);
    panel(ctx, 55, 34, 970, 205);
    const items = [
      { name: 'LTA', on: config.lta, x: 250 },
      { name: 'DL', on: config.dl, x: 540 },
      { name: 'ATS', on: config.ats, x: 830 },
    ];
    items.forEach((item) => {
      ctx.fillStyle = item.on ? COLORS.green : COLORS.light;
      ctx.strokeStyle = item.on ? COLORS.text : COLORS.line;
      ctx.lineWidth = item.on ? 5 : 2;
      ctx.beginPath();
      ctx.roundRect(item.x - 88, 84, 176, 100, 20);
      ctx.fill();
      ctx.stroke();
      label(ctx, item.name, item.x - 25, 145, item.on ? COLORS.white : COLORS.muted, 22);
    });
  }, [scenario, config]);
  return (
    <div>
      <canvas ref={ref} width={CW} height={CH} />
      <div className="ctrl">
        {(Object.keys(guide) as Scenario[]).map((item) => <button key={item} className={chipClass(scenario === item)} onClick={() => setScenario(item)}>{item}</button>)}
      </div>
      <div className={feedbackClass('neutral')}>{config.note}</div>
    </div>
  );
};

const gains = [
  { name: 'V-NIAH', value: 12.4 },
  { name: 'V-NIAH-D', value: 12.4 },
  { name: 'LongVideoBench', value: 2.9 },
  { name: 'MLVU', value: 4.5 },
  { name: 'Video-MME', value: 1.7 },
  { name: 'VideoHallucer', value: 11.9 },
];

export const ResultRace: React.FC<WidgetProps> = () => {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const raf = useRef(0);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  const start = () => {
    cancelAnimationFrame(raf.current);
    setRunning(true);
    setProgress(0);
    const startTime = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - startTime) / 1500);
      setProgress(p);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else setRunning(false);
    };
    raf.current = requestAnimationFrame(tick);
  };
  const ref = useStaticCanvas((ctx) => {
    clear(ctx);
    panel(ctx, 55, 34, 970, 205);
    gains.forEach((item, index) => {
      const row = index % 3;
      const col = Math.floor(index / 3);
      const x = 95 + col * 500;
      const y = 74 + row * 54;
      ctx.fillStyle = COLORS.line;
      ctx.fillRect(x + 150, y, 300, 26);
      ctx.fillStyle = COLORS.green;
      ctx.fillRect(x + 150, y, (item.value / 13) * 300 * progress, 26);
      label(ctx, item.name, x, y + 20, COLORS.text, 15);
      label(ctx, `+${(item.value * progress).toFixed(1)}`, x + 405, y + 20, COLORS.green, 15);
    });
  }, [progress]);
  return (
    <div>
      <canvas ref={ref} width={CW} height={CH} />
      <div className="ctrl"><button onClick={start} disabled={running}>{running ? '比较中…' : '开始对比'}</button></div>
      <div className={feedbackClass(progress === 1 ? 'good' : 'neutral')}>
        {progress === 1 ? '论文引言报告了相对 M-RoPE 的这些提升；不同基准的分数不能直接横向比较。' : '启动后按论文引言中的同基准提升值展开；柱长仅表示各自提升幅度。'}
      </div>
    </div>
  );
};
