import React, { useMemo, useState } from 'react';
import { PsFeedback, PsSegmented } from '../components/ps-controls';
import type { WidgetProps } from './registry';

type Mode = 'special' | 'shared';

const LANES = [
  { id: 'manip', label: '操纵', detail: '机器人操纵策略', output: '连续动作', color: 'var(--viz-red)', y: 74 },
  { id: 'nav', label: '导航', detail: '视觉-语言导航策略', output: '航点', color: 'var(--viz-sky)', y: 165 },
  { id: 'ego', label: '人体动作', detail: '第一视角动作策略', output: '人体/手部轨迹', color: 'var(--viz-green)', y: 256 },
] as const;

export const Ch1Mod1V2: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<Mode>('special');
  const [focus, setFocus] = useState<number | null>(null);
  const feedback = useMemo(
    () => mode === 'special'
      ? '三类任务各自维护一套模型与计算通路；切换任务，模型也随之切换。'
      : '三条输入通路汇入同一个 Qwen-VLA 核心，再按各自任务语义输出。统一的是计算结构，不是物理控制语义。',
    [mode],
  );

  return (
    <div className="c1m1x">
      <div className={`c1m1x-stage is-${mode}`} onMouseLeave={() => setFocus(null)}>
        <div className="c1m1x-topline">
          <span className="c1m1x-kicker">网络重构实验</span>
          <span className="c1m1x-count"><b>{mode === 'special' ? '3' : '1'}</b> {mode === 'special' ? '套独立模型' : '个共享核心'}</span>
        </div>

        <svg viewBox="0 0 1000 330" className="c1m1x-svg" role="img" aria-label="专用模型与共享模型结构切换示意">
          <defs>
            <filter id="c1m1xGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <marker id="c1m1xArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#71809a"/></marker>
          </defs>

          {LANES.map((lane, i) => {
            const dim = focus !== null && focus !== i;
            const specialPath = `M210 ${lane.y} L790 ${lane.y}`;
            const sharedIn = `M210 ${lane.y} C325 ${lane.y} 392 ${165 + (lane.y - 165) * .25} 456 165`;
            const sharedOut = `M544 165 C626 ${165 + (lane.y - 165) * .25} 690 ${lane.y} 790 ${lane.y}`;
            return (
              <g key={lane.id} className={dim ? 'is-dim' : ''} onMouseEnter={() => setFocus(i)}>
                <g className="c1m1x-source" transform={`translate(72 ${lane.y - 28})`}>
                  <rect width="118" height="56" rx="16" fill="#fff" stroke={lane.color} strokeWidth="1.8" />
                  <circle cx="18" cy="18" r="5" fill={lane.color} opacity=".82" />
                  <text x="59" y="25" textAnchor="middle" fontSize="15" fontWeight="800" fill="#2c3850">{lane.label}</text>
                  <text x="59" y="43" textAnchor="middle" fontSize="10.5" fontWeight="650" fill="#7a879b">输入条件</text>
                </g>

                <g className="c1m1x-output" transform={`translate(810 ${lane.y - 28})`}>
                  <rect width="128" height="56" rx="16" fill="#fff" stroke={lane.color} strokeWidth="1.8" />
                  <text x="64" y="24" textAnchor="middle" fontSize="14" fontWeight="800" fill="#2c3850">{lane.output}</text>
                  <text x="64" y="43" textAnchor="middle" fontSize="10.5" fontWeight="650" fill="#7a879b">原生控制语义</text>
                </g>

                <path className="c1m1x-path c1m1x-path--special" d={specialPath} stroke={lane.color} markerEnd="url(#c1m1xArrow)" />
                <path className="c1m1x-path c1m1x-path--shared" d={sharedIn} stroke={lane.color} />
                <path className="c1m1x-path c1m1x-path--shared" d={sharedOut} stroke={lane.color} markerEnd="url(#c1m1xArrow)" />

                {mode === 'special' ? (
                  <>
                    <g className="c1m1x-special-core" transform={`translate(${455 + (i - 1) * 72} ${lane.y})`}>
                      <circle r="29" fill="#fff" stroke={lane.color} strokeWidth="2.5" />
                      <circle r="20" fill={lane.color} opacity=".12" />
                      <text y="4" textAnchor="middle" fontSize="11.5" fontWeight="800" fill="#36445e">策略 {String.fromCharCode(65 + i)}</text>
                    </g>
                    <circle r="5" fill={lane.color} filter="url(#c1m1xGlow)" key={`${mode}-${lane.id}-packet`}>
                      <animateMotion dur={`${1.8 + i * .18}s`} repeatCount="indefinite" path={specialPath} />
                    </circle>
                  </>
                ) : (
                  <>
                    <circle r="5" fill={lane.color} filter="url(#c1m1xGlow)" key={`${mode}-${lane.id}-in`}>
                      <animateMotion dur={`${1.35 + i * .12}s`} repeatCount="indefinite" path={sharedIn} />
                    </circle>
                    <circle r="4.5" fill={lane.color} filter="url(#c1m1xGlow)" key={`${mode}-${lane.id}-out`}>
                      <animateMotion dur={`${1.25 + i * .12}s`} begin=".7s" repeatCount="indefinite" path={sharedOut} />
                    </circle>
                  </>
                )}
              </g>
            );
          })}

          {mode === 'shared' ? (
            <g className="c1m1x-shared-core">
              <circle cx="500" cy="165" r="60" fill="rgba(52,71,111,.08)" stroke="rgba(52,71,111,.18)" strokeWidth="9" />
              <circle cx="500" cy="165" r="45" fill="#34476f" />
              <circle cx="500" cy="165" r="54" fill="none" stroke="#3d8f6a" strokeWidth="2.5" strokeDasharray="8 6" className="c1m1x-core-orbit" />
              <text x="500" y="157" textAnchor="middle" fontSize="17" fontWeight="850" fill="#fff">Qwen-VLA</text>
              <text x="500" y="180" textAnchor="middle" fontSize="11" fontWeight="700" fill="#dce5ef">共享计算核心</text>
            </g>
          ) : (
            <g className="c1m1x-special-caption">
              <text x="500" y="318" textAnchor="middle" fontSize="12" fontWeight="700" fill="#8b97ab"></text>
            </g>
          )}
        </svg>

        <div className="c1m1x-legend">
          {LANES.map((lane, i) => (
            <button key={lane.id} className={focus === i ? 'is-active' : ''} onClick={() => setFocus(focus === i ? null : i)}>
              <i style={{ background: lane.color }} />{lane.detail}
            </button>
          ))}
        </div>
      </div>

      <div className="ps-controls-row c1m1x-controls">
        <PsSegmented
          ariaLabel="模型结构模式"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'special', label: '各自为战' },
            { value: 'shared', label: '共享模型' },
          ]}
        />
      </div>
      <PsFeedback tone={mode === 'shared' ? 'good' : 'neutral'}>{feedback}</PsFeedback>
    </div>
  );
};

export default Ch1Mod1V2;
