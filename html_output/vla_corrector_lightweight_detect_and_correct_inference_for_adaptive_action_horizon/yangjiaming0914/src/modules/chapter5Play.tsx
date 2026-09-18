import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';
import { MathMLCard, MathSym, Upright } from './mathml';
import { COLORS, Feedback, clearScene, drawBowl, drawObject, drawPath, drawRobotArm, drawText, drawToken, easeInOutCubic, useRememberedState, useResponsiveCanvas, useTweenedNumber } from './shared';

const QUEUE_STEPS = [
  ['正常执行', '机械臂正在消费旧动作块。'],
  ['目标移动', '碗平滑离开原位置，新观测开始偏离预期。'],
  ['持续异常', 'LVM 已连续 5 步越过激活阈值。'],
  ['标记过时', '尚未执行的旧 token 变红，但已执行部分不受影响。'],
  ['截断队列', '红色 token 淡出；本次实际执行时域提前结束。'],
  ['新块接管', '下一次 VLA 调用生成绿色新路径。'],
] as const;

function TruncationFormula({ phase }: { phase: number }) {
  return (
    <MathMLCard title="自适应时域来自一次真实截断" lead="h 是触发发生时已经执行的步数；H 是原本计划连续执行的步数。" source="论文第 5 页 · 自适应时域定义" activeKey={`queue-${phase}`}>
      <math display="block" aria-label="自适应执行时域小于原固定时域"><mrow><MathSym id="adaptive_h" label="本次实际执行时域 H_adaptive" tip="异常触发后，这一个动作块真正执行到的长度。" active={phase >= 4}><msub><mi>H</mi><Upright>adaptive</Upright></msub></MathSym><mo>=</mo><MathSym id="interrupt_step" label="触发位置 h" tip="旧动作块中触发时已经执行的动作数；剩余动作会被丢弃。" active={phase >= 2 && phase <= 4}><mi>h</mi></MathSym><mo>&lt;</mo><MathSym id="planned_h" label="原计划执行时域 H" tip="如果没有异常，固定方案本来会连续执行的动作数。"><mi>H</mi></MathSym></mrow></math>
    </MathMLCard>
  );
}

