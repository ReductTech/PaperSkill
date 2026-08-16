import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { PaperTable, SectionExtras } from './hy-paper-evidence';

type GroupId = 'panorama' | 'geometry' | 'nvs' | 'efficiency';
type Direction = 'higher' | 'lower';

type MetricDef = {
  id: string;
  label: string;
  direction: Direction;
  color: string;
  unit?: string;
};

type ModelDef = {
  id: string;
  label: string;
  target?: boolean;
  values: Record<string, number | null>;
  displayValues?: Record<string, string>;
};

type GroupDef = {
  id: GroupId;
  label: string;
  source: string;
  protocol: string;
  metrics: MetricDef[];
  models: ModelDef[];
};

const metricColors = ['#27446e', '#228d5c', '#d97706'];

const staticGroups: Record<Exclude<GroupId, 'efficiency'>, GroupDef> = {
  panorama: {
    id: 'panorama', label: '全景生成', source: 'Table 4 · I2P',
    protocol: '图像到全景（I2P）兼容子协议；CLIP-I、Q-Align 质量与美学均为越高越好。',
    metrics: [
      { id: 'clip', label: 'CLIP-I', direction: 'higher', color: metricColors[0] },
      { id: 'quality', label: 'Q-Align 质量（透视）', direction: 'higher', color: metricColors[1] },
      { id: 'aesthetic', label: 'Q-Align 美学（ERP）', direction: 'higher', color: metricColors[2] },
    ],
    models: [
      { id: 'cubediff', label: 'CubeDiff', values: { clip: .828, quality: 2.938, aesthetic: 3.645 } },
      { id: 'genex', label: 'GenEx', values: { clip: .831, quality: 2.917, aesthetic: 3.646 } },
      { id: 'hypano', label: 'HY-Pano 2.0', target: true, values: { clip: .844, quality: 4.026, aesthetic: 4.056 } },
    ],
  },
  geometry: {
    id: 'geometry', label: '相机与深度', source: 'Table 12 · RE10K',
    protocol: 'RealEstate10K；AUC@30 越高越好，AbsRel 越低越好。WorldMirror 2.0 取 M 分辨率。',
    metrics: [
      { id: 'auc', label: 'AUC@30', direction: 'higher', color: metricColors[0] },
      { id: 'absrel', label: 'AbsRel', direction: 'lower', color: metricColors[1] },
    ],
    models: [
      { id: 'fast3r', label: 'Fast3R', values: { auc: 61.68, absrel: .353 } },
      { id: 'cut3r', label: 'CUT3R', values: { auc: 81.47, absrel: .260 } },
      { id: 'flare', label: 'FLARE', values: { auc: 80.01, absrel: .445 } },
      { id: 'vggt', label: 'VGGT', values: { auc: 77.62, absrel: .256 } },
      { id: 'pi3', label: 'pi3', values: { auc: 85.90, absrel: .151 } },
      { id: 'mirror', label: 'WorldMirror 2.0 (M)', target: true, values: { auc: 86.48, absrel: .167 } },
    ],
  },
  nvs: {
    id: 'nvs', label: '新视角合成', source: 'Table 12 · NVS',
    protocol: 'RealEstate10K 与 DL3DV 平均；PSNR、SSIM 越高越好，LPIPS 越低越好。',
    metrics: [
      { id: 'psnr', label: 'PSNR', direction: 'higher', color: metricColors[0], unit: ' dB' },
      { id: 'ssim', label: 'SSIM', direction: 'higher', color: metricColors[1] },
      { id: 'lpips', label: 'LPIPS', direction: 'lower', color: metricColors[2] },
    ],
    models: [
      { id: 'flare', label: 'FLARE', values: { psnr: 15.84, ssim: .545, lpips: .500 } },
      { id: 'anysplat', label: 'AnySplat', values: { psnr: 18.57, ssim: .626, lpips: .255 } },
      { id: 'mirror', label: 'WorldMirror 2.0 (M)', target: true, values: { psnr: 20.07, ssim: .680, lpips: .186 } },
    ],
  },
};

