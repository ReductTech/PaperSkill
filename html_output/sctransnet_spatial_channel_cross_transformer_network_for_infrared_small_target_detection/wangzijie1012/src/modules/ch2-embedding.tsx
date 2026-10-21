import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, Chips, Readouts, Feedback, Source, FONT_SANS, FONT_MONO } from './kit';

// 模块 2.1：四层编码特征 E_i 如何经 patch 嵌入对齐到同一个 h×w 网格。
// 形状关系来自 §III-A：C = 32/64/128/256；卷积核与步幅为 P, P/2, P/4, P/8，P = 16（§IV-B）；
// 输出 I_i ∈ R^{C_i × H/16 × W/16}。E_i 的空间尺寸原文记作 H/i，这里按池化次数写成 H/2^{i−1}（推断，见下方说明）。

const CH = [32, 64, 128, 256];
const KS = [16, 8, 4, 2];

export const EmbeddingLab: React.FC<WidgetProps> = () => {
  const [lv, setLv] = useState(0);
  const [size, setSize] = useState(256);
  const Hs = size / Math.pow(2, lv);
  const h = size / 16;
  const k = KS[lv];
  const tokenPx = k * Math.pow(2, lv); // 每个 token 对应原图的边长（像素）

  // 几何
  const W = 900;
  const Hh = 300;
  const base = 216; // E1 显示边长
  const sides = [base, base / 2, base / 4, base / 8];
  const ex = [18, 18 + base + 16, 18 + base + 16 + base / 2 + 14, 18 + base + 16 + base / 2 + 14 + base / 4 + 12];
  const ey = (s: number) => 40 + (base - s);
  const sel = sides[lv];
  const cell = sel / (Hs / k); // 一个 patch 在显示中的边长
  const gx0 = 620;
  const gy0 = 40;
  const gs = 216;
  const gc = gs / h;
  // 选中的 patch（取第 3 行第 5 列，或网格中部）
  const pr = Math.min(h - 1, 4);
  const pc = Math.min(h - 1, 6);

  return (
    <div className="sx-lab">
      <Chips
        label="编码层"
        value={lv}
        onChange={setLv}
        options={[0, 1, 2, 3].map((i) => ({ value: i, label: `E${'₁₂₃₄'[i]} · ${CH[i]} 通道` }))}
      />
      <Chips
        label="输入边长"
        value={size}
        onChange={setSize}
        options={[256, 384, 512].map((v) => ({ value: v, label: `${v}×${v}` }))}
      />
      <svg viewBox={`0 0 ${W} ${Hh}`} width="100%" className="sx-diagram" role="img" aria-label="四层编码特征与嵌入后的统一网格">
        <defs>
          <marker id="emb-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0,1 L9,5 L0,9 z" fill={C.blue} />
          </marker>
          <pattern id="emb-grid" width={cell} height={cell} patternUnits="userSpaceOnUse" x={ex[lv]} y={ey(sel)}>
            <path d={`M ${cell} 0 L 0 0 0 ${cell}`} fill="none" stroke={C.blue} strokeOpacity={0.35} strokeWidth={0.8} />
          </pattern>
        </defs>
        <g fontFamily={FONT_SANS}>
          {sides.map((s, i) => (
            <g key={i} opacity={i === lv ? 1 : 0.55}>
              <rect x={ex[i]} y={ey(s)} width={s} height={s} fill={i === lv ? '#eef2f8' : C.paper2} stroke={i === lv ? C.blue : C.line2} strokeWidth={i === lv ? 1.6 : 1} />
              <text x={ex[i] + s / 2} y={ey(s) + s + 18} textAnchor="middle" fontSize={13} fill={i === lv ? C.blue : C.muted} fontWeight={i === lv ? 700 : 500}>
                E{'₁₂₃₄'[i]}
              </text>
              <text x={ex[i] + s / 2} y={ey(s) + s + 34} textAnchor="middle" fontSize={11} fill={C.muted} fontFamily={FONT_MONO}>
                {size / Math.pow(2, i)}²
              </text>
            </g>
          ))}
          <rect x={ex[lv]} y={ey(sel)} width={sel} height={sel} fill="url(#emb-grid)" />
          <rect x={ex[lv] + pc * cell} y={ey(sel) + pr * cell} width={cell} height={cell} fill={C.orange} fillOpacity={0.35} stroke={C.orange} strokeWidth={1.5} />
          <path d={`M ${ex[3] + base / 8 + 22} ${40 + base / 2} L ${gx0 - 16} ${40 + base / 2}`} stroke={C.blue} strokeWidth={1.6} markerEnd="url(#emb-arr)" />
          <text x={(ex[3] + base / 8 + gx0) / 2 + 3} y={40 + base / 2 - 12} textAnchor="middle" fontSize={12.5} fill={C.blue} fontWeight={600}>
            Conv {k}×{k}
          </text>
          <text x={(ex[3] + base / 8 + gx0) / 2 + 3} y={40 + base / 2 + 22} textAnchor="middle" fontSize={11.5} fill={C.muted}>
            步幅 {k}
          </text>
          {Array.from({ length: h + 1 }, (_, i) => (
            <g key={i}>
              <line x1={gx0} x2={gx0 + gs} y1={gy0 + i * gc} y2={gy0 + i * gc} stroke={C.line2} strokeWidth={0.7} />
              <line y1={gy0} y2={gy0 + gs} x1={gx0 + i * gc} x2={gx0 + i * gc} stroke={C.line2} strokeWidth={0.7} />
            </g>
          ))}
          <rect x={gx0} y={gy0} width={gs} height={gs} fill="none" stroke={C.ink2} />
          <rect x={gx0 + pc * gc} y={gy0 + pr * gc} width={gc} height={gc} fill={C.orange} fillOpacity={0.5} stroke={C.orange} strokeWidth={1.5} />
          <rect x={gx0 + gs + 14} y={gy0 + gs - (gs * CH[lv]) / 256} width={14} height={(gs * CH[lv]) / 256} fill={C.blue} fillOpacity={0.75} />
          <text x={gx0 + gs + 21} y={gy0 + gs + 18} textAnchor="middle" fontSize={11} fill={C.muted}>
            C
          </text>
          <text x={gx0 + gs / 2} y={gy0 + gs + 18} textAnchor="middle" fontSize={13} fill={C.ink} fontWeight={700}>
            I{'₁₂₃₄'[lv]}
          </text>
          <text x={gx0 + gs / 2} y={gy0 + gs + 34} textAnchor="middle" fontSize={11} fill={C.muted} fontFamily={FONT_MONO}>
            {h}×{h} 个位置
          </text>
          <text x={gx0 + gs / 2} y={22} textAnchor="middle" fontSize={12} fill={C.muted}>
            四层共用的嵌入网格
          </text>
          <text x={18} y={22} fontSize={12} fill={C.muted}>
            编码器输出（按空间尺寸等比例绘制）
          </text>
        </g>
      </svg>
      <Readouts
        cols={4}
        items={[
          { k: <>E{'₁₂₃₄'[lv]} 形状</>, v: `${CH[lv]}×${Hs}×${Hs}`, tone: 'blue' },
          { k: '卷积核 = 步幅', v: `${k}×${k}`, tone: 'orange' },
          { k: <>I{'₁₂₃₄'[lv]} 形状</>, v: `${CH[lv]}×${h}×${h}` },
          { k: '名义网格步距', v: `${tokenPx}×${tokenPx}`, unit: '像素' },
        ]}
      />
      <Feedback tone="info">
        {lv === 0 ? (
          <>
            E₁ 保持原分辨率，用 16×16 卷积一次跨 16 个像素；3×3 与名义 16×16 网格单元的面积比为 9/256 ≈ 3.5%；这是理想化几何示意，不表示实际感受野或目标信息保留比例。
          </>
        ) : (
          <>
            E{'₁₂₃₄'[lv]} 已经过 {lv} 次 2 倍下采样，所以卷积核缩小为 {k}×{k}；四层的有效采样步距都为原图 16 像素，因此网格可以对齐；实际感受野还受前层卷积和池化影响，通常更大且彼此重叠。
          </>
        )}
      </Feedback>
      <Source>
        依据 §III-A 与 §IV-B：C₁…C₄ = 32/64/128/256，卷积核与步幅为 P、P/2、P/4、P/8 且 P = 16，I<sub>i</sub> ∈ ℝ<sup>C<sub>i</sub>×H/16×W/16</sup>。原文把 E<sub>i</sub> 的空间尺寸写作 H/i；由于第 i 层经过 i−1 次 2 倍池化，且步幅 P/2<sup>i−1</sup> 要把它变成 H/16，这里按 H/2<sup>i−1</sup> 绘制（作者代码中四层分别为 H、H/2、H/4、H/8，与此一致）。输入边长只是演示用的取值。
      </Source>
    </div>
  );
};
