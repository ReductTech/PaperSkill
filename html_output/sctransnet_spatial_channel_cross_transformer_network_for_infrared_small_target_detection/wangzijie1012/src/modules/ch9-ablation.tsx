import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, Chips, Readouts, Feedback, Source, Stepper, FONT_SANS, FONT_MONO } from './kit';
import { TABLE4, TABLE5, TABLE8, TABLE9, TABLE10, num } from './paper-data';

// 模块 9.1：逐项加入模块，看三项指标怎样变化（表 IV：从 U-Net 出发；表 V：从 UCTransNet 出发）。

type Path = 'unet' | 'uct';
const MET = [
  { k: 'iou', name: 'IoU', color: C.blue },
  { k: 'niou', name: 'nIoU', color: C.purple },
  { k: 'f', name: 'F-measure', color: C.green },
] as const;

export const AblationLab: React.FC<WidgetProps> = () => {
  const [path, setPath] = useState<Path>('unet');
  const rows = path === 'unet' ? TABLE4 : TABLE5;
  const [step, setStep] = useState(rows.length - 1);
  const s = Math.min(step, rows.length - 1);
  const cur = rows[s];
  const prev = s > 0 ? rows[s - 1] : null;
  const W = 880;
  const H = 300;
  const pad = { l: 56, r: 30, t: 20, b: 50 };
  const lo = 74;
  const hi = 92;
  const X = (i: number) => pad.l + (i / (rows.length - 1)) * (W - pad.l - pad.r);
  const Y = (v: number) => H - pad.b - ((v - lo) / (hi - lo)) * (H - pad.t - pad.b);
  const dIoU = prev ? num(cur.iou) - num(prev.iou) : 0;
  const biggest = rows.reduce((b, r, i) => (i > 0 && num(r.iou) - num(rows[i - 1].iou) > b.d ? { i, d: num(r.iou) - num(rows[i - 1].iou) } : b), { i: 0, d: -1 });

  return (
    <div className="sx-lab">
      <Chips
        label="出发点"
        value={path}
        onChange={(p) => {
          setPath(p);
          setStep((p === 'unet' ? TABLE4 : TABLE5).length - 1);
        }}
        options={[
          { value: 'unet', label: '从 U-Net 出发（表 IV）' },
          { value: 'uct', label: '从 UCTransNet 出发（表 V）' },
        ]}
      />
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="sx-chart" role="img" aria-label="逐步加入模块时三项指标的变化">
        <g fontFamily={FONT_SANS}>
          {[76, 80, 84, 88, 92].map((v) => (
            <g key={v}>
              <line x1={pad.l} x2={W - pad.r} y1={Y(v)} y2={Y(v)} className="grid" />
              <text x={pad.l - 8} y={Y(v) + 4} textAnchor="end" className="tick">
                {v}
              </text>
            </g>
          ))}
          {rows.map((r, i) => (
            <g key={i} opacity={i <= s ? 1 : 0.35}>
              <line x1={X(i)} x2={X(i)} y1={pad.t} y2={H - pad.b} stroke={i === s ? C.orange : C.line} strokeDasharray={i === s ? undefined : '2 4'} />
              <text x={X(i)} y={H - pad.b + 20} textAnchor="middle" fontSize={12.5} fill={i === s ? C.orange : C.ink2} fontWeight={i === s ? 700 : 500}>
                {r.step}
              </text>
              <text x={X(i)} y={H - pad.b + 36} textAnchor="middle" fontSize={11} fill={C.muted}>
                {r.add}
              </text>
            </g>
          ))}
          {MET.map((m) => {
            const pts = rows.slice(0, s + 1).map((r, i) => `${i ? 'L' : 'M'}${X(i)},${Y(num(r[m.k]))}`).join(' ');
            return (
              <g key={m.k}>
                <path d={pts} fill="none" stroke={m.color} strokeWidth={2} />
                {rows.slice(0, s + 1).map((r, i) => (
                  <circle key={i} cx={X(i)} cy={Y(num(r[m.k]))} r={i === s ? 5.5 : 3.5} fill={m.color} stroke="#fff" strokeWidth={1.2} />
                ))}
                <text x={X(s) + 10} y={Y(num(cur[m.k])) + 4} fontSize={12} fill={m.color} fontFamily={FONT_MONO}>
                  {cur[m.k]}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      <div className="sx-legend-row light">
        {MET.map((m) => (
          <span className="lg" key={m.k}>
            <i className="dot" style={{ background: m.color }} />
            {m.name}
          </span>
        ))}
        <span className="lg muted">三个数据集的平均值（%）</span>
        {path === 'uct' ? <span className="lg" style={{ color: C.red }}>注意：表 V 末行 F-measure 原文为 90.66，表 IV 同一模型为 90.96</span> : null}
      </div>
      <Stepper step={s} total={rows.length} onStep={setStep} labels={rows.map((r) => r.step)} />
      <Readouts
        cols={3}
        items={MET.map((m) => ({
          k: <>{m.name} 变化</>,
          v: prev ? `${num(cur[m.k]) - num(prev[m.k]) >= 0 ? '+' : '−'}${Math.abs(num(cur[m.k]) - num(prev[m.k])).toFixed(2)}` : '基线',
          unit: prev ? '个百分点' : undefined,
          tone: prev ? 'green' : 'muted',
        }))}
      />
      <Feedback tone={s === biggest.i ? 'good' : 'info'}>
        {s === 0 ? (
          <>基线：{cur.step}。逐步点击“下一步”，每一步只加入一个部件。</>
        ) : s === biggest.i ? (
          <>
            这一步的提升最大：加入 {cur.add} 后平均 IoU 增加 {dIoU.toFixed(2)} 个百分点。
            {path === 'unet' ? '原文据此强调全层信息建模对红外小目标的作用（注意它建立在已加入 RB 与 DS 的基础上）。' : '原文据此认为 SCTB 比原始 CCT 更能拉开目标与背景的语义差异。'}
          </>
        ) : (
          <>加入 {cur.add}：平均 IoU 增加 {dIoU.toFixed(2)} 个百分点。每一步都是在前一步的基础上累加，增量不能直接当作该部件单独的贡献。</>
        )}
      </Feedback>
      <Source>
        数值：表 IV、表 V（p.10），三数据集平均 IoU / nIoU / F-measure，单位 %。原文写的 “提高 4.66%” 等是百分点差值。表 V 最后一行 F-measure 原文为 90.66，与表 II/IV/X 中完整模型的 90.96 不一致，此处照录。消融均为单次结果，原文未报告多次运行的方差。
      </Source>
    </div>
  );
};

// 模块 9.2：超参数与替换实验——性能与代价。

type Group = 'sctb' | 'eta' | 'width' | 'rb' | 'cca';

export const HparamLab: React.FC<WidgetProps> = () => {
  const [g, setG] = useState<Group>('sctb');
  const rows =
    g === 'rb'
      ? TABLE9.map((r, i) => ({ k: `第 ${i + 1} 行 ${r.marks}`, iou: r.iou, niou: r.niou, f: r.f, c1: r.c1, c2: r.c2, chosen: i === 4 }))
      : g === 'cca'
      ? TABLE8.map((r) => ({ k: r.name, iou: r.nuaa[0], niou: r.nuaa[1], f: r.nudt[0], c1: r.params, c2: r.flops, chosen: r.name.startsWith('SCTransNet') }))
      : TABLE10[g].map((r) => ({ ...r, chosen: !!(r as { chosen?: boolean }).chosen }));
  const [pick, setPick] = useState(-1);
  const chosenIdx = rows.findIndex((r) => r.chosen);
  const p = pick >= 0 && pick < rows.length ? pick : chosenIdx;
  const r = rows[p];
  const ref = rows[chosenIdx];
  const isCca = g === 'cca';

  const W = 880;
  const H = 290;
  const pad = { l: 60, r: 60, t: 26, b: 56 };
  const n = rows.length;
  const bw = Math.min(70, (W - pad.l - pad.r) / n - 18);
  const X = (i: number) => pad.l + ((i + 0.5) / n) * (W - pad.l - pad.r);
  const ious = rows.map((x) => num(x.iou));
  const lo = Math.floor(Math.min(...ious) - 0.5);
  const hi = Math.ceil(Math.max(...ious) + 0.3);
  const Y = (v: number) => H - pad.b - ((v - lo) / (hi - lo)) * (H - pad.t - pad.b);
  const cmax = Math.max(...rows.map((x) => Math.max(num(x.c1), num(x.c2))));
  const BY = (v: number) => (v / cmax) * (H - pad.t - pad.b);

  const notes: Record<Group, React.ReactNode> = {
    sctb: <>N 从 1 增到 4，平均 IoU 稳步上升；之后基本持平（N = 5 为 83.40，略低于 N = 4 的 83.43；N = 6 只高 0.02），代价却继续线性增加，因此取 N = 4。原文称性能随 N“稳步提升”，严格说只在 N ≤ 4 时成立。</>,
    eta: <>扩展系数 η = 2.66 最好；η 再大或再小都略差。注意 η = 2.00 的 IoU 反而低于 1.33，变化并不单调。</>,
    width: <>基础宽度 W = 48 比 32 略差，原文归因于参数过多、泛化下降；W 取 32。</>,
    rb: <>残差块越深性能越好。但原表前两行的勾选完全相同、结果不同，正文又说用 “0/1/2/3” 表示深度，表中却标 1–4，所以每一行究竟对应几层残差块无法从原文确定。</>,
    cca: <>把解码端的 CCA 换成 ACM、AGPC、AFFPN 中的跨层融合模块，IoU 与 nIoU 都下降，而参数与计算量都更大。</>,
  };

  return (
    <div className="sx-lab">
      <Chips
        label="研究对象"
        value={g}
        onChange={(v) => {
          setG(v);
          setPick(-1);
        }}
        options={[
          { value: 'sctb', label: 'SCTB 数量（表 X）' },
          { value: 'eta', label: 'CFN 扩展系数 η（表 X）' },
          { value: 'width', label: '基础宽度 W（表 X）' },
          { value: 'rb', label: '残差块（表 IX）' },
          { value: 'cca', label: '解码融合模块（表 VIII）' },
        ]}
      />
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="sx-chart" role="group" aria-label="各设置的性能与代价，可点击柱条">
        <g fontFamily={FONT_SANS}>
          {rows.map((x, i) => (
            <g key={i} className="sx-node" onClick={() => setPick(i)}>
              <rect x={X(i) - bw / 2} y={pad.t} width={bw} height={H - pad.t - pad.b} fill="transparent" />
              <rect x={X(i) - bw / 2} y={H - pad.b - BY(num(x.c1))} width={bw / 2 - 2} height={BY(num(x.c1))} fill={C.line2} opacity={i === p ? 0.95 : 0.55} />
              <rect x={X(i) + 1} y={H - pad.b - BY(num(x.c2))} width={bw / 2 - 2} height={BY(num(x.c2))} fill="#a79f8f" opacity={i === p ? 0.95 : 0.55} />
              <text x={X(i)} y={H - pad.b + 18} textAnchor="middle" fontSize={isCca || g === 'rb' ? 10.5 : 12} fill={i === p ? C.orange : C.ink2} fontWeight={i === p ? 700 : 500}>
                {g === 'rb' ? `第 ${i + 1} 行` : x.k}
              </text>
              {x.chosen ? (
                <text x={X(i)} y={H - pad.b + 34} textAnchor="middle" fontSize={10.5} fill={C.green}>
                  论文采用
                </text>
              ) : null}
            </g>
          ))}
          <path d={rows.map((x, i) => `${i ? 'L' : 'M'}${X(i)},${Y(num(x.iou))}`).join(' ')} fill="none" stroke={C.blue} strokeWidth={2} />
          {rows.map((x, i) => (
            <g key={i}>
              <circle cx={X(i)} cy={Y(num(x.iou))} r={i === p ? 6.5 : 4.5} fill={x.chosen ? C.green : i === p ? C.orange : C.blue} stroke="#fff" strokeWidth={1.4} />
              <text x={X(i)} y={Y(num(x.iou)) - 11} textAnchor="middle" fontSize={11.5} fill={C.ink} fontFamily={FONT_MONO}>
                {x.iou}
              </text>
            </g>
          ))}
          <text x={pad.l - 10} y={pad.t - 8} textAnchor="start" fontSize={11} fill={C.blue}>
            {isCca ? '折线：NUAA-SIRST 上的 IoU（%）' : '折线：三数据集平均 IoU（%）'}
          </text>
          <text x={W - pad.r + 10} y={pad.t - 8} textAnchor="end" fontSize={11} fill={C.muted}>
            柱：两列代价（见下方说明）
          </text>
        </g>
      </svg>
      <Readouts
        cols={4}
        items={[
          { k: '所选设置', v: g === 'rb' ? `第 ${p + 1} 行` : r.k, tone: 'orange' },
          { k: isCca ? 'NUAA IoU / nIoU' : '平均 IoU / nIoU', v: `${r.iou} / ${r.niou}` },
          { k: isCca ? 'NUDT IoU' : '平均 F-measure', v: r.f },
          { k: isCca ? '参数 M / 计算量 G' : '代价两列（原表顺序）', v: <span style={{ fontFamily: FONT_MONO }}>{r.c1} / {r.c2}</span>, tone: 'muted' },
        ]}
      />
      <Feedback tone={p === chosenIdx ? 'good' : num(r.iou) < num(ref.iou) ? 'bad' : 'info'}>
        {p === chosenIdx ? notes[g] : <>与论文采用的设置相比，IoU {num(r.iou) - num(ref.iou) >= 0 ? '+' : '−'}{Math.abs(num(r.iou) - num(ref.iou)).toFixed(2)} 个百分点。{notes[g]}</>}
      </Feedback>
      <Source>
        {isCca ? (
          <>表 VIII（p.12）只报告 NUAA-SIRST 与 NUDT-SIRST 的 IoU / nIoU（%），柱为参数量（M，浅）与计算量（G，深）。</>
        ) : (
          <>
            表 IX（p.12）、表 X（p.13）。核对：这两张表把两列代价标为 Params(M)、Flops(G)，完整模型对应 20.2372、11.1905；而表 II/VII/VIII 中完整模型为 11.19 M 参数、20.24 G 计算量。两处列名疑似互换，这里只按原表顺序称为“第一列 / 第二列”（柱的浅色 / 深色）。
          </>
        )}
      </Source>
    </div>
  );
};
