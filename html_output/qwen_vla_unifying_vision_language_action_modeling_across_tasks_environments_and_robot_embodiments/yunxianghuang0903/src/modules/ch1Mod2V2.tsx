import React, { useMemo, useState } from 'react';
import { PsChip } from '../components/ps-controls';
import type { WidgetProps } from './registry';

type Key = 'o' | 'x' | 'e' | 'z';

const SOURCES: Array<{ key: Key; name: string; sym: string; note: string; optional?: boolean; color: string }> = [
  { key: 'o', name: '视觉观察', sym: 'o', note: '场景与目标状态', color: 'var(--viz-green)' },
  { key: 'x', name: '语言指令', sym: 'x', note: '任务意图', color: 'var(--viz-navy)' },
  { key: 'e', name: '本体感知提示', sym: 'e', note: '机器人与控制约定', color: 'var(--viz-amber)' },
  { key: 'z', name: '任务标识', sym: 'z', note: '附加上下文', optional: true, color: 'var(--viz-purple)' },
];

const PRESETS: Array<{ label: string; state: Record<Key, boolean> }> = [
  { label: '完整条件', state: { o: true, x: true, e: true, z: true } },
  { label: '缺少视觉', state: { o: false, x: true, e: true, z: false } },
  { label: '只关闭 z', state: { o: true, x: true, e: true, z: false } },
];

function MiniSignal({ color, live }: { color: string; live: boolean }) {
  return (
    <svg viewBox="0 0 86 26" className="c1m2x-signal" aria-hidden="true">
      <path d="M2 15 C12 3 21 25 31 13 S51 4 60 14 S74 22 84 9" fill="none" stroke={live ? color : '#cbd5e1'} strokeWidth="2" strokeLinecap="round" strokeDasharray={live ? undefined : '4 4'} />
      {live ? <circle r="3" fill={color}><animateMotion dur="1.2s" repeatCount="indefinite" path="M2 15 C12 3 21 25 31 13 S51 4 60 14 S74 22 84 9" /></circle> : null}
    </svg>
  );
}

