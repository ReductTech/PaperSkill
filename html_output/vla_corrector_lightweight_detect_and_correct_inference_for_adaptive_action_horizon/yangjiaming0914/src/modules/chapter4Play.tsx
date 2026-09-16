import React, { useEffect, useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { MathMLCard, MathSym, Upright } from './mathml';
import { ChipButton, COLORS, Feedback, useRememberedState, useTweenedNumber } from './shared';

function ScoreFormula({ angle, zero }: { angle: number; zero: boolean }) {
  const score = 1 - Math.cos(angle * Math.PI / 180);
  return (
    <MathMLCard title="LVM 把方向差换成一个分数" lead={zero ? '真实残差是零向量，方向没有定义，因此这一刻不能直接计算余弦分数。' : `当前夹角 ${Math.round(angle)}°，所以 Eₜ = ${score.toFixed(2)}。`} source="论文第 5 页 · 公式 (5)" activeKey={`score-zero-${zero}`}>
      <math display="block" aria-label="不一致分数和余弦相似度的完整定义">
        <mtable rowspacing="1.10em" columnalign="right center left">
          <mtr><mtd><MathSym id="energy" label="不一致分数 Eₜ" tip="新观测到达后计算的方向不一致程度；同向为 0，正交为 1，反向为 2。"><msub><mi>E</mi><mi>t</mi></msub></MathSym></mtd><mtd><mo>=</mo></mtd><mtd><mrow><mn>1</mn><mo>−</mo><MathSym id="score_cosine" label="预期与真实残差的余弦相似度" tip="比较 Corrector 预测的期望残差与新观测得到的真实残差方向。"><mrow><mi mathvariant="normal">CosSim</mi><mo>(</mo><msubsup><mrow><mo>Δ</mo><mi>Z</mi></mrow><mrow><mi>t</mi><mo>+</mo><mi>k</mi></mrow><Upright>exp</Upright></msubsup><mo>,</mo><msubsup><mrow><mo>Δ</mo><mi>Z</mi></mrow><mrow><mi>t</mi><mo>+</mo><mi>k</mi></mrow><Upright>real</Upright></msubsup><mo>)</mo></mrow></MathSym></mrow></mtd></mtr>
          <mtr><mtd><MathSym id="cosine" label="余弦相似度 CosSim" tip="点积除以两个向量长度的乘积，因此非零向量的整体长度会被归一化。"><mrow><mi mathvariant="normal">CosSim</mi><mo>(</mo><mi>u</mi><mo>,</mo><mi>v</mi><mo>)</mo></mrow></MathSym></mtd><mtd><mo>=</mo></mtd><mtd><mfrac><MathSym id="dot" label="向量点积" tip="uᵀv 随夹角改变：同向为正，正交为零，反向为负。"><mrow><msup><mi>u</mi><mo>⊤</mo></msup><mi>v</mi></mrow></MathSym><MathSym id="norms" label="范数乘积" tip="两个非零向量的长度乘积；如果某个向量为零，方向无法比较。"><mrow><msub><mrow><mo>‖</mo><mi>u</mi><mo>‖</mo></mrow><mn>2</mn></msub><msub><mrow><mo>‖</mo><mi>v</mi><mo>‖</mo></mrow><mn>2</mn></msub></mrow></MathSym></mfrac></mtd></mtr>
        </mtable>
      </math>
    </MathMLCard>
  );
}

export function CosineChallenge(_: WidgetProps) {
  const [angle, setAngle] = useRememberedState('cosine-angle-v6', 35);
  const [length, setLength] = useRememberedState('cosine-length-v6', 1);
  const [dragging, setDragging] = useState(false);
  const animatedAngle = useTweenedNumber(angle, 340, dragging);
  const radians = animatedAngle * Math.PI / 180;
  const radius = 118 * length;
  const origin = { x: 236, y: 238 };
  const actual = { x: origin.x + Math.cos(radians) * radius, y: origin.y - Math.sin(radians) * radius };
  const score = length === 0 ? null : 1 - Math.cos(radians);

  const setFromPointer = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width * 760;
    const py = (event.clientY - rect.top) / rect.height * 340;
    const next = Math.atan2(Math.max(0, origin.y - py), px - origin.x) * 180 / Math.PI;
    setAngle(Math.max(0, Math.min(180, next)));
  };

  return (
    <div className="v2-widget cosine-clear-lab">
      <div className="term-definition-banner"><b>LVM</b><span><strong>Latent space Vision Monitor（潜在空间视觉监视器）</strong>不生成动作；它比较“动作本应造成的视觉特征变化”和“新画面中真实发生的变化”，用来判断旧动作是否开始失效。</span></div>
      <div className="projection-note"><b>紫色表示预期变化，橙色表示新观测中的真实变化</b><span>这是高维视觉特征变化的二维教学投影，不是机械臂末端的物理位移。</span></div>
      <div className="cosine-clear-layout">
        <div className="cosine-vector-stage">
          <svg viewBox="0 0 760 340" tabIndex={0} role="slider" aria-label="拖动橙色真实残差箭头改变与紫色预期残差的夹角" aria-valuemin={0} aria-valuemax={180} aria-valuenow={Math.round(angle)}
            onPointerDown={(event) => { setDragging(true); event.currentTarget.setPointerCapture(event.pointerId); setFromPointer(event); }} onPointerMove={(event) => { if (dragging) setFromPointer(event); }} onPointerUp={() => setDragging(false)} onPointerCancel={() => setDragging(false)}
            onKeyDown={(event) => { if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') { event.preventDefault(); setAngle((value) => Math.max(0, value - 5)); } if (event.key === 'ArrowRight' || event.key === 'ArrowUp') { event.preventDefault(); setAngle((value) => Math.min(180, value + 5)); } }}>
            <defs><marker id="expected-head-v6" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill={COLORS.prediction} /></marker><marker id="actual-head-v6" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill={COLORS.actual} /></marker></defs>
            <rect width="760" height="340" rx="10" fill={COLORS.surface} />
            <path d="M94 238 A142 142 0 0 1 378 238" fill={COLORS.surfaceSoft} stroke={COLORS.grid} strokeWidth="2" />
            {[0, 90, 180].map((degree) => { const a = degree * Math.PI / 180; return <g key={degree}><line x1={origin.x + Math.cos(a) * 136} y1={origin.y - Math.sin(a) * 136} x2={origin.x + Math.cos(a) * 146} y2={origin.y - Math.sin(a) * 146} stroke={COLORS.pending} strokeWidth="2" /><text x={origin.x + Math.cos(a) * 162} y={origin.y + 5 - Math.sin(a) * 162} textAnchor="middle" fill={COLORS.muted} fontSize="13">{degree}°</text></g>; })}
            {animatedAngle > 1 && <path d={`M ${origin.x + 43} ${origin.y} A 43 43 0 0 0 ${origin.x + Math.cos(radians) * 43} ${origin.y - Math.sin(radians) * 43}`} fill="none" stroke={COLORS.primary} strokeWidth="2.5" />}
            <line x1={origin.x} y1={origin.y} x2={origin.x + 118} y2={origin.y} stroke={COLORS.prediction} strokeWidth="5" markerEnd="url(#expected-head-v6)" />
            {length > 0 && <line x1={origin.x} y1={origin.y} x2={actual.x} y2={actual.y} stroke={COLORS.actual} strokeWidth="5" markerEnd="url(#actual-head-v6)" />}
            <circle cx={length > 0 ? actual.x : origin.x} cy={length > 0 ? actual.y : origin.y} r="10" fill={COLORS.surface} stroke={COLORS.actual} strokeWidth="4" />
            <circle cx={origin.x} cy={origin.y} r="5" fill={COLORS.primary} />
            <text x={origin.x + 118} y={origin.y + 32} textAnchor="middle" fill={COLORS.predictionInk} fontSize="13">预期变化</text>
            <text x={Math.max(62, Math.min(430, actual.x))} y={Math.max(36, actual.y - 20)} textAnchor="middle" fill={COLORS.actualInk} fontSize="13">真实变化</text>
            <g transform="translate(472 76)"><text x="0" y="0" fill={COLORS.muted} fontSize="13">方向一致吗？</text><text x="0" y="42" fill={COLORS.primary} fontSize="16">夹角 {Math.round(animatedAngle)}°</text><text x="0" y="101" fill={score !== null && score > 1 ? COLORS.anomaly : COLORS.primary} fontSize="38" fontWeight="800">Eₜ = {score === null ? '—' : score.toFixed(2)}</text><text x="0" y="132" fill={COLORS.muted} fontSize="13">0 同向 · 1 正交 · 2 反向</text></g>
          </svg>
        </div>
        <aside className="cosine-controls-simple">
          <div className="angle-landmarks" role="group" aria-label="三个典型夹角">{[0, 90, 180].map((value) => <ChipButton key={value} selected={Math.round(angle) === value} onClick={() => setAngle(value)}><b>{value}°</b><span>E = {value / 90}</span></ChipButton>)}</div>
          <label htmlFor="actual-vector-length"><span>再验证长度是否影响方向分数</span><b>{length.toFixed(2)}×</b><input id="actual-vector-length" type="range" min="0" max="1.35" step=".05" value={length} onChange={(event) => setLength(Number(event.target.value))} /></label>
        </aside>
      </div>
      <Feedback tone={score === null ? 'warn' : score < .2 ? 'good' : score > 1.4 ? 'bad' : 'aux'}>{score === null ? '真实残差长度为零时没有方向，余弦相似度不能直接计算。' : '拖动橙色端点改变夹角；只改变它的非零长度时，Eₜ 不变，因为这个分数主要比较方向。'}</Feedback>
      <ScoreFormula angle={animatedAngle} zero={score === null} />
    </div>
  );
}

type TriggerMode = 'spike' | 'drift';
type Rule = 'add' | 'hold' | 'reset';
type FormulaPhase = 'stats' | 'threshold' | 'counter';
const BASELINE = [0.20,0.22,0.19,0.23,0.21,0.24,0.20,0.22,0.21,0.19,0.23,0.20,0.22,0.21,0.20];
const SPIKE = [...BASELINE,0.22,1.12,0.23,0.21,0.22,0.20,0.23,0.21,0.22,0.20,0.21,0.23,0.20,0.22,0.21];
const DRIFT = [...BASELINE,0.52,0.61,0.69,0.74,0.79,0.83,0.76,0.68,0.48,0.35,0.27,0.23,0.21,0.20,0.19];

function median(values: number[]) { const sorted = [...values].sort((a, b) => a - b); if (!sorted.length) return 0; const middle = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2; }

function detectorState(values: number[], index: number) {
  let count = 0; let triggeredAt = -1; let safeCount = 0; let resetAt = -1; let med = 0; let mad = 0; let on = .28; let off = .25; let lastRule: Rule = 'reset';
  for (let i = 0; i <= index; i += 1) {
    const window = values.slice(Math.max(0, i - 14), i + 1);
    med = median(window); mad = median(window.map((value) => Math.abs(value - med))); on = med + 3 * mad; off = med + 2 * mad;
    lastRule = values[i] > on ? 'add' : values[i] < off ? 'reset' : 'hold';
    if (triggeredAt < 0) {
      if (lastRule === 'add') count += 1;
      else if (lastRule === 'reset') count = 0;
      if (count >= 5) triggeredAt = i;
    } else if (i > triggeredAt) {
      // Appendix B.1 resets the anomaly counter after an interrupt. Appendix B.2
      // additionally requires five consecutive safe observations before reset.
      count = 0;
      safeCount = lastRule === 'reset' ? safeCount + 1 : 0;
      if (safeCount >= 5 && resetAt < 0) resetAt = i;
    }
  }
  return { count: Math.min(5, count), triggeredAt, safeCount: Math.min(5, safeCount), resetAt, med, mad, on, off, lastRule, cooldown: triggeredAt < 0 ? 0 : Math.max(0, 10 - (index - triggeredAt)) };
}

function TriggerFormula({ phase, setPhase }: { phase: FormulaPhase; setPhase: (phase: FormulaPhase) => void }) {
  return (
    <MathMLCard title="从窗口统计到持续触发" lead="三层公式始终完整显示，按钮只突出当前步骤。" source="论文第 5 页 · 公式 (6)–(7)；第 16 页 · 公式 (12)–(13)" activeKey={phase}>
      <div className="formula-phase-tabs" role="tablist" aria-label="触发公式的三个阶段"><button type="button" role="tab" aria-selected={phase === 'stats'} className={phase === 'stats' ? 'active' : ''} onClick={() => setPhase('stats')}>1 窗口统计</button><button type="button" role="tab" aria-selected={phase === 'threshold'} className={phase === 'threshold' ? 'active' : ''} onClick={() => setPhase('threshold')}>2 双阈值</button><button type="button" role="tab" aria-selected={phase === 'counter'} className={phase === 'counter' ? 'active' : ''} onClick={() => setPhase('counter')}>3 持续触发</button></div>
      <div className="trigger-formula-stack">
        <section className="trigger-formula-layer" data-active={phase === 'stats' ? 'true' : 'false'}><span>1 · 窗口统计</span><math display="block" aria-label="滑动窗口中位数和中位绝对偏差"><mtable rowspacing="1.05em" columnalign="right center left"><mtr><mtd><MathSym id="window_median" label="窗口中位数 Mₑ" tip="最近 15 个不一致分数的中位数；它比均值更不容易被单个尖峰拖动。"><msub><mi>M</mi><mi>e</mi></msub></MathSym></mtd><mtd><mo>=</mo></mtd><mtd><MathSym id="median_op" label="中位数算子 median" tip="把滑动窗口 E_W 中的分数排序后取中间位置。"><mrow><mi mathvariant="normal">median</mi><mo>(</mo><msub><mi>E</mi><mi>W</mi></msub><mo>)</mo></mrow></MathSym></mtd></mtr><mtr><mtd><MathSym id="mad" label="中位绝对偏差 MAD" tip="先求每个分数离窗口中位数的绝对距离，再对这些距离取中位数。"><mi mathvariant="normal">MAD</mi></MathSym></mtd><mtd><mo>=</mo></mtd><mtd><mrow><mi mathvariant="normal">median</mi><mo>(</mo><mo>|</mo><msub><mi>E</mi><mi>i</mi></msub><mo>−</mo><msub><mi>M</mi><mi>e</mi></msub><mo>|</mo><mo>)</mo></mrow></mtd></mtr></mtable></math></section>
        <section className="trigger-formula-layer" data-active={phase === 'threshold' ? 'true' : 'false'}><span>2 · 激活 / 恢复阈值</span><math display="block" aria-label="激活阈值和恢复阈值"><mtable rowspacing="1.05em" columnalign="right center left"><mtr><mtd><MathSym id="threshold_on" label="激活阈值 T_on" tip="窗口中心加 λ_on 倍 MAD；论文运行设置中 λ_on=3。"><msub><mi>T</mi><Upright>on</Upright></msub></MathSym></mtd><mtd><mo>=</mo></mtd><mtd><mrow><msub><mi>M</mi><mi>e</mi></msub><mo>+</mo><MathSym id="lambda_on" label="激活系数 λ_on" tip="控制高阈值离正常中心多远；当前论文设置为 3。"><msub><mi>λ</mi><Upright>on</Upright></msub></MathSym><mi mathvariant="normal">MAD</mi></mrow></mtd></mtr><mtr><mtd><MathSym id="threshold_off" label="恢复阈值 T_off" tip="较低的恢复阈值，用来形成滞回并减少频繁来回切换。"><msub><mi>T</mi><Upright>off</Upright></msub></MathSym></mtd><mtd><mo>=</mo></mtd><mtd><mrow><msub><mi>M</mi><mi>e</mi></msub><mo>+</mo><MathSym id="lambda_off" label="恢复系数 λ_off" tip="论文运行设置为 2，因此 T_off 低于 T_on。"><msub><mi>λ</mi><Upright>off</Upright></msub></MathSym><mi mathvariant="normal">MAD</mi></mrow></mtd></mtr></mtable></math></section>
        <section className="trigger-formula-layer cases-layer" data-active={phase === 'counter' ? 'true' : 'false'}><span>3 · 持续计数与中断</span><math display="block" aria-label="持续计数的三段分段函数和中断条件"><mtable rowspacing="1.10em" columnalign="right center left"><mtr><mtd><MathSym id="counter" label="持续异常计数 cₜ" tip="高于 T_on 加一，低于 T_off 清零，位于两阈值之间保持。"><msub><mi>c</mi><mi>t</mi></msub></MathSym></mtd><mtd><mo>=</mo></mtd><mtd><mrow><mo stretchy="true">{'{'}</mo><mtable rowspacing="0.45em" columnalign="left left"><mtr><mtd><mrow><msub><mi>c</mi><mrow><mi>t</mi><mo>−</mo><mn>1</mn></mrow></msub><mo>+</mo><mn>1</mn></mrow></mtd><mtd><mrow><mtext>if </mtext><msub><mi>E</mi><mi>t</mi></msub><mo>&gt;</mo><msub><mi>T</mi><Upright>on</Upright></msub></mrow></mtd></mtr><mtr><mtd><mn>0</mn></mtd><mtd><mrow><mtext>if </mtext><msub><mi>E</mi><mi>t</mi></msub><mo>&lt;</mo><msub><mi>T</mi><Upright>off</Upright></msub></mrow></mtd></mtr><mtr><mtd><msub><mi>c</mi><mrow><mi>t</mi><mo>−</mo><mn>1</mn></mrow></msub></mtd><mtd><mtext>otherwise</mtext></mtd></mtr></mtable></mrow></mtd></mtr><mtr><mtd><MathSym id="trigger" label="中断条件 interrupt" tip="持续计数达到 patience 参数 p 时才触发动作块中断。"><mtext>interrupt</mtext></MathSym></mtd><mtd><mo>⇔</mo></mtd><mtd><mrow><msub><mi>c</mi><mi>t</mi></msub><mo>≥</mo><mi>p</mi></mrow></mtd></mtr></mtable></math></section>
      </div>
    </MathMLCard>
  );
}

export function RobustTrigger(_: WidgetProps) {
  const [mode, setMode] = useRememberedState<TriggerMode>('trigger-mode-v6', 'spike');
  const [index, setIndex] = useRememberedState('trigger-index-v6', 14);
  const [playing, setPlaying] = useState(false);
  const [formulaPhase, setFormulaPhase] = useState<FormulaPhase>('stats');
  const values = mode === 'spike' ? SPIKE : DRIFT; const state = useMemo(() => detectorState(values, index), [index, values]); const current = values[index]; const triggered = state.triggeredAt >= 0;
  const start = Math.max(0, index - 14); const windowValues = values.slice(start, index + 1); const x = (i: number) => 62 + i * (780 / 14); const y = (value: number) => 232 - value / 1.2 * 184;
  const points = windowValues.map((value, i) => `${x(i)},${y(value)}`).join(' ');

  useEffect(() => { if (!playing) return; if (index >= values.length - 1) { setPlaying(false); return; } const timer = window.setTimeout(() => setIndex((value) => Math.min(values.length - 1, value + 1)), 720); return () => window.clearTimeout(timer); }, [index, playing, setIndex, values.length]);
  useEffect(() => { if (index <= 15) setFormulaPhase('stats'); else if (state.count === 0) setFormulaPhase('threshold'); else setFormulaPhase('counter'); }, [index, state.count]);
  const reset = (nextMode = mode) => { setPlaying(false); setMode(nextMode); setIndex(14); setFormulaPhase('stats'); };
  const afterInterrupt = state.triggeredAt >= 0 && index > state.triggeredAt;
  const justTriggered = state.triggeredAt === index;
  const safelyReset = state.resetAt >= 0 && index >= state.resetAt;
  const ruleText = afterInterrupt
    ? state.lastRule === 'add' ? '仍高于 T_on：偏差尚未消退' : state.lastRule === 'reset' ? `低于 T_off：安全观测 ${state.safeCount}/5` : '位于双阈值之间：等待进一步恢复'
    : state.lastRule === 'add' ? '高于 T_on：计数 +1' : state.lastRule === 'reset' ? '低于 T_off：计数清零' : '位于双阈值之间：计数保持';
  const eventText = mode === 'spike'
    ? (index === 16 ? '短暂遮挡正在发生' : index > 16 ? '遮挡已经消失' : '画面保持正常')
    : index < 15 ? '目标尚未移动' : index <= 22 ? '目标碗移位，偏差持续' : safelyReset ? '观测已连续回到安全范围' : '纠正后，偏差正在回落';
  return (
    <div className="v2-widget trigger-timeline-simple">
      <div className="detector-toolbar"><div className="preset-row" role="group" aria-label="选择观测序列"><ChipButton selected={mode === 'spike'} onClick={() => reset('spike')}>单次遮挡尖峰</ChipButton><ChipButton selected={mode === 'drift'} onClick={() => reset('drift')}>目标持续移位</ChipButton></div><div className="mission-controls"><button type="button" className="tiny primary" onClick={() => setPlaying((value) => !value)}>{playing ? '暂停' : '连续播放'}</button><button type="button" className="tiny" disabled={index >= values.length - 1} onClick={() => { setPlaying(false); setIndex((value) => Math.min(values.length - 1, value + 1)); }}>下一个观测</button><button type="button" className="tiny" onClick={() => reset()}>重置</button></div></div>
      <div className="trigger-story-head"><div><span>第 {index + 1} 步的新观测</span><b>{eventText}</b></div><div className={`trigger-decision ${state.lastRule}`}><span>本步判断</span><b>{ruleText}</b></div></div>
      <div className="threshold-guide" aria-label="激活阈值和恢复阈值的三段判定"><div className="add"><b>Eₜ &gt; T<sub>on</sub></b><span>越过高门槛，异常计数 +1</span></div><div className="hold"><b>T<sub>off</sub> ≤ Eₜ ≤ T<sub>on</sub></b><span>落在滞回区，计数保持</span></div><div className="reset"><b>Eₜ &lt; T<sub>off</sub></b><span>低于恢复门槛，计数清零</span></div></div>
      <div className="trigger-chart-wrap">
        <svg viewBox="0 0 900 270" role="img" aria-label="最近十五步不一致分数、激活阈值和恢复阈值的时间轴"><rect width="900" height="270" rx="9" fill={COLORS.surface} /><rect x="50" y="34" width="804" height="204" fill={COLORS.surfaceSoft} /><line x1="50" x2="854" y1={y(state.on)} y2={y(state.on)} stroke={COLORS.anomaly} strokeWidth="2" strokeDasharray="7 5" /><line x1="50" x2="854" y1={y(state.off)} y2={y(state.off)} stroke={COLORS.emphasis} strokeWidth="2" strokeDasharray="7 5" /><text x="848" y={y(state.on) - 8} textAnchor="end" fill={COLORS.anomalyInk} fontSize="13">T_on {state.on.toFixed(2)}</text><text x="848" y={y(state.off) + 18} textAnchor="end" fill={COLORS.actualInk} fontSize="13">T_off {state.off.toFixed(2)}</text><polyline points={points} fill="none" stroke={COLORS.prediction} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />{windowValues.map((value, i) => <g key={`${start}-${i}`}><circle cx={x(i)} cy={y(value)} r={i === windowValues.length - 1 ? 7 : 4} fill={i === windowValues.length - 1 ? COLORS.actual : COLORS.surface} stroke={value > state.on ? COLORS.anomaly : COLORS.prediction} strokeWidth="3" /><text x={x(i)} y="256" textAnchor="middle" fill={COLORS.muted} fontSize="10">{start + i + 1}</text></g>)}<text x="52" y="24" fill={COLORS.muted} fontSize="13">滑动窗口：最近 {windowValues.length}/15 个 Eₜ</text></svg>
      </div>
      <div className="persistence-strip"><div><span>持续异常计数</span><strong>{state.count} / 5</strong></div><div className="counter-lamps" aria-label={`连续异常计数${state.count}`}>{Array.from({ length: 5 }, (_, lamp) => <i key={lamp} className={lamp < state.count ? 'on' : ''} />)}</div><p>{justTriggered ? '计数刚达到 5 / 5，立即触发中断。' : afterInterrupt ? `中断后异常计数归零；当前安全观测 ${state.safeCount} / 5。` : '只有连续点亮 5 格才触发；单个尖峰不够。'}</p></div>
      {triggered && <div className={`cooldown-line ${safelyReset ? 'safe' : ''}`}><b>{safelyReset ? '已完成安全复位' : justTriggered ? '已触发中断' : '中断后的监控阶段'}</b><span>{safelyReset ? '连续 5 个安全观测已经成立。' : `安全观测 ${state.safeCount} / 5；`} 冷却剩余 {state.cooldown} / 10 步。</span></div>}
      <details className="robust-details"><summary>查看窗口统计</summary><div><span>median = {state.med.toFixed(3)}</span><span>MAD = {state.mad.toFixed(3)}</span><span>论文演示设置：窗口 15、λ_on=3、λ_off=2、连续 5 步、冷却 10 步</span></div></details>
      <Feedback tone={safelyReset ? 'good' : triggered ? 'bad' : mode === 'spike' && index > 17 ? 'good' : 'aux'}>{safelyReset ? '触发后的观测连续 5 步低于恢复阈值，监视器完成安全复位；冷却机制同时避免立刻再次触发。' : triggered ? '持续偏差已经满足触发条件，系统据此截断旧动作；之后仍按新观测判断偏差是否消退。' : mode === 'spike' && index > 17 ? '尖峰过去后 Eₜ 低于 T_off，计数清零，所以没有误触发。' : '每个新观测到达后，Eₜ 都会落入“加一、保持、清零”三个区间之一。'}</Feedback>
      <TriggerFormula phase={formulaPhase} setPhase={setFormulaPhase} />
    </div>
  );
}
