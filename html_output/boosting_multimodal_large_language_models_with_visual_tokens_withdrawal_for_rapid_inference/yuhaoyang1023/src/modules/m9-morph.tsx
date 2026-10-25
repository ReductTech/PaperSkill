import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { useStage, Anim, Pulse, rr, txt, clamp, glow, ripple, easeOut } from '../lib/stage';
import { C, rgba, METHOD_COLOR } from '../lib/palette';
import { Feedback, Seg, Tags, EvChip } from '../ui/kit';
import { StageBox } from '../ui/StageBox';
import { Guess, ModeSwitch, ScoreBar, useChallenge } from '../ui/Challenge';
import { BENCH, TABLE2, type T2Block } from '../data/tables';

// 9.1 结果变形图（论文实测，表 2，单次运行）。
// 每行一个基准，条形 = 相对原模型的变化（%），切换模型 / 方法时条形平滑变形；
// 变化最大的一项自动高亮并标注。颜色只表示方法，不因差值大小染色。超出坐标范围的条形用箭头截断并写出数值。

type MethodKey = 'vtw' | 'fastv' | 'vtwr' | 'rand';
const METHODS: { value: MethodKey; label: string }[] = [
  { value: 'vtw', label: 'VTW' },
  { value: 'fastv', label: 'FastV' },
  { value: 'vtwr', label: 'VTW†（随机层）' },
  { value: 'rand', label: 'Rand（随机丢）' },
];
const BLABEL: Record<string, string> = { AI2D: 'AI2D', SQA_Img: 'SQA', MMMU_Val: 'MMMU', MMB_EN: 'MMB', POPE: 'POPE', MME: 'MME' };
const LO = -20;
const HI = 5;

function rel(block: T2Block, key: MethodKey) {
  const base = block.rows.find((r) => r.key === 'base')!.values;
  const row = block.rows.find((r) => r.key === key)!.values;
  return row.map((v, i) => ({ base: base[i], v, pct: ((v - base[i]) / base[i]) * 100 }));
}

const CH: { id: string; model: T2Block['id']; method: MethodKey; ask: string; mode: 'min' | 'absmax' | 'max' }[] = [
  { id: 'a', model: '7b', method: 'vtwr', ask: '7B：VTW†（随机层撤出）在哪个基准上相对原模型掉得最多？', mode: 'min' },
  { id: 'b', model: '7b', method: 'vtw', ask: '7B：VTW（K = 16）在哪个基准上变化幅度最大？', mode: 'absmax' },
  { id: 'c', model: '13b', method: 'fastv', ask: '13B：FastV 在哪个基准上比原模型高得最多？', mode: 'max' },
];