export const Ch1Mod2V2: React.FC<WidgetProps> = () => {
  const [on, setOn] = useState<Record<Key, boolean>>({ o: true, x: true, e: true, z: false });
  const [focus, setFocus] = useState<Key | null>(null);
  const requiredOk = on.o && on.x && on.e;

  const status = useMemo(() => {
    if (!on.o) return '视觉观察断流：融合核心无法获得场景状态，动作块停止生成。';
    if (!on.x) return '语言指令断流：任务意图缺失，预测条件不完整。';
    if (!on.e) return '本体感知提示断流：控制约定未知，动作语义无法落到具体机器人。';
    if (!on.z) return 'z 为可选条件：关闭后主预测链仍保持完整。';
    return '四路条件已汇合：共享核心持续生成 H 步未来动作。';
  }, [on]);

  return (
    <div className="c1m2x">
      <div className={`c1m2x-stage${requiredOk ? ' is-ready' : ' is-broken'}`}>
        <section className="c1m2x-sources" aria-label="预测条件输入">
          <div className="c1m2x-section-title"><span>01</span> 条件信号</div>
          {SOURCES.map((s) => {
            const live = on[s.key];
            const dim = focus !== null && focus !== s.key;
            return (
              <button
                type="button"
                key={s.key}
                className={`c1m2x-source${live ? ' is-live' : ' is-off'}${dim ? ' is-dim' : ''}`}
                onClick={() => setOn((p) => ({ ...p, [s.key]: !p[s.key] }))}
                onMouseEnter={() => setFocus(s.key)}
                onMouseLeave={() => setFocus(null)}
              >
                <span className="c1m2x-source-led" style={{ background: live ? s.color : '#cbd5e1' }} />
                <span className="c1m2x-source-main"><b>{s.name}</b><small>{s.note}</small></span>
                <MiniSignal color={s.color} live={live} />
                <span className="c1m2x-source-symbol">{s.sym}{s.optional ? <em>可选</em> : null}</span>
              </button>
            );
          })}
        </section>

        <section className="c1m2x-fusion">
          <div className="c1m2x-section-title"><span>02</span> 条件融合</div>
          <div className={`c1m2x-core${requiredOk ? ' is-ready' : ' is-gap'}`}>
            <svg viewBox="0 0 240 240" aria-hidden="true">
              <circle cx="120" cy="120" r="86" className="c1m2x-core-outer" />
              <circle cx="120" cy="120" r="65" className="c1m2x-core-mid" />
              <circle cx="120" cy="120" r="47" className="c1m2x-core-inner" />
              {SOURCES.map((s, i) => {
                const ang = (-135 + i * 90) * Math.PI / 180;
                const x = 120 + Math.cos(ang) * 92;
                const y = 120 + Math.sin(ang) * 92;
                const live = on[s.key];
                return (
                  <g key={s.key}>
                    <line x1={x} y1={y} x2="120" y2="120" stroke={live ? s.color : '#d4dbe5'} strokeWidth={live ? 2.8 : 1.8} strokeDasharray={live ? undefined : '5 5'} opacity={focus && focus !== s.key ? .22 : 1} />
                    <circle cx={x} cy={y} r="8" fill={live ? s.color : '#fff'} stroke={live ? s.color : '#cbd5e1'} strokeWidth="2" />
                    {live ? <circle r="4" fill={s.color}><animateMotion dur={`${1.25 + i * .08}s`} repeatCount="indefinite" path={`M${x} ${y} L120 120`} /></circle> : null}
                  </g>
                );
              })}
            </svg>
            <div className="c1m2x-core-label">
              <b>{requiredOk ? 'READY' : 'INCOMPLETE'}</b>
              <span>Qwen-VLA<br/>条件预测核心</span>
            </div>
            <div className="c1m2x-energy">
              {Array.from({ length: 12 }).map((_, i) => <i key={i} style={{ '--i': i } as React.CSSProperties} />)}
            </div>
          </div>
          <div className="c1m2x-equation">o + x + e {on.z ? '+ z' : ''} → p(y | ·)</div>
        </section>

        <section className="c1m2x-output">
          <div className="c1m2x-section-title"><span>03</span> 未来动作块</div>
          <div className="c1m2x-horizon">
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className={requiredOk ? 'is-live' : i < 2 ? 'is-ghost' : 'is-stop'} style={{ '--i': i } as React.CSSProperties}>
                <b>{i === 0 ? 't+1' : i === 7 ? 't+H' : ''}</b>
              </span>
            ))}
          </div>
          <div className="c1m2x-trajectory">
            <svg viewBox="0 0 320 140" aria-hidden="true">
              <path d="M18 105 C76 46, 145 128, 210 62 S278 48, 302 25" className="c1m2x-traj-ghost" />
              {requiredOk ? <path d="M18 105 C76 46, 145 128, 210 62 S278 48, 302 25" className="c1m2x-traj-live" /> : null}
              {requiredOk ? (
                <g className="c1m2x-eef">
                  <path d="M-7 5 L0 -5 L7 5" />
                  <rect x="-3" y="4" width="6" height="8" rx="1" />
                </g>
              ) : null}
              {!requiredOk ? [70, 112, 154, 196].map((x) => <circle key={x} cx={x} cy="105" r="4" className="c1m2x-suspended" />) : null}
            </svg>
          </div>
          <div className={`c1m2x-output-state${requiredOk ? ' ok' : ' bad'}`}>
            <i /> {requiredOk ? '动作序列持续形成' : '预测链路暂停'}
          </div>
        </section>
      </div>

      <div className="c1m2x-footer">
        <div className="c1m2x-presets">
          {PRESETS.map((p) => <PsChip key={p.label} onClick={() => setOn(p.state)}>{p.label}</PsChip>)}
        </div>
        <p className={requiredOk ? 'ok' : 'bad'}>{status}</p>
      </div>
    </div>
  );
};

export default Ch1Mod2V2;
