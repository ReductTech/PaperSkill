import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f5f8f0', wood: '#92400e', woodSoft: '#f3e6d2', envL: '#b8c9a7', envD: '#76906a',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  ink: '#21324a', muted: '#68778f', line: '#d7deea',
};

type Source = { id: string; zh: string; delta: number; fromFigure?: boolean };
type Cap = { id: string; zh: string; base: number; sources: Source[] };
const CAPS: Cap[] = [
  {
    id: 'counting', zh: 'Counting 计数', base: 63.58,
    sources: [
      { id: 'loc', zh: 'Localization 定位', delta: 2.5 },
      { id: 'point', zh: 'Object pointing 物体指点', delta: 2.0 },
      { id: 'inpaint', zh: 'Inpainting 补全', delta: 1.5 },
    ],
  },
  {
    id: 'order', zh: '2D ordering 2D 排序', base: 60.35,
    sources: [
      { id: 'inpaint', zh: 'Inpainting 补全', delta: 7.2 },
      { id: 'jigsaw', zh: 'Jigsaw 拼图', delta: 6.8 },
    ],
  },
  {
    id: 'metric3d', zh: 'Metric 3D relation 度量 3D', base: 68.65,
    sources: [
      { id: 'euc', zh: 'Euclidean depth 欧氏深度', delta: 3.8 },
      { id: 'zdepth', zh: 'Z-depth Z 深度', delta: 3.6 },
      { id: 'normal', zh: 'Surface normals 表面法向', delta: 3.4 },
    ],
  },
  {
    id: 'category', zh: 'Category recognition 类别识别', base: 75.09,
    sources: [{ id: 'seg25', zh: '2.5D segmentation 2.5D 分割', delta: 1.2 }],
  },
  {
    id: 'localization', zh: 'Localization 定位', base: 61.89,
    sources: [{ id: 'zdepth', zh: 'Z-depth Z 深度（图 4 标注值）', delta: 2.3, fromFigure: true }],
  },
];

