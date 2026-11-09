import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

const METHODS = ['RRDB', 'ESRGAN', 'RealSR-DPED', 'BSRNet', 'BSRGAN'];
const OURS = new Set(['BSRNet', 'BSRGAN']);
const TYPES = [
  { key: 'Type I', label: 'I 双三次', note: '既有基准' },
  { key: 'Type II', label: 'II 模糊 + 最近邻 ×4', note: '' },
  { key: 'Type III', label: 'III 两段下采样 + JPEG', note: '' },
  { key: 'Type IV', label: 'IV 本文退化', note: '本文主张' },
];

// Rows = degradation type (I–IV), columns = method. Values from paper Table 1.
const PSNR = [
  [30.89, 28.16, 21.72, 29.07, 27.30],
  [25.66, 25.56, 26.29, 27.76, 26.26],
  [26.70, 26.21, 22.82, 27.59, 26.28],
  [24.03, 23.68, 22.97, 25.67, 24.58],
];
const LPIPS = [
  [0.254, 0.115, 0.312, 0.331, 0.236],
  [0.542, 0.526, 0.263, 0.397, 0.284],
  [0.517, 0.436, 0.379, 0.419, 0.284],
  [0.659, 0.599, 0.528, 0.506, 0.361],
];

const STEPS = [
  { id: 1, label: '① 按行读', hint: '同一种退化里谁最好' },
  { id: 2, label: '② 按列读', hint: '同一方法换退化还稳不稳' },
  { id: 3, label: '③ 看整体', hint: '能否一个模型打四类' },
] as const;

const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

