import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Feedback } from './kit';

// Lab 5.1 — Session Lifecycle：一台可以被「玩坏」的状态机。
// 所有节点都可以点：合法转移推进会话并在协议文件里留下记录；
// 非法转移被治理层直接拒绝——会话不是一串可以任意调用的函数。

type StateId =
  | 'pending'
  | 'claimed'
  | 'running'
  | 'finalizing'
  | 'awaiting_verification'
  | 'verifying'
  | 'succeeded'
  | 'failed'
  | 'replanned';

const ORDER: StateId[] = ['pending', 'claimed', 'running', 'finalizing', 'awaiting_verification', 'verifying'];

const NODES: { id: StateId; label: string; owner: string; write: string }[] = [
  {
    id: 'pending',
    label: 'pending',
    owner: 'Agent / Session Compiler',
    write: 'SESSIONS.md ← 目标 · Runtime · Target · 接受标准（等待认领）',
  },
  {
    id: 'claimed',
    label: 'claimed',
    owner: 'WatchdogSupervisor',
    write: 'SESSIONS.md ← state=claimed · 原子认领，开始兼容性预检',
  },
  {
    id: 'running',
    label: 'running',
    owner: 'SessionRunner',
    write: 'heartbeat: runner ✓ policy ✓ target ✓（受控执行中）',
  },
  {
    id: 'finalizing',
    label: 'finalizing',
    owner: 'SessionRunner',
    write: 'evidence ← S₀ / S_T 观测 · 动作-观测历史 · 目标端事件',
  },
  {
    id: 'awaiting_verification',
    label: 'awaiting_verification',
    owner: 'Runtime',
    write: 'SESSIONS.md ← state=awaiting_verification · 证据包就绪',
  },
  {
    id: 'verifying',
    label: 'verifying',
    owner: 'SessionVerifier',
    write: 'verifier: 对比 G / S₀ / S_T / τ / H 与接受标准',
  },
];

const TERMINALS: { id: StateId; label: string; write: string }[] = [
  { id: 'succeeded', label: 'succeeded', write: 'SESSIONS.md ← verdict=succeeded（经验候选 → KNOWLEDGE）' },
  { id: 'failed', label: 'failed', write: 'SESSIONS.md ← verdict=failed（证据保留 → 诊断 / LESSONS）' },
  { id: 'replanned', label: 'replanned', write: 'child session 已编译；原会话不被改写（append-only）' },
];

