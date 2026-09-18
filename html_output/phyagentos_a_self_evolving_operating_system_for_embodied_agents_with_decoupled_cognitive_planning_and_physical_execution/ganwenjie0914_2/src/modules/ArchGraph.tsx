import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { Feedback } from './kit';

// Lab 3.2 — Architecture Graph：可交互的系统架构网络。
// 从主链骨干开始，点击任意「球」展开它的关联节点与边；
// 选中节点在下方信息面板显示职责与输入输出，可沿关联继续探索。
// 「展开全部」进入全景模式：此时点击只在聚焦 / 取消聚焦间切换，保持全图完整。
// 对应论文 Figure 3（总体架构），但把静态图变成了可以逐层展开的网络。

type Zone = 'agent' | 'protocol' | 'runtime' | 'target';

interface NodeDef {
  id: string;
  label: string;
  short: string;
  zone: Zone;
  x: number;
  y: number;
  desc: string;
  links: string[];
}

const ZONE_META: Record<Zone, { name: string; color: string; soft: string }> = {
  agent: { name: 'Agent Plane', color: '#27446e', soft: 'var(--blue-soft)' },
  protocol: { name: 'Protocol Boundary', color: '#7c3aed', soft: 'var(--purple-soft)' },
  runtime: { name: 'Runtime Plane', color: '#228d5c', soft: 'var(--green-soft)' },
  target: { name: 'Target', color: '#b85c1e', soft: 'var(--orange-soft)' },
};