export function ReplanComparison(_: WidgetProps) {
  const [phase, setPhase] = useRememberedState('queue-phase-v4', 0); const [playing, setPlaying] = useState(false); const tween = useTweenedNumber(phase, 480);
  useEffect(() => { if (!playing) return; if (phase >= 5) { setPlaying(false); return; } const timer = window.setTimeout(() => setPhase((value) => Math.min(5, value + 1)), 1050); return () => window.clearTimeout(timer); }, [phase, playing, setPhase]);
  const ref = useResponsiveCanvas((ctx, w, h) => {
    clearScene(ctx, w, h); ctx.fillStyle = COLORS.surface; ctx.fillRect(0, 0, w, h);
    const compact = w < 620; const tokenW = Math.max(25, Math.min(44, (w - 76) / 10 - 5)); const gap = (w - 40 - tokenW * 10) / 9;
    for (let i = 0; i < 10; i += 1) { const executed = i < 4; const staleProgress = Math.max(0, Math.min(1, tween - 2.65)); const fade = Math.max(0.16, 1 - Math.max(0, tween - 3.7) * 0.82); drawToken(ctx, 20 + i * (tokenW + gap), 22, tokenW, `a${i + 1}`, executed ? 'executed' : staleProgress > 0.05 ? 'stale' : 'pending', executed ? 1 : fade); }
    if (tween > 3.85) { const reveal = Math.min(1, tween - 3.85); for (let i = 0; i < 5; i += 1) drawToken(ctx, w * 0.48 + i * Math.min(53, w * 0.085), 61, tokenW, `a′${i + 1}`, 'new', Math.max(0, Math.min(1, reveal * 5 - i))); }
    const sceneTop = compact ? 102 : 112; const sceneH = h - sceneTop; const tableY = sceneTop + sceneH * 0.76; ctx.fillStyle = COLORS.table; ctx.fillRect(0, tableY, w, h - tableY);
    const start = { x: w * 0.31, y: tableY - sceneH * 0.31 }; const interrupt = { x: w * 0.53, y: tableY - sceneH * 0.24 }; const oldBowl = { x: w * 0.79, y: tableY - 5 }; const newBowl = { x: w * 0.68, y: tableY - 5 };
    const bowlMove = easeInOutCubic(Math.max(0, Math.min(1, tween - 0.72))); const bowlX = oldBowl.x + (newBowl.x - oldBowl.x) * bowlMove; drawBowl(ctx, bowlX, newBowl.y, compact ? 0.66 : 0.82, COLORS.recovery);
    if (bowlMove > 0.05) { ctx.save(); ctx.globalAlpha = 0.25; drawBowl(ctx, oldBowl.x, oldBowl.y, compact ? 0.66 : 0.82, COLORS.anomaly); ctx.restore(); }
    drawPath(ctx, [start, { x: w * 0.56, y: tableY - sceneH * 0.38 }, { x: oldBowl.x, y: tableY - 24 }], bowlMove > 0.08 ? COLORS.anomaly : COLORS.normal, 3, bowlMove > 0.08, 0.82);
    if (tween > 3.75) drawPath(ctx, [interrupt, { x: w * 0.58, y: tableY - sceneH * 0.46 }, { x: newBowl.x, y: tableY - 23 }], COLORS.recovery, 4, false, Math.min(1, tween - 3.75));
    const oldMotion = Math.min(1, tween / 2.5) * 0.56; const recoverMotion = Math.max(0, Math.min(1, tween - 4.05)); const handX = interrupt.x + (newBowl.x - interrupt.x) * recoverMotion; const handY = interrupt.y + (tableY - 27 - interrupt.y) * recoverMotion - Math.sin(recoverMotion * Math.PI) * 28; const preX = start.x + (interrupt.x - start.x) * oldMotion / 0.56; const preY = start.y + (interrupt.y - start.y) * oldMotion / 0.56; const x = recoverMotion > 0 ? handX : preX; const y = recoverMotion > 0 ? handY : preY;
    const color = tween < 1.6 ? COLORS.normal : tween < 3.7 ? COLORS.anomaly : recoverMotion > 0.76 ? COLORS.recovery : COLORS.emphasis; drawRobotArm(ctx, w * 0.1, tableY, x, y, compact ? 0.66 : 0.82, color); drawObject(ctx, x, y + 17, compact ? 0.65 : 0.76, COLORS.actual); drawText(ctx, QUEUE_STEPS[phase][0], w - 18, sceneTop + 17, color, compact ? 11 : 13, 'right'); if (phase >= 4) drawText(ctx, 'H_adaptive = 4 < H', 18, sceneTop + 17, COLORS.anomaly, compact ? 11 : 13);
  }, [phase, tween], { mobileHeight: 340, desktopRatio: 0.34, minDesktopHeight: 350, maxDesktopHeight: 390 });
  return <div className="v2-widget queue-truncation"><div className="pipeline-strip queue-six" role="tablist" aria-label="从异常到新动作块的六个阶段">{QUEUE_STEPS.map((item, index) => <button type="button" role="tab" aria-selected={phase === index} className={`${phase === index ? 'active' : ''} ${index < phase ? 'done' : ''}`} key={item[0]} onClick={() => { setPlaying(false); setPhase(index); }}><span>{index + 1}</span><b>{item[0]}</b></button>)}</div><div className="token-legend"><span className="executed">已执行</span><span className="pending">待执行</span><span className="stale">被截断</span><span className="new">新生成</span></div><canvas ref={ref} className="v2-canvas" aria-label="动作token被标记过时、截断并由新动作块接管" /><div className="evidence-sentence"><b>{QUEUE_STEPS[phase][0]}</b><span>{QUEUE_STEPS[phase][1]}</span></div><div className="mission-controls"><button type="button" className="tiny primary" onClick={() => { if (phase >= 5) setPhase(0); setPlaying((value) => !value); }}>{playing ? '暂停' : phase >= 5 ? '重放截断过程' : '自动播放'}</button><button type="button" className="tiny" disabled={phase === 0} onClick={() => { setPlaying(false); setPhase((value) => Math.max(0, value - 1)); }}>上一步</button><button type="button" className="tiny" disabled={phase >= 5} onClick={() => { setPlaying(false); setPhase((value) => Math.min(5, value + 1)); }}>下一步</button></div><Feedback tone={phase >= 4 ? 'good' : phase >= 2 ? 'bad' : 'neutral'}>{phase < 3 ? '深绿色 token 已经执行完毕；需要处理的是仍在队列中、却继续指向旧目标的动作。' : phase === 3 ? '剩余旧 token 已被标红，说明过时的是尚未执行的部分。' : '丢弃红色旧动作后，系统才向 VLA 请求新动作块；检测器本身不会生成绿色 token。'}</Feedback><TruncationFormula phase={phase} /></div>;
}

