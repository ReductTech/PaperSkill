import React, { useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { useStage, Anim, Pulse, rr, txt, clamp, glow, ripple, easeOut, pill } from '../lib/stage';
import { C, rgba, TYPE_COLOR, TYPE_NAME, type TokType } from '../lib/palette';
import { Btn, Controls, Feedback, Seg, Slider, Tags, EvChip } from '../ui/kit';
import { StageBox } from '../ui/StageBox';
import { Guess, ModeSwitch, ScoreBar, useChallenge } from '../ui/Challenge';
import { useNarrow } from '../lib/hooks';
import { CODE_URL } from '../data/tutorial';

// 5.1 逐层分步：预填充 → 撤出 → 解码（教学示意小模型 + 官方代码对照）。
// 8 层；输入 = 2 个系统 + 5 个视觉 + 2 个问题 token；随后解码 2 个词。
// 层号口径可切换：代码（前 K 层带视觉 token）/ Eq. (5) 字面（前 K−1 层）。

const N = 8;
const PROMPT: TokType[] = ['sys', 'sys', 'vis', 'vis', 'vis', 'vis', 'vis', 'ins', 'ins'];
const COLS: TokType[] = [...PROMPT, 'out', 'out'];
const TEXT_N = PROMPT.filter((t) => t !== 'vis').length; // 4

type StepId = 'input' | 'shallow' | 'withdraw' | 'deep' | 'cache' | 'dec1' | 'dec2';
const STEPS: StepId[] = ['input', 'shallow', 'withdraw', 'deep', 'cache', 'dec1', 'dec2'];

const CODE: { n: number; t: string; ind: number }[] = [
  { n: 308, t: 'if temp_cache.use_vtw:', ind: 0 },
  { n: 309, t: 'drop_layer_idx = temp_cache.k', ind: 1 },
  { n: 310, t: 'if temp_cache.pe_type == "keep":', ind: 1 },
  { n: 311, t: 'if decoder_layer.self_attn.layer_idx == drop_layer_idx and seq_length > 1:', ind: 2 },
  { n: 312, t: 'if temp_cache.mode == "vtw":', ind: 3 },
  { n: 313, t: 'hidden_states = torch.cat([hidden_states[:, :sys], hidden_states[:, sys + img:]], dim=1)', ind: 4 },
  { n: 314, t: 'position_ids = torch.cat([position_ids[:, :sys], position_ids[:, sys + img:]], dim=1)', ind: 4 },
  { n: 330, t: 'layer_outputs = decoder_layer(hidden_states, attention_mask=attention_mask,', ind: 0 },
  { n: 333, t: '    position_ids=position_ids, past_key_value=past_key_values, ...)', ind: 0 },
];
const HL: Record<StepId, number[]> = {
  input: [],
  shallow: [311, 330, 333],
  withdraw: [311, 312, 313, 314],
  deep: [330, 333],
  cache: [333],
  dec1: [311, 330, 333],
  dec2: [311, 330, 333],
};

const Q: Partial<Record<StepId, { id: string; ask: string; answer: string; options: { value: string; label: string }[]; how: string }>> = {
  withdraw: {
    id: 'w',
    ask: '撤出这一刻，从序列里切掉的是哪一段？',
    answer: 'vis',
    options: (['sys', 'vis', 'ins'] as TokType[]).map((t) => ({ value: t, label: `${TYPE_NAME[t]} token` })),
    how: '点画布上的一列',
  },
  cache: {
    id: 'c',
    ask: '预填充结束后，浅层和深层，哪边每层的 KV 缓存更长？',
    answer: 'shallow',
    options: [
      { value: 'shallow', label: '浅层（带视觉 token 的层）' },
      { value: 'deep', label: '深层（撤出之后的层）' },
    ],
    how: '点画布上半部或下半部的层',
  },
  dec1: {
    id: 'd',
    ask: '解码第 1 个词时，新 token 在深层（②）读不到哪一类缓存？',
    answer: 'vis',
    options: (['sys', 'vis', 'ins'] as TokType[]).map((t) => ({ value: t, label: `${TYPE_NAME[t]} token` })),
    how: '点画布上的一列',
  },
};

export const M5Stepper: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const [K, setK] = useState(4);
  const [conv, setConv] = useState<'code' | 'eq5'>('code');
  const [showCode, setShowCode] = useState(false);
  const narrow = useNarrow(640);
  const ch = useChallenge(3);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const anim = useRef(new Anim()).current;
  const pulse = useRef(new Pulse(0.9)).current;
  const geo = useRef<{ cols: { ty: TokType; x0: number; x1: number }[]; split: number; top: number; bottom: number }>({ cols: [], split: 0, top: 0, bottom: 0 });

  const sid = STEPS[step];
  const F = conv === 'code' ? K : K - 1; // 带视觉 token 的层数
  const q = ch.guessing ? Q[sid] : undefined;
  const qPicked = q ? answers[q.id] ?? null : null;
  const blocked = !!q && qPicked === null; // 挑战：决定性的画面先隐藏，答完才能下一步

  const s = useStage(
    {
      heightOf: (w) => clamp(w * 0.6, 290, 400),
      live: sid === 'dec1' || sid === 'dec2' || sid === 'withdraw',
      draw: ({ ctx, w, h, t, dt, final }) => {
        anim.begin();
        ctx.clearRect(0, 0, w, h);
        const left = 38;
        const right = w - (w < 500 ? 40 : 70);
        const top = 26;
        const bottom = h - 46;
        const cw = (right - left) / COLS.length;
        const rh = (bottom - top) / N;
        const X = (j: number) => left + cw * (j + 0.5);
        const Y = (l: number) => bottom - rh * (l + 0.5);
        geo.current = { cols: [], split: bottom - rh * F, top, bottom };
        const si = STEPS.indexOf(sid);
        // 列标题
        COLS.forEach((ty, j) => {
          if (j === 0 || COLS[j - 1] !== ty) {
            let cnt = 0;
            for (let k = j; k < COLS.length && COLS[k] === ty; k++) cnt++;
            const x0 = X(j) - cw / 2;
            txt(ctx, ty === 'out' ? '输出' : TYPE_NAME[ty], x0 + (cnt * cw) / 2, 12, { size: 10, color: TYPE_COLOR[ty], align: 'center', weight: 700 });
            geo.current.cols.push({ ty, x0, x1: x0 + cnt * cw });
          }
        });
        for (let l = 0; l < N; l++) txt(ctx, `L${l + 1}`, left - 6, Y(l), { size: 9, color: l < F ? C.ink2 : C.ink4, align: 'right' });
        // 预填充进度（层）
        const preTarget = si === 0 ? 0 : si === 1 ? F : si === 2 ? F : N;
        const wave = anim.to(`wave-${conv}-${K}`, preTarget, dt, final, si === 1 || si === 3 ? 3.2 : 9);
        // 挑战：撤出这一步作答前先不画退潮（否则会泄露答案）
        const withdrawn = si >= 3 || (si === 2 && !blocked);
        const ebb = si === 2 ? anim.to(`ebb-${K}-${conv}`, 1, dt, final, 2.5) : withdrawn ? 1 : 0;
        // 网格
        for (let l = 0; l < N; l++) {
          for (let j = 0; j < COLS.length; j++) {
            const ty = COLS[j];
            const x = X(j);
            const y = Y(l);
            const sz = Math.min(cw, rh) * 0.62;
            const isOut = ty === 'out';
            let a = 0.12;
            if (!isOut) a = l < wave ? 0.88 : 0.16;
            if (isOut) {
              const di = j - PROMPT.length; // 0 或 1
              const decStep = si - 5; // 0 = 第 1 个词
              if (decStep > di) a = 0.88;
              else if (decStep === di) a = 0.88;
              else a = 0.05;
            }
            if (ty === 'vis' && l >= F) {
              // 撤出：深层视觉格子退潮（收缩、淡出），只留虚线轮廓
              const k = withdrawn ? easeOut(ebb) : 0;
              const ss = sz * (1 - 0.55 * k);
              ctx.fillStyle = rgba(C.vis, a * (1 - 0.92 * k));
              rr(ctx, x - ss / 2, y - ss / 2, ss, ss, 3);
              ctx.fill();
              if (k > 0.5) {
                ctx.strokeStyle = rgba(C.vis, 0.22);
                ctx.setLineDash([2, 2]);
                rr(ctx, x - sz / 2, y - sz / 2, sz, sz, 3);
                ctx.stroke();
                ctx.setLineDash([]);
              }
              continue;
            }
            ctx.fillStyle = rgba(TYPE_COLOR[ty], a);
            rr(ctx, x - sz / 2, y - sz / 2, sz, sz, 3);
            ctx.fill();
          }
        }
        // 撤出潮线
        const yK = bottom - rh * F;
        ctx.strokeStyle = rgba(C.vis, withdrawn ? 0.95 : 0.35);
        ctx.lineWidth = withdrawn ? 2 : 1;
        ctx.setLineDash(withdrawn ? [] : [4, 4]);
        ctx.beginPath();
        for (let x = left; x <= right; x += 4) {
          const yy = yK + (withdrawn ? Math.sin(x * 0.09 + t * 3) * 1.5 : 0);
          if (x === left) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineWidth = 1;
        if (si === 2 && !blocked) {
          glow(ctx, (X(2) + X(6)) / 2, yK, 60, C.vis, 0.35 * (1 - ebb));
        }
        // 位置编号（Keep：撤出后剩下的 token 保留原编号）
        const posY = bottom + 14;
        txt(ctx, 'pos', left - 6, posY, { size: 9, color: C.ink4, align: 'right' });
        COLS.forEach((ty, j) => {
          const isOut = ty === 'out';
          if (isOut && si < 5 + (j - PROMPT.length)) return;
          const deepGone = ty === 'vis' && withdrawn;
          txt(ctx, String(j), X(j), posY, { size: 10, color: deepGone ? C.ink4 : C.ink2, align: 'center', alpha: deepGone ? 0.5 : 1 });
        });
        // KV 缓存长度（每层）
        if (si >= 4 && !(blocked && sid === 'cache')) {
          for (let l = 0; l < N; l++) {
            const len = (l < F ? PROMPT.length : TEXT_N) + Math.max(0, si - 4);
            const g = anim.to(`kv-${l}-${si}-${F}`, len, dt, final, 6 - l * 0.3);
            const bx = right + 6;
            const maxW = (w < 500 ? 30 : 60) - 4;
            ctx.fillStyle = rgba(l < F ? C.vis : C.ins, 0.7);
            rr(ctx, bx, Y(l) - 4, (g / (PROMPT.length + 2)) * maxW, 8, 3);
            ctx.fill();
            if (w >= 500) txt(ctx, String(Math.round(g)), bx + maxW + 2, Y(l), { size: 9, color: C.ink2 });
          }
          txt(ctx, 'KV', right + 6, top - 12, { size: 9, color: C.ink3 });
        }
        // 解码：决定性的一步——把新 token 在浅层 ① 与深层 ② 实际读到的缓存画出来
        if ((sid === 'dec1' || sid === 'dec2') && !blocked) {
          const c = sid === 'dec1' ? PROMPT.length : PROMPT.length + 1;
          const shallow = Math.max(0, Math.min(F - 1, 1));
          const deep = Math.min(N - 1, Math.max(F, N - 2));
          const g1 = anim.to(`g1-${sid}-${F}`, 1, dt, final, 3.5);
          const g2 = anim.to(`g2-${sid}-${F}`, g1 > 0.6 ? 1 : 0, dt, final, 3.5);
          const drawReads = (row: number, prog: number, mark: string) => {
            const x0 = X(c);
            const y0 = Y(row);
            glow(ctx, x0, y0, 16, C.out, 0.9);
            // 弧线从新 token 拱起、落到被读取的缓存格子上（离得越远拱得越高）
            for (let j = 0; j < c; j++) {
              const ty = COLS[j];
              if (ty === 'vis' && row >= F) {
                // 深层：视觉缓存不存在，画一个淡淡的“✕”提示
                if (prog > 0.95) txt(ctx, '✕', X(j), y0, { size: 10, color: rgba(C.bad, 0.85), align: 'center', weight: 800 });
                continue;
              }
              const xj = X(j);
              const lift = (10 + (c - j) * Math.min(5, rh * 0.28)) * (row < N / 2 ? 1 : -1); // 浅层向上拱、深层向下拱，避免越出画布
              const p = clamp(prog * 1.15 - (c - j) * 0.02, 0, 1);
              if (p <= 0) continue;
              ctx.strokeStyle = rgba(TYPE_COLOR[ty], ty === 'vis' ? 0.8 : 0.9);
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              const steps = 16;
              for (let k = 0; k <= steps; k++) {
                const u = (k / steps) * p;
                const bx = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * ((x0 + xj) / 2) + u * u * xj;
                const by = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * (y0 - lift * 2) + u * u * y0;
                if (k === 0) ctx.moveTo(bx, by);
                else ctx.lineTo(bx, by);
              }
              ctx.stroke();
              if (p >= 1) {
                ctx.strokeStyle = rgba(TYPE_COLOR[ty], 0.95);
                ctx.lineWidth = 1.5;
                rr(ctx, xj - Math.min(cw, rh) * 0.4, y0 - Math.min(cw, rh) * 0.4, Math.min(cw, rh) * 0.8, Math.min(cw, rh) * 0.8, 4);
                ctx.stroke();
              }
            }
            ctx.lineWidth = 1;
            const nRead = PROMPT.filter((ty) => !(ty === 'vis' && row >= F)).length + (c - PROMPT.length);
            ctx.fillStyle = 'rgba(6,12,34,0.85)';
            rr(ctx, x0 + 8, y0 - 22, 58, 16, 8);
            ctx.fill();
            txt(ctx, `${mark} 读 ${nRead} 个`, x0 + 37, y0 - 14, { size: 10, color: C.moon, align: 'center', weight: 700 });
          };
          if (F > 0) drawReads(shallow, easeOut(g1), '①');
          drawReads(deep, easeOut(g2), '②');
        }
        // 挑战：已作答时给所选列 / 区域描边
        if (q && qPicked) {
          ctx.strokeStyle = qPicked === q.answer ? C.ok : C.warn;
          ctx.lineWidth = 2;
          if (sid === 'cache') {
            const y0 = qPicked === 'shallow' ? yK : top - 4;
            const y1 = qPicked === 'shallow' ? bottom + 2 : yK;
            rr(ctx, left - 30, y0, right - left + 34, y1 - y0, 6);
          } else {
            const g = geo.current.cols.find((cc) => cc.ty === qPicked);
            if (g) rr(ctx, g.x0 + 1, top - 4, g.x1 - g.x0 - 2, bottom - top + 8, 6);
          }
          ctx.stroke();
          ctx.lineWidth = 1;
        }
        pill(ctx, conv === 'code' ? `layer_idx == ${K} 时撤出（第 ${K + 1} 层起无视觉）` : `第 K = ${K} 层起无视觉（Eq. 5）`, X(2) - cw / 2, yK - 12, { size: 10, color: C.vis, maxX: right });
        const pp = pulse.p(t, final);
        if (pp >= 0) {
          ripple(ctx, (X(2) + X(6)) / 2, yK, easeOut(pp), C.vis, 50);
          anim.moving = true;
        }
        return anim.moving;
      },
    },
    [step, K, conv, blocked, qPicked]
  );

  const go = (d: number) => {
    const n = clamp(step + d, 0, STEPS.length - 1);
    setStep(n);
    if (STEPS[n] === 'withdraw') pulse.fire(performance.now() / 1000);
  };
  const answer = (v: string) => {
    if (!q || qPicked !== null) return;
    setAnswers((a) => ({ ...a, [q.id]: v }));
    ch.record(q.id, v === q.answer);
  };
  const onTap = (x: number, y: number) => {
    if (!q || qPicked !== null) return;
    if (sid === 'cache') {
      if (y >= geo.current.top - 10 && y <= geo.current.bottom) answer(y > geo.current.split ? 'shallow' : 'deep');
      return;
    }
    const g = geo.current.cols.find((c) => x >= c.x0 && x <= c.x1);
    if (g && g.ty !== 'out') answer(g.ty);
  };

  const info = useMemo(() => {
    const deepN = N - F;
    const map: Record<StepId, { title: string; text: React.ReactNode }> = {
      input: { title: '① 拼接输入', text: <>X₁ = [S, 𝒱, I]：2 个系统 + 5 个视觉 + 2 个问题 token，位置编号 0–8（Eq. 2）。</> },
      shallow: { title: `② 第 1–${F} 层：照常计算`, text: <>前 {F} 层每层都算全部 9 个 token。代码里条件 <code>layer_idx == k</code> 还不成立。</> },
      withdraw: {
        title: '③ 撤出：切掉视觉 token',
        text: (
          <>
            进入第 {F + 1} 层前，把 hidden_states 与 position_ids 中视觉 token 那一段切掉（代码 L313–314）。剩下 4 个文字 token，<b>保留原位置编号</b> 0、1、7、8。
          </>
        ),
      },
      deep: { title: `④ 第 ${F + 1}–${N} 层：只算文字`, text: <>后 {deepN} 层每层只算 4 个 token。视觉信息只能通过已经吸收了它的文字 token 继续往下传。</> },
      cache: { title: '⑤ 预填充结束：各层的 KV 缓存', text: <>浅层每层缓存 9 个 token，深层每层只缓存 4 个。之后的解码步不再撤出（条件里 <code>{'seq_length > 1'}</code> 不成立）。</> },
      dec1: {
        title: '⑥ 解码第 1 个词（决定性的一步）',
        text: (
          <>
            新 token（位置 9）逐层计算：在浅层 ① 读 9 个缓存 + 自己，<b>包含视觉 token</b>；在深层 ② 只读 4 个文字缓存 + 自己。
          </>
        ),
      },
      dec2: { title: '⑦ 解码第 2 个词', text: <>同样的规则：① 读 9 + 2 个，② 读 4 + 2 个。缓存只增不改，所以与 KV Cache 完全兼容。</> },
    };
    return map[sid];
  }, [sid, F]);

  const codePanel = (
    <div className="codebox">
      <div className="codebox-head">
        <span>
          官方代码 · VTW.py（sys / img 为每个样本的系统、视觉 token 数）
        </span>
        <a href={CODE_URL('llava/model/language_model/VTW.py', 308, 337)} target="_blank" rel="noopener noreferrer">
          L308–337 ↗
        </a>
      </div>
      <div className="code-scroll" role="region" aria-label="代码，可横向滚动" tabIndex={0}>
        <ol className="code">
          {CODE.filter((c) => showCode || !narrow || HL[sid].includes(c.n)).map((c) => (
            <li key={c.n} className={HL[sid].includes(c.n) ? 'is-hl' : ''}>
              <span className="ln">{c.n}</span>
              <span className="lc" style={{ paddingLeft: `${c.ind * 1.1}em` }}>
                {c.t}
              </span>
            </li>
          ))}
        </ol>
      </div>
      {narrow && !showCode && HL[sid].length === 0 ? <p className="code-empty">这一步不涉及撤出代码（系统 / 视觉 token 数由 llava_arch.py L261–262 写入）。</p> : null}
      {narrow ? (
        <button type="button" className="btn btn-ghost" onClick={() => setShowCode((v) => !v)} aria-expanded={showCode}>
          {showCode ? '只看本步高亮行' : '展开全部代码'}
        </button>
      ) : null}
    </div>
  );

  return (
    <div className="mod-stack">
      <div className="mod-toolbar">
        <ModeSwitch
          ch={{
            ...ch,
            setMode: (m) => {
              ch.setMode(m);
              setAnswers({});
              setStep(0);
            },
          }}
        />
        <Tags kinds={['demo', 'code']} />
        <EvChip id="cDrop" />
      </div>
      {/* 桌面：左侧画布 + 控件，右侧“本步解释 → 按钮 → 代码”，两栏高度接近；手机：画布 → 本步解释 → 按钮 → 代码 → 控件 */}
      <div className="stepper">
        <div className="st-stage">
          <StageBox s={s} onTap={onTap} label={`第 ${step + 1}/${STEPS.length} 步：${info.title}。${conv === 'code' ? `前 ${F} 层带视觉 token（代码口径）` : `前 ${F} 层带视觉 token（Eq. 5 口径）`}`} />
        </div>
        <div className="st-side">
          <div className="step-explain">
            <div className="step-k">
              第 {step + 1} / {STEPS.length} 步
            </div>
            <h4>{info.title}</h4>
            {q ? (
              <Guess q={q.ask} options={q.options} answer={q.answer} picked={qPicked} onPick={answer} explain={<p>{info.text}</p>} canvasHint={`${q.how}，或点下面的选项`} />
            ) : (
              <Feedback tone="info" k={`${sid}-${F}`} lead={info.text} />
            )}
          </div>
          <div className="ctrl-row step-btns">
            <Btn onClick={() => go(-1)} disabled={step === 0}>
              上一步
            </Btn>
            <Btn primary onClick={() => go(1)} disabled={step === STEPS.length - 1 || blocked}>
              {blocked ? '先作答' : '下一步'}
            </Btn>
            <Btn onClick={() => { setStep(0); setAnswers({}); }}>回到起点</Btn>
          </div>
          {ch.guessing ? <ScoreBar ch={ch} onRestart={() => { setAnswers({}); setStep(0); }} /> : null}
          {codePanel}
        </div>
        <div className="st-ctrl">
          <Controls>
            <Slider label="撤出层 K" value={K} min={2} max={7} onChange={setK} display={`K = ${K}`} />
            <Seg
              small
              label="层号口径"
              value={conv}
              onChange={setConv}
              options={[
                { value: 'code', label: '代码 / 表 1：前 K 层' },
                { value: 'eq5', label: 'Eq. (5)：前 K−1 层' },
              ]}
            />
          </Controls>
        </div>
      </div>
    </div>
  );
};