const NODES: NodeDef[] = [
  // Agent Plane
  { id: 'goal', label: '用户目标 / 指令', short: '目标', zone: 'agent', x: 110, y: 60, desc: '自然语言任务请求与多源上下文的入口。', links: ['context', 'planner'] },
  { id: 'context', label: 'ContextBuilder · 记忆检索', short: '检索', zone: 'agent', x: 250, y: 60, desc: '按 goal / environment / target / risk 检索相关经验，注入规划上下文——经验必须携带 provenance 与 scope。', links: ['goal', 'memory', 'environment', 'planner'] },
  { id: 'planner', label: 'Goal Planner', short: '规划器', zone: 'agent', x: 110, y: 165, desc: '把请求解释为任务目标，锁定必须保持不变的约束；依据验证结果重规划。', links: ['goal', 'context', 'compiler', 'verifier'] },
  { id: 'compiler', label: 'Session Compiler · Goal Graph', short: '编译器', zone: 'agent', x: 110, y: 270, desc: '把目标分解为依赖感知的子任务，编译成结构化会话契约：目标、Runtime、Target、前置条件、接受标准。', links: ['planner', 'sessions', 'selector'] },
  { id: 'selector', label: 'SkillRuntime & Target Selector', short: '选择器', zone: 'agent', x: 250, y: 270, desc: '依据能力、观测模态、动作语义与目标约束，选择执行方法与执行目标。', links: ['compiler', 'skillrtF', 'targetsF', 'skillrt'] },
  { id: 'verifier', label: 'SessionVerifier', short: '验证器', zone: 'agent', x: 250, y: 385, desc: '读取证据包与接受标准，输出 success / failure / replan；replan 编译 child session，原会话不可变。', links: ['environment', 'sessions', 'planner', 'runner'] },
  // Protocol Boundary
  { id: 'sessions', label: 'SESSIONS.md', short: 'SESSIONS', zone: 'protocol', x: 450, y: 60, desc: '事务中心：任务目标、契约、生命周期状态与 append-only 的 attempts 记录。', links: ['compiler', 'watchdog', 'verifier'] },
  { id: 'skillrtF', label: 'SKILLRUNTIME.md', short: 'SKILLRT', zone: 'protocol', x: 450, y: 160, desc: '执行方法声明：需要什么观测、产出什么动作、可配置参数与适配要求。', links: ['selector', 'skillrt'] },
  { id: 'targetsF', label: 'TARGETS.md', short: 'TARGETS', zone: 'protocol', x: 450, y: 260, desc: '目标端能力清单：观测模态、动作语义、端点与操作约束。', links: ['selector', 'target'] },
  { id: 'environment', label: 'ENVIRONMENT.md', short: 'ENV', zone: 'protocol', x: 450, y: 360, desc: '结构化环境快照：entity / attribute / relation / state change，附指向原始观测的证据指针。', links: ['target', 'verifier', 'context'] },
  { id: 'memory', label: 'KNOWLEDGE / LESSONS.md', short: '记忆', zone: 'protocol', x: 450, y: 455, desc: '跨会话持久记忆：已验证的成功模式与失败纠正；只有经过 Re-verify 的修复才能进入。', links: ['context'] },
  // Runtime Plane
  { id: 'watchdog', label: 'WatchdogSupervisor', short: 'Watchdog', zone: 'runtime', x: 660, y: 60, desc: '唯一监督入口：认领 pending 会话、执行预检、监控心跳、传播超时与取消、把终止结果写回协议。', links: ['sessions', 'preflight', 'heartbeat', 'runner'] },
  { id: 'preflight', label: 'Compatibility Preflight', short: '预检', zone: 'runtime', x: 660, y: 165, desc: '在触碰目标端之前核对观测模态、动作语义、控制频率、适配器与安全配置；非法组合直接拒绝。', links: ['watchdog', 'runner', 'adapters'] },
  { id: 'runner', label: 'SessionRunner', short: 'Runner', zone: 'runtime', x: 660, y: 270, desc: '拥有本次执行的生命周期：observe → 调用 SkillRuntime → 判定终止 → 收集证据。', links: ['preflight', 'skillrt', 'heartbeat', 'verifier'] },
  { id: 'heartbeat', label: 'Heartbeat Monitoring', short: '心跳', zone: 'runtime', x: 660, y: 375, desc: '监控 Runner / 策略服务 / 目标端三路心跳；失联触发超时处理与受控终止，旧动作块同时被切断。', links: ['watchdog', 'runner', 'safety'] },
  { id: 'skillrt', label: 'SkillRuntime', short: 'SkillRT', zone: 'runtime', x: 810, y: 165, desc: '定义这类技能如何被运行：PolicySkillRuntime（连续策略）/ BuiltinSkillRuntime（Agent 工具流）。', links: ['selector', 'skillrtF', 'policy', 'runner'] },
  { id: 'policy', label: 'Policy / VLA', short: 'Policy', zone: 'runtime', x: 810, y: 60, desc: '产生动作的策略模型：从观测生成动作或动作块（Aₜ = Policy(I, Oₜ, Sₜ, Hₜ)）。', links: ['skillrt', 'adapters'] },
  { id: 'adapters', label: 'ActionBridge · Adapters', short: '桥接', zone: 'runtime', x: 810, y: 270, desc: 'PolicyAdapter / TargetAdapter / ActionBridge：确定性的表示转换（坐标、单位、维度、重采样）——只管转换，不判安全。', links: ['skillrt', 'policy', 'safety', 'preflight'] },
  { id: 'safety', label: 'SafetyGuard', short: '安全', zone: 'runtime', x: 810, y: 375, desc: '判定转换后的命令是否可发：NaN/无穷、关节与工作空间限位、速度/加速度、频率、急停状态；Reject / Safe Halt / Authorized Clamp。', links: ['adapters', 'heartbeat', 'target'] },
  // Target
  { id: 'target', label: 'Target', short: '目标端', zone: 'target', x: 955, y: 270, desc: '真正被控制的执行对象：游戏 / 仿真器 / 真实机器人，经 TargetAdapter 暴露受控接口。', links: ['safety', 'targetsF', 'environment', 'local'] },
  { id: 'local', label: '目标端本地约束', short: '本地', zone: 'target', x: 955, y: 385, desc: '关节限位、碰撞检测、扭矩/速度限制、硬件急停——最内层、始终生效的最终权威。', links: ['target'] },
];

// 初始可见的主链骨干
const ROOTS = new Set(['goal', 'planner', 'compiler', 'sessions', 'watchdog', 'preflight', 'runner', 'skillrt', 'adapters', 'safety', 'target', 'verifier']);
// 初始就显示的主链边
const ROOT_EDGES = new Set([
  'goal|planner', 'planner|compiler', 'compiler|sessions', 'sessions|watchdog',
  'watchdog|preflight', 'preflight|runner', 'runner|skillrt', 'skillrt|adapters',
  'adapters|safety', 'safety|target', 'runner|verifier',
]);

