import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Feedback } from './kit';

// Lab 8.1 — Failure-to-Memory System Map。
// Phase 1：沿真实路径逐步推进一次「失败 → 诊断 → child session → 再验证 → 固化」；
// Phase 2：把候选经验分进正确的桶——未经 Re-verify 的修复不能进入长期记忆。

type Phase = 'path' | 'classify';

interface StepDef {
  node: string;
  line: string;
  tone?: 'bad' | 'good' | 'warn';
}

const STEPS: StepDef[] = [
  { node: 'planner', line: 'Goal Planner：理解「杯子进柜子」→ 目标 + 接受标准（sess-0142）' },
  { node: 'compiler', line: 'Session Compiler：编译会话契约 → 写入 SESSIONS.md（pending）' },
  { node: 'watchdog', line: 'WatchdogSupervisor：认领会话（claimed），绑定 Runtime 与 Target' },
  { node: 'preflight', line: 'Compatibility Preflight：通过 → 产出 AdapterPlan + TargetToolManifest' },
  { node: 'runner', line: 'SessionRunner：启动执行（running），三路心跳上线' },
  { node: 'runtime', line: 'PolicySkillRuntime：观测 → 策略推理 → 动作块（经 Bridge / SafetyGuard）' },
  { node: 'target', line: 'Target：夹爪在感知位闭合——第一次尝试：闭空', tone: 'bad' },
  { node: 'evidence', line: 'Evidence Bundle 写回：S₀ / S_T / τ / return_code = 0' },
  { node: 'verifier', line: 'SessionVerifier：S₀ = S_T（杯子未动）→ failure', tone: 'bad' },
  { node: 'diagnose', line: 'Diagnose：结合 LESSONS + 运行时事件 → 候选原因 = 感知偏移', tone: 'warn' },
  { node: 'child', line: 'Revise → 编译 child session（sess-0143）：先重新对齐感知再抓取', tone: 'warn' },
  { node: 'reverify', line: 'child session 再执行、再验证（相同验收语义）→ success', tone: 'good' },
  { node: 'consolidate', line: 'Consolidate：LESSONS 更新（纠正已验证）+ KNOWLEDGE 新增成功模式', tone: 'good' },
  { node: 'done', line: '第二次比第一次好——模型权重一个都没改。这就是系统级自演化。', tone: 'good' },
];

const NODES: { id: string; label: string; plane: 'agent' | 'runtime' | 'verify' }[] = [
  { id: 'planner', label: 'Goal Planner', plane: 'agent' },
  { id: 'compiler', label: 'Session Compiler', plane: 'agent' },
  { id: 'sessions', label: 'SESSIONS.md', plane: 'agent' },
  { id: 'watchdog', label: 'Watchdog', plane: 'runtime' },
  { id: 'preflight', label: 'Preflight', plane: 'runtime' },
  { id: 'runner', label: 'SessionRunner', plane: 'runtime' },
  { id: 'runtime', label: 'PolicySkillRuntime', plane: 'runtime' },
  { id: 'target', label: 'Target', plane: 'runtime' },
  { id: 'evidence', label: 'Evidence Bundle', plane: 'verify' },
  { id: 'verifier', label: 'SessionVerifier', plane: 'verify' },
  { id: 'diagnose', label: 'Diagnose', plane: 'verify' },
  { id: 'child', label: 'Child Session', plane: 'verify' },
  { id: 'reverify', label: 'Re-verify', plane: 'verify' },
  { id: 'consolidate', label: 'Consolidate', plane: 'verify' },
];

type Bucket = 'hypothesis' | 'lesson' | 'knowledge';

interface CandidateDef {
  id: string;
  text: string;
  correct: Bucket;
  explain: string;
}

