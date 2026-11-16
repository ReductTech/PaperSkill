import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f5f8f0', wood: '#92400e', woodSoft: '#f3e6d2', envL: '#b8c9a7', envD: '#76906a',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  ink: '#21324a', muted: '#68778f', line: '#d7deea',
};

const SOURCES = [
  { id: 'loc', zh: '定位', en: 'Local.', full: 'Localization', family: 'Reorganization' },
  { id: 'point', zh: '指点', en: 'Obj.Point', full: 'Object pointing', family: 'Reorganization' },
  { id: 'zdepth', zh: 'Z 深度', en: 'Z-depth', full: 'Z-depth', family: 'Reconstruction' },
  { id: 'euc', zh: '欧氏', en: 'Euclid.', full: 'Euclidean depth', family: 'Reconstruction' },
  { id: 'normal', zh: '法向', en: 'Normals', full: 'Surface normals', family: 'Reconstruction' },
  { id: 'jigsaw', zh: '拼图', en: 'Jigsaw', full: 'Jigsaw', family: 'Reorganization' },
  { id: 'inpaint', zh: '补全', en: 'Inpaint', full: 'Inpainting', family: 'Reconstruction' },
  { id: 'seg25', zh: '2.5D', en: 'Segm.', full: '2.5D segmentation', family: 'Reorganization' },
];
const ROWS = [
  { id: 'count', zh: '计数', en: 'Counting' },
  { id: 'order', zh: '2D 排序', en: '2D ordering' },
  { id: 'metric3d', zh: '度量 3D', en: 'Metric 3D' },
  { id: 'category', zh: '类别识别', en: 'Category recog.' },
  { id: 'localization', zh: '定位', en: 'Localization' },
  { id: 'depth', zh: '深度理解', en: 'Depth und.' },
  { id: 'ocr', zh: 'OCR / 文字', en: 'OCR & text' },
  { id: 'appearance', zh: '外观理解', en: 'Appearance' },
];
type Cell = { from: string; to: string; value: number; where: string };
const CELLS: Cell[] = [
  { from: 'loc', to: 'count', value: 2.5, where: '正文' },
  { from: 'point', to: 'count', value: 2.0, where: '正文' },
  { from: 'inpaint', to: 'count', value: 1.5, where: '正文' },
  { from: 'jigsaw', to: 'order', value: 6.8, where: '正文' },
  { from: 'inpaint', to: 'order', value: 7.2, where: '正文' },
  { from: 'zdepth', to: 'metric3d', value: 3.6, where: '正文' },
  { from: 'euc', to: 'metric3d', value: 3.8, where: '正文' },
  { from: 'normal', to: 'metric3d', value: 3.4, where: '正文' },
  { from: 'seg25', to: 'category', value: 1.2, where: '正文' },
  { from: 'zdepth', to: 'localization', value: 2.3, where: '图 4 标注' },
];

