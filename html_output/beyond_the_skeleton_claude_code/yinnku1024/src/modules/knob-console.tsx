import React, { useState } from 'react';
import { Dept, HW } from './kit';

type Knob = { name: string; desc: string };
const GROUPS: { id: string; label: string; knobs: Knob[] }[] = [
  {
    id: 'model', label: '模型行为', knobs: [
      { name: 'CLAUDE_CODE_EFFORT_LEVEL', desc: '推理努力等级，1–5。' },
      { name: 'CLAUDE_CODE_DISABLE_THINKING', desc: '关闭思考模式。' },
      { name: 'CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING', desc: '关闭自适应思考。' },
      { name: 'CLAUDE_CODE_DISABLE_1M_CONTEXT', desc: '关掉百万 token 上下文。' },
      { name: 'CLAUDE_CODE_MAX_OUTPUT_TOKENS', desc: '硬性限制输出 token。' },
      { name: 'CLAUDE_CODE_SUBAGENT_MODEL', desc: '子 agent 用哪个模型。' },
      { name: 'MAX_THINKING_TOKENS', desc: '思考 token 预算上限。' },
    ],
  },
  {
    id: 'feature', label: '功能开关', knobs: [
      { name: 'CLAUDE_CODE_COORDINATOR_MODE', desc: '多 Agent 协调模式。' },
      { name: 'CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS', desc: '团队模式。' },
      { name: 'CLAUDE_CODE_PLAN_MODE_REQUIRED', desc: '强制所有请求进入计划模式。' },
      { name: 'ENABLE_TOOL_SEARCH', desc: '工具搜索功能。' },
      { name: 'VOICE_STREAM_BASE_URL', desc: '自定义语音识别端点。' },
    ],
  },
  {
    id: 'perf', label: '性能调优', knobs: [
      { name: 'DISABLE_PROMPT_CACHING_OPUS', desc: '单独禁用 Opus 提示缓存。' },
      { name: 'DISABLE_PROMPT_CACHING_SONNET', desc: '单独禁用 Sonnet 提示缓存。' },
      { name: 'CLAUDE_CODE_PERFETTO_TRACE', desc: '启用 Perfetto 性能追踪。' },
      { name: 'BASH_MAX_TIMEOUT_MS', desc: 'Bash 执行超时上限。' },
      { name: 'MCP_TOOL_TIMEOUT', desc: 'MCP 工具执行超时。' },
    ],
  },
];

/* 控制台：320+ 个环境变量，绝大多数是内部调试用的。
   分类看，才知道哪些真的会影响行为。 */
export function KnobConsole() {
  const [group, setGroup] = useState('model');
  const [active, setActive] = useState('CLAUDE_CODE_EFFORT_LEVEL');
  const knobs = GROUPS.find(item => item.id === group)!.knobs;
  const knob = knobs.find(item => item.name === active) ?? knobs[0];

  return (
    <div className="hw" style={{ gridTemplateColumns: 'minmax(0, 1.24fr) minmax(0, 1fr)' }}>
      <div className="hw-card hw-card--plain hw-col" style={{ gap: 8 }}>
        <div className="hw-spread">
          <p className="hw-h">控制台</p>
          <Dept>控制台</Dept>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {GROUPS.map(item => (
            <button key={item.id} type="button" className="hw-btn"
              aria-pressed={group === item.id}
              onClick={() => { setGroup(item.id); setActive(item.knobs[0].name); }}>
              {item.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gap: 6, alignContent: 'start' }}>
          {knobs.map(item => (
            <button key={item.name} type="button" className="hw-btn hw-btn--block"
              aria-pressed={active === item.name} onClick={() => setActive(item.name)}
              style={{ padding: '5px 12px' }}>
              <span className="hw-mono" style={{ fontSize: 26 }}>{item.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="hw-col">
        <div className="hw-card hw-card--plain" style={{ flex: '1 1 auto' }}>
          <p className="hw-t hw-muted">这个旋钮管什么</p>
          <p className="hw-mono" style={{ fontSize: 26, margin: '4px 0', wordBreak: 'break-all' }}>{knob.name}</p>
          <p className="hw-h" style={{ lineHeight: 1.3 }}>{knob.desc}</p>
          <hr style={{ height: 1, background: HW.line, border: 0, margin: '10px 0' }} />
          <p className="hw-t hw-t--tight hw-muted">
            这些变量大多不在公开文档里；有一部分按模型分别控制缓存，说明不同模型的成本结构要分开调。
          </p>
        </div>
        <div className="hw-card hw-card--mint" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <p className="hw-fig" style={{ color: HW.blue }}>320+</p>
          <p className="hw-t hw-t--tight">逆向出的环境变量总数；本篇只列出了会明显影响行为的那些。</p>
        </div>
      </div>
    </div>
  );
}