const OGG_STEPS = [
  ['得到候选动作', '冻结 VLA 在当前流匹配状态上外推候选动作块，并取第一步候选动作。'],
  ['预测候选效果', 'Corrector 预测候选首动作会造成的潜变量变化，再与恢复方向 ΔZ_corr 比较。这个方向等于原本应有的局部变化减去已经累积的偏离。'],
  ['轻推生成速度', 'OGG 用方向损失的梯度，只修改这一次生成过程的速度场。'],
  ['输出新块并关闭', '修正后的动作块接管队列；本次调用结束后 OGG 关闭。'],
] as const;
const ETA_RESULTS = [
  { eta: 0.1, value: 62.68, guide: .18, meter: 16, label: '引导很轻', note: '梯度项带来的改动较小' },
  { eta: 1, value: 64.35, guide: .62, meter: 40, label: '本表最高', note: '候选动作与恢复方向取得较好平衡' },
  { eta: 10, value: 60.65, guide: .84, meter: 70, label: '引导较强', note: '成功率没有继续上升' },
  { eta: 100, value: 58.90, guide: .96, meter: 100, label: '引导很强', note: '本表成功率进一步下降' },
] as const;

function OggFormula({ step }: { step: number }) {
  return (
    <MathMLCard title="只保留 OGG 的两个核心关系" lead="恢复方向 ΔZ_corr 由“原本应有的变化 − 已累积的偏离”得到；OGG 比较候选动作效果与这个方向，再轻推本次流匹配速度。" source="论文第 6 页 · 公式 (9)–(11)" activeKey={`ogg-${step}`}>
      <math display="block" aria-label="OGG方向损失和引导速度"><mtable rowspacing="1.10em" columnalign="right center left">
        <mtr data-focus={step === 1 || step === 2 ? 'true' : undefined}><mtd><MathSym id="ogg_loss" label="OGG 方向损失" tip="候选动作的预测效果越接近恢复方向，损失越小。"><msub><mi>L</mi><Upright>OGG</Upright></msub></MathSym></mtd><mtd><mo>=</mo></mtd><mtd><mrow><mn>1</mn><mo>−</mo><MathSym id="ogg_cosine" label="候选效果与恢复方向的余弦相似度" tip="ΔZ_corr 是论文式 (9) 的纠偏方向：原本应有的局部变化减去已经累积的偏离；它不是机器人空间中的目标坐标。"><mrow><mi mathvariant="normal">CosSim</mi><mo>(</mo><msub><mrow><mo>Δ</mo><mover accent="true"><mi>Z</mi><mo>ˆ</mo></mover></mrow><Upright>act</Upright></msub><mo>,</mo><msub><mrow><mo>Δ</mo><mi>Z</mi></mrow><Upright>corr</Upright></msub><mo>)</mo></mrow></MathSym></mrow></mtd></mtr>
        <mtr data-focus={step === 2 ? 'true' : undefined}><mtd><MathSym id="guided_velocity" label="引导后的速度场" tip="OGG 只在这次恢复调用中修改流匹配速度，VLA 参数保持冻结。"><msubsup><mi>v</mi><mi>τ</mi><Upright>guide</Upright></msubsup></MathSym></mtd><mtd><mo>=</mo></mtd><mtd><mrow><msub><mi>v</mi><mi>τ</mi></msub><mo>−</mo><MathSym id="eta" label="引导强度 η" tip="论文表 8 中 η=1 在测试值里表现最好；引导更强并不保证更好。"><mi>η</mi></MathSym><msub><mo>∇</mo><msub><mi>v</mi><mi>τ</mi></msub></msub><msub><mi>L</mi><Upright>OGG</Upright></msub></mrow></mtd></mtr>
      </mtable></math>
    </MathMLCard>
  );
}

