import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, Chips, Feedback, Source, FONT_SANS, PaperImage } from './kit';
import { TABLE6, DATASETS, DatasetKey, num } from './paper-data';

// 模块 5.1：SSCA 的三处取舍。选择一个变体，上方的结构示意标出它改动了哪里，
// 下方柱条给出它与 SSCA 在三个数据集上的 IoU / nIoU / F-measure（表 VI 原值）。

type V = 0 | 1 | 2 | 3;
const VAR: { idx: number; short: string; change: string; why: React.ReactNode }[] = [
  {
    idx: 0,
    short: 'MCA',
    change: '换成 UCTransNet 的多头交叉注意力',
    why: <>MCA 是 UCTransNet 中典型的全层交互结构。原文认为 SCTransNet 通过更全面的信息交互，更能感知小目标与复杂背景之间的差异。</>,
  },
  {
    idx: 1,
    short: '加位置编码',
    change: '在 patch 嵌入阶段加入绝对位置编码，测试时插值缩放',
    why: <>原文解释：输入尺寸可变时，位置编码矩阵需要缩放，导致小目标的位置编码不准确，进而影响目标像素的预测，因此绝对位置编码不适合该任务。</>,
  },
  {
    idx: 2,
    short: '改为多头',
    change: '把单头交叉注意力换成典型的多头交叉注意力',
    why: <>原文解释：多头策略让小目标的特征映射空间更复杂，不利于从特征有限的目标中提取信息，因此采用单头。</>,
  },
  {
    idx: 3,
    short: '去掉空间嵌入',
    change: '去掉生成 Q、K、V 时的 3×3 深度卷积',
    why: <>原文解释：局部空间嵌入既能捕捉目标的细节，也能捕捉深层中与背景的潜在空间关联，从而减少漏检、提高检测置信度（对照图 9）。</>,
  },
];

