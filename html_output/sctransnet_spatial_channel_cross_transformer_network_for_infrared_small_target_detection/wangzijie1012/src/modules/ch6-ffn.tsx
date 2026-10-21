import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, Chips, Feedback, Source, PaperImage, FONT_SANS, FONT_MONO } from './kit';
import { TABLE7, num } from './paper-data';

// 模块 6.2：把 SCTB 中的前馈网络依次换成五种结构（表 VII，图 10）。
// 选择一种结构：左侧显示它的原文结构图，右侧点阵图给出它在 NUAA-SIRST 与 NUDT-SIRST 上的 IoU / nIoU，
// 与 CFN 的差值以百分点标出。

const PANEL: Record<string, string | null> = {
  FFN: 'a',
  LeFF: 'b',
  GDFN: 'c',
  MSFN: 'd',
  'CFN w/o GSLC': 'e',
  CFN: null,
};

const NOTE: Record<string, React.ReactNode> = {
  FFN: <>ViT 的标准前馈网络：1×1 升维、激活、1×1 降维，不看空间邻域。NUAA-SIRST 上 IoU 比 CFN 低 0.63 个百分点。（原表把它的参数量与计算量加粗，但 GDFN 的两项其实更小。）</>,
  LeFF: <>在前馈网络中加入 3×3 深度卷积做局部空间聚合。原文认为它相对 FFN 的小幅提升说明局部空间信息对该任务有效（但 NUAA 上 IoU 反而略低于 FFN，提升体现在 nIoU 与 NUDT 上）。</>,
  GDFN: <>Restormer 的门控前馈网络。六者中最差；原文的解释是门控卷积容易把红外小目标当作噪声滤掉。</>,
  MSFN: <>两支不同核大小的深度卷积并交叉融合的多尺度前馈网络。原文称它是 CFN 之外最好的一个，体现了多尺度结构的优势；按表 VII，这一点在 NUAA 的 IoU 与 NUDT 的 nIoU 上成立，在 NUAA 的 nIoU 与 NUDT 的 IoU 上它并不是第二。</>,
  'CFN w/o GSLC': <>去掉 GAP + 一维卷积这一支，只保留多尺度的局部空间部分。原文说它不如 MSFN；按表 VII，这一判断在 NUAA 的 IoU 上成立（76.54 对 77.35），在 NUAA 的 nIoU 和 NUDT 的 IoU 上它反而略高。图 11 显示其深层特征把目标混入背景。</>,
  CFN: <>完整 CFN：在多尺度局部空间之后再加 GSLC 分支。两个数据集的 IoU 与 nIoU 都最高，而参数量与 CFN w/o GSLC 相同、计算量只多 0.001 G。</>,
};

export const FfnLab: React.FC<WidgetProps> = () => {
  const [sel, setSel] = useState('MSFN');
  const row = TABLE7.find((r) => r.name === sel) as (typeof TABLE7)[number];
  const cfn = TABLE7[5];
  const panel = PANEL[sel];

  const cols = [
    { k: 'NUAA IoU', get: (r: typeof row) => r.nuaa[0] },
    { k: 'NUAA nIoU', get: (r: typeof row) => r.nuaa[1] },
    { k: 'NUDT IoU', get: (r: typeof row) => r.nudt[0] },
    { k: 'NUDT nIoU', get: (r: typeof row) => r.nudt[1] },
  ];
  const W = 560;
  const rowH = 60;
  const H = cols.length * rowH + 30;
  const x0 = 120;
  const x1 = W - 70;

  return (
    <div className="sx-lab">
      <Chips label="前馈网络" value={sel} onChange={setSel} options={TABLE7.map((r) => ({ value: r.name, label: r.name }))} />
      <div className="ffn-grid">
        <div className="ffn-fig">
          {panel ? (
            <img src={`./images/fig10-${panel}.png`} alt={`原文图 10(${panel})：${sel} 的结构`} />
          ) : (
            <img src="./images/fig3.png" alt="原文图 3：右侧 (b) 为 CFN" className="ffn-fig3" />
          )}
          <div className="ffn-cap">
            {panel ? `原文图 10(${panel})` : '原文图 3(b)：完整 CFN'}
            <span>
              参数 {row.params} M · 计算量 {row.flops} G
            </span>
          </div>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="sx-chart" role="img" aria-label="六种前馈网络的 IoU 与 nIoU 点阵图">
          <g fontFamily={FONT_SANS}>
            {cols.map((col, ci) => {
              const vals = TABLE7.map((r) => num(col.get(r)));
              const lo = Math.min(...vals) - 0.15;
              const hi = Math.max(...vals) + 0.15;
              const X = (v: number) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0);
              const y = 30 + ci * rowH;
              const mine = num(col.get(row));
              const ref = num(col.get(cfn));
              const d = mine - ref;
              return (
                <g key={col.k}>
                  <text x={0} y={y + 4} fontSize={12.5} fill={C.ink2}>
                    {col.k}
                  </text>
                  <line x1={x0} x2={x1} y1={y} y2={y} stroke={C.line} />
                  <text x={x0} y={y + 22} fontSize={10.5} fill={C.faint} fontFamily={FONT_MONO} textAnchor="start">
                    {lo.toFixed(2)}
                  </text>
                  <text x={x1} y={y + 22} fontSize={10.5} fill={C.faint} fontFamily={FONT_MONO} textAnchor="end">
                    {hi.toFixed(2)}
                  </text>
                  {TABLE7.map((r) => {
                    const v = num(col.get(r));
                    const isSel = r.name === sel;
                    const isCfn = r.name === 'CFN';
                    return (
                      <circle key={r.name} cx={X(v)} cy={y} r={isSel ? 7 : 4.5} fill={isCfn ? C.green : isSel ? C.orange : '#c9c4b8'} stroke="#fff" strokeWidth={1.2} opacity={isSel || isCfn ? 1 : 0.9}>
                        <title>
                          {r.name}: {col.get(r)}
                        </title>
                      </circle>
                    );
                  })}
                  <text x={x1 + 10} y={y + 4} fontSize={12} fill={sel === 'CFN' ? C.green : d < 0 ? C.red : C.green} fontFamily={FONT_MONO}>
                    {sel === 'CFN' ? col.get(row) : `${d >= 0 ? '+' : '−'}${Math.abs(d).toFixed(2)}`}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      <div className="sx-legend-row light">
        <span className="lg"><i className="dot" style={{ background: C.orange }} />所选结构</span>
        <span className="lg"><i className="dot" style={{ background: C.green }} />CFN</span>
        <span className="lg"><i className="dot" style={{ background: '#c9c4b8' }} />其他</span>
        <span className="lg muted">右侧数字：所选结构 − CFN（百分点）</span>
      </div>
      <Feedback tone={sel === 'CFN' ? 'good' : 'bad'}>{NOTE[sel]}</Feedback>
      {sel === 'CFN w/o GSLC' ? (
        <PaperImage src="./images/fig11.jpg" alt="原文图 11" caption="原文图 11（p.12）：每组上行为 SCTransNet，下行为 CFN w/o GSLC。作者指出后者的深层特征把目标混入背景，最终在输出层漏检。" maxWidth={720} />
      ) : null}
      <Source>数值：表 VII（p.11），只报告 NUAA-SIRST 与 NUDT-SIRST，单位 %。每一行横轴按六个结构在该列的取值范围单独截取，只用于比较相对位置。结构图裁自原文图 10。</Source>
    </div>
  );
};
