import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// 第3章：组装「任务→模型→数据引擎→SA-1B」自我强化飞轮（环形卡片 UI）
const R = 122;
const NODES = [
  { ico: '🎯', name: '可提示任务', desc: '任意提示 → 有效掩码' },
  { ico: '🧠', name: 'SAM 模型', desc: '重编码 + 轻解码，约 50ms' },
  { ico: '🏭', name: '数据引擎', desc: '辅助 → 半自动 → 全自动' },
  { ico: '🗃️', name: 'SA-1B', desc: '11M 图 / 1.1B 掩码' },
];
const FB = [
  '起点：可提示分割任务，作为预训练目标。',
  '任务约束模型：SAM 支持灵活提示、实时输出掩码。',
  '模型进入数据引擎：辅助标注、反哺更多数据。',
  '引擎产出 SA-1B（11M 图 / 1.1B 掩码）；数据再训练模型，飞轮转起来，回到任务。',
];

export const Ch3Loop: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [step, setStep] = useState(0);
  const pos = (i: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / NODES.length;
    return { x: Math.cos(a) * R, y: Math.sin(a) * R, a };
  };
  const arrowPos = (i: number) => {
    const a = -Math.PI / 2 + ((i + 0.5) * 2 * Math.PI) / NODES.length;
    const rot = (a * 180) / Math.PI + 90;
    return { x: Math.cos(a) * R * 0.72, y: Math.sin(a) * R * 0.72, rot };
  };
  return (
    <div className="fly">
      <div className="fly-ring">
        <div className="fly-track" />
        {NODES.map((n, i) => {
          const p = pos(i);
          return (
            <div
              key={i}
              className={`fly-node ${i < step ? 'done' : i === step ? 'on' : 'off'}`}
              style={{ left: `calc(50% + ${p.x}px)`, top: `calc(50% + ${p.y}px)` }}
              onClick={() => setStep(i)}
              role="button"
              tabIndex={0}
            >
              <div className="fly-ico">{n.ico}</div>
              <div className="fly-name">{n.name}</div>
              <div className="fly-desc">{n.desc}</div>
            </div>
          );
        })}
        {NODES.map((_, i) => {
          const p = arrowPos(i);
          return (
            <span
              key={'a' + i}
              className={`fly-arrow ${i < step ? 'on' : ''}`}
              style={{
                left: `calc(50% + ${p.x}px)`,
                top: `calc(50% + ${p.y}px)`,
                transform: `translate(-50%, -50%) rotate(${p.rot}deg)`,
              }}
            >
              ➤
            </span>
          );
        })}
        <div className="fly-core">
          <span className="fly-spin">🔄</span>
          <span className="fly-core-t">
            数据反哺
            <br />
            回到任务
          </span>
        </div>
      </div>
      <div className="ctrl">
        <button className="btn" disabled={step === 0} onClick={() => setStep(step - 1)}>
          ← 上一步
        </button>
        <span className="val">
          阶段 {step + 1} / {NODES.length}
        </span>
        <button
          className="btn on"
          disabled={step === NODES.length - 1}
          onClick={() => setStep(step + 1)}
        >
          下一步 →
        </button>
      </div>
      <div className="feedback good">{FB[step]}</div>
    </div>
  );
};

export default Ch3Loop;
