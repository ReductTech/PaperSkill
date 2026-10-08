import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// m10-2 (score-tables) — 全景成绩单：四张表 + 三条边界（DOM 表格，非 Canvas）。

type Row = (string | number)[];
const TABLES: Record<string, { head: string[]; rows: Row[]; yoloeRows: number[] }> = {
  text: {
    head: ['模型', 'AP', 'APr', 'FPS (T4)'],
    rows: [
      ['YOLOE-v8-S', '27.9', '22.3', '305.8'],
      ['YOLO-Worldv2-S', '24.4', '17.1', '216.4'],
      ['YOLOE-v8-M', '32.6', '26.9', '156.7'],
      ['YOLO-Worldv2-M', '32.4', '28.4', '117.9'],
      ['YOLOE-v8-L', '35.9', '33.2', '102.5'],
      ['YOLO-Worldv2-L', '35.5', '25.6', '80.0'],
    ],
    yoloeRows: [0, 2, 4],
  },
  seg: {
    head: ['模型', 'APm', '口径'],
    rows: [
      ['YOLOE-v8-M', '20.8', '零样本'],
      ['YOLO-Worldv2-M †', '17.8', 'LVIS-Base 微调'],
      ['YOLOE-v8-L', '23.5', '零样本'],
      ['YOLO-Worldv2-L †', '19.8', 'LVIS-Base 微调'],
    ],
    yoloeRows: [0, 2],
  },
  free: {
    head: ['模型', 'AP', 'FPS (PyTorch/T4)'],
    rows: [
      ['YOLOE-v8-L', '27.2', '25.3'],
      ['GenerateU (Swin-T)', '26.8', '0.48'],
      ['GenerateU (Swin-L)', '27.9', '0.40'],
    ],
    yoloeRows: [0],
  },
  coco: {
    head: ['设置', '结果', '训练轮数'],
    rows: [
      ['YOLOE-v8-L Full tuning', '+0.6 APb vs YOLOv8-L', '80 轮'],
      ['YOLOv8-L 基线', '—', '300 轮'],
      ['Linear probing 11-M/L', '>80% 性能', '<2% 训练时间'],
    ],
    yoloeRows: [0, 2],
  },
};
const FEEDBACK: Record<string, { text: string; cls: string }> = {
  text: { text: '文本提示：+3.5/0.2/0.4 AP，APr 最高 +7.6（Tab 1）。', cls: 'good' },
  seg: { text: '分割：零样本 20.8/23.5 APm，反超在 LVIS-Base 微调过的 YOLO-Worldv2（Tab 2，注意协议不对等）。', cls: '' },
  free: { text: '无提示：27.2 AP、25.3 FPS，快 GenerateU 53×（Tab 3）。', cls: 'good' },
  coco: { text: '迁移：Full tuning 80 轮 vs 300 轮仍 +0.6 APb（Tab 4）。', cls: 'good' },
};
const BOUNDS = [
  { color: '#f07e47', text: '权衡：联合分割训练使 APf 微降（Tab 5）。' },
  { color: '#c43f52', text: '限制：无提示命名受 4585 类词表覆盖约束（§4.1）。' },
  { color: '#27446e', text: '协议：各表口径不同（TensorRT vs PyTorch），不可混比（§4.1 Metric）。' },
];

export const M10_2: React.FC<WidgetProps> = () => {
  const [tab, setTab] = useState('text');
  const table = TABLES[tab];

  return (
    <div>
      <div className="ctrl">
        <button type="button" className={tab === 'text' ? 'chip selected' : 'chip'} onClick={() => setTab('text')}>
          文本提示
        </button>
        <button type="button" className={tab === 'seg' ? 'chip selected' : 'chip'} onClick={() => setTab('seg')}>
          分割
        </button>
        <button type="button" className={tab === 'free' ? 'chip selected' : 'chip'} onClick={() => setTab('free')}>
          无提示
        </button>
        <button type="button" className={tab === 'coco' ? 'chip selected' : 'chip'} onClick={() => setTab('coco')}>
          COCO 迁移
        </button>
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <table style={{ flex: '1 1 560px', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr>
              {table.head.map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid #d7deea' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r, i) => (
              <tr key={i} style={table.yoloeRows.includes(i) ? { background: '#eef8f1', fontWeight: 600 } : undefined}>
                {r.map((c, j) => (
                  <td key={j} style={{ padding: '8px 12px', borderBottom: '1px solid #eef2f7' }}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ flex: '0 0 320px' }}>
          {BOUNDS.map((b, i) => (
            <div
              key={i}
              style={{
                borderLeft: '4px solid ' + b.color,
                background: '#fff',
                padding: '8px 12px',
                marginBottom: 8,
                fontSize: 13,
                borderRadius: 6,
              }}
            >
              {b.text}
            </div>
          ))}
        </div>
      </div>
      <div className={`feedback ${FEEDBACK[tab].cls}`}>{FEEDBACK[tab].text}</div>
    </div>
  );
};

export default M10_2;
