import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, Chips, Readouts, Feedback, Source, FONT_SANS, FONT_MONO, PaperImage } from './kit';

// 模块 6.1：CFN 的数据流（式 15–17，图 3(b)）。点击任一节点：
//  · 右上的 16×16 网格标出该运算在“空间”上看多大范围；
//  · 右下的通道条标出它在“通道”上看多大范围；
// 由此直接对照图 4 的两种范式：LSGC（局部空间 × 全局通道）与 GSLC（全局空间 × 局部通道）。

const CH = [32, 64, 128, 256];
const ETA = 2.66;
const SUB = '₁₂₃₄';

type NodeKey = 'ln' | 'up' | 'dw3' | 'dw5' | 'cat' | 'down' | 'gap' | 'c1d' | 'mul' | 'add';

interface NodeDef {
  key: NodeKey;
  label: string;
  x: number;
  y: number;
  w?: number;
  space: 'none' | 'pos' | '3' | '5' | 'all';
  chan: 'none' | 'one' | 'all' | 'three';
  group: 'LSGC' | 'GSLC' | '—';
  shape: (c: number, h: number) => string;
  text: React.ReactNode;
}

export const CfnLab: React.FC<WidgetProps> = () => {
  const [lv, setLv] = useState(0);
  const [sel, setSel] = useState<NodeKey>('dw3');
  const c = CH[lv];
  const hid = Math.floor(c * ETA);

  const NODES: NodeDef[] = [
    { key: 'ln', label: 'LN', x: 80, y: 150, space: 'pos', chan: 'all', group: '—', shape: (c) => `${c}×16×16`, text: <>层归一化，在每个位置上沿通道归一（式 15 中的 LN）。</> },
    { key: 'up', label: '1×1 升维', x: 190, y: 150, w: 92, space: 'pos', chan: 'all', group: 'LSGC', shape: () => `${2 * hid}×16×16`, text: <>1×1 卷积按比例 η 升高通道数，然后对半切成两支（Chunk，式 15）。逐位置混合全部通道。</> },
    { key: 'dw3', label: '3×3 DW', x: 330, y: 95, space: '3', chan: 'one', group: 'LSGC', shape: () => `${hid}×16×16`, text: <>3×3 深度卷积：每个通道独立地看 3×3 邻域，随后经激活 δ（式 16）。</> },
    { key: 'dw5', label: '5×5 DW', x: 330, y: 205, space: '5', chan: 'one', group: 'LSGC', shape: () => `${hid}×16×16`, text: <>5×5 深度卷积：另一支看更大的 5×5 邻域——两种尺度的局部空间信息（式 16）。</> },
    { key: 'cat', label: '拼接', x: 450, y: 150, space: 'pos', chan: 'all', group: 'LSGC', shape: () => `${2 * hid}×16×16`, text: <>沿通道把两支拼回去（式 16 中的 [·, ·]）。</> },
    { key: 'down', label: '1×1 降维', x: 560, y: 150, w: 92, space: 'pos', chan: 'all', group: 'LSGC', shape: (c) => `${c}×16×16`, text: <>1×1 卷积恢复为原通道数，得到 X<sub>sc</sub>。到这里是“局部空间 + 全局通道”（LSGC）。</> },
    { key: 'gap', label: 'GAP', x: 690, y: 70, space: 'all', chan: 'one', group: 'GSLC', shape: (c) => `${c}×1×1`, text: <>全局平均池化：每个通道把 16×16 个位置压成一个数，用来近似“全局空间信息”。原文说明选择 GAP 而非空间 MLP，是因为测试图像分辨率可变且后者计算量大。</> },
    { key: 'c1d', label: '1D 卷积 k=3', x: 690, y: 150, w: 100, space: 'none', chan: 'three', group: 'GSLC', shape: (c) => `${c}×1×1`, text: <>核长为 3 的一维卷积沿通道方向滑动：每个通道只与相邻的 2 个通道交互——“全局空间 + 局部通道”（GSLC，式 17）。</> },
    { key: 'mul', label: '⊙', x: 830, y: 150, w: 44, space: 'all', chan: 'one', group: 'GSLC', shape: (c) => `${c}×16×16`, text: <>把每个通道的权重广播到全部位置，与 X<sub>sc</sub> 逐元素相乘（式 17 中的 ⊙）。</> },
    { key: 'add', label: '+ X', x: 910, y: 150, w: 52, space: 'pos', chan: 'one', group: '—', shape: (c) => `${c}×16×16`, text: <>与 CFN 的输入 X<sub>i</sub> 相加，得到 X<sub>o</sub>（式 17）。这就是 SCTB 的输出 O<sub>i</sub>。</> },
  ];
  const nd = NODES.find((n) => n.key === sel) as NodeDef;

  const W = 950;
  const H = 280;
  const nodeBox = (n: NodeDef) => {
    const w = n.w ?? 80;
    const on = n.key === sel;
    const col = n.group === 'GSLC' ? C.purple : n.group === 'LSGC' ? C.blue : C.ink2;
    return (
      <g key={n.key} className="sx-node" onClick={() => setSel(n.key)} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSel(n.key)}>
        <rect x={n.x - w / 2} y={n.y - 18} width={w} height={36} rx={6} fill={on ? col : '#fff'} stroke={col} strokeWidth={on ? 2 : 1.2} />
        <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize={13} fill={on ? '#fff' : C.ink} fontWeight={on ? 700 : 500}>
          {n.label}
        </text>
      </g>
    );
  };
  const ln = (x1: number, y1: number, x2: number, y2: number, dashed = false) => (
    <path d={`M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`} fill="none" stroke={C.line2} strokeWidth={1.4} strokeDasharray={dashed ? '4 4' : undefined} markerEnd="url(#cfn-arr)" />
  );

  // 右侧：空间与通道范围示意
  const G = 16;
  const gs = 128;
  const gc = gs / G;
  const ctr = 7;
  const spaceCells: [number, number][] = [];
  if (nd.space === 'pos') spaceCells.push([ctr, ctr]);
  if (nd.space === '3' || nd.space === '5') {
    const r = nd.space === '3' ? 1 : 2;
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) spaceCells.push([ctr + y, ctr + x]);
  }
  const nChan = 24;
  const chanOn = (i: number) => (nd.chan === 'all' ? true : nd.chan === 'one' ? i === 11 : nd.chan === 'three' ? i >= 10 && i <= 12 : false);

  return (
    <div className="sx-lab">
      <Chips label="层级" value={lv} onChange={setLv} options={[0, 1, 2, 3].map((i) => ({ value: i, label: `第 ${i + 1} 层 · C = ${CH[i]}` }))} />
      <div className="cfn-wrap-v">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="sx-diagram" role="group" aria-label="CFN 数据流，可点击节点">
          <defs>
            <marker id="cfn-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,1 L9,5 L0,9 z" fill={C.line2} />
            </marker>
          </defs>
          <g fontFamily={FONT_SANS}>
            <rect x={140} y={52} width={474} height={180} rx={10} fill={C.blue} fillOpacity={0.04} stroke={C.blue} strokeOpacity={0.25} strokeDasharray="4 4" />
            <text x={150} y={44} fontSize={12} fill={C.blue}>LSGC：多尺度局部空间 + 全局通道（式 15–16）</text>
            <rect x={632} y={30} width={240} height={160} rx={10} fill={C.purple} fillOpacity={0.05} stroke={C.purple} strokeOpacity={0.3} strokeDasharray="4 4" />
            <text x={642} y={22} fontSize={12} fill={C.purple}>GSLC：全局空间 + 局部通道（式 17）</text>
            <text x={6} y={155} fontSize={13} fill={C.ink} fontWeight={600}>X{SUB[lv]}</text>
            {ln(26, 150, 40, 150)}
            {ln(120, 150, 144, 150)}
            {ln(236, 150, 290, 95)}
            {ln(236, 150, 290, 205)}
            {ln(370, 95, 410, 150)}
            {ln(370, 205, 410, 150)}
            {ln(490, 150, 514, 150)}
            {ln(606, 150, 650, 70)}
            <line x1={690} y1={88} x2={690} y2={130} stroke={C.line2} strokeWidth={1.4} markerEnd="url(#cfn-arr)" />
            {ln(740, 150, 808, 150)}
            <path d="M 606 156 C 680 214, 770 214, 826 170" fill="none" stroke={C.line2} strokeWidth={1.4} strokeDasharray="4 4" markerEnd="url(#cfn-arr)" />
            <text x={716} y={226} textAnchor="middle" fontSize={11} fill={C.muted}>X<tspan baselineShift="sub" fontSize={8}>sc</tspan></text>
            {ln(852, 150, 884, 150)}
            <path d="M 14 166 C 14 270, 910 270, 910 170" fill="none" stroke={C.line2} strokeDasharray="2 4" markerEnd="url(#cfn-arr)" />
            <text x={470} y={262} textAnchor="middle" fontSize={11} fill={C.muted}>残差：+ X<tspan baselineShift="sub" fontSize={8}>i</tspan></text>
            {NODES.map(nodeBox)}
          </g>
        </svg>
        <div className="cfn-strip">
          <div className="cfn-cell">
          <div className="cfn-side-title">空间范围（16×16 网格）</div>
          <svg viewBox={`0 0 ${gs} ${gs}`} width={gs} height={gs} className="cfn-grid">
            {Array.from({ length: G * G }, (_, i) => {
              const y = Math.floor(i / G);
              const x = i % G;
              const on = nd.space === 'all' || spaceCells.some(([a, b]) => a === y && b === x);
              return <rect key={i} x={x * gc + 0.5} y={y * gc + 0.5} width={gc - 1} height={gc - 1} fill={on ? (nd.group === 'GSLC' ? C.purple : C.blue) : '#eceae4'} fillOpacity={on ? 0.85 : 1} />;
            })}
          </svg>
          </div>
          <div className="cfn-cell">
          <div className="cfn-side-title">通道范围</div>
          <svg viewBox={`0 0 300 22`} width={300} height={22}>
            {Array.from({ length: nChan }, (_, i) => (
              <rect key={i} x={i * (300 / nChan) + 0.5} y={2} width={300 / nChan - 1} height={18} fill={chanOn(i) ? (nd.group === 'GSLC' ? C.purple : C.blue) : '#eceae4'} />
            ))}
          </svg>
          </div>
          <div className="cfn-side-note">
            {nd.space === 'none' ? '不涉及空间维（已被 GAP 压成 1×1）' : nd.space === 'all' ? '覆盖全部位置' : nd.space === 'pos' ? '只看当前位置' : `每个位置看 ${nd.space}×${nd.space} 邻域`}
            {' · '}
            {nd.chan === 'all' ? '混合全部通道' : nd.chan === 'three' ? '只看相邻 3 个通道' : '各通道独立'}
          </div>
        </div>
      </div>
      <Readouts
        cols={3}
        items={[
          { k: '当前节点', v: nd.label, tone: nd.group === 'GSLC' ? 'blue' : 'blue' },
          { k: '输出形状（256×256 输入）', v: <span style={{ fontFamily: FONT_MONO }}>{nd.shape(c, 16)}</span> },
          { k: '所属范式', v: nd.group },
        ]}
      />
      <Feedback tone={nd.group === 'GSLC' ? 'good' : 'info'}>{nd.text}</Feedback>
      <details className="sx-details">
        <summary>对照原文图 4（两种信息增强范式）</summary>
        <PaperImage src="./images/fig4.png" alt="原文图 4：LSGC 与 GSLC" caption="原文图 4（p.6）。(a) 局部空间 + 全局通道（LSGC）；(b) 全局空间 + 局部通道（GSLC）。CFN 在内部同时使用两者。" maxWidth={640} />
      </details>
      <Source>
        依据：§III-B2，式 (15)–(17)，图 3(b) 与图 4。η = 2.66（§IV-B）。每支通道数按作者代码取 ⌊ηC⌋（第 {lv + 1} 层为 ⌊2.66×{c}⌋ = {hid}），升维 1×1 输出两倍再对半切分；原文只写“按 η 升维并均分为两支”。式 (16) 中 δ 依图 3 图例为 ReLU。注意：式 (17) 中没有 Sigmoid，而作者公开代码在一维卷积后接了 Sigmoid，此处以论文公式为准。
      </Source>
    </div>
  );
};
