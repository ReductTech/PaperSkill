import React, { useState } from 'react';
import { C, stage, label, legend, useStudioCanvas } from './studiokit';

const W = 1080;
const H = 280;

// ---------------------------------------------------------------------------
// Data provenance (both series are OUR recomputation, not a paper table row):
// Figure 1(b)'s y-axis definition ("Relative Performance Change (%)") is NOT
// defined anywhere in the paper. We therefore recomputed it from the paper's own
// tables, one point per merged model:
//   blue (8 language tasks), relative to the `Mistral 0.2 LM` row of Table 2:
//     mean over the 8 tasks of (v_merged - v_Mistral) / v_Mistral * 100
//   green (5 vision tasks), relative to the unmerged LLaVA-1.6-Mistral (alpha=0)
//     row of Table 3:
//     mean over the 5 tasks of (v_alpha - v_0) / v_0 * 100
//
// Worked examples (one value spelled out so the numbers can be re-derived):
//   language at alpha=0: Hellaswag (.5971-.6602)/.6602 = -9.56%, MMLU -2.00%,
//     CQA +7.96%, Wino -3.41%, Arc-E -3.81%, Race-H -3.32%, OBQA -11.80%,
//     GSM8k -16.91% -> mean = -5.36%
//   language at alpha=0.1: per-task (-2.70, +0.51, +10.77, -1.17, +1.87, -4.36,
//     -3.93, +9.01) -> mean = +1.25%
//   vision at alpha=0.1: GQA (.5981-.5514)/.5514 = +8.47%,
//     MMBench (62.8869-40.6118)/40.6118 = +54.85%,
//     MME Cognition -13.79%, MME Perception -5.95%, VizWiz +25.64% -> mean = +13.85%
//
// IMPORTANT: the green series has only FIVE points and NO alpha=0 point. At
// alpha=0 the visual change is exactly 0 by construction (that row IS the
// baseline), and the paper's Figure 1(b) likewise starts the green curve at the
// second tick, alpha=0.05. Plotting six green points from alpha=0 would shift the
// whole vision curve one tick to the left and make alpha=0.1 look collapsed.
// ---------------------------------------------------------------------------
const XS = [0, 0.05, 0.1, 0.5, 0.9, 0.95]; // blue: 6 points, includes alpha=0
const LANGP = [-5.36, -0.99, 1.25, 0.57, 0.08, -0.27];
const XSV = [0.05, 0.1, 0.5, 0.9, 0.95]; // green: 5 points, NO alpha=0
const VISP = [18.0, 13.8, -35.5, -55.4, -55.5];

// Three ways to look at the same alpha trade-off: the linked curve, the paper's
// Figure 1(b) alone, or the full Figure 1 with the (a) eight-task comparison.
type View = 'curve' | 'figure' | 'full';

const CURVE_FB =
  '视觉在 0.05 为 +18.0%（视觉曲线从这里开始，α=0 处变化恒为 0，论文 Figure 1(b) 也没有这个点），到 0.1 仍为 +13.8%；语言曲线在 0.1 附近转正（+1.3%）。视觉的崩塌发生在 α=0.5 以后：0.5 为 −35.5%，0.9/0.95 约 −55.4%。';