export function S7Transfer(_props: WidgetProps) {
  const [source, setSource] = useState('loc');
  const [picked, setPicked] = useState<string | null>(null);
  const src = SOURCES.find((item) => item.id === source)!;
  const gains = CELLS.filter((cell) => cell.from === source).sort((a, b) => b.value - a.value);
  const detail = CELLS.find((cell) => cell.from + '>' + cell.to === picked) ?? null;

  const labelW = 146;
  const colW = 88;
  const rowH = 52;
  const headH = 84;

  return (
    <div style={{ display: 'flex', gap: 24, width: 1472, height: 622 }}>
      <div style={{ width: 900, background: C.bg, border: `2px solid ${C.line}`, borderRadius: 18, padding: '8px 14px', boxSizing: 'border-box' }}>
        <svg viewBox="0 0 860 500" width="860" height="500" role="group" aria-label="精简迁移矩阵：行是理解能力，列是 I2I 源任务">
          {SOURCES.map((item, index) => {
            const x = labelW + index * colW;
            const active = item.id === source;
            return (
              <g key={item.id} role="button" tabIndex={0} aria-label={`查看 ${item.full} 的显著增益`}
                style={{ cursor: 'pointer' }}
                onClick={() => setSource(item.id)}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSource(item.id); } }}>
                {active && <rect x={x + 2} y={4} width={colW - 4} height={headH + ROWS.length * rowH - 12} rx="8" fill="rgba(39,68,110,.08)" />}
                <text x={x + colW / 2} y={40} fontSize="19" fill={active ? C.blue : C.ink} textAnchor="middle">{item.zh}</text>
                <text x={x + colW / 2} y={62} fontSize="13" fill={active ? C.blue : C.muted} textAnchor="middle">{item.en}</text>
                <line x1={x} y1={headH} x2={x} y2={headH + ROWS.length * rowH} stroke={C.line} strokeWidth="1.5" />
              </g>
            );
          })}
          {ROWS.map((row, r) => (
            <g key={row.id}>
              <text x={labelW - 12} y={headH + r * rowH + 24} fontSize="19" fill={C.ink} textAnchor="end">{row.zh}</text>
              <text x={labelW - 12} y={headH + r * rowH + 42} fontSize="12" fill={C.muted} textAnchor="end">{row.en}</text>
              <line x1={8} y1={headH + r * rowH} x2={labelW + SOURCES.length * colW} y2={headH + r * rowH} stroke={C.line} strokeWidth="1" />
              {CELLS.filter((cell) => cell.to === row.id).map((cell) => {
                const col = SOURCES.findIndex((item) => item.id === cell.from);
                const x = labelW + col * colW;
                const y = headH + r * rowH;
                const dim = cell.from === source ? 1 : 0.5;
                return (
                  <g key={cell.from + cell.to} opacity={dim} role="button" tabIndex={0}
                    aria-label={`${cell.from} 到 ${cell.to} 增益 ${cell.value} 百分点`} style={{ cursor: 'pointer' }}
                    onClick={(event) => { event.stopPropagation(); setSource(cell.from); setPicked(cell.from + '>' + cell.to); }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault(); setSource(cell.from); setPicked(cell.from + '>' + cell.to);
                      }
                    }}>
                    <rect x={x + 5} y={y + 9} width={colW - 10} height={rowH - 18} rx="6"
                      fill={picked === cell.from + '>' + cell.to ? 'rgba(34,141,92,.38)' : 'rgba(34,141,92,.16)'}
                      stroke={C.green} strokeWidth={picked === cell.from + '>' + cell.to ? 3 : 1.8} />
                    <text x={x + colW / 2} y={y + 34} fontSize="18" fill={C.green} textAnchor="middle" fontWeight="700">
                      +{cell.value.toFixed(1)}
                    </text>
                  </g>
                );
              })}
            </g>
          ))}
          <line x1="8" y1={headH + ROWS.length * rowH} x2={labelW + SOURCES.length * colW} y2={headH + ROWS.length * rowH} stroke={C.line} strokeWidth="1.5" />
        </svg>
        <div style={{ fontSize: 19, color: C.muted, marginTop: 2 }}>
          只在正文或图 4 报告了具体 pp 的单元才标出；空白 = 论文未报告显著增益，不等于零增益或有害。
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ padding: '16px 20px', background: '#fff', border: `2px solid ${C.blue}`, borderRadius: 16 }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: C.ink }}>{src.zh} · {src.full}</div>
          <div style={{ fontSize: 21, color: C.muted, marginTop: 4 }}>所属族：{src.family}</div>
        </div>
        <div style={{ padding: '16px 20px', background: '#fff', border: `2px solid ${C.line}`, borderRadius: 16, flex: 1 }}>
          <div style={{ fontSize: 22, color: C.muted, marginBottom: 10 }}>本页记录的显著增益</div>
          {gains.length === 0 ? (
            <div style={{ fontSize: 23, color: C.ink, lineHeight: 1.5 }}>
              本页没有记录该源任务的显著增益。正文报告的显著单元集中在计数、2D 排序、度量 3D、类别识别与定位上。
            </div>
          ) : gains.map((cell) => {
            const row = ROWS.find((item) => item.id === cell.to)!;
            return (
              <div key={cell.to} style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 23, color: C.ink, minWidth: 96 }}>{row.zh}</span>
                <span style={{ fontSize: 27, fontWeight: 700, color: C.green }}>+{cell.value.toFixed(1)} pp</span>
                <span style={{ fontSize: 18, color: C.muted }}>{cell.where}</span>
              </div>
            );
          })}
          <div style={{ marginTop: 8, fontSize: 19, color: C.muted, lineHeight: 1.5 }}>
            显著性判据：逐样本精确配对置换检验 p &lt; 0.05，三次种子平均。
          </div>
        </div>
        <div style={{ fontSize: 20, color: C.muted, lineHeight: 1.5 }}>
          完整 19 × 25 矩阵见论文图 4 与图 10；本页保留有正文数值的 10 个单元。
        </div>
        {detail && (
          <div style={{ padding: '12px 16px', background: '#fff', border: `2px solid ${C.orange}`, borderRadius: 14, fontSize: 20, lineHeight: 1.45, color: C.ink }}>
            <b>{SOURCES.find((s) => s.id === detail.from)!.full} → {ROWS.find((r) => r.id === detail.to)!.zh}</b>
            <div style={{ marginTop: 4 }}>
              增益 +{detail.value.toFixed(1)} pp，来源：{detail.where}；三次种子平均，p &lt; 0.05。点别的格子可切换。
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
