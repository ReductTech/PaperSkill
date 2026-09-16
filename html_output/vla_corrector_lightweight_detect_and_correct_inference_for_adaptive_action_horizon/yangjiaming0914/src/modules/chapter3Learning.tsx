import React, { useEffect, useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { MathMLCard, MathSym, Upright } from './mathml';
import { ChipButton, COLORS, Feedback, easeInOutCubic, useRememberedState, useTweenedNumber } from './shared';

const BEFORE = [0.28, 0.68, 0.37, 0.56, 0.32, 0.76];
const AFTER = [0.46, 0.57, 0.61, 0.49, 0.51, 0.67];
const RECEIPT_STEPS = [
  ['记录动作前画面', '相机得到真实观测 oₜ，冻结视觉编码器把它写成特征 Zₜʳᵉᵃˡ。'],
  ['执行这段动作', '机械臂和物体真实移动 k 步；此刻只有动作过程，还不能计算动作后的特征差。'],
  ['记录动作后画面', '新的真实观测 oₜ₊ₖ 到达，同一个冻结编码器得到 Zₜ₊ₖʳᵉᵃˡ。'],
  ['动作后减动作前', '两行特征逐项相减，得到训练 Corrector 所用的真实潜变量残差 ΔZ*。'],
] as const;

function Bowl({ x = 238 }: { x?: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <path d="M-23 104 Q-19 122 0 125 Q19 122 23 104 Z" fill={COLORS.recoverySoft} stroke={COLORS.recovery} strokeWidth="3.5" />
      <ellipse cx="0" cy="104" rx="23" ry="6" fill={COLORS.surface} stroke={COLORS.recovery} strokeWidth="3.5" />
      <path d="M-17 104 Q0 111 17 104" fill="none" stroke={COLORS.recovery} strokeOpacity=".48" strokeWidth="2" />
    </g>
  );
}

function ArmReceiptScene({ motion, observing }: { motion: number; observing: boolean }) {
  const eased = easeInOutCubic(Math.max(0, Math.min(1, motion)));
  const handX = 142 + 50 * eased;
  const handY = 92 - 25 * eased;
  return (
    <svg viewBox="0 0 520 225" role="img" aria-label="机械臂在动作前后真实移动，目标碗始终开口向上">
      <rect width="520" height="225" rx="10" fill={COLORS.surfaceSoft} />
      <rect y="169" width="520" height="56" fill={COLORS.table} />
      <g transform="translate(210 48) scale(1.12)"><Bowl /></g>
      <g transform="translate(34 47) scale(1.18)">
        <rect x="10" y="103" width="45" height="20" rx="5" fill={COLORS.normalSoft} stroke={COLORS.normal} strokeWidth="3" />
        <line x1="43" y1="103" x2="82" y2="69" stroke={COLORS.normal} strokeWidth="12" strokeLinecap="round" />
        <circle cx="82" cy="69" r="9" fill={COLORS.surface} stroke={COLORS.normal} strokeWidth="5" />
        <line x1="82" y1="69" x2={handX - 24} y2={handY - 8} stroke={COLORS.normal} strokeWidth="11" strokeLinecap="round" />
        <circle cx={handX - 24} cy={handY - 8} r="8" fill={COLORS.surface} stroke={COLORS.normal} strokeWidth="5" />
        <line x1={handX - 24} y1={handY - 8} x2={handX} y2={handY} stroke={COLORS.normal} strokeWidth="9" strokeLinecap="round" />
        <path d={`M${handX - 2} ${handY - 7} L${handX + 8} ${handY - 13} M${handX - 2} ${handY + 7} L${handX + 8} ${handY + 13}`} stroke={COLORS.normal} strokeWidth="4" strokeLinecap="round" />
        <rect x={handX + 7} y={handY - 7} width="15" height="15" rx="3" fill={COLORS.actual} />
      </g>
      <g transform="translate(474 30)">
        <rect x="-20" y="-12" width="33" height="24" rx="5" fill={observing ? COLORS.predictionSoft : COLORS.surfaceSoft} stroke={observing ? COLORS.prediction : COLORS.pending} strokeWidth="2" />
        <circle cx="-4" cy="0" r="5" fill={COLORS.surface} stroke={observing ? COLORS.prediction : COLORS.pending} strokeWidth="2" />
        <path d="M13 -6 L23 -12 L23 12 L13 6 Z" fill={observing ? COLORS.prediction : COLORS.pending} />
      </g>
      <text x="24" y="28" fill={COLORS.muted} fontSize="13">同一场景 · 同一冻结编码器</text>
      <text x="496" y="62" textAnchor="end" fill={observing ? COLORS.predictionInk : COLORS.muted} fontSize="12">{observing ? '保存这一帧' : '动作进行中'}</text>
    </svg>
  );
}

function FeatureStrip({ label, values, tone, visible, signed = false }: { label: string; values: number[]; tone: 'purple' | 'orange' | 'green'; visible: boolean; signed?: boolean }) {
  return (
    <div className={`feature-strip ${tone} ${visible ? 'visible' : ''}`}>
      <span>{label}</span>
      <div>{values.map((value, index) => <i key={index} style={{ opacity: visible ? 1 : .55 }}><b style={{ height: `${Math.max(18, Math.abs(value) * 100)}%` }} />{signed ? `${value > 0 ? '+' : ''}${value.toFixed(2)}` : value.toFixed(2)}</i>)}</div>
    </div>
  );
}

function ResidualFormula({ stage }: { stage: number }) {
  return (
    <MathMLCard title="从两帧真实观测得到训练目标" lead="动作前后使用同一个冻结视觉编码器；真实残差来自两次编码结果之差，Corrector 再学习预测这个变化。" source="论文第 4 页 · 公式 (2)–(3)" activeKey={`residual-${stage}`}>
      <math display="block" aria-label="动作前编码、动作后编码、真实残差和Corrector预测残差">
        <mtable rowspacing="1.10em" columnalign="right center left">
          <mtr data-focus={stage === 0 ? 'true' : undefined}><mtd><MathSym id="z_before" label="动作前真实特征" tip="t 时刻的相机观测 oₜ 经过冻结视觉编码器 E 得到 Zₜʳᵉᵃˡ。"><msubsup><mi>Z</mi><mi>t</mi><Upright>real</Upright></msubsup></MathSym></mtd><mtd><mo>=</mo></mtd><mtd><MathSym id="encode_before" label="编码动作前观测" tip="E 是冻结视觉编码器，oₜ 是动作开始前真实到达的图像。"><mrow><mi>E</mi><mo>(</mo><msub><mi>o</mi><mi>t</mi></msub><mo>)</mo></mrow></MathSym></mtd></mtr>
          <mtr data-focus={stage === 2 ? 'true' : undefined}><mtd><MathSym id="z_after" label="动作后真实特征" tip="动作真正执行 k 步后，新观测 oₜ₊ₖ 经过同一个冻结编码器得到特征。"><msubsup><mi>Z</mi><mrow><mi>t</mi><mo>+</mo><mi>k</mi></mrow><Upright>real</Upright></msubsup></MathSym></mtd><mtd><mo>=</mo></mtd><mtd><MathSym id="encode_after" label="编码动作后观测" tip="oₜ₊ₖ 在动作执行后才到达，因此真实残差不是提前预知的。"><mrow><mi>E</mi><mo>(</mo><msub><mi>o</mi><mrow><mi>t</mi><mo>+</mo><mi>k</mi></mrow></msub><mo>)</mo></mrow></MathSym></mtd></mtr>
          <mtr data-focus={stage === 3 ? 'true' : undefined}><mtd><MathSym id="real_delta" label="真实潜变量残差" tip="动作后真实特征减去动作前真实特征，是训练 Corrector 的监督目标。"><msubsup><mrow><mo>Δ</mo><mi>Z</mi></mrow><mrow><mi>t</mi><mo>+</mo><mi>k</mi></mrow><mo>*</mo></msubsup></MathSym></mtd><mtd><mo>=</mo></mtd><mtd><mrow><MathSym id="z_after_term" label="动作后特征项" tip="执行 k 步后的真实视觉特征。"><msubsup><mi>Z</mi><mrow><mi>t</mi><mo>+</mo><mi>k</mi></mrow><Upright>real</Upright></msubsup></MathSym><mo>−</mo><MathSym id="z_before_term" label="动作前特征项" tip="动作执行前保存的真实视觉特征。"><msubsup><mi>Z</mi><mi>t</mi><Upright>real</Upright></msubsup></MathSym></mrow></mtd></mtr>
          <mtr><mtd><MathSym id="pred_delta" label="Corrector 预测残差" tip="轻量 Corrector 根据当前真实特征与动作，预测动作应造成的潜变量变化。"><msub><mrow><mo>Δ</mo><mover accent="true"><mi>Z</mi><mo>ˆ</mo></mover></mrow><mrow><mi>t</mi><mo>+</mo><mi>k</mi></mrow></msub></MathSym></mtd><mtd><mo>=</mo></mtd><mtd><MathSym id="corrector_map" label="轻量 Corrector Mφ" tip="Mφ 预测动作效果，不负责生成或执行机器人动作。"><mrow><msub><mi>M</mi><mi>φ</mi></msub><mo>(</mo><msubsup><mi>Z</mi><mi>t</mi><Upright>real</Upright></msubsup><mo>,</mo><msub><mi>a</mi><mi>t</mi></msub><mo>)</mo></mrow></MathSym></mtd></mtr>
        </mtable>
      </math>
    </MathMLCard>
  );
}

export function ResidualObserver(_: WidgetProps) {
  const [stage, setStage] = useRememberedState('residual-receipt-stage-v6', 0);
  const [playing, setPlaying] = useState(false);
  const animatedStage = useTweenedNumber(stage, 440);
  const delta = useMemo(() => AFTER.map((value, index) => value - BEFORE[index]), []);
  const motion = stage === 0 ? 0 : stage === 1 ? Math.max(0, Math.min(1, animatedStage)) : 1;

  useEffect(() => {
    if (!playing) return;
    if (stage >= 3) { setPlaying(false); return; }
    const timer = window.setTimeout(() => setStage((value) => Math.min(3, value + 1)), 1350);
    return () => window.clearTimeout(timer);
  }, [playing, setStage, stage]);

  return (
    <div className="v2-widget residual-focus-lab">
      <div className="receipt-stepper" role="tablist" aria-label="真实残差的四步时间流水线">{RECEIPT_STEPS.map(([title], index) => <button type="button" role="tab" aria-selected={stage === index} className={`${stage === index ? 'active' : ''} ${stage > index ? 'done' : ''}`} key={title} onClick={() => { setPlaying(false); setStage(index); }}><span>{index + 1}</span>{title}</button>)}</div>
      <div className="receipt-focus-layout">
        <div className="receipt-main-scene"><div className="scene-time"><b>{stage === 0 ? 't' : stage === 1 ? 't → t+k' : 't+k'}</b><span>{stage === 1 ? '机械臂正在真实执行动作' : '相机保存真实观测'}</span></div><ArmReceiptScene motion={motion} observing={stage !== 1} /></div>
        <aside className="receipt-current-evidence"><span>当前证据</span><h3>{RECEIPT_STEPS[stage][0]}</h3><p>{RECEIPT_STEPS[stage][1]}</p><div className="receipt-causal-line"><i className="on">真实画面</i><b>→</b><i className={stage !== 1 ? 'on purple' : ''}>冻结特征</i><b>→</b><i className={stage === 3 ? 'on green' : ''}>真实残差</i></div></aside>
      </div>
      <div className={`feature-ledger-simple ${stage === 3 ? 'subtracting' : ''}`}><FeatureStrip label="动作前 Zₜʳᵉᵃˡ" values={BEFORE} tone="purple" visible /><FeatureStrip label="动作后 Zₜ₊ₖʳᵉᵃˡ" values={AFTER} tone="orange" visible={stage >= 2} /><FeatureStrip label="相减得到 ΔZ*" values={delta} tone="green" visible={stage >= 3} signed /></div>
      <div className="mission-controls"><button type="button" className="tiny primary" onClick={() => { if (stage >= 3) setStage(0); setPlaying((value) => !value); }}>{playing ? '暂停' : stage >= 3 ? '从头再看' : '连续播放'}</button><button type="button" className="tiny" disabled={stage === 0} onClick={() => { setPlaying(false); setStage((value) => Math.max(0, value - 1)); }}>上一步</button><button type="button" className="tiny" disabled={stage >= 3} onClick={() => { setPlaying(false); setStage((value) => Math.min(3, value + 1)); }}>下一步</button></div>
      <Feedback tone={stage === 3 ? 'good' : 'aux'}>{stage === 3 ? '真实残差已经得到：它是两次真实观测的冻结特征之差，不是机械臂在画面中的二维位移。' : '动作后的画面尚未到达，因此系统还不能得到真实残差。'}</Feedback>
      <ResidualFormula stage={stage} />
    </div>
  );
}

type LossMode = 'l2' | 'cos' | 'combined';
const LOSS_COPY: Record<LossMode, { title: string; purpose: string }> = {
  l2: { title: '只用残差 L2 项', purpose: '直接缩短两个向量端点的距离，因此长度和方向都会一起变化。' },
  cos: { title: '只用余弦方向项', purpose: '把预测方向转向真实残差，但不要求两条箭头一样长。' },
  combined: { title: '论文的组合损失', purpose: '既约束完整残差，又额外强调方向一致。' },
};

function predictedVector(mode: LossMode, progress: number) {
  const t = easeInOutCubic(progress); const start = { x: -70, y: 58 }; const target = { x: 126, y: -72 };
  if (mode === 'l2') return { x: start.x + (target.x - start.x) * t, y: start.y + (target.y - start.y) * t };
  const startAngle = 140 * Math.PI / 180; const targetAngle = Math.atan2(-target.y, target.x); const angle = startAngle + (targetAngle - startAngle) * t;
  const length = mode === 'cos' ? 82 : 82 + (Math.hypot(target.x, target.y) - 82) * t;
  return { x: Math.cos(angle) * length, y: -Math.sin(angle) * length };
}

function lossValues(mode: LossMode, vector: { x: number; y: number }) {
  const target = { x: 126, y: -72 }; const length = Math.hypot(vector.x, vector.y); const targetLength = Math.hypot(target.x, target.y);
  const cosine = length < .001 ? 0 : (vector.x * target.x + vector.y * target.y) / (length * targetLength);
  const normalizedDistance = Math.hypot(vector.x - target.x, vector.y - target.y) / 220;
  const l2 = normalizedDistance * normalizedDistance; const direction = 1 - Math.max(-1, Math.min(1, cosine));
  return { l2, direction, total: mode === 'l2' ? l2 : mode === 'cos' ? direction : l2 + .5 * direction };
}

function CorrectorLossFormula({ mode }: { mode: LossMode }) {
  const l2Active = mode === 'l2' || mode === 'combined';
  const directionActive = mode === 'cos' || mode === 'combined';
  return (
    <MathMLCard title="完整的 Corrector 组合损失" lead={`当前选择“${LOSS_COPY[mode].title}”；完整公式始终保留，只改变大小误差与方向误差的强调程度。`} source="论文第 4 页 · 公式 (4)" activeKey={mode}>
      <math display="block" aria-label="Corrector完整组合训练损失">
        <mrow>
          <MathSym id="loss_corr" label="Corrector 训练损失" tip="训练 Corrector 的总目标，由大小误差和带权重的方向误差相加。"><msub><mi mathvariant="script">L</mi><Upright>corr</Upright></msub></MathSym>
          <mo>=</mo>
          <mrow data-loss-term="l2" data-active={l2Active ? 'true' : 'false'}>
            <munder accentunder="true"><munder accentunder="true"><MathSym id="l2_term" label="残差 L2 项" tip="预测残差与真实残差之差的平方二范数，约束完整向量的大小与位置。"><msubsup><mrow><mo>‖</mo><msub><mrow><mo>Δ</mo><mover accent="true"><mi>Z</mi><mo>ˆ</mo></mover></mrow><mrow><mi>t</mi><mo>+</mo><mi>k</mi></mrow></msub><mo>−</mo><msubsup><mrow><mo>Δ</mo><mi>Z</mi></mrow><mrow><mi>t</mi><mo>+</mo><mi>k</mi></mrow><mo>*</mo></msubsup><mo>‖</mo></mrow><mn>2</mn><mn>2</mn></msubsup></MathSym><mo>⏟</mo></munder><mtext>大小误差</mtext></munder>
          </mrow>
          <mo>+</mo>
          <mrow data-loss-term="direction" data-active={directionActive ? 'true' : 'false'}>
            <MathSym id="beta" label="方向项权重 β" tip="β 控制方向误差在总损失中的相对权重。"><mi>β</mi></MathSym>
            <munder accentunder="true"><munder accentunder="true"><mrow><mo>[</mo><mn>1</mn><mo>−</mo><MathSym id="cos_term" label="余弦相似度 CosSim" tip="比较预测残差与真实残差的方向；两者越同向，方向误差越小。"><mrow><mi mathvariant="normal">CosSim</mi><mo>(</mo><msub><mrow><mo>Δ</mo><mover accent="true"><mi>Z</mi><mo>ˆ</mo></mover></mrow><mrow><mi>t</mi><mo>+</mo><mi>k</mi></mrow></msub><mo>,</mo><msubsup><mrow><mo>Δ</mo><mi>Z</mi></mrow><mrow><mi>t</mi><mo>+</mo><mi>k</mi></mrow><mo>*</mo></msubsup><mo>)</mo></mrow></MathSym><mo>]</mo></mrow><mo>⏟</mo></munder><mtext>方向误差</mtext></munder>
          </mrow>
        </mrow>
      </math>
    </MathMLCard>
  );
}

export function CorrectorTrainer(_: WidgetProps) {
  const [mode, setMode] = useRememberedState<LossMode>('corrector-loss-mode-v6', 'combined');
  const [progress, setProgress] = useRememberedState('corrector-progress-v6', 0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { setProgress(1); setPlaying(false); return; }
    const startValue = progress >= 1 ? 0 : progress; if (progress >= 1) setProgress(0);
    const started = performance.now(); let raf = 0;
    const frame = (now: number) => { const next = Math.min(1, startValue + (now - started) / 2800); setProgress(next); if (next < 1) raf = requestAnimationFrame(frame); else setPlaying(false); };
    raf = requestAnimationFrame(frame); return () => cancelAnimationFrame(raf);
  }, [playing]);

  const vector = predictedVector(mode, progress); const losses = lossValues(mode, vector);
  const history = Array.from({ length: 34 }, (_, index) => lossValues(mode, predictedVector(mode, index / 33)).total); const max = Math.max(...history, .001);
  const curve = history.map((value, index) => `${18 + index * 5.35},${80 - value / max * 58}`).join(' ');
  return (
    <div className="v2-widget corrector-bench-simple">
      <div className="training-task compact"><div><b>让紫色预测逐渐贴近橙色真实残差</b><span>选择一种损失，再播放训练过程，观察方向和长度分别怎样改变。</span></div><span>二维潜变量教学投影</span></div>
      <div className="loss-mode-tabs" role="group" aria-label="选择Corrector训练损失">{(Object.keys(LOSS_COPY) as LossMode[]).map((key) => <ChipButton key={key} selected={mode === key} onClick={() => { setPlaying(false); setMode(key); setProgress(0); }}>{LOSS_COPY[key].title}</ChipButton>)}</div>
      <div className="loss-single-stage">
        <svg viewBox="0 0 640 330" role="img" aria-label="当前损失下预测残差向真实残差靠近">
          <defs>
            <marker id="loss-real-head" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill={COLORS.actual} /></marker>
            <marker id="loss-pred-head" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill={COLORS.prediction} /></marker>
          </defs>
          <rect width="640" height="330" rx="10" fill={COLORS.surface} />
          <line x1="70" y1="246" x2="390" y2="246" stroke={COLORS.grid} />
          <line x1="230" y1="48" x2="230" y2="288" stroke={COLORS.grid} />
          <line x1="230" y1="246" x2="356" y2="174" stroke={COLORS.actual} strokeWidth="6" markerEnd="url(#loss-real-head)" />
          <line x1="230" y1="246" x2={230 + vector.x} y2={246 + vector.y} stroke={COLORS.prediction} strokeWidth="6" markerEnd="url(#loss-pred-head)" />
          <text x="370" y="166" fill={COLORS.actualInk} fontSize="14">真实残差 ΔZ*</text>
          <text x={Math.max(78, Math.min(390, 230 + vector.x))} y={Math.max(36, Math.min(305, 232 + vector.y))} fill={COLORS.predictionInk} fontSize="14" textAnchor="middle">预测残差</text>
          <g transform="translate(430 60)">
            <text x="0" y="0" fill={COLORS.muted} fontSize="13">总损失随训练下降</text>
            <line x1="18" y1="82" x2="198" y2="82" stroke={COLORS.grid} />
            <line x1="18" y1="18" x2="18" y2="82" stroke={COLORS.grid} />
            <polyline points={curve} fill="none" stroke={COLORS.normal} strokeWidth="3" />
            <line x1={18 + progress * 176.5} x2={18 + progress * 176.5} y1="16" y2="84" stroke={COLORS.emphasis} strokeWidth="2" />
          </g>
        </svg>
        <aside className="loss-explanation"><span>当前训练规则</span><h3>{LOSS_COPY[mode].title}</h3><p>{LOSS_COPY[mode].purpose}</p><div><span>残差 L2 项<b>{losses.l2.toFixed(3)}</b></span><span>方向项<b>{losses.direction.toFixed(3)}</b></span><span>当前总损失<b>{losses.total.toFixed(3)}</b></span></div></aside>
      </div>
      <div className="training-progress-row"><button type="button" className="tiny primary" onClick={() => setPlaying((value) => !value)}>{playing ? '暂停训练' : progress >= 1 ? '重新训练' : '开始训练'}</button><label htmlFor="corrector-progress">训练进度 <b>{Math.round(progress * 100)}%</b><input id="corrector-progress" type="range" min="0" max="1" step=".01" value={progress} onChange={(event) => { setPlaying(false); setProgress(Number(event.target.value)); }} /></label></div>
      <Feedback tone={progress >= .98 ? 'good' : 'aux'}>{mode === 'cos' ? (progress > .9 ? '方向已经对齐，但箭头仍可能较短：余弦项不要求长度相同。' : '余弦项正在旋转预测方向；它主要关心是否同向，不负责补齐长度。') : mode === 'l2' ? 'L2 项直接缩小完整向量差距；论文还加入余弦项，明确强调方向一致。' : '组合损失同时约束完整残差与变化方向，这就是论文训练 Corrector 的目标。'}</Feedback>
      <CorrectorLossFormula mode={mode} />
    </div>
  );
}
