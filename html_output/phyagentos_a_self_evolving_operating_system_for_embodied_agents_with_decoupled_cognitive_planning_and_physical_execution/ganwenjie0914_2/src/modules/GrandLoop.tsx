import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';

// Lab 8.2 — Grand Loop：全机制综合大动画。
// 论文的机制本来就是一个闭环：目标编译 → 会话契约 → 认领与预检 → 受监督执行
// → 证据包 → 语义验收 → 诊断与修订 → child session 再验证 → 固化记忆 → 注入下一次规划。
// 本模块把 §3–§9 的所有机制串成一部自动播放的连续动画：
// 一个「会话包」从目标出发，第一次失败、诊断、重规划、再验证、成功、固化，
// 最后作为经验回到起点——模型权重零改动。

type Zone = 'agent' | 'protocol' | 'runtime' | 'target' | 'verify' | 'memory';

interface NodeDef {
  id: string;
  l1: string;
  l2: string;
  zone: Zone;
  x: number;
  y: number;
  w?: number;
}

const ZONE_COLOR: Record<Zone, string> = {
  agent: '#27446e',
  protocol: '#7c3aed',
  runtime: '#228d5c',
  target: '#b85c1e',
  verify: '#27446e',
  memory: '#7c3aed',
};

const NODES: NodeDef[] = [
  { id: 'goal', l1: '用户目标', l2: '杯子进柜子', zone: 'agent', x: 60, y: 80 },
  { id: 'planner', l1: 'Goal Planner', l2: '理解目标', zone: 'agent', x: 180, y: 80 },
  { id: 'compiler', l1: 'Session Compiler', l2: '编译契约', zone: 'agent', x: 300, y: 80 },
  { id: 'sessions', l1: 'SESSIONS.md', l2: '事务中心', zone: 'protocol', x: 430, y: 80, w: 110 },
  { id: 'watchdog', l1: 'Watchdog', l2: '监督者', zone: 'runtime', x: 560, y: 80 },
  { id: 'preflight', l1: 'Preflight', l2: '兼容性预检', zone: 'runtime', x: 680, y: 80 },
  { id: 'runner', l1: 'SessionRunner', l2: '受控执行', zone: 'runtime', x: 800, y: 80 },
  { id: 'guard', l1: 'Bridge·Guard', l2: '转换·放行', zone: 'runtime', x: 930, y: 80 },
  { id: 'target', l1: 'Target', l2: '真实执行', zone: 'target', x: 1040, y: 80, w: 84 },
  { id: 'evidence', l1: 'Evidence Bundle', l2: '证据包', zone: 'verify', x: 1040, y: 210, w: 104 },
  { id: 'verifier', l1: 'SessionVerifier', l2: '语义验收', zone: 'verify', x: 890, y: 210 },
  { id: 'diagnose', l1: 'Diagnose', l2: '定位原因', zone: 'verify', x: 730, y: 210 },
  { id: 'child', l1: 'Child Session', l2: '再规划', zone: 'agent', x: 580, y: 210 },
  { id: 'consolidate', l1: 'Consolidate', l2: '固化', zone: 'memory', x: 420, y: 210 },
  { id: 'memory', l1: 'KNOWLEDGE·LESSONS', l2: '持久记忆', zone: 'protocol', x: 270, y: 210, w: 116 },
  { id: 'context', l1: 'ContextBuilder', l2: '检索经验', zone: 'agent', x: 110, y: 210 },
];

// 阶段定义：包走的路径 + 依次点亮的节点 + 顶部说明
interface PhaseDef {
  name: string;
  desc: string;
  ms: number;
  route: string;
  packet: { label: string; tone: 'blue' | 'red' | 'green' | 'purple' };
  lit: string[];
  targetState?: 'bad' | 'good';
  fx?: string; // 阶段开始时触发的特效元素 id
}