const edgeKey = (a: string, b: string) => [a, b].sort().join('|');
const LINK_MAP: Record<string, string[]> = Object.fromEntries(NODES.map((n) => [n.id, n.links]));
const NODE_MAP: Record<string, NodeDef> = Object.fromEntries(NODES.map((n) => [n.id, n]));

const ALL_EDGES: [string, string][] = (() => {
  const seen = new Set<string>();
  const out: [string, string][] = [];
  NODES.forEach((n) =>
    n.links.forEach((m) => {
      const k = edgeKey(n.id, m);
      if (!seen.has(k)) {
        seen.add(k);
        out.push([n.id, m]);
      }
    })
  );
  return out;
})();

export const ArchGraph: React.FC<WidgetProps> = () => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<string | null>('goal');
  // 全景（展开全部）模式下，点击节点只在「聚焦 / 取消聚焦」间切换，
  // 不再增删 expanded，否则第二次点击无法回到全景原状。
  const [fullView, setFullView] = useState(false);

  const visible = useMemo(() => {
    const vis = new Set(ROOTS);
    expanded.forEach((id) => LINK_MAP[id]?.forEach((m) => vis.add(m)));
    return vis;
  }, [expanded]);

  const shownEdges = useMemo(
    () =>
      ALL_EDGES.filter(([a, b]) => {
        if (!visible.has(a) || !visible.has(b)) return false;
        return ROOT_EDGES.has(edgeKey(a, b)) || expanded.has(a) || expanded.has(b);
      }),
    [visible, expanded]
  );

  const toggle = (id: string) => {
    if (fullView) {
      setActive((prev) => (prev === id ? null : id));
      return;
    }
    setActive(id);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpanded(new Set(NODES.map((n) => n.id)));
    setActive(null);
    setFullView(true);
  };
  const reset = () => {
    setExpanded(new Set());
    setActive('goal');
    setFullView(false);
  };

  const act = active ? NODE_MAP[active] : null;
  const hiddenCount = NODES.length - visible.size;

  let tone: '' | 'good' | 'bad' | 'info' = 'info';
  let msg = fullView
    ? '全景模式：点击任意「球」高亮它的关联节点与边；再点一次取消高亮。'
    : '从主链骨干开始：点击任意「球」展开它的关联节点；再点一次收起。信息面板可以沿「关联」继续跳转。';
  if (act) {
    tone = 'info';
    msg = `${act.label} · ${ZONE_META[act.zone].name} —— ${act.desc}`;
  }

  return (
    <div className="lab ag-lab">
      <div className="lab-controls lab-controls-top">
        <div className="lab-choice-group">
          <button type="button" className="lab-chip" onClick={expandAll}>
            展开全部（{NODES.length} 节点）
          </button>
          <button type="button" className="lab-chip is-active" onClick={reset}>
            回到主链
          </button>
          <span className="ag-count">
            当前可见 {visible.size}/{NODES.length}
            {hiddenCount > 0 ? ` · 还有 ${hiddenCount} 个节点待展开` : ' · 已全部展开'}
          </span>
        </div>
      </div>

      <div className="lab-stage ag-stage">
        <svg viewBox="0 0 1040 510" role="img" aria-label="PhyAgentOS 交互式架构网络">
          {/* 平面分区 */}
          <rect x={22} y={16} width={308} height={478} rx={12} fill="rgba(39,68,110,0.05)" stroke="rgba(39,68,110,0.25)" strokeDasharray="6 5" />
          <text x={36} y={36} fontSize={12} fill="#27446e" fontWeight={700}>Agent Plane · 做什么</text>
          <rect x={368} y={16} width={172} height={478} rx={12} fill="rgba(124,58,237,0.05)" stroke="rgba(124,58,237,0.3)" strokeDasharray="6 5" />
          <text x={382} y={36} fontSize={12} fill="#7c3aed" fontWeight={700}>文件协议边界</text>
          <rect x={596} y={16} width={282} height={478} rx={12} fill="rgba(34,141,92,0.05)" stroke="rgba(34,141,92,0.3)" strokeDasharray="6 5" />
          <text x={610} y={36} fontSize={12} fill="#228d5c" fontWeight={700}>Runtime Plane · 怎么执行</text>
          <rect x={912} y={16} width={116} height={478} rx={12} fill="rgba(240,126,71,0.06)" stroke="rgba(240,126,71,0.35)" strokeDasharray="6 5" />
          <text x={926} y={36} fontSize={12} fill="#b85c1e" fontWeight={700}>Target</text>

          {/* 边 */}
          {shownEdges.map(([a, b]) => {
            const na = NODE_MAP[a];
            const nb = NODE_MAP[b];
            const isHot = active !== null && (a === active || b === active);
            const dx = nb.x - na.x;
            const dy = nb.y - na.y;
            const len = Math.max(1, Math.hypot(dx, dy));
            const r = 24;
            const x1 = na.x + (dx / len) * r;
            const y1 = na.y + (dy / len) * r;
            const x2 = nb.x - (dx / len) * (r + 7);
            const y2 = nb.y - (dy / len) * (r + 7);
            return (
              <line
                key={edgeKey(a, b)}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isHot ? '#f07e47' : '#9fb0c8'}
                strokeWidth={isHot ? 2.4 : 1.6}
                markerEnd="url(#ag-arrow)"
                opacity={active !== null && !isHot ? 0.3 : 0.9}
              />
            );
          })}
          <defs>
            <marker id="ag-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#9fb0c8" />
            </marker>
            <marker id="ag-arrow-hot" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#f07e47" />
            </marker>
          </defs>

          {/* 节点 */}
          {NODES.map((n) => {
            const isVisible = visible.has(n.id);
            if (!isVisible) return null;
            const meta = ZONE_META[n.zone];
            const isActive = active === n.id;
            const isExpanded = expanded.has(n.id);
            const isNeighborOfActive = active !== null && LINK_MAP[active]?.includes(n.id);
            return (
              <g
                key={n.id}
                className="ag-node"
                transform={`translate(${n.x} ${n.y})`}
                onClick={() => toggle(n.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggle(n.id);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`${n.label}（点击展开关联）`}
              >
                {isActive ? <circle r={31} fill="none" stroke="#f07e47" strokeWidth={2} strokeDasharray="4 4" /> : null}
                {!isActive && isNeighborOfActive ? <circle r={30} fill="none" stroke="#27446e" strokeWidth={1.6} opacity={0.55} /> : null}
                <circle
                  className="ag-node-body"
                  r={24}
                  fill={isExpanded ? meta.color : '#fff'}
                  stroke={meta.color}
                  strokeWidth={2.2}
                  style={{ filter: isActive ? 'drop-shadow(0 0 6px rgba(240,126,71,.6))' : undefined }}
                />
                <text
                  y={3.5}
                  textAnchor="middle"
                  fontSize={n.short.length > 6 ? 7.5 : 9.5}
                  fontWeight={700}
                  fill={isExpanded ? '#fff' : meta.color}
                >
                  {n.short}
                </text>
                <text y={42} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="#21324a">
                  {n.label.length > 14 ? `${n.label.slice(0, 13)}…` : n.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 选中节点信息面板 */}
      <div className="ag-info" aria-live="polite">
        {act ? (
          <>
            <div className="ag-info-head">
              <span className="ag-info-dot" style={{ background: ZONE_META[act.zone].color }} aria-hidden />
              <b>{act.label}</b>
              <span className="ag-info-zone">{ZONE_META[act.zone].name}</span>
            </div>
            <p className="ag-info-desc">{act.desc}</p>
            <div className="ag-info-links">
              <span className="ag-info-links-label">关联（点击跳转）：</span>
              {act.links.map((id) => (
                <button type="button" key={id} className={`ag-link-chip ${visible.has(id) ? '' : 'is-hidden-node'}`} onClick={() => toggle(id)}>
                  {LINK_MAP[id] ? NODE_MAP[id].label : id}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="ag-info-desc">点击场景中的任意节点查看职责与关联。</p>
        )}
      </div>

      <Feedback tone={tone}>{msg}</Feedback>
    </div>
  );
};

export default ArchGraph;
