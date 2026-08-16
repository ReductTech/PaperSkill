import React, { useState } from 'react';
import { PsChip } from '../components/ps-controls';
import { EMB_DATA, ROBOT_ORDER, RobotTransition, type RobotKind } from './robotMorph';
import type { WidgetProps } from './registry';

const BODY_TITLE: Record<RobotKind, string> = {
  widowx: '单臂机械臂',
  aloha: '双臂机器人',
  nav: '移动机器人',
};

const OUTER: Record<RobotKind, Array<{ title: string; value: string }>> = {
  widowx: [
    { title: '机器人平台', value: 'WidowX' },
    { title: '机械臂配置', value: '单臂' },
    { title: '控制约定', value: '末端位姿 + gripper' },
    { title: '预测范围', value: 'dataset-native H' },
  ],
  aloha: [
    { title: '机器人平台', value: 'Mobile ALOHA' },
    { title: '机械臂配置', value: '双臂' },
    { title: '控制约定', value: '双臂协同 + gripper' },
    { title: '预测范围', value: 'dataset-native H' },
  ],
  nav: [
    { title: '机器人平台', value: '移动机器人 / VLN' },
    { title: '机械臂配置', value: '无机械臂' },
    { title: '控制约定', value: '航点 Δx / Δy / Δθ' },
    { title: '预测范围', value: 'dataset-native H' },
  ],
};

const LOCKED = ['VLM 骨干', 'DiT 架构', '共享参数化'];

function SemanticGlyph({ kind }: { kind: RobotKind }) {
  if (kind === 'nav') {
    return <svg viewBox="0 0 180 72" className="c3m3x-glyph" aria-hidden="true"><polyline points="10,54 45,32 80,44 118,20 168,28" fill="none" stroke="var(--viz-sky)" strokeWidth="3" /><circle cx="168" cy="28" r="5" fill="var(--viz-amber)" /></svg>;
  }
  if (kind === 'aloha') {
    return <svg viewBox="0 0 180 72" className="c3m3x-glyph" aria-hidden="true"><path d="M10 48 C48 16 76 54 108 28 S145 24 170 32" fill="none" stroke="var(--viz-green)" strokeWidth="3"/><path d="M10 60 C46 32 78 62 110 40 S146 34 170 44" fill="none" stroke="var(--viz-navy)" strokeWidth="3"/></svg>;
  }
  return <svg viewBox="0 0 180 72" className="c3m3x-glyph" aria-hidden="true"><path d="M10 58 C46 20 74 62 111 34 S145 28 170 16" fill="none" stroke="var(--viz-navy)" strokeWidth="3.2"/><circle cx="170" cy="16" r="5" fill="var(--viz-amber)" /></svg>;
}

export const Ch3Mod3V2: React.FC<WidgetProps> = () => {
  const [idx, setIdx] = useState(0);
  const [cycle, setCycle] = useState(0);
  const kind = ROBOT_ORDER[idx];

  const switchTo = (i: number) => {
    if (i === idx) return;
    setIdx(i);
    setCycle((c) => c + 1);
  };

  return (
    <div className="c3m3x">
      <div className="c3m3x-stage">
        <section className="c3m3x-body">
          <div className="c3m3x-kicker">当前身体</div>
          <div className="c3m3x-robot"><RobotTransition kind={kind} /></div>
          <h4>{BODY_TITLE[kind]}</h4>
          <p>{EMB_DATA[kind].protocol}</p>
        </section>

        <section className="c3m3x-orbit">
          <div className="c3m3x-kicker">不变量核心 / 可变量外环</div>
          <div className="c3m3x-orbit-field">
            <svg viewBox="0 0 500 410" className="c3m3x-ring-svg" aria-hidden="true">
              <circle cx="250" cy="205" r="146" fill="none" stroke="#dbe2eb" strokeWidth="2" strokeDasharray="7 8" />
              <circle cx="250" cy="205" r="92" fill="none" stroke="#aeb8c7" strokeWidth="3" />
              <circle cx="250" cy="205" r="65" fill="#34476f" opacity=".98" />
              <circle cx="250" cy="205" r="78" fill="none" stroke="#3d8f6a" strokeWidth="2.5" strokeDasharray="6 7" className="c3m3x-lock-orbit" />
              {[[-1.55,0],[-.1,1],[1.55,2]].map(([a, i]) => {
                const x = 250 + Math.cos(a as number) * 95;
                const y = 205 + Math.sin(a as number) * 95;
                return <g key={i}><circle cx={x} cy={y} r="13" fill="#fff" stroke="#34476f" strokeWidth="2"/><path d={`M${x-4} ${y+1} v-5 a4 4 0 0 1 8 0 v5`} fill="none" stroke="#34476f" strokeWidth="1.5"/><rect x={x-5} y={y+1} width="10" height="8" rx="2" fill="none" stroke="#34476f" strokeWidth="1.5"/></g>;
              })}
            </svg>

            <div className="c3m3x-core-label"><b>Qwen-VLA</b><span>共享计算核心</span></div>
            {LOCKED.map((n, i) => <div key={n} className={`c3m3x-lock-label c3m3x-lock-label--${i}`}>{n}</div>)}

            <div className="c3m3x-vars" key={`${kind}-${cycle}`}>
              {OUTER[kind].map((v, i) => (
                <div key={v.title} className={`c3m3x-var c3m3x-var--${i}`} style={{ '--i': i } as React.CSSProperties}>
                  <small>{v.title}</small><b>{v.value}</b>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="c3m3x-output">
          <div className="c3m3x-kicker">变化后的接口</div>
          <div className="c3m3x-output-main" key={`out-${kind}-${cycle}`}>
            <b>{EMB_DATA[kind].sem}</b>
            <SemanticGlyph kind={kind} />
          </div>
          <div className="c3m3x-balance">
            <div><span>共享结构</span><strong>锁定</strong></div>
            <div><span>本体条件</span><strong>更新</strong></div>
          </div>
        </section>
      </div>

      <div className="c3m3x-controls">
        {ROBOT_ORDER.map((k, i) => <PsChip key={k} selected={idx === i} onClick={() => switchTo(i)}>{EMB_DATA[k].label}</PsChip>)}
      </div>
      <div className="c3m3x-note">切换本体时，外环条件与输出语义发生变化；内环 VLM、DiT 架构与共享参数化保持不变。</div>
    </div>
  );
};

export default Ch3Mod3V2;