const CANDIDATES: CandidateDef[] = [
  {
    id: 'A',
    text: '「感知偏移可能导致闭空」——失败后 Agent 的一句归因',
    correct: 'hypothesis',
    explain: '只是事后猜测：没有任何执行验证它。Hypothesis 可以留在工作记忆里，但不允许进入长期记忆。',
  },
  {
    id: 'B',
    text: '「抓取前按真实位置重新对齐，再执行闭合」——child session 再验证成功',
    correct: 'lesson',
    explain: '修复经过了一次相同验收语义下的 Re-verify——可以作为 Verified Lesson 写入 LESSONS.md，并附证据指针。',
  },
  {
    id: 'C',
    text: '「Franka + tabletop、RGB-D、平行夹爪条件下重新对齐抓取成功」——含条件与来源',
    correct: 'knowledge',
    explain: '有 provenance（哪台机器人）、scope（什么条件下适用）且经验证——进入 KNOWLEDGE.md，可被未来会话检索。换夹爪或换控制频率时，scope 不匹配，必须重新验证。',
  },
];

const BUCKETS: { id: Bucket; label: string; hint: string }[] = [
  { id: 'hypothesis', label: 'Hypothesis', hint: '未经执行的猜测' },
  { id: 'lesson', label: 'Verified Lesson', hint: '经再验证的失败纠正' },
  { id: 'knowledge', label: 'Reusable Knowledge', hint: '带条件与来源的成功模式' },
];