export function OggWorkshop(_: WidgetProps) {
  const [step, setStep] = useRememberedState('ogg-step-v6', 0); const [eta, setEta] = useRememberedState('ogg-eta-v5', 1); const tween = useTweenedNumber(step, 520);
  const chosen = ETA_RESULTS.find((item) => item.eta === eta)!; const guide = chosen.guide; const candidateAngle = 18; const targetAngle = 62; const shownAngle = tween < 2 ? candidateAngle : candidateAngle + (targetAngle - candidateAngle) * guide * Math.max(0, Math.min(1, tween - 1));
  const angle = shownAngle * Math.PI / 180; const target = targetAngle * Math.PI / 180;
  const input = step === 0 ? 'Aτ 与 vτ' : step === 1 ? '候选首动作 âₜ' : step === 2 ? '候选效果与 ΔZ_corr' : '引导后的速度'; const operation = step === 0 ? '冻结 VLA 外推候选' : step === 1 ? 'Corrector 预测效果' : step === 2 ? '−η∇L_OGG 轻推速度' : '继续流匹配生成'; const output = step === 0 ? '候选块 Â₀' : step === 1 ? '效果差距' : step === 2 ? 'v_guide' : '新动作块 A′';
  return (
    <div className="v2-widget ogg-four-step">
      <div className="ogg-call-status"><span className={step < 3 ? 'on' : ''}><i />OGG {step < 3 ? 'ON · 只服务这一次恢复调用' : 'OFF · 后续恢复普通推理'}</span><small><b>Online Gradient Guidance（在线梯度引导）</b>：不直接操控机械臂，而是在中断后的第一次 VLA 调用中，轻微调整动作生成方向。</small></div>
      <div className="ogg-four-tabs" role="tablist" aria-label="OGG恢复调用的四个步骤">{OGG_STEPS.map(([title], index) => <button type="button" role="tab" aria-selected={step === index} className={`${step === index ? 'active' : ''} ${step > index ? 'done' : ''}`} key={title} onClick={() => setStep(index)}><span>{index + 1}</span><b>{title}</b></button>)}</div>
      <div className="ogg-four-stage">
        <svg viewBox="0 0 900 330" role="img" aria-label="OGG从候选动作到一次速度引导再到新动作块的四步过程">
          <defs>
            <marker id="ogg-purple-head" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill={COLORS.prediction} /></marker>
            <marker id="ogg-green-head" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill={COLORS.recovery} /></marker>
            <marker id="ogg-orange-head" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill={COLORS.emphasis} /></marker>
          </defs>
          <rect width="900" height="330" rx="10" fill={COLORS.surface} />
          {[0,1,2,3].map((i) => <rect key={i} x={22 + i * 220} y="28" width="196" height="250" rx="8" fill={step === i ? COLORS.predictionSoft : COLORS.surfaceSoft} stroke={step === i ? COLORS.prediction : COLORS.line} strokeWidth={step === i ? 2.5 : 1} opacity={i > step ? .55 : 1} />)}
          <g><text x="120" y="58" textAnchor="middle" fill={COLORS.ink} fontSize="15" fontWeight="700">冻结 VLA 候选</text><path d="M58 214 C92 104 156 108 186 170" fill="none" stroke={COLORS.prediction} strokeWidth="5" markerEnd="url(#ogg-purple-head)" /><text x="120" y="246" textAnchor="middle" fill={COLORS.predictionInk} fontSize="13">Â₀ → âₜ</text></g>
          <g opacity={step >= 1 ? 1 : .55}><text x="340" y="58" textAnchor="middle" fill={COLORS.ink} fontSize="15" fontWeight="700">Corrector 比较效果</text><circle cx="340" cy="194" r="78" fill={COLORS.surface} stroke={COLORS.grid} /><line x1="340" y1="194" x2={340 + Math.cos(candidateAngle * Math.PI / 180) * 72} y2={194 - Math.sin(candidateAngle * Math.PI / 180) * 72} stroke={COLORS.prediction} strokeWidth="5" markerEnd="url(#ogg-purple-head)" /><line x1="340" y1="194" x2={340 + Math.cos(target) * 72} y2={194 - Math.sin(target) * 72} stroke={COLORS.recovery} strokeWidth="4" strokeDasharray="7 5" markerEnd="url(#ogg-green-head)" /><text x="340" y="292" textAnchor="middle" fill={COLORS.muted} fontSize="12">预测效果 vs 恢复目标</text></g>
          <g opacity={step >= 2 ? 1 : .55}><text x="560" y="58" textAnchor="middle" fill={COLORS.ink} fontSize="15" fontWeight="700">梯度轻推速度</text><circle cx="560" cy="194" r="78" fill={COLORS.surface} stroke={COLORS.grid} /><line x1="560" y1="194" x2={560 + Math.cos(angle) * 76} y2={194 - Math.sin(angle) * 76} stroke={COLORS.emphasis} strokeWidth="6" markerEnd="url(#ogg-orange-head)" /><line x1="560" y1="194" x2={560 + Math.cos(target) * 76} y2={194 - Math.sin(target) * 76} stroke={COLORS.recovery} strokeWidth="3" strokeDasharray="7 5" /><text x="560" y="292" textAnchor="middle" fill={COLORS.muted} fontSize="12">vτ → vguide</text></g>
          <g opacity={step >= 3 ? 1 : .55}><text x="780" y="58" textAnchor="middle" fill={COLORS.ink} fontSize="15" fontWeight="700">新动作块</text>{Array.from({ length: 5 }, (_, index) => <g key={index}><rect x="714" y={88 + index * 34} width="132" height="25" rx="5" fill={COLORS.recoverySoft} stroke={COLORS.recovery} /><text x="780" y={106 + index * 34} textAnchor="middle" fill={COLORS.recoveryInk} fontSize="12">a′{index + 1}</text></g>)}<text x="780" y="292" textAnchor="middle" fill={COLORS.recovery} fontSize="12">输出后 OGG 关闭</text></g>
        </svg>
        <div className="ogg-one-sentence"><span>输入 <b>{input}</b></span><i>→</i><span>这一步 <b>{operation}</b></span><i>→</i><span>输出 <b>{output}</b></span></div>
      </div>
      <div className="ogg-navigation"><button type="button" className="tiny" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>上一步</button><button type="button" className="tiny primary" onClick={() => setStep((value) => value >= 3 ? 0 : value + 1)}>{step >= 3 ? '从候选动作再看一次' : '下一步：' + OGG_STEPS[step + 1][0]}</button></div>
      <div className="evidence-sentence"><b>{OGG_STEPS[step][0]}</b><span>{OGG_STEPS[step][1]}</span></div>
      <section className="eta-lab" aria-label="论文表8中不同eta的引导强度和消融结果">
        <header><div><span>引导强度 η</span><h3>η 决定恢复梯度对这一次生成施加多大影响</h3></div><strong>论文表 8 最高：η = 1 · 64.35%</strong></header>
        <div className="eta-choice-grid" role="group" aria-label="选择eta并比较平均成功率">
          {ETA_RESULTS.map((item) => <button type="button" key={item.eta} className={`${eta === item.eta ? 'selected' : ''} ${item.eta === 1 ? 'best' : ''}`} aria-pressed={eta === item.eta} onClick={() => { setEta(item.eta); setStep(2); }}><span>η = {item.eta}</span><b>{item.value.toFixed(2)}%</b><i aria-hidden="true"><em style={{ width: `${item.meter}%` }} /></i><small>{item.label}</small></button>)}
        </div>
        <div className="eta-current-reading" aria-live="polite">
          <div><span>当前引导强度</span><b>{chosen.label}</b><i aria-hidden="true"><em style={{ width: `${chosen.meter}%` }} /></i><small>对数尺度示意，仅表示 η 从 0.1 增至 100</small></div>
          <div><span>论文表 8 平均成功率</span><strong>{chosen.value.toFixed(2)}%</strong><small>{chosen.note}</small></div>
        </div>
        <p className="eta-explanation"><b>为什么 η=1 更合适？</b><span>η 直接缩放 OGG 的梯度修正。η=0.1 时改动较轻；增大到 1 后，本表成功率升至最高的 64.35%。继续增大到 10 和 100，成功率反而降至 60.65% 和 58.90%。从机制上看，过强的辅助梯度可能压过 VLA 原本学到的生成方向；论文消融能确认的是“更大并不更好”，不能把 η=1 当成所有任务的通用常数。</span></p>
      </section>
      <Feedback tone={step === 3 || eta === 1 ? 'good' : 'warn'}>{step === 3 ? '新动作块生成后，OGG 立即关闭；后续调用仍使用普通 VLA 推理。' : eta === 1 ? '现在选中 η=1。左侧速度方向会按这一强度调整；它也是论文表 8 四个测试值中成功率最高的一项。' : `现在选中 η=${eta}。观察第三幅图里的速度方向，并和论文表 8 的 ${chosen.value.toFixed(2)}% 对照。`}</Feedback>
      <OggFormula step={step} />
    </div>
  );
}