export const SessionLifecycle: React.FC<WidgetProps> = () => {
  const [current, setCurrent] = useState<StateId>('pending');
  const [violations, setViolations] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>(['SESSIONS.md ← session sess-0142 created (pending)']);

  const idx = ORDER.indexOf(current);
  const terminal = TERMINALS.find((t) => t.id === current);
  const atVerifying = current === 'verifying';

  const advance = (next: StateId) => {
    if (next === current) return;
    const nextIdx = ORDER.indexOf(next);
    const curIdx = ORDER.indexOf(current);

    // terminal 只能从 verifying 进入
    if (terminal || current === 'succeeded' || current === 'failed' || current === 'replanned') {
      reject('terminal 是终态：会话生命周期不可回退。重试会编译新的 child session，而不是改写历史。');
      return;
    }
    if (TERMINALS.some((t) => t.id === next)) {
      if (atVerifying) {
        setCurrent(next);
        const t = TERMINALS.find((x) => x.id === next)!;
        setLog((l) => [...l, t.write]);
        return;
      }
      reject(`Illegal transition：${current} 状态下不能直接给出 verdict——必须先走完 finalizing → awaiting_verification → verifying。`);
      return;
    }
    if (nextIdx === curIdx + 1) {
      setCurrent(next);
      const n = NODES[nextIdx];
      setLog((l) => [...l, n.write]);
      setFlash(null);
      return;
    }
    if (nextIdx <= curIdx) {
      reject(`Illegal transition：会话状态不可回退（append-only）。${current} → ${next} 会破坏审计历史。`);
      return;
    }
    const skipped = ORDER.slice(curIdx + 1, nextIdx).map((s) => NODES[ORDER.indexOf(s)].label);
    reject(`Illegal transition：跳过了 ${skipped.join(' → ')}。治理要求每一步都显式发生——比如在 ${current} 时点 Verify，Verifier 还没有任何证据可读。`);
  };

  const reject = (why: string) => {
    setViolations((v) => v + 1);
    setFlash(why);
  };

  const reset = () => {
    setCurrent('pending');
    setViolations(0);
    setFlash(null);
    setLog(['SESSIONS.md ← session sess-0142 created (pending)']);
  };

  let tone: '' | 'good' | 'bad' | 'info' = 'info';
  let msg = '按顺序点击节点推进会话；也可以故意点非法转移（比如 running 时直接点 verifying），看看治理层如何拒绝。';
  if (flash) {
    tone = 'bad';
    msg = flash;
  } else if (terminal) {
    tone = 'good';
    if (current === 'replanned') {
      msg = 'replanned：原会话保持不可变，系统编译了更新前置条件的 child session（sess-0143）——重规划是新的可审计决策。';
    } else if (current === 'succeeded') {
      msg = 'succeeded：判定已追加进 attempts 记录。整条生命周期每一步都在协议文件里留下了痕迹。';
    } else {
      msg = 'failed：证据保留用于诊断与教训提取——失败不丢人，丢证据才丢人。';
    }
  } else if (atVerifying) {
    tone = '';
    msg = 'verifying：SessionVerifier 正在评估证据包。现在选择一个 verdict —— 注意这一步只能发生在证据就绪之后。';
  }

  return (
    <div className="lab sl-lab">
      <div className="lab-stage lab-rail-stage">
        <div className="lab-rail" role="group" aria-label="会话状态机">
          {NODES.map((n, i) => {
            const stateIdx = ORDER.indexOf(current);
            const isDone = terminal || stateIdx > i;
            const isActive = current === n.id;
            return (
              <button
                type="button"
                key={n.id}
                className={`lab-rail-node ${isActive ? 'is-active' : ''} ${isDone ? 'is-done' : ''}`}
                onClick={() => advance(n.id)}
              >
                <span className="lab-rail-dot" aria-hidden />
                <span className="lab-rail-label">{n.label}</span>
                <span className="lab-rail-owner">{n.owner}</span>
              </button>
            );
          })}
        </div>

        {/* verdict 选择 */}
        <div className={`sl-verdicts ${atVerifying ? 'is-open' : ''}`}>
          <span className="sl-verdicts-label">terminal →</span>
          {TERMINALS.map((t) => (
            <button
              type="button"
              key={t.id}
              className={`sl-verdict-btn tone-${t.id === 'succeeded' ? 'good' : t.id === 'failed' ? 'bad' : 'warn'}`}
              onClick={() => advance(t.id)}
              disabled={!atVerifying}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 协议控制台 */}
        <div className="runtime-console sl-console" aria-live="polite">
          <div className="sl-console-head">protocol console · 只追加（append-only）</div>
          {log.map((l, i) => (
            <div className="sl-console-line" key={i}>
              {l}
            </div>
          ))}
          {terminal ? <div className="sl-console-line is-final">attempts += 1 · 历史未被改写</div> : null}
        </div>
      </div>

      <div className="lab-controls">
        <button type="button" className="lab-btn lab-btn-ghost" onClick={reset}>
          重置
        </button>
        <span className="sl-violations">
          非法转移尝试：<b>{violations}</b> 次
          {violations > 0 ? '（被拒绝的操作也是可审计的事件）' : ''}
        </span>
      </div>
      <Feedback tone={tone}>{msg}</Feedback>
    </div>
  );
};

export default SessionLifecycle;