export const ArchMap: React.FC<WidgetProps> = () => {
  const [phase, setPhase] = useState<Phase>('path');
  const [step, setStep] = useState(-1);
  const [assign, setAssign] = useState<Record<string, Bucket>>({});

  const current = step >= 0 && step < STEPS.length ? STEPS[step] : null;
  const finished = step === STEPS.length - 1;
  const visited = (id: string) => STEPS.slice(0, step + 1).some((s) => s.node === id);
  const isHot = (id: string) => current?.node === id;
  const verdictTone =
    step >= 8 && step <= 11 ? 'bad' : step >= 12 ? 'good' : '';

  const allAssigned = CANDIDATES.every((c) => assign[c.id]);
  const allCorrect = CANDIDATES.every((c) => assign[c.id] === c.correct);

  let tone: '' | 'good' | 'bad' | 'info' = 'info';
  let msg = '点击「执行会话」，逐步推进一次完整失败恢复。注意第 9 步：Verifier 拒绝了 return code 的诱惑。';
  if (phase === 'path') {
    if (finished) {
      tone = 'good';
      msg = '闭环走完：失败没有丢进垃圾堆，而是变成了带条件的经验。下一步去「这能被学吗」判断哪些东西配进记忆。';
    } else if (current) {
      tone = current.tone === 'bad' ? 'bad' : current.tone === 'warn' ? '' : current.tone === 'good' ? 'good' : 'info';
      msg = current.line;
    }
  } else {
    if (allCorrect) {
      tone = 'good';
      msg = '全部分类正确：未经 Re-verify 的修复只是 hypothesis；进入长期记忆的经验必须带验证记录、provenance 与 scope。';
    } else if (allAssigned) {
      tone = 'bad';
      msg = '有卡片放错桶了。判断标准：有没有经过执行验证？有没有携带适用条件与来源？点错可以重选。';
    } else {
      tone = 'info';
      msg = '给每张候选经验卡片选一个归属。注意：A 只是归因猜测，B 经过了一次再验证，C 带条件与来源。';
    }
  }

  return (
    <div className="lab am-lab">
      <div className="lab-controls lab-controls-top">
        <div className="lab-choice-group">
          <button type="button" className={`lab-chip ${phase === 'path' ? 'is-active' : ''}`} onClick={() => setPhase('path')}>
            ① 系统路径追踪
          </button>
          <button type="button" className={`lab-chip ${phase === 'classify' ? 'is-active' : ''}`} onClick={() => setPhase('classify')}>
            ② 这能被学吗？
          </button>
        </div>
      </div>

      {phase === 'path' ? (
        <div className="lab-stage am-stage">
          <div className="am-plane am-plane-agent">
            <span className="am-plane-tag">Agent Plane</span>
            <div className="am-nodes">
              {NODES.filter((n) => n.plane === 'agent').map((n) => (
                <div
                  key={n.id}
                  className={`am-node ${visited(n.id) ? 'is-done' : ''} ${isHot(n.id) ? 'is-hot' : ''} ${
                    n.id === 'verifier' && verdictTone ? `tone-${verdictTone}` : ''
                  }`}
                >
                  {n.label}
                </div>
              ))}
            </div>
          </div>
          <div className="am-plane am-plane-protocol">
            <span className="am-plane-tag">Protocol Boundary · 文件协议（append-only）</span>
          </div>
          <div className="am-plane am-plane-runtime">
            <span className="am-plane-tag">Runtime Plane</span>
            <div className="am-nodes">
              {NODES.filter((n) => n.plane === 'runtime').map((n) => (
                <div key={n.id} className={`am-node ${visited(n.id) ? 'is-done' : ''} ${isHot(n.id) ? 'is-hot' : ''}`}>
                  {n.label}
                </div>
              ))}
            </div>
          </div>
          <div className="am-plane am-plane-verify">
            <span className="am-plane-tag">Verification → Memory</span>
            <div className="am-nodes">
              {NODES.filter((n) => n.plane === 'verify').map((n) => (
                <div
                  key={n.id}
                  className={`am-node ${visited(n.id) ? 'is-done' : ''} ${isHot(n.id) ? 'is-hot' : ''} ${
                    n.id === 'verifier' && verdictTone ? `tone-${verdictTone}` : ''
                  }`}
                >
                  {n.label}
                </div>
              ))}
            </div>
          </div>

          <div className="am-progress">
            <button
              type="button"
              className="lab-btn lab-btn-primary"
              onClick={() => setStep((s) => Math.min(s + 1, STEPS.length - 1))}
              disabled={finished}
            >
              {step < 0 ? '执行会话' : finished ? '闭环完成 ✓' : `下一步（${step + 2}/${STEPS.length}）`}
            </button>
            <button type="button" className="lab-btn lab-btn-ghost" onClick={() => { setStep(-1); }} disabled={step < 0}>
              重置
            </button>
          </div>

          <div className="runtime-console am-console" aria-live="polite">
            {STEPS.slice(0, step + 1).map((s, i) => (
              <div className={`sl-console-line ${s.tone ? `is-${s.tone}` : ''}`} key={i}>
                {s.line}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="lab-stage am-classify">
          <div className="am-cards">
            {CANDIDATES.map((c) => (
              <div className="am-card" key={c.id}>
                <div className="am-card-text">
                  <b>{c.id}.</b> {c.text}
                </div>
                <div className="am-card-buckets">
                  {BUCKETS.map((b) => (
                    <button
                      type="button"
                      key={b.id}
                      className={`am-bucket-btn ${assign[c.id] === b.id ? 'is-chosen' : ''} ${
                        assign[c.id] && assign[c.id] !== c.correct && assign[c.id] === b.id ? 'is-wrong' : ''
                      }`}
                      onClick={() => setAssign((prev) => ({ ...prev, [c.id]: b.id }))}
                      title={b.hint}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
                {assign[c.id] ? (
                  <div className={`am-card-explain ${assign[c.id] === c.correct ? 'is-ok' : 'is-bad'}`}>
                    {assign[c.id] === c.correct ? '✓ ' : '✕ '}
                    {c.explain}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <div className="am-classify-foot">
            判断顺序：<b>有没有经过 Re-verify？</b>→ 有没有 provenance 与 scope？——顺序反了，记忆就会变成谣言仓库。
          </div>
        </div>
      )}

      <Feedback tone={tone}>{msg}</Feedback>
    </div>
  );
};

export default ArchMap;
