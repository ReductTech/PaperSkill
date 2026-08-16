import React, { useState } from 'react';

interface ModelResult {
  model: string;
  value: number;
}

interface MetricResult {
  id: string;
  label: string;
  fullName: string;
  unit: string;
  precision: number;
  direction: 'higher' | 'lower';
  source: string;
  sourceImage: string;
  description: string;
  rows: ModelResult[];
}

const metrics: MetricResult[] = [
  {
    id: 'pose-map', label: 'Pose mAP', fullName: '全身姿态估计 mAP', unit: '%', precision: 1, direction: 'higher',
    source: 'Sapiens2 Table 3 · 11K test · 308 keypoints', sourceImage: './paper/sapiens2-pose-seg-tables.png',
    description: '关键点定位的平均精度，数值越高越好。相同模型训练集下比较。',
    rows: [
      { model: 'ViTPose+-L', value: 47.8 }, { model: 'ViTPose+-H', value: 48.3 },
      { model: 'DWPose-M', value: 60.6 }, { model: 'DWPose-L', value: 66.5 },
      { model: 'RTMW-L', value: 70.1 }, { model: 'RTMW-X', value: 70.2 },
      { model: 'Sapiens-1B', value: 76.8 }, { model: 'Sapiens-2B', value: 78.3 },
      { model: 'Sapiens2-0.4B', value: 76.9 }, { model: 'Sapiens2-0.8B', value: 79.4 },
      { model: 'Sapiens2-1B', value: 80.4 }, { model: 'Sapiens2-5B', value: 82.3 },
    ],
  },
  {
    id: 'seg-miou', label: 'Seg mIoU', fullName: '身体部位分割 mIoU', unit: '%', precision: 1, direction: 'higher',
    source: 'Sapiens2 Table 4 · 5K in-the-wild test · 29 classes', sourceImage: './paper/sapiens2-pose-seg-tables.png',
    description: '预测身体区域与真实区域的平均交并比，数值越高越好。',
    rows: [
      { model: 'SegFormer', value: 45.2 }, { model: 'Mask2Former', value: 48.7 },
      { model: 'DeepLabV3+', value: 42.8 }, { model: 'HRNetV2+OCR', value: 47.3 },
      { model: 'Sapiens-1B', value: 53.8 }, { model: 'Sapiens-2B', value: 58.2 },
      { model: 'Sapiens2-0.4B', value: 79.5 }, { model: 'Sapiens2-0.8B', value: 80.6 },
      { model: 'Sapiens2-1B', value: 81.7 }, { model: 'Sapiens2-1B-4K', value: 81.9 },
      { model: 'Sapiens2-5B', value: 82.5 },
    ],
  },
  {
    id: 'pointmap-l2', label: 'Pointmap L2', fullName: '逐像素三维坐标 L2', unit: '', precision: 3, direction: 'lower',
    source: 'Sapiens2 Table 5 · 10K test · focal-length normalized', sourceImage: './paper/sapiens2-pointmap-table.png',
    description: '预测三维点坐标与真实坐标之间的距离误差，数值越低越好。',
    rows: [
      { model: 'UniDepth', value: 0.368 }, { model: 'DUSt3R', value: 0.349 },
      { model: 'VGGT', value: 0.217 }, { model: 'MoGe', value: 0.202 },
      { model: 'Sapiens2-0.4B', value: 0.190 }, { model: 'Sapiens2-0.8B', value: 0.186 },
      { model: 'Sapiens2-1B', value: 0.178 }, { model: 'Sapiens2-5B', value: 0.167 },
    ],
  },
  {
    id: 'normal-mae', label: 'Normal MAE', fullName: '表面法线平均角误差', unit: '°', precision: 2, direction: 'lower',
    source: 'Sapiens2 Table 6 · 10K whole-body test · 4K ground truth', sourceImage: './paper/sapiens2-normal-albedo-tables.png',
    description: '预测法线与真实法线的平均夹角，数值越低越好。',
    rows: [
      { model: 'Marigold', value: 18.83 }, { model: 'DSINE', value: 17.24 },
      { model: 'Sapiens-1B', value: 13.62 }, { model: 'Sapiens-2B', value: 12.38 },
      { model: 'DAViD-L', value: 10.73 }, { model: 'Sapiens2-0.4B', value: 8.63 },
      { model: 'Sapiens2-0.8B', value: 8.49 }, { model: 'Sapiens2-1B', value: 7.12 },
      { model: 'Sapiens2-1B-4K', value: 6.98 }, { model: 'Sapiens2-5B', value: 6.73 },
    ],
  },
  {
    id: 'albedo-mae', label: 'Albedo MAE', fullName: '固有颜色平均绝对误差', unit: '', precision: 5, direction: 'lower',
    source: 'Sapiens2 Table 7 · 10K synthetic-render test', sourceImage: './paper/sapiens2-normal-albedo-tables.png',
    description: '去除光照后的固有颜色预测误差，数值越低越好。',
    rows: [
      { model: 'Sapiens2-0.4B', value: 0.01825 }, { model: 'Sapiens2-0.8B', value: 0.01602 },
      { model: 'Sapiens2-1B', value: 0.01224 }, { model: 'Sapiens2-5B', value: 0.01191 },
    ],
  },
];

