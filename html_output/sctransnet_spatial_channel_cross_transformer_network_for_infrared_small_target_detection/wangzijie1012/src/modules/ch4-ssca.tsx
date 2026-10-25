import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, Chips, Readouts, Feedback, Source, Stepper, FONT_SANS, FONT_MONO, PaperImage } from './kit';

// 模块 4.1：逐步计算 SSCA（式 8–14），以 256×256 输入为例（h = w = 16，hw = 256，C_Σ = 480）。
// 张量按真实形状等比例绘制：高度 ∝ 通道数，宽度 ∝ 空间位置数或通道数。

const CH = [32, 64, 128, 256];
const CS = 480;
const HW = 256;
const SUB = '₁₂₃₄';
const LAMBDA = Math.sqrt(CS);

interface StepDef {
  op: string;
  eq: string;
  focus: ('q' | 'k' | 'a' | 'v' | 'o')[];
  text: (i: number) => React.ReactNode;
}

const STEPS: StepDef[] = [
  {
    op: 'LN',
    eq: '式 (8)(9)',
    focus: ['q', 'k'],
    text: (i) => (
      <>
        先做层归一化：J{SUB[i]} = LN(I{SUB[i]})，形状 {CH[i]}×16×16；同时把四路嵌入沿通道拼接再归一化，得到 J<sub>Σ</sub>，形状 480×16×16。
      </>
    ),
  },
  {
    op: '1×1 逐点卷积',
    eq: '式 (12)',
    focus: ['q', 'k', 'v'],
    text: () => <>1×1 卷积 W<sub>p</sub> 在每个空间位置上混合通道信息，不看邻域。Q 用本层的 J<sub>i</sub>，K 与 V 都用 J<sub>Σ</sub>。</>,
  },
  {
    op: '3×3 深度卷积',
    eq: '式 (12)',
    focus: ['q', 'k', 'v'],
    text: () => (
      <>
        3×3 深度卷积 W<sub>d</sub> 在每个通道内部聚合 3×3 邻域——这就是“空间嵌入”。原文认为它以很小的代价突出局部空间上下文，提高小目标的显著性。
      </>
    ),
  },
  {
    op: '展平',
    eq: '§III-B1',
    focus: ['q', 'k', 'v'],
    text: (i) => (
      <>
        把空间维展平：Q{SUB[i]} 变为 {CH[i]}×256，K 与 V 变为 480×256。此后每个<b>通道</b>是一个“token”，它的特征是 256 个位置上的响应。
      </>
    ),
  },
  {
    op: 'Q Kᵀ / λ',
    eq: '式 (14)',
    focus: ['q', 'k', 'a'],
    text: (i) => (
      <>
        Q{SUB[i]}Kᵀ 沿 256 个空间位置做内积，得到 {CH[i]}×480 的通道相关矩阵，再除以温度 λ = √C<sub>Σ</sub> = √480 ≈ {LAMBDA.toFixed(2)}。矩阵的大小只与通道数有关，与 h、w 无关。
      </>
    ),
  },
  {
    op: 'IN + Softmax',
    eq: '式 (14)',
    focus: ['a'],
    text: (i) => (
      <>
        对相关矩阵做实例归一化 𝓘(·)，再逐行 Softmax，得到注意力图 A{SUB[i]}：第 {i + 1} 层的每个通道在全部 480 个通道上分配一组和为 1 的权重——这 480 个通道来自四个层级。
      </>
    ),
  },
  {
    op: '× V',
    eq: '式 (14)',
    focus: ['a', 'v', 'o'],
    text: (i) => (
      <>
        A{SUB[i]}V：用这组权重对 V 的 480 个通道加权求和，输出 {CH[i]}×256，即第 {i + 1} 层每个通道都变成四层通道的混合。
      </>
    ),
  },
  {
    op: '1×1 投影',
    eq: '式 (13)',
    focus: ['o'],
    text: (i) => <>还原为 {CH[i]}×16×16，并经 1×1 卷积 W<sub>pi</sub> 得到 CA{SUB[i]}。</>,
  },
  {
    op: '+ 残差',
    eq: '式 (10)',
    focus: ['o'],
    text: (i) => (
      <>
        与输入相加：P{SUB[i]} = SSCA(…) + I{SUB[i]}，形状仍为 {CH[i]}×16×16，随后送入 CFN（第 6 章）。四个层级各自做同样的计算，共用同一组 K、V。
      </>
    ),
  },
];

