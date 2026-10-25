import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { useStage, Anim, Pulse, rr, txt, clamp, glow, ripple, easeOut, arrowLine, pill } from '../lib/stage';
import { C, rgba, TYPE_COLOR, TYPE_NAME, type TokType } from '../lib/palette';
import { Btn, Feedback, Slider, Tag } from '../ui/kit';
import { StageBox } from '../ui/StageBox';
import { Guess, ModeSwitch, ScoreBar, useChallenge } from '../ui/Challenge';
import { TimeBar } from '../ui/TimeBar';
import { useTimeline } from '../lib/timeline';

// 4.1 信息迁移（概念动画，教学示意）。
// 小模型：2 个系统 + 5 个视觉 + 3 个问题 token，8 层。时间轴 = 计算进行到第几层。
// 每层问题 token 从左边的视觉 token 吸收一部分“视觉染料”（示意规则：每层吸收剩余部分的固定比例）；
// 系统 token 排在图像之前，因果掩码下永远读不到图像。第 K 层之后撤出视觉 token：染料从此不再增加。
// “染料”只是示意量，模型里没有这样一个可以直接读出的数，所以画面上不标百分比。

const N = 8;
const TOK: TokType[] = ['sys', 'sys', 'vis', 'vis', 'vis', 'vis', 'vis', 'ins', 'ins', 'ins'];
const ALPHA = 0.35;
const absorbed = (layers: number) => 1 - Math.pow(1 - ALPHA, Math.max(0, layers));

const CH = [
  { id: 'a', kind: 'col' as const, ask: '哪一类 token 永远读不到图像信息？（点一列）' },
  { id: 'b', kind: 'meter' as const, ask: '如果在第 2 层之后就撤出，问题 token 最终携带的视觉信息会怎样？（点仪表上的刻度）' },
];
const METER_OPTS = [
  { value: 'more', label: '比不撤还多', v: 1.0 },
  { value: 'same', label: '和不撤差不多', v: 0.9 },
  { value: 'less', label: '明显更少', v: 0.45 },
] as const;

