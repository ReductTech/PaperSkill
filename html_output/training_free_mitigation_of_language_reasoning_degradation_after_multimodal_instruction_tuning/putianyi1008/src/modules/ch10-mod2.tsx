import React, { useState } from 'react';
import { C, stage, num, legend, useStudioCanvas } from './studiokit';

const W = 1080;
const H = 280;

// Paper Table 2 (page 9): columns in the paper's order, three rows.
// All row/column names live in the DOM below; the canvas carries no prose.
const COLS = ['Hella', 'MMLU', 'CQA', 'Wino', 'ARC-E', 'Race-H', 'OBQA', 'GSM8k'];
const ROWS: Array<{ name: string; color: string; vals: number[] }> = [
  {
    name: '基座 Mistral',
    color: C.blue,
    vals: [0.6602, 0.5901, 0.6683, 0.7371, 0.813, 0.4612, 0.356, 0.395],
  },
  {
    name: '未合并',
    color: C.red,
    vals: [0.5971, 0.5783, 0.7215, 0.712, 0.782, 0.4459, 0.314, 0.3282],
  },
  {
    name: '合并 α=0.1',
    color: C.green,
    vals: [0.6424, 0.5931, 0.7403, 0.7285, 0.8282, 0.4411, 0.342, 0.4306],
  },
];

const LIMITS = [
  '论文未给出 K 的具体取值',
  '论文未给出 α 的最优值',
  '论文未报告显著性检验',
  '视觉侧有 2 项（MME Cognition / Perception）下降',
];

export const Ch10Mod2: React.FC = () => {
  const [tab, setTab] = useState<'table' | 'limits'>('table');
  const [col, setCol] = useState(7);
  const [fb, setFb] = useState<{ t: string; c: string }>({
    t: '逐列核对：α=0.1 在 8 列中的 7 列上高于未合并模型，只有 Race-H 略低；GSM8k 提升最明显。',
    c: 'good',
  });

  const ref = useStudioCanvas(W, H, (ctx) => {
    stage(ctx, W, H);

    if (tab === 'table') {
      // 8 columns x 3 rows of bars on a 1080x280 canvas; one shared vertical scale
      // so rows stay comparable (no per-row normalisation).
      //
      // Geometry, with the worst case being the tallest value in the whole table,
      // v = 0.8282 (ARC-E of the merged row):
      //   maxH = 0.8282 * 62 = 51.3
      //   topmost row bar top: y = 62 - 51.3 = 10.7 >= 0        -> no bar is clipped
      //   row pitch = 137 - 62 = 75 >= maxH + 21 = 72.3          -> a bar never reaches
      //                                                             the caption of the
      //                                                             row below it
      //   lowest caption baseline = 212 + 15 = 227 <= 280        -> captions stay inside
      // The 21px allowance covers the 12px caption text plus its gap above the next
      // baseline, so bar tops and the captions of the row below never overlap
      // (num() draws bare fillText with no backing plate).
      const left = 130;
      const colW = 112;
      const baselines = [62, 137, 212];
      const barScale = 62;
      // The row identity is carried by the legend as well as by the DOM table,
      // so the chart never relies on colour alone.
      const rowColors = [C.blue, C.red, C.green];
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2.5;
      // The selection frame spans from just above the tallest possible bar top
      // (10.7) to just below the lowest caption (227).
      ctx.strokeRect(left + col * colW - 8, 4, colW - 6, 236);
      ROWS.forEach((r, ri) => {
        const base = baselines[ri];
        r.vals.forEach((v, ci) => {
          const h = v * barScale;
          ctx.fillStyle = r.color;
          ctx.fillRect(left + ci * colW, base - h, colW - 26, h);
          num(ctx, left + ci * colW + (colW - 26) / 2, base + 15, v, r.color, 12, 'center');
        });
      });
      legend(ctx, 150, 22, [
        ['基座', rowColors[0]],
        ['未合并', rowColors[1]],
        ['合并', rowColors[2]],
      ]);
    } else {
      // Qualitative limitation severity: dots plus graduated bars, no prose.
      LIMITS.forEach((_, i) => {
        const y = 62 + i * 46;
        ctx.beginPath();
        ctx.arc(160, y, 9, 0, Math.PI * 2);
        ctx.fillStyle = i < 3 ? C.orange : C.red;
        ctx.fill();
        ctx.fillStyle = C.axis;
        ctx.fillRect(200, y - 6, 520, 12);
        ctx.fillStyle = i < 3 ? C.orange : C.red;
        ctx.fillRect(200, y - 6, 520 - i * 70, 12);
      });
    }
  });

  const pick = (t: 'table' | 'limits') => {
    setTab(t);
    setFb(
      t === 'table'
        ? {
            t: '逐列核对：α=0.1 在 8 列中的 7 列上高于未合并模型，只有 Race-H 略低；GSM8k 提升最明显。',
            c: 'good',
          }
        : {
            t: '论文未给出 K 的取值、未给出 α 的最优值、未做显著性检验，视觉侧还有 2 项下降——这些都是使用前必须知道的边界。',
            c: 'bad',
          }
    );
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button className={tab === 'table' ? 'chip active' : 'chip'} onClick={() => pick('table')}>
          数值表
        </button>
        <button className={tab === 'limits' ? 'chip active' : 'chip'} onClick={() => pick('limits')}>
          局限
        </button>
      </div>
      {tab === 'table' ? (
        <>
          <div className="ctrl">
            {COLS.map((c, i) => (
              <button
                key={c}
                className={i === col ? 'chip active' : 'chip'}
                onClick={() => setCol(i)}
              >
                {c}
              </button>
            ))}
          </div>
          <table className="metric-table">
            <thead>
              <tr>
                <th>模型</th>
                {COLS.map((c, i) => (
                  <th key={c} className={i === col ? 'is-col' : undefined}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.name}>
                  <td>{r.name}</td>
                  {r.vals.map((v, i) => (
                    <td key={COLS[i]} className={i === col ? 'is-col' : undefined}>
                      {v.toFixed(4)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="ctrl" style={{ display: 'block', color: 'var(--slate)' }}>
            数值取自论文 Table 2（第 9 页）。协议：8 项语言任务由 lm-evaluation-harness 评测，全部为零样本、
            不使用思维链，唯一例外是 GSM8K（8 样本 + 思维链）；论文只说明「使用 harness 中对应的官方指标」，
            <b>并未逐任务给出指标名</b>，本教程统一称「准确率」只是便于理解的统称。越高越好。
            <br />
            两处与论文原表的差异需要留意：论文 Table 2 中基座那一行的原始行名写作 <b>Mistral 0.2 LM</b>
            （论文未解释 "0.2" 的含义），本表为便于阅读改称「基座 Mistral」；另外论文表标题用的是 <b>λ</b>，
            而列头与正文用 <b>α</b>，二者指同一个合并权重，本教程统一写作 α。
            <br />
            量纲提示：论文 Table 3 内部各任务量纲也不统一（MMBench 为 0–100，GQA / VizWizVQA 为 0–1，
            MME Cognition / Perception 为数百），因此那里的百分比变化要按各任务自身基线分别计算，
            不能跨任务比较绝对分数。
          </div>
        </>
      ) : (
        <ul style={{ margin: '10px 0 0 18px', color: 'var(--slate)' }}>
          {LIMITS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}
      <div className={`feedback ${fb.c}`}>{fb.t}</div>
    </div>
  );
};

export default Ch10Mod2;
