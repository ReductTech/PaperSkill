import React, { useState } from 'react';
import { Feedback, RW } from './kit';

const FLAGS = [
  { id: 'PROACTIVE', label: '主动代理', module: 'proactive/' },
  { id: 'KAIROS', label: 'Kairos 子系统', module: 'kairos/' },
  { id: 'BRIDGE_MODE', label: 'IDE 桥接', module: 'bridge/' },
  { id: 'DAEMON', label: '后台守护', module: 'daemon/' },
  { id: 'VOICE_MODE', label: '语音输入', module: 'commands/voice/' },
  { id: 'AGENT_TRIGGERS', label: '触发器', module: 'triggers/' },
  { id: 'MONITOR_TOOL', label: '监控工具', module: 'tools/monitor.ts' },
  { id: 'COORDINATOR_MODE', label: '多代理协调', module: 'coordinator/' },
  { id: 'WORKFLOW_SCRIPTS', label: '工作流脚本', module: 'workflow/' },
];

/* 特性开关不是“藏起来”，而是在构建期决定那段代码是否进入产物。
   打开一个开关，才会有一个模块被打进包里。 */
export function FeatureFlags() {
  const [on, setOn] = useState<string[]>(['PROACTIVE', 'KAIROS']);
  const enabled = FLAGS.filter(flag => on.includes(flag.id));

  return (
    <div className="rw" style={{ gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1fr)' }}>
      <div className="rw-card rw-card--plain rw-col" style={{ gap: 10 }}>
        <p className="rw-h">九组特性开关</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {FLAGS.map(flag => {
            const active = on.includes(flag.id);
            return (
              <button key={flag.id} type="button" className="rw-btn"
                aria-pressed={active}
                onClick={() => setOn(current => active ? current.filter(id => id !== flag.id) : [...current, flag.id])}
                style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '8px 10px' }}>
                <span className="rw-mono" style={{ fontSize: 26, fontWeight: 700 }}>{flag.id}</span>
                <span style={{ fontSize: 26, color: active ? '#cdd8e8' : RW.muted }}>{flag.label}</span>
              </button>
            );
          })}
        </div>
        <p className="rw-t rw-muted">
          写法：<span className="rw-code">if (feature(&apos;VOICE_MODE&apos;))</span> — 未启用时整段被删除。
        </p>
      </div>

      <div className="rw-col">
        <div className="rw-card" style={{ borderLeftColor: RW.steel }}>
          <div className="rw-spread">
            <p className="rw-t rw-muted">产物里的模块</p>
            <span className="rw-chip" data-tone="blue">{enabled.length} / 9</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {enabled.map(flag => (
              <span key={flag.id} className="rw-chip" data-tone="green">{flag.module}</span>
            ))}
            {enabled.length === 0 && <span className="rw-chip" data-tone="steel">只有核心</span>}
          </div>
        </div>

        <div className="rw-card rw-card--plain">
          <p className="rw-t rw-muted">被构建期删掉的模块</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            {FLAGS.filter(flag => !on.includes(flag.id)).map(flag => (
              <span key={flag.id} className="rw-mono" style={{
                fontSize: 26, color: RW.muted, textDecoration: 'line-through',
                border: `1px dashed ${RW.line}`, borderRadius: 4, padding: '2px 8px',
              }}>{flag.module}</span>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <Feedback tone={enabled.length <= 2 ? 'good' : 'neutral'}>
            {enabled.length === 0
              ? '九个特性全关：产物里只有核心路径，功能也一并消失。'
              : `产物只带 ${enabled.length} 个可选模块；其余六段代码不在二进制里，删掉的是代码，不是入口。`}
          </Feedback>
        </div>
      </div>
    </div>
  );
}
