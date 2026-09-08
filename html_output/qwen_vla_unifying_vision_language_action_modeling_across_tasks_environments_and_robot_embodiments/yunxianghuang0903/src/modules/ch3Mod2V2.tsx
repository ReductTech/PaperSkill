import React, { useMemo, useState } from 'react';
import { PsChip } from '../components/ps-controls';
import { EMB_DATA, ROBOT_ORDER, RobotKind, RobotTransition } from './robotMorph';
import type { WidgetProps } from './registry';

type TokenKey = 'platform' | 'arm' | 'control' | 'fps' | 'chunk';

const TOKEN_META: Array<{ key: TokenKey; label: string; short: string }> = [
  { key: 'platform', label: '机器人平台', short: 'platform' },
  { key: 'arm', label: '机械臂配置', short: 'arm config' },
  { key: 'control', label: '控制约定', short: 'control' },
  { key: 'fps', label: '控制频率', short: 'frequency' },
  { key: 'chunk', label: '预测时域 H', short: 'horizon' },
];

const TOKEN_VALUE: Record<TokenKey, Record<RobotKind, string>> = {
  platform: { widowx: 'WidowX', aloha: 'Mobile ALOHA', nav: 'VLN mobile base' },
  arm: { widowx: '单臂', aloha: '双臂', nav: '无机械臂' },
  control: { widowx: '原生操纵控制约定', aloha: '双臂协同控制约定', nav: '航点 Δx / Δy / Δθ' },
  fps: { widowx: '{FPS}', aloha: '{FPS}', nav: '{FPS}' },
  chunk: { widowx: '{chunk_size}', aloha: '{chunk_size}', nav: '{chunk_size}' },
};

const TOKEN_HELP: Record<TokenKey, string> = {
  platform: '告诉共享模型当前面对哪一种机器人平台。',
  arm: '描述机械臂构型；不同本体可以共享同一模型架构。',
  control: '保留数据集原生控制语义，不强行把物理动作统一成同一种含义。',
  fps: '控制频率写进本体感知提示；论文不要求所有数据集使用同一固定频率。',
  chunk: '预测时域同样作为条件信息；不同数据集可有不同动作块长度。',
};

export const Ch3Mod2V2: React.FC<WidgetProps> = () => {
  const [kind, setKind] = useState<RobotKind>('widowx');
  const [active, setActive] = useState<TokenKey>('arm');
  const [pulse, setPulse] = useState(0);
  const e = EMB_DATA[kind];

  const sentence = useMemo(
    () => TOKEN_META.map((m) => ({ ...m, value: TOKEN_VALUE[m.key][kind] })),
    [kind]
  );

  const chooseKind = (next: RobotKind) => {
    setKind(next);
    setPulse((p) => p + 1);
  };

  return (
    <div className="c3m2x-lab">
      <div className="c3m2x-head">
        <div><span>本体感知提示 · 结构化条件</span><strong>把“身体说明书”注入共享 Qwen‑VLA</strong></div>
        <div className="c3m2x-robot-tabs">
          {ROBOT_ORDER.map((k) => <PsChip key={k} selected={kind === k} onClick={() => chooseKind(k)}>{EMB_DATA[k].label}</PsChip>)}
        </div>
      </div>

      <div className="c3m2x-stage">
        <section className="c3m2x-robot-stage">
          <span className="c3m2x-kicker">当前本体</span>
          <div className="c3m2x-robot-wrap" key={`${kind}-${pulse}`}><RobotTransition kind={kind} /></div>
          <strong>{e.label}</strong>
          <small>{e.sem}</small>
          <div className="c3m2x-body-scan" aria-hidden="true"><i /><i /><i /></div>
        </section>

        <section className="c3m2x-prompt-stage">
          <div className="c3m2x-prompt-title"><span>Prompt Builder</span><b>本体感知提示</b></div>
          <div className="c3m2x-prompt-sentence">
            {sentence.map((m, i) => (
              <React.Fragment key={m.key}>
                {i > 0 ? <span className="c3m2x-sep">·</span> : null}
                <button type="button" className={active === m.key ? 'is-active' : ''} onClick={() => setActive(m.key)}>
                  <small>{m.label}</small><b>{m.value}</b>
                </button>
              </React.Fragment>
            ))}
          </div>

          <div className="c3m2x-injector" aria-hidden="true">
            {sentence.map((m, i) => <span key={m.key} className={active === m.key ? 'is-hot' : ''} style={{ '--i': i } as React.CSSProperties}>{m.short}</span>)}
            <div className="c3m2x-inject-line"><i /></div>
          </div>

          <div className="c3m2x-active-explain">
            <span>{TOKEN_META.find((m) => m.key === active)?.label}</span>
            <strong>{TOKEN_VALUE[active][kind]}</strong>
            <p>{TOKEN_HELP[active]}</p>
          </div>
        </section>

        <section className="c3m2x-core-stage">
          <span className="c3m2x-kicker">共享模型</span>
          <div className="c3m2x-core">
            <i className="c3m2x-core-ring" />
            <b>Qwen‑VLA</b>
            <span>Qwen3.5 VLM</span>
            <span>DiT Action Expert</span>
          </div>
          <div className="c3m2x-core-lock">核心结构保持不变</div>
          <div className="c3m2x-output">
            <span>输出仍采用当前本体的原生控制语义</span>
            <div className="c3m2x-output-rail">{Array.from({ length: 8 }).map((_, i) => <i key={i} style={{ animationDelay: `${i * 70}ms` }} />)}</div>
          </div>
        </section>
      </div>

      <div className="c3m2x-foot">
        <span>点击任意提示字段</span><b>→</b><span>看它如何解释“这具身体”</span><b>→</b><span>共享核心无需为每种本体重新设计输出头</span>
      </div>
    </div>
  );
};

export default Ch3Mod2V2;