const ROUTES: Record<number, string> = {
  0: 'M 60 80 L 430 80',
  1: 'M 430 80 L 680 80',
  2: 'M 680 80 L 1040 80',
  3: 'M 1040 102 L 1040 188',
  4: 'M 1040 210 L 890 210',
  5: 'M 890 210 L 580 210',
  6: 'M 580 210 L 580 146 L 800 146 L 800 80 L 1040 80',
  7: 'M 1040 102 L 1040 210 L 890 210',
  8: 'M 890 210 C 740 280 560 210 468 210 L 270 210',
  9: 'M 270 210 L 110 210 L 110 92 L 128 80',
};

const PHASES: PhaseDef[] = [
  {
    name: '① 目标编译',
    desc: 'Agent 理解「杯子进柜子」，Session Compiler 写出会话契约：目标 · 前置条件 · 接受标准',
    ms: 2600, route: ROUTES[0], packet: { label: 'S', tone: 'blue' },
    lit: ['goal', 'planner', 'compiler', 'sessions'],
  },
  {
    name: '② 认领与预检',
    desc: 'WatchdogSupervisor 认领 pending 会话；兼容性预检在触碰目标端之前完成，产出 AdapterPlan',
    ms: 2600, route: ROUTES[1], packet: { label: 'S', tone: 'blue' },
    lit: ['watchdog', 'preflight'],
  },
  {
    name: '③ 受监督执行',
    desc: 'SessionRunner 驱动策略流：动作经 ActionBridge 转换、SafetyGuard 判定后才能到达 Target',
    ms: 2800, route: ROUTES[2], packet: { label: 'S', tone: 'blue' },
    lit: ['runner', 'guard', 'target'],
  },
  {
    name: '④ 执行终止 ≠ 成功',
    desc: '第一次尝试闭空。return_code = 0 只是证据包里的一个字段——完整证据包（S₀/S_T/τ）被送入验收',
    ms: 2400, route: ROUTES[3], packet: { label: 'E', tone: 'red' },
    lit: ['evidence'], targetState: 'bad',
  },
  {
    name: '⑤ 判定 failure',
    desc: 'S₀ = S_T，杯子未动：判定 failure 并追加进 attempts——原会话不可变（append-only）',
    ms: 2200, route: ROUTES[4], packet: { label: 'E', tone: 'red' },
    lit: ['verifier'], fx: 'gl-stamp-failure',
  },
  {
    name: '⑥ 诊断与修订',
    desc: '结合 LESSONS 与运行时事件定位「感知偏移」→ 编译 child session（更新前置条件）',
    ms: 2600, route: ROUTES[5], packet: { label: 'E', tone: 'red' },
    lit: ['diagnose', 'child'], fx: 'gl-diag',
  },
  {
    name: '⑦ 再执行',
    desc: '新会话经同一套监督、转换与安全边界重新执行——没有绕过任何一层',
    ms: 3000, route: ROUTES[6], packet: { label: "S'", tone: 'green' },
    lit: ['runner', 'guard', 'target'], targetState: 'good',
  },
  {
    name: '⑧ 判定 success',
    desc: 'S₀ → S_T 变化成立：杯子真的进了柜子——验收对象是状态变化，不是终止画面',
    ms: 2400, route: ROUTES[7], packet: { label: "S'", tone: 'green' },
    lit: ['verifier'], targetState: 'good', fx: 'gl-stamp-success',
  },
  {
    name: '⑨ 固化经验',
    desc: '验证过的纠正写入 LESSONS，成功模式写入 KNOWLEDGE——必须带 provenance 与 scope',
    ms: 2800, route: ROUTES[8], packet: { label: 'L', tone: 'purple' },
    lit: ['consolidate', 'memory'], fx: 'gl-mem',
  },
  {
    name: '⑩ 闭环',
    desc: 'ContextBuilder 把经验注入下一次规划：模型权重零改动，系统仍然变强——这就是 Self-Evolution',
    ms: 2800, route: ROUTES[9], packet: { label: 'L', tone: 'purple' },
    lit: ['context', 'planner'], fx: 'gl-loop',
  },
];

const TOTAL = PHASES.reduce((a, p) => a + p.ms, 0);
const STARTS: number[] = (() => {
  const arr: number[] = [];
  let acc = 0;
  PHASES.forEach((p) => {
    arr.push(acc);
    acc += p.ms;
  });
  return arr;
})();

