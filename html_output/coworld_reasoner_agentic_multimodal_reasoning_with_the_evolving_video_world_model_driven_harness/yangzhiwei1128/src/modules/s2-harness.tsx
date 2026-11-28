import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Camera } from './sceneKit';

type Part = 'T' | 'S' | 'V' | 'E';

const PARTS: { key: Part; name: string; role: string; x: number; y: number }[] = [
  { key: 'T', name: '工具 T', role: '把一种视觉操作暴露成标准接口：给定源图、顺序与需保持的条件，返回一段生成视频。', x: 150, y: 96 },
  { key: 'S', name: '技能 S', role: '规定什么时候该想象、选哪种操作、请求怎么写、结果怎么读。', x: 750, y: 96 },
  { key: 'V', name: '验证器 V', role: '只读生成视频，报告可见事件与伪影，不参与答题。', x: 150, y: 344 },
  { key: 'E', name: '执行层 E', role: '组织调用顺序，把每次调用与结果写回交互历史。', x: 750, y: 344 },
];

export function S2Harness(_props: WidgetProps) {
  const [active, setActive] = useState<Part>('T');
  const current = PARTS.find(part => part.key === active)!;
  return (
    <div className="ps-page s2-page">
      <div className="ps-scene">
        <svg viewBox="0 0 900 470" role="group" aria-label="可编辑的推理骨架：工具、技能、验证器、执行层围绕相机">
          {PARTS.map(part => {
            const on = part.key === active;
            return (
              <g key={part.key} role="button" tabIndex={0} aria-label={`${part.name}：${part.role}`}
                className="ps-node" onClick={() => setActive(part.key)}
                onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setActive(part.key); } }}>
                <path d={`M${part.x} ${part.y} L450 232`} stroke={on ? '#27446e' : '#d7deea'} strokeWidth={on ? 4 : 2} strokeDasharray="10 8" />
                <rect x={part.x - 108} y={part.y - 40} width="216" height="80" rx="16"
                  fill={on ? '#eaf0f9' : '#ffffff'} stroke={on ? '#27446e' : '#d7deea'} strokeWidth={on ? 4 : 2} opacity={on ? 1 : 0.75} />
                <text x={part.x} y={part.y + 10} textAnchor="middle" fontSize="30" fontWeight="700" fill={on ? '#27446e' : '#68778f'}>{part.name}</text>
              </g>
            );
          })}
          <circle cx="450" cy="232" r="86" fill="#f2f6fb" stroke="#27446e" strokeWidth="3" opacity=".9" />
          <Camera x={450} y={240} scale={1.05} />
          <text x="450" y="342" textAnchor="middle" fontSize="24" fill="#68778f">视频世界模型 W</text>
        </svg>
      </div>
      <div className="ps-bottom">
        <div className="ps-formula" aria-label="harness 由工具、技能、验证器与执行层组成">
          <span>H = (</span>
          {PARTS.map((part, index) => (
            <React.Fragment key={part.key}>
              <button className={`ps-term ${active === part.key ? 'is-on' : ''}`} onClick={() => setActive(part.key)}>{part.key}</button>
              {index < PARTS.length - 1 ? <span>,</span> : null}
            </React.Fragment>
          ))}
          <span>)</span>
        </div>
        <p className={`ps-feedback ${active === 'T' ? 'is-neutral' : 'is-info'}`} aria-live="polite">{current.role}</p>
      </div>
    </div>
  );
}