function formatValue(metric: MetricResult, value: number) {
  return `${value.toFixed(metric.precision)}${metric.unit}`;
}

export function ResultsDrawer() {
  const [selectedId, setSelectedId] = useState(metrics[0].id);
  const metric = metrics.find((item) => item.id === selectedId) || metrics[0];
  const values = metric.rows.map((row) => row.value);
  const best = metric.direction === 'higher' ? Math.max(...values) : Math.min(...values);
  const worst = metric.direction === 'higher' ? Math.min(...values) : Math.max(...values);
  const range = Math.max(Math.abs(best - worst), Number.EPSILON);

  return (
    <div className="results-explorer">
      <div className="metric-tabs" role="tablist" aria-label="选择结果指标">
        {metrics.map((item) => (
          <button
            role="tab"
            aria-selected={item.id === metric.id}
            className={item.id === metric.id ? 'active' : ''}
            onClick={() => setSelectedId(item.id)}
            key={item.id}
          >
            {item.label}<small>{item.direction === 'higher' ? '↑' : '↓'}</small>
          </button>
        ))}
      </div>

      <section className="metric-summary">
        <div><span>当前指标</span><h3>{metric.fullName}</h3><p>{metric.description}</p></div>
        <strong>{metric.direction === 'higher' ? '越高越好 ↑' : '越低越好 ↓'}</strong>
      </section>

      <div className="metric-table-wrap">
        <table className="metric-table">
          <thead><tr><th>模型</th><th>数值</th><th>可视化比较</th></tr></thead>
          <tbody>
            {metric.rows.map((row) => {
              const score = metric.direction === 'higher' ? (row.value - worst) / range : (worst - row.value) / range;
              const isBest = row.value === best;
              return (
                <tr className={`${row.model.startsWith('Sapiens2') ? 'ours' : ''} ${isBest ? 'best' : ''}`} key={row.model}>
                  <td>{row.model}{isBest ? <em>BEST</em> : null}</td>
                  <td>{formatValue(metric, row.value)}</td>
                  <td><span className="result-bar"><i style={{ width: `${22 + score * 78}%` }} /></span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <details className="paper-table-source">
        <summary>查看论文原始表格</summary>
        <a href={metric.sourceImage} target="_blank" rel="noreferrer"><img src={metric.sourceImage} alt={`${metric.fullName}论文原始结果表`} /></a>
      </details>
      <details className="paper-table-source">
        <summary>查看统一 Dense Probing 完整对照表</summary>
        <a href="./paper/sapiens2-dense-probing-table.png" target="_blank" rel="noreferrer"><img src="./paper/sapiens2-dense-probing-table.png" alt="Sapiens2 Table 2 全部密集探测结果" /></a>
      </details>
      <p className="result-source">数据来源：{metric.source}</p>
    </div>
  );
}
