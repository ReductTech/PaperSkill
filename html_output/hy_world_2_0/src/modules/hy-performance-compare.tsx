import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { PaperTable } from './hy-paper-evidence';

type ComparisonGroup = 'panorama' | 'geometry' | 'nvs' | 'efficiency';
type Direction = 'higher' | 'lower';

type MetricRow = {
  model: string;
  value: number | null;
  display: string;
  target?: boolean;
  note?: string;
};

type Metric = {
  id: string;
  name: string;
  direction: Direction;
  unit: string;
  rows: MetricRow[];
  protocol: string;
  takeaway: string;
};

const groups: Array<{ id: ComparisonGroup; name: string; short: string }> = [
  { id: 'panorama', name: '全景生成', short: '表 4 · I2P' },
  { id: 'geometry', name: '相机与深度', short: '表 12 · RE10K' },
  { id: 'nvs', name: '新视角合成', short: '表 12 · NVS' },
  { id: 'efficiency', name: '显存与时间', short: '表 14 · H20' },
];

const metrics: Record<ComparisonGroup, Metric[]> = {
  panorama: [
    { id: 'clip', name: 'CLIP-I', direction: 'higher', unit: '', protocol: '论文表 4 图像到全景（I2P）；所有方法使用同一子协议。', takeaway: 'HY-Pano 2.0 在该 I2P 指标上高于 CubeDiff 与 GenEx，但不能外推成整套世界系统总排名。', rows: [
      { model: 'CubeDiff', value: .828, display: '0.828' }, { model: 'GenEx', value: .831, display: '0.831' }, { model: 'HY-Pano 2.0', value: .844, display: '0.844', target: true },
    ] },
    { id: 'quality-persp', name: 'Q-Align 质量（透视）', direction: 'higher', unit: '', protocol: '每张 ERP 全景投影为 12 个透视面参与 Persp 评估。', takeaway: '这项结果衡量投影后的感知质量，不等于三维几何准确率。', rows: [
      { model: 'CubeDiff', value: 2.938, display: '2.938' }, { model: 'GenEx', value: 2.917, display: '2.917' }, { model: 'HY-Pano 2.0', value: 4.026, display: '4.026', target: true },
    ] },
    { id: 'aesthetic-erp', name: 'Q-Align 美学（ERP）', direction: 'higher', unit: '', protocol: '论文表 4 I2P 的等距柱状投影美学评分。', takeaway: '美学分数描述视觉偏好，不能替代环形接缝或空间一致性的专门诊断。', rows: [
      { model: 'CubeDiff', value: 3.645, display: '3.645' }, { model: 'GenEx', value: 3.646, display: '3.646' }, { model: 'HY-Pano 2.0', value: 4.056, display: '4.056', target: true },
    ] },
  ],
  geometry: [
    { id: 'auc', name: 'AUC@30', direction: 'higher', unit: '', protocol: 'RealEstate10K；外部基线按 M 分辨率，WorldMirror 2.0 取 M 分辨率。', takeaway: 'WorldMirror 2.0 (M) 在这组姿态指标中略高于 π3；差距很小，不能写成所有几何任务全面领先。', rows: [
      { model: 'Fast3R', value: 61.68, display: '61.68' }, { model: 'CUT3R', value: 81.47, display: '81.47' }, { model: 'FLARE', value: 80.01, display: '80.01' }, { model: 'VGGT', value: 77.62, display: '77.62' }, { model: 'π3', value: 85.90, display: '85.90' }, { model: 'WorldMirror 2.0 (M)', value: 86.48, display: '86.48', target: true },
    ] },
    { id: 'absrel', name: '深度 AbsRel', direction: 'lower', unit: '', protocol: 'RealEstate10K；越低越好，WorldMirror 2.0 取 M 分辨率。', takeaway: 'π3 的 AbsRel 0.151 低于 WorldMirror 2.0 (M) 的 0.167；教程保留这一非领先结果，避免挑选式汇报。', rows: [
      { model: 'Fast3R', value: .353, display: '0.353' }, { model: 'CUT3R', value: .260, display: '0.260' }, { model: 'FLARE', value: .445, display: '0.445' }, { model: 'VGGT', value: .256, display: '0.256' }, { model: 'π3', value: .151, display: '0.151' }, { model: 'WorldMirror 2.0 (M)', value: .167, display: '0.167', target: true },
    ] },
  ],
  nvs: [
    { id: 'psnr', name: 'NVS PSNR', direction: 'higher', unit: ' dB', protocol: 'RealEstate10K 与 DL3DV 平均；只纳入表 12 报告 NVS 的外部方法。', takeaway: 'WorldMirror 2.0 (M) 在所列外部方法中 PSNR 更高；这不是与闭源 Marble 的统一比较。', rows: [
      { model: 'FLARE', value: 15.84, display: '15.84 dB' }, { model: 'AnySplat', value: 18.57, display: '18.57 dB' }, { model: 'WorldMirror 2.0 (M)', value: 20.07, display: '20.07 dB', target: true },
    ] },
    { id: 'ssim', name: 'NVS SSIM', direction: 'higher', unit: '', protocol: 'RealEstate10K 与 DL3DV 平均；越高越好。', takeaway: '同一 NVS 协议下，WorldMirror 2.0 (M) 的 SSIM 为 0.680。', rows: [
      { model: 'FLARE', value: .545, display: '0.545' }, { model: 'AnySplat', value: .626, display: '0.626' }, { model: 'WorldMirror 2.0 (M)', value: .680, display: '0.680', target: true },
    ] },
    { id: 'lpips', name: 'NVS LPIPS', direction: 'lower', unit: '', protocol: 'RealEstate10K 与 DL3DV 平均；越低越好。', takeaway: 'WorldMirror 2.0 (M) 的 LPIPS 为 0.186，低于 FLARE 与 AnySplat。', rows: [
      { model: 'FLARE', value: .500, display: '0.500' }, { model: 'AnySplat', value: .255, display: '0.255' }, { model: 'WorldMirror 2.0 (M)', value: .186, display: '0.186', target: true },
    ] },
  ],
  efficiency: [],
};