const efficiencyConfigs = [
  { id: 'fp32', label: 'FP32 单卡', values: { memory: [24.95, 38.56, 59.26, null], time: [2.45, 6.27, 18.00, null] } },
  { id: 'bf16', label: 'BF16 单卡', values: { memory: [15.10, 25.06, 41.73, 75.05], time: [2.11, 5.65, 16.96, 56.96] } },
  { id: 'sp', label: 'SP + BF16 四卡', values: { memory: [15.81, 26.44, 44.47, 80.54], time: [.96, 2.21, 5.65, 17.69] } },
  { id: 'fsdp', label: 'SP + BF16 + FSDP 四卡', target: true, values: { memory: [14.04, 24.67, 42.71, 78.78], time: [.93, 2.20, 5.60, 17.52] } },
];
const viewCounts = [32, 64, 128, 256] as const;

const crossPaperEfficiency = [
  {
    id: 'worldmirror', model: 'WorldMirror 2.0', paper: 'HY-World 2.0 · Table 14', hardware: '1× NVIDIA H20', input: '32 视图 · 518×378 · BF16', memory: '15.10 GB/卡', time: '2.11 s',
    memoryValue: 15.10, seconds: 2.11, fps: null,
    scope: 'WorldMirror 2.0 单卡 BF16 推理；与本模块同论文，可继续在上方切换视图数。', source: 'https://arxiv.org/abs/2604.14268',
  },
  {
    id: 'fast3r', model: 'Fast3R', paper: 'Fast3R · Table 2', hardware: '1× NVIDIA A100', input: '32 视图 · 512×384', memory: '13.25 GiB', time: '0.509 s',
    memoryValue: 13.25, seconds: .509, fps: null,
    scope: '单次多视图前向；论文另报 DUSt3R 在 48 视图全局对齐阶段 OOM。', source: 'https://arxiv.org/abs/2501.13928',
  },
  {
    id: 'vggt', model: 'VGGT', paper: 'VGGT · Table 9', hardware: '1× NVIDIA H100 · FlashAttention v3', input: '20 帧 · 336×518', memory: '5.58 GB', time: '0.31 s',
    memoryValue: 5.58, seconds: .31, fps: null,
    scope: '只测特征骨干；每个 DPT 头平均另需 0.03 s 与 0.2 GB/帧，不能当成完整多头重建总成本。', source: 'https://arxiv.org/abs/2503.11651',
  },
  {
    id: 'cut3r', model: 'CUT3R', paper: 'CUT3R · Table 2', hardware: '1× NVIDIA A100', input: 'KITTI 视频深度 · 512×144', memory: '未报告', time: '16.58 FPS',
    memoryValue: null, seconds: null, fps: 16.58,
    scope: '在线逐帧视频深度吞吐，不是固定视图批量重建墙钟时间。', source: 'https://arxiv.org/abs/2501.12387',
  },
  {
    id: 'pi3', model: 'π³', paper: 'π³ · Table 4', hardware: '1× NVIDIA A800', input: 'KITTI 视频深度 · 表中未单列分辨率', memory: '未报告', time: '57.4 FPS',
    memoryValue: null, seconds: null, fps: 57.4,
    scope: '视频深度 FPS；论文表格未提供同协议峰值显存，不能补写或换算为批量耗时。', source: 'https://arxiv.org/abs/2507.13347',
  },
];

const crossEfficiencyGroup: GroupDef = {
  id: 'efficiency',
  label: '其它模型公开记录',
  source: '跨论文公开工程记录',
  protocol: '柱高仍按每个指标的公开打印值从零绘制，但硬件、输入规模、任务范围和 GB/GiB 单位不同；这里只统一阅读格式，不建立统一排行榜。',
  metrics: [
    { id: 'memory', label: '峰值显存记录', direction: 'lower', color: metricColors[0] },
    { id: 'seconds', label: '秒级墙钟记录', direction: 'lower', color: metricColors[1] },
    { id: 'fps', label: '视频吞吐记录', direction: 'higher', color: metricColors[2] },
  ],
  models: crossPaperEfficiency.map((record) => ({
    id: record.id,
    label: record.model,
    target: record.id === 'worldmirror',
    values: { memory: record.memoryValue, seconds: record.seconds, fps: record.fps },
    displayValues: {
      memory: record.memory,
      seconds: record.seconds === null ? '未报告' : record.time,
      fps: record.fps === null ? '未报告' : record.time,
    },
  })),
};

function efficiencyGroup(viewIndex: number): GroupDef {
  return {
    id: 'efficiency', label: '显存与时间', source: 'Table 14 · H20',
    protocol: `NVIDIA H20，${viewCounts[viewIndex]} 视图、518x378；显存按每张 GPU 记录，时间为墙钟时间，均越低越好。`,
    metrics: [
      { id: 'memory', label: '显存/卡', direction: 'lower', color: metricColors[0], unit: ' GB' },
      { id: 'time', label: '墙钟时间', direction: 'lower', color: metricColors[1], unit: ' s' },
    ],
    models: efficiencyConfigs.map((config) => ({
      id: config.id, label: config.label, target: config.target,
      values: { memory: config.values.memory[viewIndex], time: config.values.time[viewIndex] },
    })),
  };
}