export function S11Gain(_props: WidgetProps) {
  const [capId, setCapId] = useState('counting');
  const [sourceId, setSourceId] = useState('loc');
  const [override, setOverride] = useState<number | null>(null);
  const cap = CAPS.find((item) => item.id === capId)!;
  const source = cap.sources.find((item) => item.id === sourceId) ?? cap.sources[0];
  const base = override === null ? cap.base : override;
  const result = base + source.delta;
  const lo = Math.max(0, Math.min(base, result) - 6);
  const hi = Math.min(100, Math.max(base, result) + 6);
  const scale = (value: number) => 40 + ((value - lo) / (hi - lo)) * 760;
  const custom = Math.abs(base - cap.base) > 0.001;

  const pickCap = (id: string) => {
    const next = CAPS.find((item) => item.id === id)!;
    setCapId(id);
    setSourceId(next.sources[0].id);
    setOverride(null);
  };

  return (
    <div style={{ display: 'flex', gap: 22, width: 1472, height: 622 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 21, color: C.muted }}>选择理解能力</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CAPS.map((item) => (
            <button key={item.id} type="button" onClick={() => pickCap(item.id)}
              style={{
                padding: '9px 13px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 20, color: C.ink,
                background: item.id === capId ? 'rgba(240,126,71,.12)' : '#fff',
                border: `2px solid ${item.id === capId ? C.orange : C.line}`,
              }}>{item.zh}</button>
          ))}
        </div>

        <div style={{ fontSize: 21, color: C.muted, marginTop: 2 }}>选择 I2I 源任务（只列正文报告了显著增益的组合）</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {cap.sources.map((item) => (
            <button key={item.id} type="button" onClick={() => setSourceId(item.id)}
              style={{
                padding: '9px 13px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 20, color: C.ink,
                background: item.id === sourceId ? 'rgba(39,68,110,.10)' : '#fff',
                border: `2px solid ${item.id === sourceId ? C.blue : C.line}`,
              }}>{item.zh}</button>
          ))}
        </div>

        <div style={{ background: C.bg, border: `2px solid ${C.line}`, borderRadius: 16, padding: '8px 16px', flex: 1 }}>
          <svg viewBox="0 0 850 250" width="850" height="250" role="img"
            aria-label={`基线 ${base.toFixed(2)}%，加 ${source.delta} 个百分点后 ${result.toFixed(2)}%`}>
            <line x1="30" y1="150" x2="820" y2="150" stroke={C.line} strokeWidth="4" />
            {[lo, (lo + hi) / 2, hi].map((tick) => (
              <g key={tick}>
                <line x1={scale(tick)} y1="140" x2={scale(tick)} y2="160" stroke={C.muted} strokeWidth="2" />
                <text x={scale(tick)} y="184" fontSize="18" fill={C.muted} textAnchor="middle">{tick.toFixed(1)}</text>
              </g>
            ))}
            <circle cx={scale(base)} cy="150" r="10" fill={C.blue} />
            <text x={scale(base)} y="112" fontSize="22" fill={C.blue} textAnchor="middle">
              基线 {base.toFixed(2)}{custom ? '（你的）' : ''}
            </text>
            <line x1={scale(base)} y1="150" x2={scale(result)} y2="150" stroke={C.green} strokeWidth="12" opacity=".55" />
            <circle cx={scale(result)} cy="150" r="10" fill={C.green} />
            <text x={scale(result)} y="214" fontSize="22" fill={C.green} textAnchor="middle">训练后 {result.toFixed(2)}</text>
            <text x={Math.min(scale(result) + 24, 650)} y="156" fontSize="26" fontWeight="700" fill={C.green}>
              +{source.delta.toFixed(1)} pp
            </text>
            <text x="30" y="240" fontSize="18" fill={C.muted}>局部放大：{lo.toFixed(1)}–{hi.toFixed(1)}；Δ 为相对 I2T-only 基线的百分点变化（p &lt; 0.05，3 seeds）。</text>
          </svg>
          <div style={{ marginTop: 2 }}>
            <div style={{ fontSize: 19, color: C.muted }}>
              把 Δ 套到你自己的基线上（拖动；论文基线 {cap.base.toFixed(2)}%）
            </div>
            <input type="range" min={30} max={95} step={0.5} value={base} aria-label="你的基线准确率"
              onChange={(event) => setOverride(Number(event.target.value))}
              style={{ width: '100%', accentColor: C.blue }} />
            {custom && (
              <button type="button" onClick={() => setOverride(null)}
                style={{
                  padding: '3px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 17, color: C.blue, background: '#fff', border: `1.5px solid ${C.blue}`,
                }}>回到论文基线 {cap.base.toFixed(2)}%</button>
            )}
          </div>
        </div>
      </div>

      <div style={{ width: 430, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ padding: '16px 18px', background: '#fff', border: `2px solid ${C.green}`, borderRadius: 14 }}>
          <div style={{ fontSize: 19, color: C.muted }}>Δ 的定义</div>
          <div style={{ fontSize: 22, fontFamily: 'ui-monospace, Consolas, monospace', color: C.ink, marginTop: 6, lineHeight: 1.6 }}>
            Δ(s,t) = Acc(M_s, D_t)<br />− Acc(M_I2T, D_t)
          </div>
          <div style={{ fontSize: 19, color: C.muted, marginTop: 6 }}>
            M_s：先做源任务 s 的 I2I、再 I2T 微调的模型；M_I2T：只用 I2T 的基线；D_t：能力 t 的评估集。
          </div>
        </div>

        <div style={{ padding: '16px 18px', background: '#fff', border: `2px solid ${C.blue}`, borderRadius: 14, flex: 1 }}>
          <div style={{ fontSize: 23, color: C.ink }}>
            {base.toFixed(2)} + {source.delta.toFixed(1)} = <b style={{ color: C.green }}>{result.toFixed(2)}</b>
          </div>
          <div style={{ fontSize: 20, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>
            {source.fromFigure ? '该 Δ 只出现在图 4 标注中，正文未复述。' : '该 Δ 由正文给出（三次种子平均，p < 0.05）。'}
          </div>
          {custom ? (
            <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(196,63,82,.06)', border: `1.5px solid ${C.red}`, fontSize: 19, color: C.ink, lineHeight: 1.45 }}>
              这是外推：论文只在你现在看到的基线上测过 Δ。换基线只用来体会 Δ 的量级，不能当成“你的模型也会涨这么多”。
            </div>
          ) : (
            <div style={{ marginTop: 10, fontSize: 19, color: C.muted, lineHeight: 1.45 }}>
              基线均为 9,444 个评估样本上的三次种子平均；不同能力难度不同，跨能力比 Δ 比比绝对准确率更合理。
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