export const M9Morph: React.FC<WidgetProps> = () => {
  const [mid, setMid] = useState<T2Block['id']>('7b');
  const [meth, setMeth] = useState<MethodKey>('vtw');
  const ch = useChallenge(CH.length);
  const [ci, setCi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const anim = useRef(new Anim()).current;
  const pulse = useRef(new Pulse(0.8)).current;
  const rows = useRef<{ i: number; y0: number; y1: number }[]>([]);

  const cur = CH[ci];
  const model = ch.guessing ? cur.model : mid;
  const method = ch.guessing ? cur.method : meth;
  const block = TABLE2.find((b) => b.id === model)!;
  const data = rel(block, method);
  const hidden = ch.guessing && picked === null;
  const pcts = data.map((d) => d.pct);
  const answer = cur.mode === 'min' ? pcts.indexOf(Math.min(...pcts)) : cur.mode === 'max' ? pcts.indexOf(Math.max(...pcts)) : pcts.map(Math.abs).indexOf(Math.max(...pcts.map(Math.abs)));
  const top = pcts.map(Math.abs).indexOf(Math.max(...pcts.map(Math.abs)));

  const s = useStage(
    {
      heightOf: (w) => (w < 520 ? 6 * 54 + 20 : 6 * 48 + 30),
      draw: ({ ctx, w, h, t, dt, final }) => {
        anim.begin();
        ctx.clearRect(0, 0, w, h);
        const narrow = w < 520;
        const labW = narrow ? 0 : 64;
        const left = labW + 8;
        const right = w - (narrow ? 8 : 150);
        const rowH = (h - 26) / 6;
        const X = (pct: number) => left + ((clamp(pct, LO, HI) - LO) / (HI - LO)) * (right - left);
        const x0 = X(0);
        // 刻度
        [-20, -10, 0, 5].forEach((v) => {
          ctx.strokeStyle = v === 0 ? rgba(C.moon, 0.55) : 'rgba(255,255,255,0.06)';
          ctx.beginPath();
          ctx.moveTo(X(v), 4);
          ctx.lineTo(X(v), h - 22);
          ctx.stroke();
          txt(ctx, `${v > 0 ? '+' : ''}${v}%`, X(v), h - 10, { size: 9, color: C.ink3, align: 'center' });
        });
        rows.current = [];
        data.forEach((d, i) => {
          const y = 4 + i * rowH;
          rows.current.push({ i, y0: y, y1: y + rowH });
          const barY = narrow ? y + 18 : y + 8;
          const barH = narrow ? rowH - 26 : rowH - 16;
          if (narrow) txt(ctx, BLABEL[BENCH[i]], left, y + 8, { size: 11, color: C.ink2, weight: 700 });
          else txt(ctx, BLABEL[BENCH[i]], labW, barY + barH / 2, { size: 12, color: C.ink2, weight: 700, align: 'right' });
          const target = hidden ? 0 : d.pct;
          const v = anim.to(`b${i}`, target, dt, final, 7 - i * 0.5);
          const xv = X(v);
          const isTop = !hidden && i === top && Math.abs(d.pct) > 0.05;
          ctx.fillStyle = rgba(METHOD_COLOR[method], isTop ? 1 : 0.7);
          rr(ctx, Math.min(x0, xv), barY, Math.abs(xv - x0), barH, 4);
          ctx.fill();
          if (isTop) glow(ctx, xv, barY + barH / 2, 26, METHOD_COLOR[method], 0.6);
          // 截断箭头
          if (!hidden && d.pct < LO) {
            ctx.fillStyle = C.moon;
            ctx.beginPath();
            ctx.moveTo(X(LO) - 2, barY + barH / 2);
            ctx.lineTo(X(LO) + 8, barY);
            ctx.lineTo(X(LO) + 8, barY + barH);
            ctx.fill();
          }
          if (hidden) {
            txt(ctx, '?', x0 + 10, barY + barH / 2, { size: 13, color: C.ink3, weight: 800 });
          } else {
            const lab = `${d.pct >= 0 ? '+' : '−'}${Math.abs(d.pct).toFixed(1)}%`;
            const detail = `${d.base} → ${d.v}`;
            if (narrow) {
              txt(ctx, `${lab}  (${detail})`, w - 8, y + 8, { size: 10, color: isTop ? C.moon : C.ink2, align: 'right', weight: isTop ? 800 : 600 });
            } else {
              txt(ctx, lab, right + 8, barY + barH / 2 - 7, { size: 12, color: isTop ? C.moon : C.ink, weight: 800 });
              txt(ctx, detail, right + 8, barY + barH / 2 + 8, { size: 10, color: C.ink3 });
            }
          }
          if (ch.guessing && picked === i) {
            ctx.strokeStyle = i === answer ? C.ok : C.warn;
            ctx.lineWidth = 2;
            rr(ctx, 2, y + 1, w - 4, rowH - 2, 6);
            ctx.stroke();
            ctx.lineWidth = 1;
          }
        });
        const pp = pulse.p(t, final);
        if (pp >= 0 && !hidden) {
          const r = rows.current[top];
          if (r) ripple(ctx, X(data[top].pct), (r.y0 + r.y1) / 2, easeOut(pp), METHOD_COLOR[method], 30);
          anim.moving = true;
        }
        return anim.moving;
      },
    },
    [model, method, hidden, picked, ci]
  );

  const change = (fn: () => void) => {
    fn();
    pulse.fire(performance.now() / 1000);
  };
  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    pulse.fire(performance.now() / 1000);
    ch.record(cur.id, i === answer);
  };
  const onTap = (_x: number, y: number) => {
    if (!ch.guessing) return;
    const r = rows.current.find((rr0) => y >= rr0.y0 && y <= rr0.y1);
    if (r) pick(r.i);
  };

  const topD = data[top];
  const methodName = METHODS.find((m) => m.value === method)!.label;

  return (
    <div className="mod-stack">
      <div className="mod-toolbar">
        <ModeSwitch
          ch={{
            ...ch,
            setMode: (m) => {
              ch.setMode(m);
              setCi(0);
              setPicked(null);
            },
          }}
        />
        <Tags kinds={['paper']} />
        <EvChip id="tab2" />
      </div>
      {!ch.guessing ? (
        <div className="ctrls">
          <Seg small label="模型" value={mid} onChange={(v) => change(() => setMid(v))} options={TABLE2.map((b) => ({ value: b.id, label: b.model.replace('LLaVA-', '') }))} />
          <Seg small label="方法" value={meth} onChange={(v) => change(() => setMeth(v))} options={METHODS} />
        </div>
      ) : null}
      <StageBox
        s={s}
        onTap={onTap}
        label={
          hidden
            ? `挑战：${cur.ask}点一行作答。`
            : `${block.model}，${methodName} 相对原模型的变化：${data.map((d, i) => `${BENCH[i]} ${d.pct.toFixed(1)}%`).join('，')}`
        }
      />
      {ch.guessing ? (
        <>
          <Guess
            q={cur.ask}
            options={BENCH.map((b, i) => ({ value: String(i), label: BLABEL[b] }))}
            answer={String(answer)}
            picked={picked === null ? null : String(picked)}
            onPick={(v) => pick(Number(v))}
            explain={
              <p>
                {data.map((d, i) => `${BLABEL[BENCH[i]]} ${d.pct >= 0 ? '+' : '−'}${Math.abs(d.pct).toFixed(1)}%`).join('，')}。
                {cur.method === 'vtw' ? ' 最大的 MMMU 也只是 35.60 → 36.30；论文单次运行、无置信区间，无法判断这些变化是否超出评测波动。' : ''}
                {cur.method === 'vtwr' ? ' 论文的解释是“过早移除视觉信息影响性能”；但没有报告每个样本抽到的 K，无法把下降拆到具体层号。' : ''}
                {cur.method === 'fastv' ? ' FastV 在 13B 的 MME 上高 1.5%，同样无法判断是否超出波动。' : ''}
              </p>
            }
            canvasHint="点画布上的一行，或点下面的选项"
          />
          <div className="ctrl-row">
            <button
              type="button"
              className="btn btn-primary"
              disabled={picked === null || ci >= CH.length - 1}
              onClick={() => {
                setCi((i) => i + 1);
                setPicked(null);
              }}
            >
              下一题（{Math.min(ci + 2, CH.length)}/{CH.length}）
            </button>
          </div>
          <ScoreBar
            ch={ch}
            onRestart={() => {
              setCi(0);
              setPicked(null);
            }}
          />
        </>
      ) : (
        <Feedback
          tone="info"
          k={`${mid}-${meth}`}
          lead={
            method === 'vtw' ? (
              <>
                {block.model} 上 VTW 变化最大的是 {BLABEL[BENCH[top]]}（{topD.pct >= 0 ? '+' : '−'}
                {Math.abs(topD.pct).toFixed(2)}%，{topD.base} → {topD.v}），其余更小。这么小的差值，现有材料无法判断是否超出评测波动。
              </>
            ) : method === 'rand' ? (
              <>Rand 在同样的计算量下几乎全面崩溃：不分视觉 / 文字随机丢 token，连问题本身都可能被丢掉。</>
            ) : method === 'vtwr' ? (
              <>
                随机层撤出在 {BLABEL[BENCH[top]]} 上掉了 {Math.abs(topD.pct).toFixed(1)}%：撤在哪一层很关键。
              </>
            ) : (
              <>
                FastV 变化最大的是 {BLABEL[BENCH[top]]}（{topD.pct >= 0 ? '+' : '−'}
                {Math.abs(topD.pct).toFixed(1)}%）。
              </>
            )
          }
          more={
            <p>
              条形 = （方法 − 原模型）/ 原模型，坐标截在 −20% 到 +5%，超出部分用箭头标出并写数值。表 2 是单次运行，没有逐题结果和置信区间；颜色只代表方法。MME 是 14 个子任务的分数之和；POPE 的指标论文未说明是准确率还是 F1。
            </p>
          }
        />
      )}
    </div>
  );
};