export const M4Flow: React.FC<WidgetProps> = () => {
  const [K, setK] = useState(4);
  const [reverse, setReverse] = useState(false);
  const tl = useTimeline(7);
  const ch = useChallenge(CH.length);
  const [ci, setCi] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const anim = useRef(new Anim()).current;
  const pulse = useRef(new Pulse(0.7)).current;
  const geo = useRef<{ cols: { ty: TokType; x0: number; x1: number }[]; meter: { value: string; x: number; y: number }[]; top: number; bottom: number }>({
    cols: [],
    meter: [],
    top: 0,
    bottom: 0,
  });
  const tap = useRef<{ x: number; y: number } | null>(null);

  const cur = CH[ci];
  const guessing = ch.guessing;
  const effK = guessing && cur.kind === 'meter' ? 2 : K;
  const hidden = guessing && picked === null;

  const s = useStage(
    {
      heightOf: (w) => clamp(w * 0.56, 280, 400),
      // 只有在“正在吸收”的层（暂停时也算）才需要持续流动的光点；其余时间不跑循环
      live: tl.playing || (!guessing && tl.p > 0 && tl.p * N < K),
      draw: ({ ctx, w, h, t, dt, final }) => {
        if (!final) tl.tick(dt);
        anim.begin();
        const L = guessing ? N : tl.pRef.current * N; // 已计算的层数（连续）
        ctx.clearRect(0, 0, w, h);
        const narrow = w < 520;
        const meterW = narrow ? 0 : 130;
        const left = 34;
        const right = w - meterW - 12;
        const top = 30;
        const bottom = h - (narrow ? 70 : 30);
        const cw = (right - left) / TOK.length;
        const rh = (bottom - top) / N;
        const X = (j: number) => left + cw * (j + 0.5);
        const Y = (l: number) => bottom - rh * (l + 0.5);
        geo.current = { cols: [], meter: [], top, bottom };
        TOK.forEach((ty, j) => {
          if (j === 0 || TOK[j - 1] !== ty) {
            const n = TOK.filter((x) => x === ty).length;
            const x0 = X(j) - cw / 2;
            txt(ctx, TYPE_NAME[ty], x0 + (n * cw) / 2, 14, { size: 11, color: TYPE_COLOR[ty], align: 'center', weight: 700 });
            geo.current.cols.push({ ty, x0, x1: x0 + n * cw });
          }
        });
        for (let l = 0; l < N; l++) txt(ctx, `L${l + 1}`, left - 6, Y(l), { size: 9, color: C.ink4, align: 'right' });
        const kAnim = anim.to('K', effK, dt, final, 8, 1.01);
        if (kAnim < N) {
          const yK = bottom - rh * kAnim;
          ctx.strokeStyle = rgba(C.vis, 0.9);
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          for (let x = X(2) - cw / 2; x <= X(6) + cw / 2; x += 4) {
            const y = yK + Math.sin(x * 0.1 + t * 3) * 1.6;
            if (x === X(2) - cw / 2) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.lineWidth = 1;
        }
        for (let l = 0; l < N; l++) {
          const reached = clamp(L - l, 0, 1);
          for (let j = 0; j < TOK.length; j++) {
            const ty = TOK[j];
            const x = X(j);
            const y = Y(l);
            const sz = Math.min(cw, rh) * 0.62;
            if (ty === 'vis') {
              const gone = l >= effK;
              const a = gone ? 0.05 : 0.2 + 0.7 * reached;
              const k = gone ? 0.35 : 1;
              ctx.fillStyle = rgba(C.vis, a);
              rr(ctx, x - (sz * k) / 2, y - (sz * k) / 2, sz * k, sz * k, 3);
              ctx.fill();
            } else {
              const info = ty === 'ins' ? absorbed(Math.min(l + reached, effK)) : 0;
              const fill = hidden ? 0 : reached > 0 ? info : 0;
              ctx.fillStyle = rgba(TYPE_COLOR[ty], 0.2 + 0.65 * reached);
              rr(ctx, x - sz / 2, y - sz / 2, sz, sz, 3);
              ctx.fill();
              if (fill > 0.01) {
                ctx.fillStyle = rgba(C.vis, 0.9);
                rr(ctx, x - sz / 2, y + sz / 2 - sz * fill, sz, sz * fill, 3);
                ctx.fill();
              }
            }
          }
        }
        const cl = Math.min(Math.floor(L), N - 1);
        if (!hidden && !guessing && L > 0 && cl < effK) {
          [7, 9].forEach((j) => [2, 4, 6].forEach((vj) => arrowLine(ctx, X(j), Y(cl) - 6, X(vj), Y(cl) - 6, 1, rgba(C.vis, 0.5), 1.1, 0, -(j - vj) * 4)));
          for (let k = 0; k < 9; k++) {
            const q = (t * 0.9 + k / 9) % 1;
            const vj = [2, 4, 6][k % 3];
            const j = k % 2 ? 7 : 9;
            const x = X(vj) + (X(j) - X(vj)) * q;
            glow(ctx, x, Y(cl) - 6 - Math.sin(q * Math.PI) * (j - vj) * 2.2, 5, C.vis, 0.9);
          }
        }
        if (reverse && !guessing) {
          const l = Math.max(0, Math.min(Math.floor(L), effK) - 1);
          [3, 5].forEach((vj) => {
            arrowLine(ctx, X(vj), Y(l) + 8, X(8), Y(l) + 8, 0.82, rgba(C.bad, 0.85), 1.4, 0, 10);
            txt(ctx, '✕', (X(vj) + X(8)) / 2 + 6, Y(l) + 2, { size: 14, color: C.bad, align: 'center', weight: 800 });
          });
          txt(ctx, 'Λ = −∞：不能读后面的 token', X(8), Y(l) + 22, { size: 10, color: C.bad, align: 'center' });
        }
        const val = absorbed(Math.min(L, effK));
        const fullV = absorbed(N);
        const mx = narrow ? left : w - meterW + 10;
        const my = narrow ? h - 48 : top;
        const mw = narrow ? w - left - 12 : 26;
        const mh = narrow ? 14 : bottom - top;
        txt(ctx, narrow ? '问题 token 携带的视觉信息（示意）' : '携带的视觉信息', narrow ? mx : mx - 6, narrow ? my - 10 : my - 14, { size: 10, color: C.ink2 });
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        rr(ctx, mx, my, mw, mh, 6);
        ctx.fill();
        const shownV = hidden ? 0 : val / fullV;
        ctx.fillStyle = C.vis;
        if (narrow) rr(ctx, mx, my, mw * shownV, mh, 6);
        else rr(ctx, mx, my + mh * (1 - shownV), mw, mh * shownV, 6);
        ctx.fill();
        if (!narrow) {
          txt(ctx, '多', mx + mw + 6, my + 6, { size: 9, color: C.ink3 });
          txt(ctx, '少', mx + mw + 6, my + mh - 6, { size: 9, color: C.ink3 });
          txt(ctx, '（示意）', mx - 6, my + mh + 14, { size: 9, color: C.ink4 });
        }
        if (guessing && cur.kind === 'meter') {
          METER_OPTS.forEach((o) => {
            const px = narrow ? mx + mw * o.v : mx + mw / 2;
            const py = narrow ? my + mh / 2 : my + mh * (1 - o.v);
            geo.current.meter.push({ value: o.value, x: px, y: py });
            ctx.fillStyle = picked === o.value ? (o.value === 'less' ? C.ok : C.warn) : rgba(C.moon, 0.9);
            ctx.beginPath();
            ctx.arc(px, py, 7, 0, Math.PI * 2);
            ctx.fill();
            txt(ctx, o.label, narrow ? px : px + 14, narrow ? py + 18 : py, { size: 10, color: C.moon, align: narrow ? 'center' : 'left' });
          });
        }
        if (guessing && cur.kind === 'col' && picked) {
          const g = geo.current.cols.find((c) => c.ty === picked);
          if (g) {
            ctx.strokeStyle = picked === 'sys' ? C.ok : C.warn;
            ctx.lineWidth = 2;
            rr(ctx, g.x0 + 1, top - 4, g.x1 - g.x0 - 2, bottom - top + 8, 6);
            ctx.stroke();
            ctx.lineWidth = 1;
          }
        }
        if (kAnim < N) pill(ctx, `第 ${Math.round(kAnim) + 1} 层起撤出`, X(2) - cw / 2, bottom - rh * kAnim - 12, { size: 10, color: C.vis });
        const pp = pulse.p(t, final);
        if (pp >= 0 && tap.current) {
          ripple(ctx, tap.current.x, tap.current.y, easeOut(pp), C.moon, 26);
          anim.moving = true;
        }
        return anim.moving || tl.playing;
      },
    },
    [K, reverse, guessing, ci, picked, effK, tl.playing ? -1 : tl.p, tl.playing]
  );

  useEffect(() => tl.onVisible(s.animate), [s.animate, tl]);

  const answerOf = (c: (typeof CH)[number]) => (c.kind === 'col' ? 'sys' : 'less');
  const pick = (v: string) => {
    if (picked !== null) return;
    setPicked(v);
    ch.record(cur.id, v === answerOf(cur));
  };
  const onTap = (x: number, y: number) => {
    tap.current = { x, y };
    pulse.fire(performance.now() / 1000);
    if (!guessing) return;
    if (cur.kind === 'col') {
      const g = geo.current.cols.find((c) => x >= c.x0 && x <= c.x1 && y >= geo.current.top - 20 && y <= geo.current.bottom);
      if (g) pick(g.ty);
    } else {
      const m = geo.current.meter.find((o) => Math.hypot(o.x - x, o.y - y) < 20);
      if (m) pick(m.value);
    }
  };

  const L = tl.p * N;
  const lead = reverse ? (
    <>
      <b>读不到：</b>视觉 token 排在问题前面，因果掩码把“往后读”的权重压成 0。信息只能从图像流向文字。
    </>
  ) : L < 0.5 ? (
    <>还没开始计算。按播放，或拖动进度条一层层看。</>
  ) : L < Math.min(K, N) ? (
    <>
      第 {Math.ceil(L)} 层：问题 token 正从左边的视觉 token 里“吸”信息（青色染料在上涨）。系统 token 排在图像前面，一直是空的。
    </>
  ) : (
    <>
      第 {K} 层之后视觉 token 被撤走，问题 token 的染料<b>不再增加</b>，带着已经吸收的信息继续往上。K 越小，带走的越少。
    </>
  );

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
        <Tag kind="demo" />
      </div>
      <StageBox
        s={s}
        onTap={onTap}
        label={guessing ? `挑战：${cur.ask}` : `概念示意：计算进行到第 ${Math.round(L)} 层，K = ${K}；问题 token 逐层吸收视觉信息，系统 token 始终读不到图像`}
      />
      {guessing ? (
        <>
          <Guess
            q={cur.ask}
            options={
              cur.kind === 'col'
                ? (['sys', 'vis', 'ins'] as TokType[]).map((t) => ({ value: t, label: `${TYPE_NAME[t]} token` }))
                : METER_OPTS.map((o) => ({ value: o.value, label: o.label }))
            }
            answer={answerOf(cur)}
            picked={picked}
            onPick={pick}
            explain={
              cur.kind === 'col' ? (
                <p>系统 token 排在图像之前。因果掩码 Λ 让第 i 个 token 只能读第 i 个及之前的 token，所以系统 token 在任何一层都读不到图像；问题 token 排在图像之后，每层都能读。</p>
              ) : (
                <p>撤出之后就没有视觉 token 可读了：问题 token 只吸收了前 2 层的量，后面的层补不回来。这就是第 7 章“撤得太早会掉分”的直觉来源（示意规则，不是测量）。</p>
              )
            }
            canvasHint={cur.kind === 'col' ? '点画布上的一列（系统 / 视觉 / 指令），或点下面的选项' : '点仪表上的刻度圆点，或点下面的选项'}
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
        <>
          <TimeBar tl={tl} label="计算进行到第几层" />
          <div className="ctrls">
            <Slider label="K：前几层带视觉 token" value={K} min={1} max={N} onChange={setK} display={K === N ? `K = ${N}（不撤出）` : `K = ${K}`} />
            <div className="ctrl-row">
              <Btn onClick={() => setReverse((r) => !r)} pressed={reverse}>
                {reverse ? '收起反向尝试' : '让视觉 token 读问题？'}
              </Btn>
            </div>
          </div>
          <Feedback
            tone={reverse ? 'bad' : 'info'}
            k={`${K}-${Math.ceil(L)}-${reverse}`}
            lead={lead}
            more={<p>“染料”是本页为讲解设定的示意量（每层吸收剩余部分的固定比例），模型里没有这样一个可以直接读出的数。真实模型里迁移在第几层“够用”，要看第 7 章的 KL 校准和下面表 1 的消融。</p>}
          />
        </>
      )}
    </div>
  );
};