export const SscaLab: React.FC<WidgetProps> = () => {
  const [lv, setLv] = useState(0);
  const [step, setStep] = useState(4);
  const st = STEPS[step];
  const on = (k: 'q' | 'k' | 'a' | 'v' | 'o') => st.focus.includes(k);
  const ci = CH[lv];
  const s = 0.5; // 每个通道的像素高度
  const wHW = 120; // 256 个位置的显示宽度
  const wCS = CS * s; // 480 个通道的显示宽度（与高度同一比例）
  const hQ = ci * s;
  const hK = wHW;
  const yMid = 165;
  const xQ = 24;
  const xK = xQ + wHW + 36;
  const xA = xK + wCS + 36;
  const xV = xA + wCS + 36;
  const xO = xV + wHW + 36;
  const W = xO + wHW + 20;
  const H = 334;
  const bandW = CH.map((c) => c * s);
  const box = (x: number, y: number, w: number, h: number, k: 'q' | 'k' | 'a' | 'v' | 'o', color: string) => (
    <rect x={x} y={y} width={w} height={h} fill={color} fillOpacity={on(k) ? 0.16 : 0.05} stroke={color} strokeOpacity={on(k) ? 1 : 0.35} strokeWidth={on(k) ? 1.6 : 1} />
  );
  const label = (x: number, y: number, t: React.ReactNode, sub: string, k: 'q' | 'k' | 'a' | 'v' | 'o') => (
    <g opacity={on(k) ? 1 : 0.5}>
      <text x={x} y={y} textAnchor="middle" fontSize={14} fontWeight={700} fill={C.ink}>
        {t}
      </text>
      <text x={x} y={y + 16} textAnchor="middle" fontSize={11} fill={C.muted} fontFamily={FONT_MONO}>
        {sub}
      </text>
    </g>
  );

  return (
    <div className="sx-lab">
      <Chips label="查询层级" value={lv} onChange={setLv} options={[0, 1, 2, 3].map((i) => ({ value: i, label: `Q${SUB[i]} · C${SUB[i]} = ${CH[i]}` }))} />
      <ol className="sx-pipeline">
        {STEPS.map((x, i) => (
          <li key={i} className={i === step ? 'on' : i < step ? 'done' : ''}>
            <button type="button" onClick={() => setStep(i)}>
              {x.op}
            </button>
          </li>
        ))}
      </ol>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="sx-diagram" role="img" aria-label="SSCA 的张量形状">
        <g fontFamily={FONT_SANS}>
          {/* Q_i */}
          {box(xQ, yMid - hQ / 2, wHW, hQ, 'q', C.blue)}
          {label(xQ + wHW / 2, yMid + Math.max(hQ, 40) / 2 + 26, <>Q{SUB[lv]}</>, `${ci}×${HW}`, 'q')}
          <text x={xQ + wHW + 18} y={yMid + 5} textAnchor="middle" fontSize={16} fill={C.muted}>×</text>
          {/* K^T : hw × 480 */}
          {box(xK, yMid - hK / 2, wCS, hK, 'k', C.purple)}
          {label(xK + wCS / 2, yMid + hK / 2 + 26, <>Kᵀ</>, `${HW}×${CS}`, 'k')}
          <text x={xA - 18} y={yMid + 5} textAnchor="middle" fontSize={16} fill={C.muted}>=</text>
          {/* A_i : C_i × 480，四个来源色带 */}
          {(() => {
            let x = xA;
            return CH.map((c, k) => {
              const w = bandW[k];
              const el = (
                <rect key={k} x={x} y={yMid - hQ / 2} width={w} height={hQ} fill={C.purple} fillOpacity={on('a') ? 0.1 + k * 0.08 : 0.05} stroke={C.purple} strokeOpacity={on('a') ? 0.9 : 0.3} strokeWidth={on('a') ? 1.2 : 0.8} />
              );
              x += w;
              return el;
            });
          })()}
          {on('a') ? (
            (() => {
              let x = xA;
              return CH.map((c, k) => {
                const cx = x + bandW[k] / 2;
                x += bandW[k];
                return (
                  <text key={k} x={cx} y={yMid - hQ / 2 - 8} textAnchor="middle" fontSize={10.5} fill={C.purple} fontFamily={FONT_MONO}>
                    {`E${SUB[k]}`}
                  </text>
                );
              });
            })()
          ) : null}
          {label(xA + wCS / 2, yMid + Math.max(hQ, 40) / 2 + 26, <>A{SUB[lv]}</>, `${ci}×${CS}`, 'a')}
          <text x={xV - 18} y={yMid + 5} textAnchor="middle" fontSize={16} fill={C.muted}>×</text>
          {/* V : 480 × hw */}
          {box(xV, yMid - wCS / 2, wHW, wCS, 'v', C.purple)}
          {label(xV + wHW / 2, yMid + wCS / 2 + 26 > H - 20 ? H - 30 : yMid + wCS / 2 + 26, <>V</>, `${CS}×${HW}`, 'v')}
          <text x={xO - 18} y={yMid + 5} textAnchor="middle" fontSize={16} fill={C.muted}>=</text>
          {box(xO, yMid - hQ / 2, wHW, hQ, 'o', C.green)}
          {label(xO + wHW / 2, yMid + Math.max(hQ, 40) / 2 + 26, <>输出</>, `${ci}×${HW}`, 'o')}
        </g>
      </svg>
      <Stepper step={step} total={STEPS.length} onStep={setStep} labels={STEPS.map((x) => x.op)} />
      <Readouts
        cols={4}
        items={[
          { k: <>注意力图 A{SUB[lv]}</>, v: `${ci}×${CS}`, tone: 'blue' },
          { k: '矩阵元素数', v: (ci * CS).toLocaleString('en-US') },
          { k: '温度 λ = √480', v: LAMBDA.toFixed(2) },
          { k: '当前步骤', v: st.eq, tone: 'muted' },
        ]}
      />
      <Feedback tone={step >= 6 ? 'good' : 'info'}>{st.text(lv)}</Feedback>
      <details className="sx-details">
        <summary>对照原文图 3（SCTB：左为 SSCA，右为 CFN）</summary>
        <PaperImage src="./images/fig3.png" alt="原文图 3：SCTB 结构" caption="原文图 3（p.5）。(a) SSCA：四路 Jᵢ 经 1×1 与 3×3 深度卷积生成 Qᵢ，拼接的 JΣ 生成 K、V；(b) CFN。" />
      </details>
      <Source>
        依据：§III-B1，式 (8)–(14)，图 3(a)。形状以 256×256 输入为例：h = w = 256/16 = 16。C<sub>Σ</sub> = 32 + 64 + 128 + 256 = 480 由拼接得到（作者代码中 KV_size = 480）。原文称 λ 为“可选的温度因子”，取 √C<sub>Σ</sub>；“IN”指实例归一化。
      </Source>
    </div>
  );
};