export function Ch4ReadTable(_props: WidgetProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [row, setRow] = useState(0);
  const [col, setCol] = useState(0);

  const rowBest = useMemo(() => PSNR.map((values) => {
    const order = values.map((value, index) => ({ value, index })).sort((a, b) => b.value - a.value);
    return { best: order[0].index, second: order[1].index };
  }), []);
  const rowBestLpips = useMemo(() => LPIPS.map((values) => {
    const order = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
    return { best: order[0].index, second: order[1].index };
  }), []);

  const avgPsnr = METHODS.map((_, index) => mean(PSNR.map((values) => values[index])));
  const avgLpips = METHODS.map((_, index) => mean(LPIPS.map((values) => values[index])));
  const psnrOrder = avgPsnr.map((value, index) => ({ value, index })).sort((a, b) => b.value - a.value);
  const lpipsOrder = avgLpips.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
  const bestPsnr = psnrOrder[0].index;
  const bestLpips = lpipsOrder[0].index;

  const rowText = [
    `Type I 是双三次：双三次训练的 ${METHODS[rowBest[0].best]}（${PSNR[0][rowBest[0].best].toFixed(2)} dB）与 ${METHODS[rowBestLpips[0].best]}（LPIPS ${LPIPS[0][rowBestLpips[0].best].toFixed(3)}）领先。这一步是自检：基准没坏，既有结论能复现。`,
    'Type II 换了各向异性模糊 + 最近邻 ×4：双三次训练的 RRDB/ESRGAN 开始掉队，BSRNet 拿到最高 PSNR，LPIPS 最优是本来就训练过这类退化的 RealSR-DPED。',
    'Type III 是两段下采样加 JPEG：双三次训练的模型继续掉，BSRNet 的 PSNR 仍最高，BSRGAN 的 LPIPS 反超所有对比方法。',
    'Type IV 是本文退化：BSRNet 的 PSNR 与 BSRGAN 的 LPIPS 都是全场最优，说明用同一套退化训练出的模型能同时压住四类。',
  ][row];

  const colText = (() => {
    const method = METHODS[col];
    const first = PSNR[0][col];
    const last = PSNR[3][col];
    const drop = (first - last).toFixed(2);
    const lp = `LPIPS ${LPIPS[0][col].toFixed(3)} → ${LPIPS[3][col].toFixed(3)}`;
    if (OURS.has(method)) {
      const rival = PSNR[3]
        .map((value, index) => ({ value, index }))
        .filter((item) => !OURS.has(METHODS[item.index]))
        .sort((a, b) => b.value - a.value)[0];
      const gap = (last - rival.value).toFixed(2);
      return `${method} 从 Type I 的 ${first.toFixed(2)} dB 到 Type IV 的 ${last.toFixed(2)} dB（−${drop} dB，每类都在降），${lp}；即使最难的 Type IV，它也比最好的对比方法（${METHODS[rival.index]} ${rival.value.toFixed(2)} dB）高 ${gap} dB。稳定来自退化覆盖够宽，不是某一类特调。`;
    }
    return `${method} 从 Type I 的 ${first.toFixed(2)} dB 掉到 Type IV 的 ${last.toFixed(2)} dB（−${drop} dB），${lp}。读列看的就是这件事：它只在训练过的那一类退化上可靠。`;
  })();

  return (
    <div className="bsr-ch4-read">
      <section className="bsr-read-table">
        <div className="bsr-panel-head">
          <span>表 1 的读法：行 = 退化类型，列 = 方法</span>
          <b>每格：上 PSNR↑ / 下 LPIPS↓</b>
        </div>
        <table className="bsr-read-grid">
          <thead>
            <tr>
              <th scope="col">退化类型</th>
              {METHODS.map((method, index) => (
                <th scope="col" key={method}>
                  <button
                    className={`bsr-read-col ${step === 2 && col === index ? 'is-on' : ''} ${OURS.has(method) ? 'is-ours' : ''}`}
                    aria-pressed={step === 2 && col === index}
                    onClick={() => { setStep(2); setCol(index); }}
                  >
                    {method}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TYPES.map((type, r) => (
              <tr key={type.key} className={step === 1 && row === r ? 'is-row' : ''}>
                <th scope="row">
                  <button
                    className={`bsr-read-row ${step === 1 && row === r ? 'is-on' : ''}`}
                    aria-pressed={step === 1 && row === r}
                    onClick={() => { setStep(1); setRow(r); }}
                  >
                    <span>{type.label}</span>
                    {type.note ? <em>{type.note}</em> : null}
                  </button>
                </th>
                {METHODS.map((method, c) => {
                  const isBest = rowBest[r].best === c;
                  const isSecond = rowBest[r].second === c;
                  const isBestLp = rowBestLpips[r].best === c;
                  const isSecondLp = rowBestLpips[r].second === c;
                  return (
                    <td
                      key={method}
                      className={`${step === 2 && col === c ? 'is-col' : ''} ${OURS.has(method) ? 'is-ours' : ''} ${step === 3 && (c === bestPsnr || c === bestLpips) ? 'is-col' : ''}`}
                    >
                      <b className={isBest ? 'is-best' : isSecond ? 'is-second' : ''}>{PSNR[r][c].toFixed(2)}</b>
                      <i className={isBestLp ? 'is-best' : isSecondLp ? 'is-second' : ''}>{LPIPS[r][c].toFixed(3)}</i>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="bsr-read-legend">
          每格上行 PSNR（Y 通道，越高越好）、下行 LPIPS（越低越好）。<b className="is-best">绿</b> = 该行该指标最优、<b className="is-second">蓝</b> = 次优；论文原表用红/蓝，本教程红色专表失败，故最优点改绿。BSRNet / BSRGAN 为本文模型。
        </p>
      </section>

      <aside className="bsr-read-side">
        <div className="bsr-read-steps" role="group" aria-label="读表步骤">
          {STEPS.map((item) => (
            <button
              key={item.id}
              className={step === item.id ? 'is-on' : ''}
              aria-pressed={step === item.id}
              onClick={() => setStep(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="bsr-read-hint">{STEPS[step - 1].hint}</p>

        {step === 1 ? (
          <>
            <p className="bsr-read-pick">选类型（点左侧行标题）：<b>{TYPES[row].label}</b></p>
            <p className="bsr-feedback is-blue">{rowText}</p>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <p className="bsr-read-pick">选一个方法（点表头）：<b>{METHODS[col]}</b></p>
            <p className="bsr-feedback is-blue">{colText}</p>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <p className="bsr-read-pick">把 5 个方法在四类上取平均（本页现算）：</p>
            <div className="bsr-read-avg">
              <div>
                <span>平均 PSNR ↑</span>
                <b className={bestPsnr === 3 ? 'is-best' : ''}>{METHODS[bestPsnr]} {avgPsnr[bestPsnr].toFixed(2)}</b>
                <em>次优：{METHODS[psnrOrder[1].index]} {psnrOrder[1].value.toFixed(2)}</em>
              </div>
              <div>
                <span>平均 LPIPS ↓</span>
                <b className={bestLpips === 4 ? 'is-best' : ''}>{METHODS[bestLpips]} {avgLpips[bestLpips].toFixed(3)}</b>
                <em>次优：{METHODS[lpipsOrder[1].index]} {lpipsOrder[1].value.toFixed(3)}</em>
              </div>
            </div>
            <p className="bsr-feedback is-green">
              结论：本页 5 个方法里，BSRNet 平均 PSNR 最高、BSRGAN 平均 LPIPS 最低——一个模型同时压住四类退化，不是某一类特调出来的。
            </p>
          </>
        ) : null}

        <p className="bsr-read-note">
          表 1 共 9 个方法，本页只保留 5 个便于读表；平均值为本页现算，论文只写 “best overall”，未给数字。
        </p>

      </aside>
    </div>
  );
}
