import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, Readouts, Slider, Feedback, Source, FONT_SANS, group } from './kit';

// 模块 4.2：注意力的规模随输入分辨率如何增长。
// 只做形状层面的计算（不涉及任何实验数值），两边都按四个层级合计比较：
//   空间自注意力：每个层级一张 (hw)×(hw) 矩阵，四层合计 4·(hw)²；
//   通道交叉注意力（SSCA）：Σ C_i × C_Σ = 480 × 480 个元素，与 h、w 无关。
// 另给出 QKᵀ 的乘加次数：空间 Σ C_i·(hw)² = 480·(hw)²，SSCA Σ C_i·C_Σ·hw = 480²·hw，比值恰为 hw / 480。

const CS = 480;
const CH_ENTRIES = CS * CS; // Σ C_i·C_Σ = 480·480

export const ScaleLab: React.FC<WidgetProps> = () => {
  const [L, setL] = useState(256);
  const hw = (L / 16) * (L / 16);
  const sp4 = 4 * hw * hw; // 四层空间注意力矩阵元素合计
  const ratioEl = sp4 / CH_ENTRIES;
  const ratioMac = hw / CS; // QKᵀ 乘加：空间 / SSCA
  const crossEl = 16 * Math.sqrt(CS / 2); // 4·(hw)² = 480² ⇒ hw = 240
  const crossMac = 16 * Math.sqrt(CS); // hw = 480

  const W = 860;
  const H = 300;
  const pad = { l: 70, r: 24, t: 20, b: 44 };
  const xs = (v: number) => pad.l + ((v - 128) / (1024 - 128)) * (W - pad.l - pad.r);
  const lmin = 3; // 10^3
  const lmax = 8; // 10^8
  const ys = (v: number) => H - pad.b - ((Math.log10(v) - lmin) / (lmax - lmin)) * (H - pad.t - pad.b);
  const pts: string[] = [];
  for (let s = 128; s <= 1024; s += 16) {
    const h2 = (s / 16) ** 2;
    pts.push(`${pts.length ? 'L' : 'M'}${xs(s).toFixed(1)},${ys(4 * h2 * h2).toFixed(1)}`);
  }

  const regime = L < crossEl ? 0 : hw < CS ? 1 : 2;
  return (
    <div className="sx-lab">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="sx-chart" role="img" aria-label="注意力矩阵元素数随输入边长的变化（对数纵轴）">
        <g fontFamily={FONT_SANS}>
          {[3, 4, 5, 6, 7, 8].map((e) => (
            <g key={e}>
              <line x1={pad.l} x2={W - pad.r} y1={ys(10 ** e)} y2={ys(10 ** e)} className="grid" />
              <text x={pad.l - 10} y={ys(10 ** e) + 4} textAnchor="end" className="tick">
                10{['³', '⁴', '⁵', '⁶', '⁷', '⁸'][e - 3]}
              </text>
            </g>
          ))}
          {[128, 256, 384, 512, 640, 768, 896, 1024].map((v) => (
            <text key={v} x={xs(v)} y={H - pad.b + 18} textAnchor="middle" className="tick">
              {v}
            </text>
          ))}
          <text x={(pad.l + W - pad.r) / 2} y={H - 6} textAnchor="middle" className="axis">
            输入边长（像素），嵌入网格为 (边长/16)²
          </text>
          <text x={16} y={(pad.t + H - pad.b) / 2} textAnchor="middle" className="axis" transform={`rotate(-90 16 ${(pad.t + H - pad.b) / 2})`}>
            矩阵元素数
          </text>
          <line x1={xs(crossEl)} x2={xs(crossEl)} y1={pad.t} y2={H - pad.b} stroke={C.line2} strokeDasharray="3 4" />
          <text x={xs(crossEl) - 5} y={pad.t + 12} textAnchor="end" fontSize={11} fill={C.muted}>元素数相等</text>
          <line x1={xs(crossMac)} x2={xs(crossMac)} y1={pad.t} y2={H - pad.b} stroke={C.line2} strokeDasharray="3 4" />
          <text x={xs(crossMac) + 5} y={pad.t + 12} fontSize={11} fill={C.muted}>QKᵀ 乘加相等</text>
          <path d={pts.join(' ')} fill="none" stroke={C.red} strokeWidth={2} />
          <line x1={pad.l} x2={W - pad.r} y1={ys(CH_ENTRIES)} y2={ys(CH_ENTRIES)} stroke={C.green} strokeWidth={2} />
          <text x={W - pad.r - 4} y={ys(CH_ENTRIES) - 8} textAnchor="end" fontSize={12} fill={C.green} fontWeight={600}>
            SSCA：四层合计 480×480
          </text>
          <text x={xs(700)} y={ys(4 * (700 / 16) ** 4) - 10} textAnchor="end" fontSize={12} fill={C.red} fontWeight={600}>
            空间自注意力：四层合计 4·(hw)²
          </text>
          <line x1={xs(L)} x2={xs(L)} y1={pad.t} y2={H - pad.b} stroke={C.orange} strokeWidth={1.5} />
          <circle cx={xs(L)} cy={ys(sp4)} r={5.5} fill={C.red} stroke="#fff" strokeWidth={1.5} />
          <circle cx={xs(L)} cy={ys(CH_ENTRIES)} r={5.5} fill={C.green} stroke="#fff" strokeWidth={1.5} />
        </g>
      </svg>
      <Slider label="输入边长" min={128} max={1024} step={32} value={L} onChange={setL} display={`${L}×${L}`} />
      <Readouts
        cols={4}
        items={[
          { k: '嵌入位置数 hw', v: group(hw), tone: 'orange' },
          { k: '空间注意力（四层合计）', v: group(sp4), tone: regime === 0 ? 'muted' : 'red' },
          { k: 'SSCA（四层合计）', v: group(CH_ENTRIES), tone: 'green' },
          { k: 'QKᵀ 乘加：空间 / SSCA', v: ratioMac.toFixed(2), unit: '倍' },
        ]}
      />
      <Feedback tone={regime === 2 ? 'good' : 'info'}>
        {regime === 0 ? (
          <>
            边长 {L} 时 hw = {group(hw)}，四层空间注意力合计只有 {group(sp4)} 个元素，少于 SSCA 的 230,400；QKᵀ 乘加也只有 SSCA 的 {ratioMac.toFixed(2)} 倍。分辨率低时，通道注意力并不更省。
          </>
        ) : regime === 1 ? (
          <>
            边长 {L} 时 hw = {group(hw)}，四层空间注意力合计 {group(sp4)} 个元素，是 SSCA 的 {ratioEl.toFixed(2)} 倍；但 QKᵀ 乘加只有 SSCA 的 {ratioMac.toFixed(2)} 倍。{L === 256 ? '训练用的 256×256 裁剪就在这一段：' : '在这一段，'}两种做法的规模大致相当，通道注意力的优势不在于“任何尺寸都更小”，而在于它不随分辨率平方增长。
          </>
        ) : (
          <>
            边长 {L} 时 hw = {group(hw)}，四层空间注意力合计 {group(sp4)} 个元素，是 SSCA 的 {ratioEl.toFixed(1)} 倍，QKᵀ 乘加也达到 {ratioMac.toFixed(2)} 倍。此后空间注意力按 (hw)² 增长；SSCA 的注意力图始终是 480×480，乘加只随 hw 线性增长。
          </>
        )}
      </Feedback>
      <Source>
        本模块是形状计算，不是论文实验。原文 §II-B 指出空间自注意力的复杂度与 token 数的平方成正比，且只在单张特征图内建立依赖；SSCA 的注意力图 A<sub>i</sub> ∈ ℝ<sup>C<sub>i</sub>×C<sub>Σ</sub></sup>（式 14）。两边都按四个层级合计：空间自注意力在每层的 h×w 嵌入网格上各算一张 (hw)×(hw) 矩阵；乘加次数只计 QKᵀ 一项，空间为 Σ C<sub>i</sub>·(hw)²，SSCA 为 Σ C<sub>i</sub>·C<sub>Σ</sub>·hw，两者之比为 hw / 480。
      </Source>
    </div>
  );
};