function formatValue(value: number, metric: MetricDef, model?: ModelDef) {
  const display = model?.displayValues?.[metric.id];
  if (display) return display;
  const digits = value < 1 ? 3 : 2;
  return `${value.toFixed(digits)}${metric.unit ?? ''}`;
}

export const HyPerformanceCompare: React.FC<WidgetProps> = () => {
  const [groupId, setGroupId] = useState<GroupId>('panorama');
  const [viewIndex, setViewIndex] = useState(2);
  const [efficiencyView, setEfficiencyView] = useState<'paper' | 'cross'>('paper');
  const group = groupId === 'efficiency'
    ? efficiencyView === 'cross' ? crossEfficiencyGroup : efficiencyGroup(viewIndex)
    : staticGroups[groupId];
  const [selectedModels, setSelectedModels] = useState<string[]>(staticGroups.panorama.models.map((model) => model.id));
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(staticGroups.panorama.metrics.map((metric) => metric.id));

  const changeGroup = (next: GroupId) => {
    const nextViewIndex = next === 'efficiency' ? 0 : viewIndex;
    const nextGroup = next === 'efficiency' ? efficiencyGroup(nextViewIndex) : staticGroups[next];
    if (next === 'efficiency') setViewIndex(nextViewIndex);
    if (next === 'efficiency') setEfficiencyView('paper');
    setGroupId(next);
    setSelectedModels(nextGroup.models.map((model) => model.id));
    setSelectedMetrics(nextGroup.metrics.map((metric) => metric.id));
  };

  const changeEfficiencyView = (next: 'paper' | 'cross') => {
    const nextGroup = next === 'paper' ? efficiencyGroup(viewIndex) : crossEfficiencyGroup;
    setEfficiencyView(next);
    setSelectedModels(nextGroup.models.map((model) => model.id));
    setSelectedMetrics(nextGroup.metrics.map((metric) => metric.id));
  };

  const toggle = (id: string, current: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (current.includes(id)) {
      if (current.length > 1) setter(current.filter((item) => item !== id));
    } else setter([...current, id]);
  };

  const visibleModels = group.models.filter((model) => selectedModels.includes(model.id));
  const visibleMetrics = group.metrics.filter((metric) => selectedMetrics.includes(metric.id));
  const maxima = useMemo(() => Object.fromEntries(group.metrics.map((metric) => {
    const values = group.models.flatMap((model) => {
      const value = model.values[metric.id];
      return value === null ? [] : [value];
    });
    return [metric.id, Math.max(...values)];
  })), [group]);

  const rawHeight = (value: number, metric: MetricDef) => {
    const max = maxima[metric.id];
    return !max ? 0 : value / max * 100;
  };

  const tableId = groupId === 'panorama' ? 'table-4' : groupId === 'efficiency' ? 'table-14' : 'table-12';
  const showingCrossEfficiency = groupId === 'efficiency' && efficiencyView === 'cross';

  return (
    <div className="cluster-compare">
      <div className="learning-contract"><div><span>为什么学</span><p>指标必须放回对应协议。</p></div><div><span>本次操作</span><p>选择协议、模型与指标。</p></div><div><span>应得判断</span><p>低优指标短柱更好，缺失保持未知。</p></div></div>
      <div className="performance-groups" role="tablist" aria-label="选择性能比较协议">
        {([
          ['panorama', '全景生成', 'Table 4 · I2P'],
          ['geometry', '相机与深度', 'Table 12 · RE10K'],
          ['nvs', '新视角合成', 'Table 12 · NVS'],
          ['efficiency', '显存与时间', 'Table 14 · H20'],
        ] as Array<[GroupId, string, string]>).map(([id, label, source]) => <button key={id} type="button" role="tab" aria-selected={groupId === id} className={groupId === id ? 'selected' : ''} onClick={() => changeGroup(id)}><strong>{label}</strong><span>{source}</span></button>)}
      </div>

      {groupId === 'efficiency' ? <div className="efficiency-view-switch" role="group" aria-label="选择效率证据范围"><button type="button" className={efficiencyView === 'paper' ? 'selected' : ''} aria-pressed={efficiencyView === 'paper'} onClick={() => changeEfficiencyView('paper')}><strong>本文 Table 14</strong><small>同硬件、同输入协议内比较配置</small></button><button type="button" className={efficiencyView === 'cross' ? 'selected' : ''} aria-pressed={efficiencyView === 'cross'} onClick={() => changeEfficiencyView('cross')}><strong>其它模型公开记录</strong><small>使用同款模型/指标选择与分簇图</small></button></div> : null}

      {groupId === 'efficiency' && !showingCrossEfficiency ? <label className="cluster-view-count"><span>输入视图数</span><select value={viewIndex} onChange={(event) => setViewIndex(Number(event.target.value))}>{viewCounts.map((count, index) => <option key={count} value={index}>{count} 视图</option>)}</select></label> : null}
      <div className="cluster-picker">
        <fieldset><legend>选择模型</legend><div>{group.models.map((model) => <button key={model.id} type="button" aria-pressed={selectedModels.includes(model.id)} className={selectedModels.includes(model.id) ? 'selected' : ''} onClick={() => toggle(model.id, selectedModels, setSelectedModels)}>{model.label}</button>)}</div></fieldset>
        <fieldset><legend>选择指标</legend><div>{group.metrics.map((metric) => <button key={metric.id} type="button" aria-pressed={selectedMetrics.includes(metric.id)} className={selectedMetrics.includes(metric.id) ? 'selected' : ''} onClick={() => toggle(metric.id, selectedMetrics, setSelectedMetrics)}><i style={{ background: metric.color }} />{metric.label}<small>{metric.direction === 'higher' ? '↑' : '↓'}</small></button>)}</div></fieldset>
      </div>

      <section className="cluster-chart" aria-live="polite">
        <header><div><span>{group.source}</span><h5>模型分簇对比</h5></div><p>{group.protocol}</p></header>
        <div className="cluster-plot">
          {visibleModels.map((model) => <article key={model.id} className={model.target ? 'target' : ''}>
            <div className="cluster-bars">
              {visibleMetrics.map((metric) => {
                const value = model.values[metric.id];
                return <div key={metric.id} className={value === null ? 'missing' : ''}>
                  <b>{value === null ? showingCrossEfficiency ? '未报告' : 'OOM' : formatValue(value, metric, model)}</b>
                  <i style={{ height: value === null ? '100%' : `${rawHeight(value, metric)}%`, background: value === null ? undefined : metric.color }} />
                  <small>{metric.label}</small>
                </div>;
              })}
            </div>
            <footer><strong>{model.label}</strong>{model.target ? <span>本文模型/配置</span> : null}</footer>
          </article>)}
        </div>
        <div className="cluster-legend">{visibleMetrics.map((metric) => <span key={metric.id}><i style={{ background: metric.color }} />{metric.label}（{metric.direction === 'higher' ? '越高越好' : '越低越好'}）</span>)}</div>
      </section>

      <SectionExtras hint={showingCrossEfficiency ? '柱高规则、硬件条件与公开记录来源' : '柱高规则与对应论文原表'}>
        <div className="performance-boundary"><strong>严格零基线比例</strong><span>{showingCrossEfficiency ? '柱高 = 各论文原始打印数值 / 当前指标最大已报告值；相同画法只统一阅读操作，不消除硬件、任务和单位差异。' : '柱高 = 原始数值 / 当前指标最大已报告值。'} AUC、PSNR、SSIM、FPS 等越高越好；AbsRel、LPIPS、显存、时间越低越好，因此后者的短柱才更优。不同指标不能相加、平均或构造综合分数。</span></div>
        {showingCrossEfficiency ? <section className="cross-efficiency-records">
          <header><span>公开记录条件卡</span><strong>选择上方模型后，仍需逐条核对测量边界</strong><small>GB 与 GiB 保留原论文单位；FPS 不倒数；骨干成本不冒充完整多头重建。</small></header>
          <div>
            {crossPaperEfficiency.filter((record) => selectedModels.includes(record.id)).map((record) => <article key={record.id}>
              <div><strong>{record.model}</strong><a href={record.source} target="_blank" rel="noreferrer">{record.paper} ↗</a></div>
              <span>{record.hardware}</span>
              <span>{record.input}</span>
              <b>{record.memory} · {record.time}</b>
              <p>{record.scope}</p>
            </article>)}
          </div>
        </section> : <PaperTable tableId={tableId} />}
      </SectionExtras>
    </div>
  );
};