export const Ch5Mod2: React.FC = () => {
  const [view, setView] = useState<View>('curve');
  const [cursor, setCursor] = useState(0.1);
  const [fb, setFb] = useState<{ t: string; c: string }>({ t: CURVE_FB, c: '' });

  const ref = useStudioCanvas(W, H, (ctx) => {
    stage(ctx, W, H);
    const left = 120;
    const right = 900;
    const top = 46;
    const bottom = 224;
    const ymin = -60;
    const ymax = 20;

    const px = (a: number) => left + (a / 0.95) * (right - left);
    const py = (v: number) => bottom - ((v - ymin) / (ymax - ymin)) * (bottom - top);

    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left, bottom);
    ctx.lineTo(right, bottom);
    ctx.stroke();
    for (let g = 0; g <= 4; g++) {
      const v = ymin + ((ymax - ymin) * g) / 4;
      const y = py(v);
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
    }

    // each series carries its own x axis, because the vision series has no alpha=0 point
    const drawSeries = (xs: number[], vals: number[], color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      vals.forEach((v, i) => {
        const x = px(xs[i]);
        const y = py(v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      vals.forEach((v, i) => {
        ctx.beginPath();
        ctx.arc(px(xs[i]), py(v), 5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      });
    };
    drawSeries(XS, LANGP, C.blue);
    drawSeries(XSV, VISP, C.green);

    // orange alpha cursor so the legend entry has a matching mark on the canvas
    const cx = px(cursor);
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, top - 4);
    ctx.lineTo(cx, bottom + 4);
    ctx.stroke();
    // `baseline` is the value at alpha = 0. The vision series has no alpha=0
    // point, and at alpha=0 its change is 0 by construction (that row IS the
    // baseline), so a cursor strictly below 0.05 reads 0 and puts the green dot
    // on the axis. The test must be `< xs[0]` (strict), not `<=`: alpha=0.05 is
    // an actual data point and has to return VISP[0] = +18.0%. The language
    // series does have an alpha=0 point, so its baseline is its own first value.
    const interp = (xs: number[], vals: number[], baseline: number) => {
      if (cursor < xs[0]) return baseline;
      for (let i = 0; i < xs.length - 1; i++) {
        if (cursor >= xs[i] && cursor <= xs[i + 1]) {
          const t = (cursor - xs[i]) / (xs[i + 1] - xs[i]);
          return vals[i] + (vals[i + 1] - vals[i]) * t;
        }
      }
      return vals[vals.length - 1];
    };
    const lv = interp(XS, LANGP, LANGP[0]);
    const vv = interp(XSV, VISP, 0);
    ctx.beginPath();
    ctx.arc(cx, py(lv), 6, 0, Math.PI * 2);
    ctx.fillStyle = C.blue;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, py(vv), 6, 0, Math.PI * 2);
    ctx.fillStyle = C.green;
    ctx.fill();

    label(ctx, left, 26, '平均变化 %');
    legend(ctx, 380, 254, [
      ['语言', C.blue],
      ['视觉', C.green],
      ['当前 α', C.orange],
    ]);
    // Percentages carry one decimal and an explicit % sign, so the reading can
    // never be mistaken for an accuracy in the 0-1 range.
    const pct = (x: number, y: number, v: number, color: string) => {
      ctx.fillStyle = color;
      ctx.font = '700 18px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(v.toFixed(1) + '%', x, y);
    };
    pct(940, py(lv), lv, C.blue);
    pct(940, py(vv), vv, C.green);
  });

  const pick = (v: View) => {
    setView(v);
    setFb(
      v === 'curve'
        ? { t: CURVE_FB, c: '' }
        : v === 'figure'
        ? { t: '这是论文 Figure 1(b) 的原图，可以直接对照坐标读数。', c: '' }
        : {
            t: '这是论文 Figure 1 全图：(a) 是 8 项语言任务上五个模型的得分对比，(b) 是不同合并权重下的平均变化。',
            c: '',
          }
    );
  };

  return (
    <div>
      {view === 'curve' ? (
        <canvas ref={ref} width={W} height={H} />
      ) : view === 'figure' ? (
        <img
          src="./images/figure-1b.png"
          alt="论文 Figure 1(b)：不同合并权重下的平均性能变化"
          style={{ maxWidth: '100%', border: '1px solid #d7deea', borderRadius: '8px' }}
        />
      ) : (
        <img
          src="./images/figure-1.png"
          alt="论文 Figure 1 全图：(a) 八项语言任务得分对比，(b) 不同合并权重下的平均性能变化"
          style={{ maxWidth: '100%', border: '1px solid #d7deea', borderRadius: '8px' }}
        />
      )}
      {view === 'curve' ? (
        <div className="ctrl">
          <label>
            α 游标 <span className="val">{cursor.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min={0}
            max={0.95}
            step={0.05}
            value={cursor}
            onChange={(e) => setCursor(Number(e.target.value))}
          />
        </div>
      ) : null}
      <div className="ctrl">
        <button className={view === 'curve' ? 'chip active' : 'chip'} onClick={() => pick('curve')}>
          任务平均变化
        </button>
        <button className={view === 'figure' ? 'chip active' : 'chip'} onClick={() => pick('figure')}>
          原图 1(b)
        </button>
        <button className={view === 'full' ? 'chip active' : 'chip'} onClick={() => pick('full')}>
          全图 1(a)+(b)
        </button>
      </div>
      <div className="ctrl" style={{ display: 'block', color: 'var(--slate)' }}>
        {view === 'curve'
          ? '两条曲线是按论文表格复算的本教程计算值，不是论文表格中的原始分数：蓝线 6 个点（8 项语言任务相对 Mistral 基座的平均变化，含 α=0）；绿线 5 个点，从 α=0.05 起（5 项视觉任务相对未合并 LLaVA-1.6-Mistral 的平均变化）。论文 Figure 1(b) 的视觉曲线没有 α=0 点，因为该点的变化按定义为 0——把游标拖到 0.05 以下时，模块按「曲线外推的基线」处理：绿线读数显示 0.0%、位于坐标轴上，而不是跳到 0.05 处的 +18.0%。论文 Figure 1(b) 的纵轴口径在正文与图注中均未定义，此处采用的就是上面这条反推口径；原图视图可直接对照刻度。'
          : view === 'figure'
          ? 'Figure 1(b)：横轴为合并权重比例，蓝线为 8 项语言任务的平均变化（6 个点，含 α=0），绿线为 5 项视觉任务的平均变化（5 个点，从 α=0.05 起，无 α=0 点）。注：论文 Table 3 各任务量纲不同（MMBench 为 0–100，GQA / VizWizVQA 为 0–1，MME Cognition / Perception 为数百），本教程的百分比变化按各任务自身基线分别计算，跨任务不要比较绝对分数。'
          : 'Figure 1(a)：横轴为 8 项语言任务，柱与横线分别对应 Mistral-7B、Vicuna-1.5-7B 与三个 LLaVA 模型；可与前面 Table 2 的数值逐项对照。'}
      </div>
      <div className={`feedback ${fb.c}`}>{fb.t}</div>
    </div>
  );
};

export default Ch5Mod2;
