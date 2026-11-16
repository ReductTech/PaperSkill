import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Svg, T, PAL, Card, Arrow, Pill } from './kit';

// Numbers transcribed from Table 5 (Appendix H.1). Each group keeps the paper's
// easy/hard split instead of collapsing them into one invented average.
const data: Record<string, { label: string; easy: number[]; hard?: number[] }> = {
  seen: { label: 'Seen Tasks', easy: [45, 63, 92, 75, 93, 91] },
  objects: { label: 'Unseen Objects', easy: [32, 34, 31, 58, 84, 70], hard: [14, 10, 43, 48, 76, 62] },
  backgrounds: { label: 'Unseen Backgrounds', easy: [13, 13, 71, 38, 75, 96], hard: [9, 3, 9, 41, 71, 48] },
  environments: { label: 'Unseen Environments', easy: [0, 0, 26, 19, 36, 63], hard: [2, 0, 14, 3, 33, 35] },
  average: { label: 'Unseen Average', easy: [12, 10, 32, 35, 62, 62] },
};

const models = [
  { n: 'R3M', c: '#9b59b6' },
  { n: 'VC-1', c: '#e0a33e' },
  { n: 'RT-1', c: '#c0392b' },
  { n: 'MOO', c: '#95a5a6' },
  { n: 'PaLM-E-12B', c: '#3f9e6a' },
  { n: 'PaLI-X-55B', c: '#2f6fd0' },
];

// Group chips switch the chart; easy/hard stay side by side so the reader never
// compares two incompatible subsets.
export const GeneralizationEvidence: React.FC<WidgetProps> = () => {
  const [g, setG] = useState('objects');
  const [pick, setPick] = useState<number | null>(5);
  const d = data[g];
  const grouped = Boolean(d.hard);
  const baseX = 128;
  const baseY = 220;
  const maxH = 140;
  const step = 150;
  return (
    <div>
      <Svg w={1080} h={250} label={`${d.label} 上各模型的成功率`}>
        <T x={24} y={26} size={13} color={PAL.ink} weight={600}>成功率（%），0–100 纵轴</T>
        <T x={24} y={46} size={11} color={PAL.muted}>同一组、同一评估协议；浅色 = Easy，深色 = Hard</T>
        <rect x={772} y={17} width={8} height={8} fill={models[pick ?? 0].c} />
        <T x={786} y={26} size={11} color={PAL.muted} anchor="start">当前：{models[pick ?? 0].n} · {d.label}</T>
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line x1={baseX - 8} y1={baseY - (v / 100) * maxH} x2={1040} y2={baseY - (v / 100) * maxH} stroke={PAL.line} />
            <T x={baseX - 16} y={baseY - (v / 100) * maxH + 4} size={10} anchor="end" color={PAL.muted}>{v}</T>
          </g>
        ))}
        {models.map((m, i) => {
          const x = baseX + i * step;
          const e = d.easy[i];
          const h = d.hard ? d.hard[i] : null;
          const eh = (e / 100) * maxH;
          const hh = h === null ? 0 : (h / 100) * maxH;
          return (
            <g key={m.n} onClick={() => setPick(i)} style={{ cursor: 'pointer' }}>
              {grouped ? (
                <>
                  <rect x={x} y={baseY - eh} width={40} height={eh} rx={4} fill={m.c} opacity={0.45} />
                  <rect x={x + 42} y={baseY - hh} width={40} height={hh} rx={4} fill={m.c} opacity={0.92} />
                  <T x={x + 12} y={baseY - eh - 6} size={10} color={m.c}>{e}</T>
                  <T x={x + 54} y={baseY - hh - 6} size={10} color={m.c}>{h}</T>
                </>
              ) : (
                <>
                  <rect x={x + 8} y={baseY - eh} width={52} height={eh} rx={4} fill={m.c} opacity={pick === i ? 1 : 0.82} />
                  <T x={x + 34} y={baseY - eh - 7} size={11} anchor="middle" color={m.c}>{e}</T>
                </>
              )}
              <T x={x + 4} y={baseY + 16} size={10} color={PAL.ink} weight={pick === i ? 700 : 400}>{m.n}</T>
            </g>
          );
        })}
      </Svg>
      <div className="rt2-controls">
        {Object.keys(data).map((k) => (
          <button key={k} className={`rt2-btn ${g === k ? 'is-active' : ''}`} onClick={() => setG(k)}>
            {data[k].label}
          </button>
        ))}
      </div>
      <p className="rt2-note">
        {grouped && d.hard ? (
          <>
            {d.label}：{models[pick ?? 0].n} easy {d.easy[pick ?? 0]}%、hard {d.hard[pick ?? 0]}%。Easy/Hard 是论文预先划分的两档难度，
            不能把两档混成一个平均值再和别组比。
          </>
        ) : (
          <>
            {d.label}：{models[pick ?? 0].n} {d.easy[pick ?? 0]}%。Seen Tasks 上与 RT-1 接近；真正的差距出现在右侧未见分布。
          </>
        )}
      </p>
    </div>
  );
};

export default GeneralizationEvidence;