export const VariantsLab: React.FC<WidgetProps> = () => {
  const [v, setV] = useState<V>(3);
  const [ds, setDs] = useState<DatasetKey>('nuaa');
  const row = TABLE6[VAR[v].idx];
  const ref = TABLE6[4];
  const names = ['IoU', 'nIoU', 'F-measure'];

  // 结构示意：Q/K/V 生成分支
  const peOn = v === 1;
  const mh = v === 2 || v === 0;
  const seOff = v === 3;
  const isMCA = v === 0;

  const W = 880;
  const Hh = 150;
  const node = (x: number, label: string, opts: { off?: boolean; add?: boolean; color?: string } = {}) => (
    <g>
      <rect
        x={x}
        y={52}
        width={104}
        height={40}
        rx={6}
        fill={opts.off ? '#fff' : opts.add ? '#fdf0e8' : '#f2f4f7'}
        stroke={opts.off ? C.red : opts.add ? C.orange : opts.color ?? C.line2}
        strokeDasharray={opts.off ? '4 3' : undefined}
        strokeWidth={opts.off || opts.add ? 1.6 : 1}
      />
      <text x={x + 52} y={77} textAnchor="middle" fontSize={13} fill={opts.off ? C.red : C.ink} textDecoration={opts.off ? 'line-through' : undefined}>
        {label}
      </text>
    </g>
  );

  return (
    <div className="sx-lab">
      <Chips
        label="变体"
        value={v}
        onChange={setV}
        options={[0, 1, 2, 3].map((i) => ({ value: i as V, label: TABLE6[VAR[i].idx].name }))}
      />
      <svg viewBox={`0 0 ${W} ${Hh}`} width="100%" className="sx-diagram" role="img" aria-label="Q K V 生成与注意力分支的改动示意">
        <defs>
          <marker id="var-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,1 L9,5 L0,9 z" fill={C.muted} />
          </marker>
        </defs>
        <g fontFamily={FONT_SANS}>
          {isMCA ? (
            <>
              {node(40, 'patch 嵌入')}
              <line x1={144} y1={72} x2={196} y2={72} stroke={C.muted} markerEnd="url(#var-arr)" />
              <rect x={200} y={44} width={480} height={56} rx={8} fill="#fdf0e8" stroke={C.orange} strokeWidth={1.6} />
              <text x={440} y={70} textAnchor="middle" fontSize={14} fill={C.ink} fontWeight={600}>
                MCA [27]：UCTransNet 的多头交叉注意力
              </text>
              <text x={440} y={89} textAnchor="middle" fontSize={11.5} fill={C.muted}>
                整体替换 SSCA；原文未在本节展开其内部结构
              </text>
              <line x1={680} y1={72} x2={732} y2={72} stroke={C.muted} markerEnd="url(#var-arr)" />
              {node(736, '输出 Pᵢ')}
            </>
          ) : (
            <>
              {node(20, 'patch 嵌入')}
              {peOn ? (
                <g>
                  <circle cx={150} cy={72} r={12} fill="#fdf0e8" stroke={C.orange} strokeWidth={1.6} />
                  <text x={150} y={77} textAnchor="middle" fontSize={15} fill={C.orange}>
                    +
                  </text>
                  <text x={150} y={36} textAnchor="middle" fontSize={11.5} fill={C.orange}>
                    位置编码（插值）
                  </text>
                </g>
              ) : null}
              <line x1={124} y1={72} x2={peOn ? 138 : 176} y2={72} stroke={C.muted} markerEnd={peOn ? undefined : 'url(#var-arr)'} />
              {peOn ? <line x1={162} y1={72} x2={176} y2={72} stroke={C.muted} markerEnd="url(#var-arr)" /> : null}
              {node(180, 'LN')}
              <line x1={284} y1={72} x2={316} y2={72} stroke={C.muted} markerEnd="url(#var-arr)" />
              {node(320, '1×1 卷积')}
              <line x1={424} y1={72} x2={456} y2={72} stroke={C.muted} markerEnd="url(#var-arr)" />
              {node(460, '3×3 深度卷积', { off: seOff })}
              <line x1={564} y1={72} x2={596} y2={72} stroke={C.muted} markerEnd="url(#var-arr)" />
              {mh ? (
                <g>
                  {[0, 1, 2, 3].map((k) => (
                    <rect key={k} x={600 + k * 6} y={46 + k * 6} width={104} height={34} rx={5} fill="#fdf0e8" stroke={C.orange} strokeWidth={1.2} />
                  ))}
                  <text x={670} y={86} textAnchor="middle" fontSize={12.5} fill={C.ink}>
                    多头注意力
                  </text>
                </g>
              ) : (
                node(600, '单头注意力', { color: C.blue })
              )}
              <line x1={730} y1={72} x2={762} y2={72} stroke={C.muted} markerEnd="url(#var-arr)" />
              {node(766, '输出 Pᵢ')}
            </>
          )}
          <text x={20} y={128} fontSize={12} fill={C.muted}>
            改动：{VAR[v].change}
          </text>
        </g>
      </svg>
      <Chips
        label="数据集"
        value={ds}
        onChange={setDs}
        options={DATASETS.map((d) => ({ value: d.key, label: d.name }))}
      />
      <div className="sx-bars3">
        {names.map((n, i) => {
          const a = num(row[ds][i]);
          const b = num(ref[ds][i]);
          const lo = Math.floor(Math.min(a, b) - 3);
          const hi = Math.ceil(Math.max(a, b) + 1);
          const pct = (x: number) => ((x - lo) / (hi - lo)) * 100;
          const d = a - b;
          return (
            <div className="sx-bar3" key={n}>
              <div className="sx-bar3-head">
                <b>{n}</b>
                <span className={d < 0 ? 'neg' : 'pos'}>
                  {d >= 0 ? '+' : '−'}
                  {Math.abs(d).toFixed(2)} 个百分点
                </span>
              </div>
              <div className="sx-bar3-row">
                <span className="lbl">{row.name}</span>
                <div className="trk">
                  <div className="fill red" style={{ width: `${pct(a)}%` }} />
                </div>
                <span className="val">{row[ds][i]}</span>
              </div>
              <div className="sx-bar3-row">
                <span className="lbl">SSCA</span>
                <div className="trk">
                  <div className="fill green" style={{ width: `${pct(b)}%` }} />
                </div>
                <span className="val">{ref[ds][i]}</span>
              </div>
              <div className="sx-bar3-axis">
                <span>{lo}</span>
                <span>{hi}</span>
              </div>
            </div>
          );
        })}
      </div>
      <Feedback tone="bad">{VAR[v].why}</Feedback>
      {v === 2 ? (
        <Feedback tone="warn">
          核对：正文写 “SSCA w MH 在 SIRST-1K 上 IoU、nIoU、F 分别下降 1.15、1.52、0.73”。按表 VI，这组差值对应的是 NUAA-SIRST（77.50−76.35、81.08−79.56、87.32−86.59）；IRSTD-1K 上的差值是 0.95、0.60、0.66。
        </Feedback>
      ) : null}
      {v === 3 ? (
        <details className="sx-details" open>
          <summary>原文图 9：SCTransNet 与 SSCA w/o SE 的特征图</summary>
          <PaperImage src="./images/fig9.jpg" alt="原文图 9" caption="原文图 9（p.11）：每组上行为 SCTransNet，下行为去掉空间嵌入的变体；L4→L1 由深到浅。作者据此说明完整 SSCA 的深层特征更准确地刻画了目标所在的局部区域。" maxWidth={720} />
        </details>
      ) : null}
      <Source>
        数值：表 VI（p.11），单位 %，柱条横轴按两者数值自动截取，只用于比较差值。图形为结构示意，依据 §III-B1 末段与 §IV-E2 对三个变体的描述。
      </Source>
    </div>
  );
};
