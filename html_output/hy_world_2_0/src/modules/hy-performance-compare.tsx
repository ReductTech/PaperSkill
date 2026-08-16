import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { PaperTable } from './hy-paper-evidence';

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

function formatValue(value: number, metric: MetricDef) {
  const digits = value < 1 ? 3 : 2;
  return `${value.toFixed(digits)}${metric.unit ?? ''}`;
}

export const HyPerformanceCompare: React.FC<WidgetProps> = () => {
  const [groupId, setGroupId] = useState<GroupId>('panorama');
  const [viewIndex, setViewIndex] = useState(2);
  const group = groupId === 'efficiency' ? efficiencyGroup(viewIndex) : staticGroups[groupId];
  const [selectedModels, setSelectedModels] = useState<string[]>(staticGroups.panorama.models.map((model) => model.id));
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(staticGroups.panorama.metrics.map((metric) => metric.id));

  const changeGroup = (next: GroupId) => {
    const nextGroup = next === 'efficiency' ? efficiencyGroup(viewIndex) : staticGroups[next];
    setGroupId(next);
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

  return (
    <div className="cluster-compare">
      <div className="learning-contract"><div><span>为什么学</span><p>论文跨全景、几何、NVS 与效率报告多种指标；不同协议和方向不能揉成一个总分。</p></div><div><span>本次操作</span><p>选择协议、模型与指标；每个指标都从零基线按原始数值比例绘制。</p></div><div><span>应得判断</span><p>柱子只表达数值大小。低优指标更短才更好，OOM 保持未知，不能反向或补齐成“更高更优”。</p></div></div>
      <div className="performance-groups" role="tablist" aria-label="选择性能比较协议">
        {([
          ['panorama', '全景生成', 'Table 4 · I2P'],
          ['geometry', '相机与深度', 'Table 12 · RE10K'],
          ['nvs', '新视角合成', 'Table 12 · NVS'],
          ['efficiency', '显存与时间', 'Table 14 · H20'],
        ] as Array<[GroupId, string, string]>).map(([id, label, source]) => <button key={id} type="button" role="tab" aria-selected={groupId === id} className={groupId === id ? 'selected' : ''} onClick={() => changeGroup(id)}><strong>{label}</strong><span>{source}</span></button>)}
      </div>

      {groupId === 'efficiency' ? <label className="cluster-view-count"><span>输入视图数</span><select value={viewIndex} onChange={(event) => setViewIndex(Number(event.target.value))}>{viewCounts.map((count, index) => <option key={count} value={index}>{count} 视图</option>)}</select></label> : null}

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
                  <b>{value === null ? 'OOM' : formatValue(value, metric)}</b>
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

      <div className="performance-boundary"><strong>严格零基线比例</strong><span>柱高 = 原始数值 / 当前指标最大已报告值。AUC、PSNR、SSIM 等越高越好；AbsRel、LPIPS、显存、时间越低越好，因此后者的短柱才更优。不同指标不能相加、平均或构造综合分数。</span></div>
      <PaperTable tableId={tableId} />
    </div>
  );
};
