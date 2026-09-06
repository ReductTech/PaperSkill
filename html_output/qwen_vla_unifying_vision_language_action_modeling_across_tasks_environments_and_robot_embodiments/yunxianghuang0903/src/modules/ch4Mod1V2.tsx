import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PsButton, IconReset } from '../components/ps-controls';
import QwenVlaCoreViz, { type InspectRegion } from './qwenVlaCoreViz';
import type { WidgetProps } from './registry';

const EXPLAIN: Record<NonNullable<InspectRegion>, string> = {
  vlm: 'Qwen3.5-4B VLM 先编码观察图像、语言指令与本体感知提示，产生供动作专家使用的隐藏状态。',
  joint: 'VLM 隐状态与噪声动作块 Yτ 被拼接为一个联合序列，而不是分成彼此独立的动作分支。',
  dit: '约 1.15B 参数的 DiT 动作专家以联合自注意力处理该序列，并通过 AdaLN 注入时间步 τ 条件，预测条件速度场。',
  euler: '推理时从 τ=1 的噪声动作出发，沿预测速度场执行少量欧拉积分步，逐步到达 τ=0。',
  action: '最终得到 H 步连续动作块；不同本体仍保留各自原生控制语义。',
};

const PHASE_NAMES = ['', '输入条件进入', '图像切分与 token 化', 'VLM 编码', '联合序列形成', 'DiT 动作专家处理', '预测条件速度场', '欧拉积分去噪', '输出 H 步动作块'];
const PHASE_DUR = [0, 900, 900, 1100, 1050, 1200, 1100, 1500, 1300];
const TAU_BY_PHASE = [1, 1, 1, 1, 1, 0.75, 0.5, 0.25, 0];

export const Ch4Mod1V2: React.FC<WidgetProps> = () => {
  const [phase, setPhase] = useState(0);
  const [highlight, setHighlight] = useState<InspectRegion>(null);
  const [auto, setAuto] = useState(false);
  const timerRef = useRef<number>(0);

  const tau = TAU_BY_PHASE[phase] ?? 1;

  const reset = useCallback(() => {
    setPhase(0);
    setAuto(false);
    setHighlight(null);
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  const advance = useCallback(() => {
    setHighlight(null);
    setPhase((p) => Math.min(8, p + 1));
  }, []);

  const startAuto = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setHighlight(null);
    setPhase(0);
    setAuto(true);
  }, []);

  useEffect(() => {
    if (!auto) return;
    if (phase >= 8) {
      setAuto(false);
      return;
    }
    const next = phase + 1;
    timerRef.current = window.setTimeout(() => setPhase(next), PHASE_DUR[next]);
    return () => window.clearTimeout(timerRef.current);
  }, [auto, phase]);

  const inspect = (region: InspectRegion) => {
    setAuto(false);
    setHighlight((prev) => (prev === region ? null : region));
  };

  const hint = highlight
    ? EXPLAIN[highlight]
    : phase > 0
      ? `步骤 ${phase}/8 · ${PHASE_NAMES[phase]}`
      : '从多模态条件到连续动作：点击“自动演示”观察完整数据流，也可逐步追踪。';

  return (
    <div className="ch4-arch-lab ch4-arch-lab--precision">
      <div className="ch4-arch-toolbar">
        <div className="ch4-arch-controls">
          <PsButton variant="primary" active={auto} onClick={startAuto}>{auto ? '演示进行中' : '自动演示'}</PsButton>
          <PsButton variant="ghost" onClick={advance} disabled={phase >= 8 || auto}>单步 {phase}/8</PsButton>
          <PsButton variant="ghost" onClick={reset}><IconReset /> 重置</PsButton>
        </div>
        <div className="ch4-arch-state">
          <span className="ch4-arch-state-label">当前状态</span>
          <strong>{phase === 0 ? '等待输入' : PHASE_NAMES[phase]}</strong>
          <span className="ch4-flow-tau-badge">τ = {tau.toFixed(2)}</span>
        </div>
      </div>

      <div className="q4x-phase-rail" aria-label="八阶段推理过程">
        {Array.from({ length: 8 }).map((_, i) => (
          <React.Fragment key={i}>
            <span className={`q4x-phase-node${phase > i + 1 ? ' is-done' : ''}${phase === i + 1 ? ' is-active' : ''}`}>
              <i>{i + 1}</i><b>{PHASE_NAMES[i + 1]}</b>
            </span>
            {i < 7 ? <span className={`q4x-phase-link${phase > i + 1 ? ' is-done' : ''}`} /> : null}
          </React.Fragment>
        ))}
      </div>

      <QwenVlaCoreViz
        mode="inference"
        inferPhase={phase}
        tau={tau}
        highlight={highlight}
        onRegionClick={inspect}
      />

      <div className={`ch4-pipeline-hint${highlight ? ' is-inspect' : ''}`}>
        <span className="ch4-hint-dot" />
        <p>{hint}</p>
        {highlight ? <button type="button" onClick={() => setHighlight(null)}>返回全局视图</button> : null}
      </div>
    </div>
  );
};

export default Ch4Mod1V2;