const EDGES: string[] = [
  'M 108 80 L 128 80',
  'M 228 80 L 248 80',
  'M 348 80 L 372 80',
  'M 486 80 L 510 80',
  'M 610 80 L 630 80',
  'M 730 80 L 750 80',
  'M 848 80 L 878 80',
  'M 978 80 L 996 80',
  'M 1040 102 L 1040 186',
  'M 986 210 L 942 210',
  'M 838 210 L 782 210',
  'M 678 210 L 632 210',
  'M 580 188 L 580 146 L 800 146 L 800 102',
  'M 890 210 C 740 280 560 210 468 210',
  'M 368 210 L 330 210',
  'M 210 210 L 162 210',
  'M 110 188 L 110 92 L 126 84',
];

const PACKET_TONE: Record<string, string> = { blue: '#27446e', red: '#c43f52', green: '#228d5c', purple: '#7c3aed' };

export const GrandLoop: React.FC<WidgetProps> = () => {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const stageRef = useRef<SVGSVGElement>(null);
  const packetRef = useRef<SVGGElement>(null);
  const elapsedRef = useRef(0);
  const lastTsRef = useRef(0);
  const rafRef = useRef(0);
  const playingRef = useRef(true);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (mq?.matches) {
      setPlaying(false);
      elapsedRef.current = TOTAL - 100;
    }
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    const packet = packetRef.current;
    if (!stage || !packet) return;
    const routeEls = new Map<string, SVGPathElement>();
    stage.querySelectorAll('path[data-route]').forEach((p) => {
      routeEls.set(p.getAttribute('data-route')!, p as SVGPathElement);
    });
    const showEls = new Map<string, SVGPathElement>();
    stage.querySelectorAll('path[data-show]').forEach((p) => {
      showEls.set(p.getAttribute('data-show')!, p as SVGPathElement);
    });
    const q = (id: string) => stage.querySelector(`[data-fx="${id}"]`);
    const resetFx = () => {
      stage.querySelectorAll('[data-fx].on').forEach((e) => e.classList.remove('on'));
      stage.querySelectorAll('.gl-node').forEach((n) => n.classList.remove('is-lit', 'is-bad', 'is-good'));
    };
    const applyPhase = (idx: number) => {
      // 累积点亮：当前阶段及之前所有阶段的节点
      const lit = new Set<string>();
      for (let i = 0; i <= idx; i++) PHASES[i].lit.forEach((n) => lit.add(n));
      stage.querySelectorAll('.gl-node').forEach((n) => {
        n.classList.toggle('is-lit', lit.has(n.getAttribute('data-node')!));
        n.classList.remove('is-bad', 'is-good');
      });
      const tgt = stage.querySelector('[data-node="target"]');
      if (tgt) {
        if (idx >= 7) tgt.classList.add('is-good');
        else if (idx >= 4) tgt.classList.add('is-bad');
      }
      // 阶段特效与判定章：与阶段精确同步（前进/跳转/回退都一致）
      // failure 章只挂在 ⑤⑥⑦；success 确认后将其撤下（判定以最终 verdict 为准）
      q('gl-stamp-failure')?.classList.toggle('on', idx >= 4 && idx <= 6);
      q('gl-stamp-success')?.classList.toggle('on', idx >= 7);
      q('gl-diag')?.classList.toggle('on', idx === 5);
      q('gl-mem')?.classList.toggle('on', idx === 8);
      q('gl-loop')?.classList.toggle('on', idx === 9);
      routeEls.forEach((el, key) => {
        const k = Number(key);
        el.classList.toggle('is-active', k === idx);
        el.classList.toggle('is-done', k < idx);
      });
      showEls.forEach((el, key) => {
        const k = Number(key);
        el.classList.toggle('is-active', k === idx);
        el.classList.toggle('is-done', k < idx);
      });
    };
    let lastPhase = -1;
    let raf = 0;
    lastTsRef.current = 0;
    const place = (elapsed: number) => {
      let idx = PHASES.length - 1;
      for (let i = 0; i < PHASES.length; i++) {
        if (elapsed < STARTS[i] + PHASES[i].ms) {
          idx = i;
          break;
        }
      }
      if (idx !== lastPhase) {
        lastPhase = idx;
        setPhaseIdx(idx);
        applyPhase(idx);
      }
      const ph = PHASES[idx];
      const route = routeEls.get(String(idx));
      if (route) {
        const len = route.getTotalLength();
        const t = Math.min(1, (elapsed - STARTS[idx]) / ph.ms);
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const pt = route.getPointAtLength(eased * len);
        packet.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
      }
    };
    const tick = (now: number) => {
      if (lastTsRef.current && playingRef.current) {
        elapsedRef.current += now - lastTsRef.current;
        if (elapsedRef.current >= TOTAL + 1200) {
          elapsedRef.current = 0;
          resetFx();
          lastPhase = -1;
        }
      }
      lastTsRef.current = now;
      place(elapsedRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const jump = (i: number) => {
    elapsedRef.current = STARTS[i] + 1;
    setPhaseIdx(i);
    // 立即重置特效并让 rAF 的 place() 在下一帧应用该阶段
    const stage = stageRef.current;
    if (stage) {
      stage.querySelectorAll('[data-fx].on').forEach((e) => e.classList.remove('on'));
      stage.querySelectorAll('path[data-route]').forEach((p) => p.classList.remove('is-active', 'is-done'));
    }
  };
  const replay = () => {
    jump(0);
    setPlaying(true);
  };

  const ph = PHASES[phaseIdx];

  return (
    <div className="lab gl-lab">
      <div className="gl-caption" aria-live="polite">
        <div className="gl-caption-head">
          <span className="gl-phase-num">{phaseIdx + 1}/10</span>
          <b>{ph.name}</b>
          <span className="gl-packet-chip">
            包类型：<code style={{ color: PACKET_TONE[ph.packet.tone] }}>{ph.packet.label}</code>
            {ph.packet.tone === 'red' ? '（失败证据）' : ph.packet.tone === 'green' ? '（重试会话）' : ph.packet.tone === 'purple' ? '（经验）' : '（会话契约）'}
          </span>
        </div>
        <p className="gl-caption-desc">{ph.desc}</p>
      </div>

      <div className="lab-stage gl-stage">
        <svg ref={stageRef} viewBox="0 0 1120 320" role="img" aria-label="PhyAgentOS 全机制综合大动画">
          {/* 分区背景 */}
          <rect x={14} y={30} width={342} height={120} rx={10} fill="rgba(39,68,110,0.05)" stroke="rgba(39,68,110,0.2)" strokeDasharray="6 5" />
          <text x={26} y={48} fontSize={11} fill="#27446e" fontWeight={700}>Agent Plane · 做什么</text>
          <rect x={366} y={30} width={128} height={120} rx={10} fill="rgba(124,58,237,0.05)" stroke="rgba(124,58,237,0.25)" strokeDasharray="6 5" />
          <text x={378} y={48} fontSize={11} fill="#7c3aed" fontWeight={700}>文件协议</text>
          <rect x={502} y={30} width={514} height={120} rx={10} fill="rgba(34,141,92,0.05)" stroke="rgba(34,141,92,0.25)" strokeDasharray="6 5" />
          <text x={514} y={48} fontSize={11} fill="#228d5c" fontWeight={700}>Runtime Plane · 怎么安全受控地执行</text>
          <rect x={14} y={160} width={1180 - 26} height={118} rx={10} fill="rgba(124,58,237,0.04)" stroke="rgba(124,58,237,0.18)" strokeDasharray="6 5" />
          <text x={26} y={178} fontSize={11} fill="#7c3aed" fontWeight={700}>验收 · 诊断 · 固化 · 记忆（append-only 闭环）</text>

          {/* 静态边 */}
          {EDGES.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="#9fb0c8" strokeWidth={1.6} markerEnd="url(#gl-arrow)" opacity={0.65} />
          ))}
          {/* 阶段路线（隐藏测量 + 高亮显示） */}
          {PHASES.map((_, i) => (
            <g key={i}>
              <path data-route={String(i)} d={ROUTES[i]} fill="none" stroke="none" />
              <path d={ROUTES[i]} fill="none" stroke="#f07e47" strokeWidth={0} className="gl-route" data-show={String(i)} />
            </g>
          ))}
          <defs>
            <marker id="gl-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#9fb0c8" />
            </marker>
          </defs>

          {/* 节点 */}
          {NODES.map((n) => {
            const w = n.w ?? 96;
            const c = ZONE_COLOR[n.zone];
            return (
              <g key={n.id} className="gl-node" data-node={n.id} transform={`translate(${n.x - w / 2} ${n.y - 22})`}>
                <rect width={w} height={44} rx={9} fill="#fff" stroke={c} strokeWidth={1.8} />
                <rect width={w} height={44} rx={9} fill={c} opacity={0} className="gl-node-bg" />
                <text x={w / 2} y={19} textAnchor="middle" fontSize={n.l1.length > 12 ? 9 : 11} fontWeight={700} fill={c}>
                  {n.l1}
                </text>
                <text x={w / 2} y={34} textAnchor="middle" fontSize={8.5} fill="#68778f">
                  {n.l2}
                </text>
              </g>
            );
          })}

          {/* 裁决只从 SessionVerifier 节点冒出；failure / success 共用一个出口并交替显示。 */}
          <g data-fx="gl-stamp-failure" className="fx">
            <path d="M 890 188 L 890 174" stroke="#c43f52" strokeWidth={1.8} strokeLinecap="round" />
            <path d="M 886 178 L 890 174 L 894 178" fill="none" stroke="#c43f52" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            <rect x={848} y={148} width={84} height={26} rx={13} fill="#fbedef" stroke="#c43f52" strokeWidth={1.6} />
            <text x={890} y={165} textAnchor="middle" fontSize={11} fontWeight={800} fill="#c43f52">failure</text>
          </g>
          <g data-fx="gl-stamp-success" className="fx">
            <path d="M 890 188 L 890 174" stroke="#228d5c" strokeWidth={1.8} strokeLinecap="round" />
            <path d="M 886 178 L 890 174 L 894 178" fill="none" stroke="#228d5c" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            <rect x={848} y={148} width={84} height={26} rx={13} fill="#e9f5ef" stroke="#228d5c" strokeWidth={1.6} />
            <text x={890} y={165} textAnchor="middle" fontSize={11} fontWeight={800} fill="#1c7a4e">success</text>
          </g>
          <g data-fx="gl-diag" className="fx fx-glow">
            <rect x={674} y={180} width={112} height={60} rx={13} fill="none" stroke="#f07e47" strokeWidth={2.2} />
          </g>
          <g data-fx="gl-mem" className="fx fx-glow">
            <rect x={206} y={182} width={128} height={56} rx={10} fill="none" stroke="#7c3aed" strokeWidth={2.2} />
          </g>
          <g data-fx="gl-loop" className="fx fx-glow">
            <path d="M 110 188 L 110 92" fill="none" stroke="#f07e47" strokeWidth={2.4} strokeDasharray="5 5" />
          </g>

          {/* 会话包 */}
          <g ref={packetRef} className="gl-packet">
            <rect x={-12} y={-12} width={24} height={24} rx={6} fill={PACKET_TONE[ph.packet.tone]} stroke="#fff" strokeWidth={2} />
            <text x={0} y={4.5} textAnchor="middle" fontSize={11} fontWeight={800} fill="#fff">
              {ph.packet.label}
            </text>
          </g>
        </svg>
      </div>

      <div className="gl-controls">
        <button type="button" className="lab-btn lab-btn-primary" onClick={() => setPlaying((p) => !p)}>
          {playing ? '⏸ 暂停' : '▶ 播放'}
        </button>
        <button type="button" className="lab-btn lab-btn-ghost" onClick={replay}>
          ↺ 重播
        </button>
        <div className="gl-dots" role="group" aria-label="阶段跳转">
          {PHASES.map((p, i) => (
            <button
              type="button"
              key={p.name}
              className={`gl-dot ${phaseIdx === i ? 'is-active' : ''} ${i < phaseIdx ? 'is-done' : ''}`}
              onClick={() => jump(i)}
              title={p.name}
              aria-label={`跳转到 ${p.name}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GrandLoop;
