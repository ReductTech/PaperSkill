import React, { useEffect, useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, Chips, Readouts, Feedback, Source, FONT_SANS, FONT_MONO, PaperImage } from './kit';
import { TABLE1, TABLE2, TABLE3, TABLE3_METHODS, DATASETS, DatasetKey, num } from './paper-data';

// 模块 10.1：表 I 与表 III 的交互读法。选择数据集与指标后点击“开始比较”，横条按作者报告值依次生长（P8）；
// 或切换到 Pd–Fa 平面，查看哪些方法在“检出率高、虚警低”两方面都不被其他方法同时超过。

type MKey = 'iou' | 'niou' | 'f' | 'pd' | 'fa' | 'a05' | 'a1';
const MDEF: Record<MKey, { name: string; unit: string; hb: boolean; idx?: number; table: string }> = {
  iou: { name: 'IoU', unit: '%', hb: true, idx: 0, table: '表 I' },
  niou: { name: 'nIoU', unit: '%', hb: true, idx: 1, table: '表 I' },
  f: { name: 'F-measure', unit: '%', hb: true, idx: 2, table: '表 I' },
  pd: { name: 'Pd', unit: '%', hb: true, idx: 3, table: '表 I' },
  fa: { name: 'Fa', unit: '×10⁻⁶', hb: false, idx: 4, table: '表 I' },
  a05: { name: 'AUC（Fa ≤ 0.5×10⁻⁶）', unit: '', hb: true, table: '表 III' },
  a1: { name: 'AUC（Fa ≤ 1×10⁻⁶）', unit: '', hb: true, table: '表 III' },
};

