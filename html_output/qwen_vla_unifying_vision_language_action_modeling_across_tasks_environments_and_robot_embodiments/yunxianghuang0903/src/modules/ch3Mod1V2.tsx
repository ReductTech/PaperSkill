import React, { useMemo, useState } from 'react';
import { PsChip } from '../components/ps-controls';
import { EMB_DATA, ROBOT_ORDER, RobotTransition, type RobotKind } from './robotMorph';
import type { WidgetProps } from './registry';

const BODY_TITLE: Record<RobotKind, string> = {
  widowx: '单臂机械臂',
  aloha: '双臂机器人',
  nav: '移动机器人',
};

const CONTROL_LABEL: Record<RobotKind, string> = {
  widowx: '末端位姿 + gripper',
  aloha: '双臂协同 + gripper',
  nav: '航点 Δx / Δy / Δθ',
};

const PROMPT_TOKENS: Record<RobotKind, string[]> = {
  widowx: ['WidowX', '单臂', '操纵', '末端控制'],
  aloha: ['Mobile ALOHA', '双臂', '操纵', '协同控制'],
  nav: ['VLN', '移动底盘', '导航', '航点控制'],
};

function OutputGlyph({ kind }: { kind: RobotKind }) {
  if (kind === 'nav') {
    return (
      <svg viewBox="0 0 240 90" className="c3m1x-output-glyph" aria-hidden="true">
        <polyline points="18,68 60,42 102,58 147,28 212,42" fill="none" stroke="var(--viz-sky)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        {[18,60,102,147,212].map((x, i) => <circle key={x} cx={x} cy={[68,42,58,28,42][i]} r="5" fill={i === 4 ? 'var(--viz-amber)' : 'var(--viz-sky)'} />)}
      </svg>
    );
  }
  if (kind === 'aloha') {
    return (
      <svg viewBox="0 0 240 90" className="c3m1x-output-glyph" aria-hidden="true">
        <path d="M18 62 C60 22 92 68 132 34 S188 24 220 42" fill="none" stroke="var(--viz-green)" strokeWidth="3.2" />
        <path d="M18 72 C58 38 94 78 137 47 S188 34 220 54" fill="none" stroke="var(--viz-navy)" strokeWidth="3.2" />
        <circle cx="220" cy="42" r="5" fill="var(--viz-amber)" /><circle cx="220" cy="54" r="5" fill="var(--viz-amber)" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 240 90" className="c3m1x-output-glyph" aria-hidden="true">
      <path d="M18 68 C66 26 104 72 151 40 S196 34 220 20" fill="none" stroke="var(--viz-navy)" strokeWidth="3.4" />
      {[18,70,118,166,220].map((x, i) => <circle key={x} cx={x} cy={[68,40,56,36,20][i]} r="5" fill={i === 4 ? 'var(--viz-amber)' : 'var(--viz-green)'} />)}
    </svg>
  );
}

export const Ch3Mod1V2: React.FC<WidgetProps> = () => {
  const [idx, setIdx] = useState(0);
  const [pulse, setPulse] = useState(0);
  const kind = ROBOT_ORDER[idx];
  const tokens = PROMPT_TOKENS[kind];
  const semantics = useMemo(() => CONTROL_LABEL[kind], [kind]);

  const switchTo = (i: number) => {
    if (i === idx) return;
    setIdx(i);
    setPulse((p) => p + 1);
  };

  return (
    <div className="c3m1x">
      <div className="c3m1x-stage">
        <svg className="c3m1x-plumbing" viewBox="0 0 1100 430" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <marker id="c3m1xArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="var(--viz-navy)" /></marker>
          </defs>
          <path d="M260 214 C340 214 365 132 455 132" className="c3m1x-pipe" markerEnd="url(#c3m1xArrow)" />
          <path d="M654 214 C760 214 786 214 865 214" className="c3m1x-pipe" markerEnd="url(#c3m1xArrow)" />
          <circle r="5" fill="var(--viz-amber)" key={`p-in-${pulse}`}>
            <animateMotion dur="1.5s" repeatCount="indefinite" path="M260 214 C340 214 365 132 455 132" />
          </circle>
          <circle r="5" fill="var(--viz-green)" key={`p-out-${pulse}`}>
            <animateMotion dur="1.6s" begin=".55s" repeatCount="indefinite" path="M654 214 C760 214 786 214 865 214" />
          </circle>
        </svg>

        <section className="c3m1x-body">
          <div className="c3m1x-kicker">01 · 当前本体</div>
          <div className="c3m1x-robot-bay"><RobotTransition kind={kind} /></div>
          <h4>{BODY_TITLE[kind]}</h4>
          <p>{EMB_DATA[kind].protocol}</p>
          <div className="c3m1x-switches">
            {ROBOT_ORDER.map((k, i) => <PsChip key={k} selected={idx === i} onClick={() => switchTo(i)}>{EMB_DATA[k].label}</PsChip>)}
          </div>
        </section>

        <section className="c3m1x-core">
          <div className="c3m1x-kicker">02 · 本体感知提示注入</div>
          <div className="c3m1x-token-stream" key={`tokens-${kind}-${pulse}`}>
            {tokens.map((t, i) => <span key={t} style={{ '--i': i } as React.CSSProperties}>{t}</span>)}
          </div>
          <div className="c3m1x-reactor">
            <div className="c3m1x-reactor-orbit" />
            <div className="c3m1x-reactor-inner">
              <strong>Qwen-VLA</strong>
              <span>Qwen3.5 VLM</span>
              <i />
              <span>DiT Action Expert</span>
            </div>
            <div className="c3m1x-lock">共享参数与结构保持不变</div>
          </div>
          <div className="c3m1x-injection-note"><i /> 只改变条件，不为每种本体重新设计一套共享模型</div>
        </section>

        <section className="c3m1x-control">
          <div className="c3m1x-kicker">03 · 原生控制语义</div>
          <div className="c3m1x-control-head" key={`head-${kind}-${pulse}`}>
            <span>输出接口随本体变化</span>
            <b>{semantics}</b>
          </div>
          <OutputGlyph kind={kind} />
          <div className="c3m1x-control-flow">
            {Array.from({ length: 7 }).map((_, i) => <i key={i} style={{ '--i': i } as React.CSSProperties} />)}
          </div>
          <div className="c3m1x-control-foot">
            <span>控制约定</span><b>{EMB_DATA[kind].sem}</b>
          </div>
        </section>
      </div>

      <div className="c3m1x-summary">
        <span><b>变：</b>机器人、本体提示、原生控制语义</span>
        <span><b>不变：</b>共享 Qwen-VLA 计算核心</span>
      </div>
    </div>
  );
};

export default Ch3Mod1V2;
