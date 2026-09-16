import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { Feedback } from './kit';

// Lab 6.1 — Dual Flow。
// 顶部切换两种执行流：Policy-driven（循环在运行层）与 Agent-directed（决策点在 Agent）。
// 内部循环变了，外部边界——Session、监督、证据、验收——纹丝不动：
// 这就是两条流能共用同一套 Runtime 的原因。

type Mode = 'policy' | 'agent';

const POLICY_NODES = ['Observation', 'PolicyAdapter', 'Policy (VLA)', 'Action Chunk', 'ActionBridge', 'SafetyGuard', 'TargetAdapter', 'Target'];
const AGENT_NODES = ['Agent', 'TargetSessionHandle', 'ToolManifest', 'Target'];

const POLICY_DUTIES = [
  '获取观测',
  '归一化为模型输入',
  '策略推理',
  '输出动作块',
  '表示转换',
  '放行判定',
  '设备适配',
  '受控执行',
];

const TOOLS = [
  { id: 'observe', label: 'observe()', ok: true, note: '读取观测：manifest 允许 ✓' },
  { id: 'invoke_tool', label: 'invoke_tool("grasp")', ok: true, note: '调用受控技能：参数校验通过 ✓' },
  { id: 'query_state', label: 'query_state()', ok: true, note: '查询目标端状态 ✓' },
  { id: 'raw_motor_command', label: 'raw_motor_command(...)', ok: false, note: 'Rejected: Not exposed by ToolManifest' },
];