const efficiencyConfigs = [
  { model: 'FP32 单卡基线', target: false, memory: [24.95, 38.56, 59.26, null], time: [2.45, 6.27, 18.00, null] },
  { model: '+ BF16 单卡', target: false, memory: [15.10, 25.06, 41.73, 75.05], time: [2.11, 5.65, 16.96, 56.96] },
  { model: '+ SP + BF16 四卡', target: false, memory: [15.81, 26.44, 44.47, 80.54], time: [.96, 2.21, 5.65, 17.69] },
  { model: '+ SP + BF16 + FSDP 四卡', target: true, memory: [14.04, 24.67, 42.71, 78.78], time: [.93, 2.20, 5.60, 17.52] },
];

const viewCounts = [32, 64, 128, 256] as const;

export const HyPerformanceCompare: React.FC<WidgetProps> = () => {
  const [groupId, setGroupId] = useState<ComparisonGroup>('panorama');
  const [metricId, setMetricId] = useState('clip');
  const [viewIndex, setViewIndex] = useState(2);
  const [efficiencyMetric, setEfficiencyMetric] = useState<'memory' | 'time'>('memory');

  const groupMetrics = metrics[groupId];
  const selectedMetric = useMemo(() => groupMetrics.find((item) => item.id === metricId) ?? groupMetrics[0], [groupMetrics, metricId]);
  const efficiencyRows: MetricRow[] = efficiencyConfigs.map((config) => {
    const value = config[efficiencyMetric][viewIndex];
    return {
      model: config.model,
      value,
      display: value === null ? 'OOM' : `${value.toFixed(2)} ${efficiencyMetric === 'memory' ? 'GB/卡' : 's'}`,
      target: config.target,
      note: viewCounts[viewIndex] === 256 && value === null ? '该配置在表 14 中 OOM' : undefined,
    };
  });
  const activeMetric: Metric = groupId === 'efficiency' ? {
    id: efficiencyMetric,
    name: efficiencyMetric === 'memory' ? '每张 GPU 显存' : '墙钟时间',
    direction: 'lower',
    unit: efficiencyMetric === 'memory' ? ' GB/卡' : ' s',
    rows: efficiencyRows,
    protocol: `论文表 14，${viewCounts[viewIndex]} 视图、518×378、NVIDIA H20；显存按每张 GPU 记录。`,
    takeaway: efficiencyMetric === 'memory'
      ? '分布式配置不保证每个视图数下都拥有最低单卡显存；FSDP 的价值需要与卡数、时间和输入规模一起读。'
      : '128 视图时 5.60 秒只属于 WorldMirror 2.0 重建步骤，不代表完整世界生成实时化。',
  } : selectedMetric;

  const validValues = activeMetric.rows.flatMap((row) => row.value === null ? [] : [row.value]);
  const maxValue = Math.max(...validValues, 1);
  const bestValue = activeMetric.direction === 'higher' ? Math.max(...validValues) : Math.min(...validValues);
  const tableId = groupId === 'panorama' ? 'table-4' : groupId === 'efficiency' ? 'table-14' : 'table-12';

  const changeGroup = (next: ComparisonGroup) => {
    setGroupId(next);
    if (next !== 'efficiency') setMetricId(metrics[next][0].id);
  };

  return (
    <div className="performance-compare">
      <div className="performance-groups" role="tablist" aria-label="选择性能比较协议">
        {groups.map((group) => <button key={group.id} type="button" role="tab" aria-selected={group.id === groupId} className={group.id === groupId ? 'selected' : ''} onClick={() => changeGroup(group.id)}><strong>{group.name}</strong><span>{group.short}</span></button>)}
      </div>

      {groupId === 'efficiency' ? (
        <div className="performance-controls">
          <div role="group" aria-label="选择效率指标"><button type="button" className={efficiencyMetric === 'memory' ? 'selected' : ''} onClick={() => setEfficiencyMetric('memory')}>显存/卡</button><button type="button" className={efficiencyMetric === 'time' ? 'selected' : ''} onClick={() => setEfficiencyMetric('time')}>墙钟时间</button></div>
          <label><span>输入视图数</span><select value={viewIndex} onChange={(event) => setViewIndex(Number(event.target.value))}>{viewCounts.map((count, index) => <option key={count} value={index}>{count} 视图</option>)}</select></label>
        </div>
      ) : (
        <div className="performance-metrics" role="group" aria-label="选择当前协议指标">
          {groupMetrics.map((metric) => <button key={metric.id} type="button" className={metric.id === activeMetric.id ? 'selected' : ''} onClick={() => setMetricId(metric.id)}>{metric.name}</button>)}
        </div>
      )}

      <section className="performance-chart" aria-live="polite">
        <header><div><span>{activeMetric.direction === 'higher' ? '越高越好 ↑' : '越低越好 ↓'}</span><h5>{activeMetric.name}</h5></div><small>{activeMetric.protocol}</small></header>
        <div className="performance-bars">
          {activeMetric.rows.map((row) => {
            const isBest = row.value !== null && Math.abs(row.value - bestValue) < 1e-8;
            const width = row.value === null ? 0 : Math.max(2, row.value / maxValue * 100);
            return <div key={row.model} className={`performance-row ${row.target ? 'target' : ''} ${isBest ? 'best' : ''} ${row.value === null ? 'oom' : ''}`}>
              <div><strong>{row.model}</strong>{row.target ? <span>本文模型</span> : null}</div>
              <div className="performance-track"><i style={{ width: `${width}%` }} /><b>{row.display}</b></div>
              <small>{isBest ? '当前指标最佳已报告值' : row.note ?? '同协议已报告值'}</small>
            </div>;
          })}
        </div>
        <p>{activeMetric.takeaway}</p>
      </section>

      <div className="performance-boundary"><strong>禁止合并成总分</strong><span>四组图使用不同任务、数据集、指标方向与硬件。条形图只帮助在当前页签协议内比较，不能跨页签相加、平均或推导“综合领先”。</span></div>
      <PaperTable tableId={tableId} />
    </div>
  );
};