export const ResultsLab: React.FC<WidgetProps> = () => {
  const [ds, setDs] = useState<DatasetKey>('nudt');
  const [m, setM] = useState<MKey>('fa');
  const [scope, setScope] = useState<'learn' | 'all'>('learn');
  const [view, setView] = useState<'rank' | 'plane' | 'cost'>('rank');
  const [run, setRun] = useState(0);
  const [t, setT] = useState(1);
  const def = MDEF[m];
  const isAuc = m === 'a05' || m === 'a1';
  const effScope = isAuc ? 'learn' : scope;

  useEffect(() => {
    if (run === 0) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const u = Math.min(1, (now - t0) / 1400);
      setT(1 - Math.pow(1 - u, 3));
      if (u < 1) raf = requestAnimationFrame(tick);
    };
    setT(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run]);

  const rows = useMemo(() => {
    let r: { name: string; v: string; kind: string }[];
    if (isAuc) {
      r = TABLE3_METHODS.map((name, i) => ({ name, v: TABLE3[ds][m as 'a05' | 'a1'][i], kind: name === 'SCTransNet' ? 'ours' : 'learn' }));
    } else {
      r = TABLE1.filter((x) => effScope === 'all' || x.kind !== 'trad').map((x) => ({ name: x.name, v: x[ds][def.idx as number], kind: x.kind }));
    }
    return r.sort((a, b) => (def.hb ? num(b.v) - num(a.v) : num(a.v) - num(b.v)));
  }, [ds, m, effScope, isAuc, def]);

  const best = rows[0];
  const ours = rows.find((r) => r.name === 'SCTransNet') as { name: string; v: string; kind: string };
  const rank = rows.indexOf(ours) + 1;
  const second = rows.find((r) => r.name !== best.name) as { v: string; name: string };
  const logScale = m === 'fa' && effScope === 'all';
  const vmax = Math.max(...rows.map((r) => num(r.v)));
  const vmin = Math.min(...rows.map((r) => num(r.v)));
  const base = logScale || isAuc || m === 'fa' || effScope === 'all' ? 0 : Math.max(0, Math.floor((vmin - 5) / 5) * 5);
  const frac = (v: number) => {
    if (logScale) return (Math.log10(v) - Math.log10(1)) / (Math.log10(vmax * 1.1) - Math.log10(1));
    if (isAuc) return v;
    if (m === 'fa') return v / (vmax * 1.05);
    return (v - base) / (100 - base);
  };

  // Pd–Fa 平面（只含学习方法）
  const plane = TABLE1.filter((x) => x.kind !== 'trad').map((x) => ({ name: x.name, pd: num(x[ds][3]), fa: num(x[ds][4]), kind: x.kind }));
  const pareto = plane.filter((a) => !plane.some((b) => b !== a && b.pd >= a.pd && b.fa <= a.fa && (b.pd > a.pd || b.fa < a.fa)));
  const PW = 860;
  const PH = 360;
  const pp = { l: 60, r: 30, t: 20, b: 46 };
  const faMax = Math.max(...plane.map((p) => p.fa)) * 1.08;
  const pdMin = Math.floor(Math.min(...plane.map((p) => p.pd)) - 1);
  const pdMax = 100;
  const PX = (fa: number) => pp.l + (fa / faMax) * (PW - pp.l - pp.r);
  const PY = (pd: number) => PH - pp.b - ((pd - pdMin) / (pdMax - pdMin)) * (PH - pp.t - pp.b);

  const dsName = DATASETS.find((d) => d.key === ds)?.name;
  let fb: { tone: 'good' | 'bad' | 'info'; text: React.ReactNode };
  if (view === 'cost') {
    fb = {
      tone: 'info',
      text: (
        <>
          SCTransNet 的参数量约为 UIU-Net 的 22%，计算量约为 37%，三项平均指标都更高；比 DNA-Net 多约 6.5 M 参数、6 G 计算量。注意：表 II 的“平均” IoU（83.43）不等于表 I 三个数据集 IoU 的算术平均（(77.50 + 94.09 + 68.03) / 3 ≈ 79.87），原文没有说明计算方式；计算量对应的输入尺寸也未写明，原文没有报告推理速度。
        </>
      ),
    };
  } else if (view === 'plane') {
    const names = pareto.map((p) => p.name).join('、');
    fb = {
      tone: 'info',
      text: (
        <>
          在 {dsName} 上，没有被其他方法在 Pd 与 Fa 两方面同时超过的方法是：<b>{names}</b>（连线标出）。固定阈值下单看一个指标并不能决定优劣；表 III 报告的 AUC 为 ROC 比较提供补充，具体积分与归一化方式原文未说明。
        </>
      ),
    };
  } else if (best.name === 'SCTransNet') {
    const gap = Math.abs(num(ours.v) - num(second.v));
    fb = {
      tone: 'good',
      text: (
        <>
          SCTransNet 在 {dsName} 的 {def.name} 上排第 1：{ours.v}{def.unit && def.unit !== '%' ? ` ${def.unit}` : def.unit}，第 2 名 {second.name} 为 {second.v}，相差 {gap.toFixed(isAuc ? 4 : 2)}
          {isAuc ? '' : def.unit === '%' ? ' 个百分点' : ''}。
        </>
      ),
    };
  } else {
    fb = {
      tone: 'bad',
      text: (
        <>
          这一项 SCTransNet 不是最好：排第 {rank}（{ours.v}），最好的是 {best.name}（{best.v}）。原文也承认 Pd 与 Fa 并非全部最优，并以 F-measure 说明它在两者间取得了更好的平衡。
        </>
      ),
    };
  }

  return (
    <div className="sx-lab">
      <div className="sx-chip-rows">
        <Chips label="数据集" value={ds} onChange={(v) => { setDs(v); setRun((r) => r + 1); }} options={DATASETS.map((d) => ({ value: d.key, label: d.name }))} />
        <Chips label="视图" value={view} onChange={setView} options={[{ value: 'rank', label: '逐指标排名' }, { value: 'plane', label: 'Pd–Fa 平面' }, { value: 'cost', label: '代价（表 II）' }]} />
      </div>
      {view === 'rank' ? (
        <>
          <div className="sx-chip-rows">
            <Chips
              label="指标"
              value={m}
              onChange={(v) => { setM(v); setRun((r) => r + 1); }}
              options={(Object.keys(MDEF) as MKey[]).map((k) => ({ value: k, label: `${MDEF[k].name} ${MDEF[k].hb ? '↑' : '↓'}` }))}
            />
            <Chips
              label="范围"
              value={effScope}
              onChange={(v) => { setScope(v); setRun((r) => r + 1); }}
              options={[
                { value: 'learn', label: '学习方法（10）' },
                { value: 'all', label: '含传统方法（17）', disabled: isAuc, title: isAuc ? '表 III 只含学习方法' : undefined },
              ]}
            />
            <button type="button" className="tiny" onClick={() => setRun((r) => r + 1)}>
              开始比较
            </button>
          </div>
          <div className="res-bars" role="img" aria-label={`${dsName} 上各方法的 ${def.name}`}>
            {rows.map((r, i) => {
              const f = Math.max(0.004, Math.min(1, frac(num(r.v)))) * t;
              const cls = r.kind === 'ours' ? 'ours' : r.kind === 'trad' ? 'trad' : i === 0 ? 'best' : '';
              return (
                <div className={`res-row ${cls}`} key={r.name}>
                  <span className="res-rank">{i + 1}</span>
                  <span className="res-name">{r.name}</span>
                  <div className="res-track">
                    <div className="res-fill" style={{ width: `${f * 100}%` }} />
                  </div>
                  <span className="res-val">{r.v}</span>
                </div>
              );
            })}
          </div>
          <div className="sx-legend-row light">
            <span className="lg"><i className="dot" style={{ background: C.green }} />SCTransNet</span>
            <span className="lg"><i className="dot" style={{ background: C.blue }} />该项第一（若非 SCTransNet）</span>
            <span className="lg"><i className="dot" style={{ background: '#d8d3c8' }} />传统方法</span>
            <span className="lg muted">
              {def.name} {def.hb ? '越高越好' : '越低越好'}
              {def.unit ? `，单位 ${def.unit}` : ''}
              {logScale ? '；横条为对数长度' : base > 0 ? `；横条从 ${base} 起` : ''}
            </span>
          </div>
        </>
      ) : view === 'cost' ? (
        <table className="sx-costtab">
          <thead>
            <tr>
              <th>模型</th>
              <th>参数量（M）</th>
              <th>计算量（G）</th>
              <th>平均 IoU</th>
              <th>平均 nIoU</th>
              <th>平均 F</th>
            </tr>
          </thead>
          <tbody>
            {TABLE2.map((r) => (
              <tr key={r.name} className={r.name === 'SCTransNet' ? 'ours' : ''}>
                <th>{r.name}</th>
                {(['params', 'flops'] as const).map((k) => (
                  <td key={k}>
                    <div className="ct-bar">
                      <i style={{ width: `${(num(r[k]) / (k === 'params' ? 50.54 : 54.42)) * 100}%` }} />
                    </div>
                    <span>{r[k]}</span>
                  </td>
                ))}
                <td className="num">{r.iou}</td>
                <td className="num">{r.niou}</td>
                <td className="num">{r.f}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <svg viewBox={`0 0 ${PW} ${PH}`} width="100%" className="sx-chart" role="img" aria-label={`${dsName} 上学习方法的 Pd 与 Fa`}>
          <g fontFamily={FONT_SANS}>
            {Array.from({ length: 5 }, (_, k) => pdMin + ((pdMax - pdMin) * k) / 4).map((v) => (
              <g key={v}>
                <line x1={pp.l} x2={PW - pp.r} y1={PY(v)} y2={PY(v)} className="grid" />
                <text x={pp.l - 8} y={PY(v) + 4} textAnchor="end" className="tick">
                  {v.toFixed(0)}
                </text>
              </g>
            ))}
            {Array.from({ length: 5 }, (_, k) => (faMax * k) / 4).map((v) => (
              <text key={v} x={PX(v)} y={PH - pp.b + 18} textAnchor="middle" className="tick">
                {v.toFixed(0)}
              </text>
            ))}
            <text x={(pp.l + PW - pp.r) / 2} y={PH - 6} textAnchor="middle" className="axis">
              Fa（×10⁻⁶，越低越好 ←）
            </text>
            <text x={16} y={(pp.t + PH - pp.b) / 2} textAnchor="middle" className="axis" transform={`rotate(-90 16 ${(pp.t + PH - pp.b) / 2})`}>
              Pd（%，越高越好 ↑）
            </text>
            <path
              d={pareto
                .slice()
                .sort((a, b) => a.fa - b.fa)
                .map((p, i) => `${i ? 'L' : 'M'}${PX(p.fa)},${PY(p.pd)}`)
                .join(' ')}
              fill="none"
              stroke={C.orange}
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
            {(() => {
              // 简单的标签避让：按 Pd 从高到低放置，若与已放置的标签重叠，则依次尝试下移、上移或放到点的左侧
              const placed: { x: number; y: number; w: number }[] = [];
              const items = plane
                .slice()
                .sort((a, b) => b.pd - a.pd)
                .map((p) => {
                  const w = p.name.length * 7.2 + 4;
                  const px = PX(p.fa);
                  const py = PY(p.pd);
                  const cands = [
                    { x: px + 9, y: py + 4, a: 'start' },
                    { x: px + 9, y: py + 17, a: 'start' },
                    { x: px + 9, y: py - 9, a: 'start' },
                    { x: px - 9, y: py + 4, a: 'end' },
                    { x: px - 9, y: py + 17, a: 'end' },
                  ];
                  const hit = (c: { x: number; y: number; a: string }) => {
                    const x0 = c.a === 'start' ? c.x : c.x - w;
                    return placed.some((q) => Math.abs(q.y - c.y) < 13 && x0 < q.x + q.w && x0 + w > q.x);
                  };
                  const c = cands.find((k) => !hit(k)) ?? cands[0];
                  placed.push({ x: c.a === 'start' ? c.x : c.x - w, y: c.y, w });
                  return { p, c };
                });
              return items.map(({ p, c }) => {
                const onF = pareto.includes(p);
                const ours = p.kind === 'ours';
                return (
                  <g key={p.name}>
                    <circle cx={PX(p.fa)} cy={PY(p.pd)} r={ours ? 7 : 5} fill={ours ? C.green : onF ? C.orange : '#b9b2a4'} stroke="#fff" strokeWidth={1.4} />
                    <text x={c.x} y={c.y} textAnchor={c.a as 'start' | 'end'} fontSize={11.5} fill={ours ? C.green : C.ink2} fontWeight={ours ? 700 : 500}>
                      {p.name}
                    </text>
                  </g>
                );
              });
            })()}
          </g>
        </svg>
      )}
      <Readouts
        cols={3}
        items={
          view === 'cost'
            ? [
                { k: '参数量 / UIU-Net', v: ((11.19 / 50.54) * 100).toFixed(0), unit: '%', tone: 'green' },
                { k: '计算量 / UIU-Net', v: ((20.24 / 54.42) * 100).toFixed(0), unit: '%', tone: 'green' },
                { k: '表 I 三数据集 IoU 算术平均', v: ((77.5 + 94.09 + 68.03) / 3).toFixed(2), unit: '%', tone: 'muted' },
              ]
            : view === 'rank'
            ? [
                { k: 'SCTransNet 排名', v: `${rank} / ${rows.length}`, tone: rank === 1 ? 'green' : 'red' },
                { k: 'SCTransNet', v: ours.v, unit: def.unit === '%' ? '%' : def.unit ? ` ${def.unit}` : undefined },
                { k: '该项第一', v: best.name, tone: best.name === 'SCTransNet' ? 'green' : 'blue' },
              ]
            : [
                { k: 'SCTransNet Pd', v: TABLE1[16][ds][3], unit: '%' },
                { k: 'SCTransNet Fa', v: TABLE1[16][ds][4], unit: '×10⁻⁶' },
                { k: '前沿上的方法数', v: pareto.length, tone: 'orange' },
              ]
        }
      />
      <Feedback tone={fb.tone}>{fb.text}</Feedback>
      <details className="sx-details">
        <summary>查看原文图 5（三个数据集上的 ROC 曲线）</summary>
        <PaperImage src="./images/fig5.jpg" alt="原文图 5：ROC 曲线" caption="原文图 5（p.7）：横轴 Fa（×10⁻⁶，截至 1），纵轴 Pd。表 III 报告 Fa ≤ 0.5×10⁻⁶ 与 ≤ 1×10⁻⁶ 对应的两档 AUC；具体积分与归一化方式原文未说明，不能把这些数直接解释为该横轴上的未归一化面积。" />
      </details>
      <Source>
        数值：表 I（p.6）、表 II（p.6）与表 III（p.7），均为作者报告值。SCTransNet 用固定阈值 0.5，对比方法按各自原论文的固定阈值；学习方法均在相同训练集上重新训练（§IV-B）。表 I 的列名写作 mIoU，正文称 IoU。Pd 以目标为单位（质心偏差小于 3 像素算命中），Fa 以像素为单位（式 21、22）。“前沿”是本导读按表 I 两列数值做的比较，不是论文的分析。
      </Source>
    </div>
  );
};

// 模块 10.2：逐例看检测结果（原文图 6 与图 12）。

type Fig = 'f6' | 'f12';
const F6_METHODS = ['Top-Hat', 'TTLCM', 'ACM', 'DNA-Net', 'UIU-Net', 'SCTransNet'];
const F12_METHODS = ['ACM', 'RDIAN', 'DNA-Net', 'UIU-Net', 'MTU-Net', 'SCTransNet'];
const F6_DS = ['NUAA-SIRST', 'NUAA-SIRST', 'NUDT-SIRST', 'NUDT-SIRST', 'IRSTD-1K', 'IRSTD-1K'];
const F6_NOTE: Record<number, string> = {
  2: '原文：只有 SCTransNet 把两个相距很近的目标分开，其他深度学习方法倾向于把它们合并成一个。',
  4: '原文：只有 SCTransNet 准确地把无人机的形状从山体背景中分离出来，作者归因于它对背景整体连续性的建模。',
  6: '原文：除 SCTransNet 与 DNA-Net 外，其余方法都在草丛中的石头上产生了虚警，作者归因于它们只建立局部对比、缺少长距离依赖。',
};
const F12_NOTE: Record<number, string> = {
  1: '原文：真实条纹噪声破坏了目标的局部邻域信息；在这幅图中只有 SCTransNet 准确检出了两个目标，其他方法出现漏检或虚警。',
  2: '原文：条纹图像中还有一块盲元，干扰了对建筑的语义理解，ACM、RDIAN 与 MTU-Net 在盲元附近产生虚警。',
};

export const CasesLab: React.FC<WidgetProps> = () => {
  const [fig, setFig] = useState<Fig>('f6');
  const [scene, setScene] = useState(2);
  const [meth, setMeth] = useState('UIU-Net');
  const methods = fig === 'f6' ? F6_METHODS : F12_METHODS;
  const mm = methods.includes(meth) ? meth : methods[0];
  const src = (col: number) => (fig === 'f6' ? `./images/fig6-r${scene}-c${col}.jpg` : `./images/fig12-${scene}-${col}.jpg`);
  const colOf = (name: string) => (fig === 'f6' ? F6_METHODS.indexOf(name) + 1 : F12_METHODS.indexOf(name) + 1);
  const note = fig === 'f6' ? F6_NOTE[scene] : F12_NOTE[scene];
  return (
    <div className="sx-lab">
      <div className="sx-chip-rows">
        <Chips
          label="图"
          value={fig}
          onChange={(f) => {
            setFig(f);
            setScene(f === 'f6' ? 2 : 1);
          }}
          options={[
            { value: 'f6', label: '图 6：三个数据集' },
            { value: 'f12', label: '图 12：真实条纹噪声' },
          ]}
        />
        <Chips
          label="场景"
          value={scene}
          onChange={setScene}
          options={(fig === 'f6' ? [1, 2, 3, 4, 5, 6] : [1, 2]).map((k) => ({ value: k, label: `(${k})` }))}
        />
      </div>
      <Chips label="对照方法" value={mm} onChange={setMeth} options={methods.filter((x) => x !== 'SCTransNet').map((x) => ({ value: x, label: x }))} />
      <div className="case-grid">
        {[
          { t: '输入', s: src(0), cls: '' },
          { t: mm, s: src(colOf(mm)), cls: 'other' },
          { t: 'SCTransNet', s: src(colOf('SCTransNet')), cls: 'ours' },
          { t: '真值', s: src(7), cls: '' },
        ].map((p) => (
          <figure key={p.t} className={`case-cell ${p.cls}`}>
            <img src={p.s} alt={`${p.t}，原文${fig === 'f6' ? '图 6' : '图 12'} 场景 (${scene})`} />
            <figcaption>{p.t}</figcaption>
          </figure>
        ))}
      </div>
      <div className="sx-legend-row light">
        <span className="lg"><i className="ring" style={{ borderColor: '#2aa3e0' }} />正确检出</span>
        <span className="lg"><i className="ring" style={{ borderColor: '#e6c200' }} />漏检</span>
        <span className="lg"><i className="ring" style={{ borderColor: '#e0302a' }} />虚警</span>
        <span className="lg muted">圆圈颜色为原图约定</span>
      </div>
      <Feedback tone={note ? 'info' : 'info'}>
        {note ?? (fig === 'f6' ? `场景 (${scene}) 来自 ${F6_DS[scene - 1]}。原文对这一行没有单独评论；总体上，Top-Hat 与 TTLCM 等传统方法常出现较多虚警与漏检，即使检出目标，轮廓也往往不清晰。` : '')}
      </Feedback>
      <Source>
        图像裁自原文图 6（p.8）与图 12（p.13），均为作者挑选的定性示例。图 12 只有两幅真实条纹噪声图像，不是按噪声强度系统测试的鲁棒性实验。
      </Source>
    </div>
  );
};