export const DualFlow: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<Mode>('policy');
  const [seq, setSeq] = useState(-1);
  const [running, setRunning] = useState(false);
  const [chunkStep, setChunkStep] = useState(0);
  const [chunkCount, setChunkCount] = useState(1);
  const [interrupted, setInterrupted] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const timerRef = useRef<number>(0);

  useEffect(() => () => window.clearInterval(timerRef.current), []);

  const nodes = mode === 'policy' ? POLICY_NODES : AGENT_NODES;

  const clearSeq = () => {
    window.clearInterval(timerRef.current);
    setRunning(false);
    setSeq(-1);
  };

  const runSequence = (lines: string[], onComplete?: () => void) => {
    if (running) return;
    setRunning(true);
    setLog(lines);
    let i = 0;
    timerRef.current = window.setInterval(() => {
      i += 1;
      if (i < nodes.length) {
        setSeq(i);
      } else {
        window.clearInterval(timerRef.current);
        setRunning(false);
        setSeq(-1);
        onComplete?.();
      }
    }, 320);
  };

  const runChunk = () => {
    if (running) return;
    const nextStep = chunkStep + 1;
    runSequence([`chunk ${chunkCount} · step ${nextStep}/5 执行中（buffer 截断边界 = 5）`], () => {
      if (nextStep >= 5) {
        setInterrupted(true);
        setChunkStep(0);
        setChunkCount((c) => c + 1);
        setLog((l) => [
          ...l,
          '⚠ 环境已变化 → 剩余 15 步被截断，触发重规划边界（模型时间 ≠ 目标时间）',
        ]);
      } else {
        setChunkStep(nextStep);
      }
    });
  };

  const callTool = (t: (typeof TOOLS)[number]) => {
    if (!t.ok) {
      setLog((l) => [`✕ raw_motor_command → Rejected: Not exposed by ToolManifest`]);
      return;
    }
    runSequence([`tool call allowed: ${t.label}`], () => {
      setLog((l) => [...l, 'Agent 保持在线决策，但权限边界与证据接口不变']);
    });
  };

  const switchMode = (m: Mode) => {
    clearSeq();
    setMode(m);
    setChunkStep(0);
    setChunkCount(1);
    setInterrupted(false);
    setLog([]);
  };

  let tone: '' | 'good' | 'bad' | 'info' = 'info';
  let msg =
    '先在两种模式间切换，观察哪里变了、哪里没变。策略流里逐块执行动作块；工具流里试试被禁止的 raw_motor_command。';
  if (mode === 'policy' && interrupted) {
    tone = '';
    msg = '动作块执行到第 5 步时环境已变化——剩余步被截断并触发重规划。模型动作不能直接等价为设备命令：缓冲、截断、打断都由 Runtime 管理。';
  } else if (mode === 'policy') {
    tone = 'info';
    msg = 'Policy-driven：循环在运行层。Agent 编译完会话就退出低层循环，由 PolicySkillRuntime 驱动 观测→推理→动作。';
  } else {
    tone = 'info';
    msg = 'Agent-directed：决策点在 Agent，但权限在 Manifest——直接参与不等于无限制访问，raw 命令会被直接拒绝。';
  }

  return (
    <div className="lab df-lab">
      <div className="lab-controls lab-controls-top">
        <div className="lab-choice-group">
          <span className="lab-choice-label">执行流</span>
          <button type="button" className={`lab-chip ${mode === 'policy' ? 'is-active' : ''}`} onClick={() => switchMode('policy')}>
            Policy-driven（PolicySkillRuntime）
          </button>
          <button type="button" className={`lab-chip ${mode === 'agent' ? 'is-active' : ''}`} onClick={() => switchMode('agent')}>
            Agent-directed（BuiltinSkillRuntime）
          </button>
        </div>
      </div>

      {/* 不变的外部边界 */}
      <div className="df-boundary" aria-label="两条流共享的外部边界">
        <span className="df-boundary-tag">不变的外部边界</span>
        <span className="df-boundary-item">Session 契约</span>
        <i>→</i>
        <span className="df-boundary-item">Watchdog 监督</span>
        <i>→</i>
        <span className="df-boundary-item">Evidence 证据</span>
        <i>→</i>
        <span className="df-boundary-item">SessionVerifier</span>
      </div>

      <div className="lab-stage df-stage" key={mode}>
        {mode === 'policy' ? (
          <>
            <div className="df-pipeline">
              {POLICY_NODES.map((n, i) => (
                <React.Fragment key={n}>
                  <div className={`lab-node lab-node-chain df-node ${seq === i ? 'is-hot' : ''}`}>
                    <span className="lab-node-title">{n}</span>
                    <span className="lab-node-sub">{POLICY_DUTIES[i]}</span>
                  </div>
                  {i < POLICY_NODES.length - 1 ? <span className="lab-arrow" aria-hidden>→</span> : null}
                </React.Fragment>
              ))}
            </div>
            <div className="df-chunkbar" role="status">
              <span className="df-chunkbar-label">
                chunk {chunkCount} · 步进缓冲 {chunkStep}/5
              </span>
              <div className="df-chunkbar-track" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <i key={i} className={i < chunkStep ? 'is-filled' : ''} />
                ))}
              </div>
              {interrupted ? <span className="df-chunkbar-note">上一块在第 5 步后被截断 ✓ 重规划边界触发</span> : null}
            </div>
            <div className="lab-controls lab-controls-center">
              <button type="button" className="lab-btn lab-btn-primary" onClick={runChunk} disabled={running}>
                Run next chunk
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="df-pipeline">
              {AGENT_NODES.map((n, i) => (
                <React.Fragment key={n}>
                  <div className={`lab-node lab-node-chain df-node ${seq === i ? 'is-hot' : ''}`}>
                    <span className="lab-node-title">{n}</span>
                  </div>
                  {i < AGENT_NODES.length - 1 ? <span className="lab-arrow" aria-hidden>→</span> : null}
                </React.Fragment>
              ))}
            </div>
            <div className="df-tools">
              <span className="df-tools-label">TargetToolManifest（经会话工具策略过滤）</span>
              <div className="df-tools-grid">
                {TOOLS.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    className={`df-tool ${t.ok ? '' : 'is-forbidden'}`}
                    onClick={() => callTool(t)}
                    disabled={running && t.ok}
                  >
                    <code>{t.label}</code>
                    <span>{t.ok ? '允许' : '禁止'}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {log.length > 0 ? (
          <div className="runtime-console df-console" aria-live="polite">
            {log.map((l, i) => (
              <div className={`sl-console-line ${l.startsWith('✕') ? 'is-bad' : ''}`} key={i}>
                {l}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <Feedback tone={tone}>{msg}</Feedback>
    </div>
  );
};

export default DualFlow;
