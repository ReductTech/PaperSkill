import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';

// 类比场景（每章共用一个「徒步」视觉世界）· V3：脚本化叙事动画
//
// 每章不再是无意义的循环走路，而是一段明确的「故事」：
//   人物到达关键节点 → 道具展示它在论文机制中的作用 → 继续前进 / 折返 / 循环。
// 实现：rAF 时间线驱动（getPointAtLength 精确定位 + 分段缓动 + 站点暂停 + FX 触发）。
// 路径起点与中段都是平整路面：出发前检查门立在起点，大本营 / 无线电 / 中转站立在中段。

const TRAIL = 'M 28 105 L 150 105 C 215 105 245 88 305 88 L 385 88 C 450 88 500 70 524 58';
const TRAIL_SOLID = 'M 28 105 L 150 105 C 215 105 245 88 305 88 L 385 88';
const TRAIL_DASH = 'M 385 88 C 450 88 500 70 524 58';
const FORK = 'M 345 88 C 398 110 448 112 478 94 C 492 85 502 76 510 68';
const SUPPLY = 'M 352 84 C 410 74 470 64 520 60';

const TONE: Record<string, { fill: string; stroke: string; text: string }> = {
  blue: { fill: '#eef3fb', stroke: '#27446e', text: '#27446e' },
  green: { fill: '#e9f5ef', stroke: '#228d5c', text: '#1c7a4e' },
  red: { fill: '#fbedef', stroke: '#c43f52', text: '#c43f52' },
  orange: { fill: '#fdf0e7', stroke: '#f07e47', text: '#b85c1e' },
};

/** 弹出式气泡：由 FX 时间线触发（data-fx + .on） */
function Pill({ id, x, y, text, tone = 'blue', fs = 10.5 }: { id: string; x: number; y: number; text: string; tone?: keyof typeof TONE | string; fs?: number }) {
  const t = TONE[tone] ?? TONE.blue;
  const w = text.length * (fs * 1.02) + 20;
  return (
    <g data-fx={id} className="fx">
      <rect x={x - w / 2} y={y - 10} width={w} height={20} rx={10} fill={t.fill} stroke={t.stroke} strokeWidth={1.3} />
      <text x={x} y={y + 3.6} textAnchor="middle" fontSize={fs} fontWeight={700} fill={t.text}>
        {text}
      </text>
    </g>
  );
}

function Hiker() {
  return (
    <g transform="translate(0 -12)">
      <rect x={-10} y={-12} width={7} height={10} rx={2} fill="#f07e47" />
      <circle cx={0} cy={-14} r={4.6} fill="#27446e" />
      <path d="M 0 -9 L 0 2" stroke="#27446e" strokeWidth={3} strokeLinecap="round" />
      <path d="M 0 -5 L 8 3" stroke="#27446e" strokeWidth={2.4} strokeLinecap="round" />
      <path d="M 8 3 L 10 9" stroke="#92400e" strokeWidth={1.8} strokeLinecap="round" />
      <path d="M 0 2 L -5 11" stroke="#27446e" strokeWidth={2.6} strokeLinecap="round" />
      <path d="M 0 2 L 5 11" stroke="#27446e" strokeWidth={2.6} strokeLinecap="round" />
    </g>
  );
}

function Flag({ color }: { color: string }) {
  return (
    <g>
      <line x1={524} y1={58} x2={524} y2={22} stroke="#92400e" strokeWidth={2.6} strokeLinecap="round" />
      <path className="flag-cloth" d="M 524 22 L 548 30 L 524 38 Z" fill={color} />
    </g>
  );
}

/**
 * §9 的三个层级是三个独立运行模式，不是一名登山者依次踩过三段地形。
 * 三个等宽小画面共享起点与终点语义，但分别呈现 Game / Simulation / Real。
 */
function TerrainModeTrio() {
  const panels = [
    { id: 'game', x: 12, label: '① Game', sub: '认知闭环', color: '#7c3aed' },
    { id: 'sim', x: 196, label: '② Simulation', sub: '动力学·碰撞', color: '#92400e' },
    { id: 'real', x: 380, label: '③ Real Robot', sub: '噪声·延迟·安全', color: '#228d5c' },
  ];

  return (
    <svg className="analogy-svg terrain-trio" viewBox="0 0 560 150" role="img" aria-label="Game、Simulation 与 Real Robot 三种独立验证模式">
      {panels.map((p) => (
        <g key={p.id}>
          <rect x={p.x} y={34} width={168} height={104} rx={10} fill="#f8faf6" stroke="#d7deea" strokeWidth={1.2} />
          <rect x={p.x + 36} y={12} width={96} height={22} rx={11} fill="#fff" stroke={p.color} strokeWidth={1.3} />
          <text x={p.x + 84} y={27} textAnchor="middle" fontSize={10} fontWeight={800} fill={p.color}>{p.label}</text>
          <text x={p.x + 84} y={54} textAnchor="middle" fontSize={9} fontWeight={700} fill="#68778f">{p.sub}</text>

          <path d={`M ${p.x + 18} 112 Q ${p.x + 84} 104 ${p.x + 150} 86`} fill="none" stroke="#dce7d5" strokeWidth={8} strokeLinecap="round" />
          <path
            d={`M ${p.x + 18} 112 Q ${p.x + 84} 104 ${p.x + 150} 86`}
            fill="none"
            stroke={p.id === 'real' ? '#6aa7cc' : p.id === 'sim' ? '#8a6b4a' : '#92400e'}
            strokeWidth={3.2}
            strokeLinecap="round"
          />

          {p.id === 'sim' ? [58, 82, 108, 132].map((dx) => (
            <path key={dx} d={`M ${p.x + dx - 4} ${108 - dx * 0.12} l 4 -5 l 4 5 z`} fill="#6b5236" />
          )) : null}
          {p.id === 'real' ? [48, 82, 116].map((dx) => (
            <line key={dx} x1={p.x + dx} y1={108 - dx * 0.14} x2={p.x + dx + 10} y2={105 - dx * 0.14} stroke="#eaf6fd" strokeWidth={2} strokeLinecap="round" />
          )) : null}

          <g className={`terrain-walker terrain-walker-${p.id}`}>
            <Hiker />
          </g>
          <line x1={p.x + 150} y1={86} x2={p.x + 150} y2={64} stroke="#92400e" strokeWidth={2} />
          <path d={`M ${p.x + 150} 64 l 14 5 l -14 5 z`} fill="#228d5c" />
        </g>
      ))}
      <text x={280} y={147} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#27446e">
        三种模式独立运行；Game 与 Simulation 的经验为 Real Robot 提供验证依据
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------- 脚本时间线

type Seg =
  | { type: 'walk'; from: number; to: number; ms: number; marks?: { frac: number; fx: () => void }[] }
  | { type: 'hold'; ms: number; fx?: () => void };

interface FxKit {
  pop: (id: string, delay?: number) => void;
  slip: () => void;
  fracAtX: (x: number) => number;
}

const X = { gate: 114, camp: 320, radio: 330, fork: 345, s0: 154, st: 496, brk: 385, waypoint: 290 };

const SCRIPTS: Record<string, (k: FxKit) => Seg[]> = {
  // §1 角色地图：走两段、各停一次看地图——地图高亮两处缺口
  'chap-1': (k) => [
    { type: 'walk', from: 0, to: k.fracAtX(250), ms: 1900 },
    { type: 'hold', ms: 1300, fx: () => { k.pop('map-glow'); k.pop('q1', 250); } },
    { type: 'walk', from: k.fracAtX(250), to: k.fracAtX(420), ms: 1600 },
    { type: 'hold', ms: 1400, fx: () => { k.pop('map-glow'); k.pop('noowner', 300); } },
    { type: 'walk', from: k.fracAtX(420), to: 0.97, ms: 700 },
  ],
  // §2 路径中断：人物明确走到实线末端，停住，看着够不到的旗子
  'chap-2': (k) => [
    { type: 'walk', from: 0, to: k.fracAtX(X.brk), ms: 2600 },
    { type: 'hold', ms: 2100, fx: () => { k.pop('q-break', 200); k.pop('flag-dim', 600); } },
  ],
  // §3 大本营：到达 → 整备（记录/检查/补给逐个亮起）→ 补给包裹沿路线送到终点 → 出发登顶
  'chap-3': (k) => [
    { type: 'walk', from: 0, to: k.fracAtX(X.camp), ms: 2100 },
    {
      type: 'hold', ms: 2900, fx: () => {
        k.pop('camp-rest', 100);
        k.pop('camp-fx0', 450);
        k.pop('camp-fx1', 1000);
        k.pop('camp-fx2', 1550);
        k.pop('camp-pack', 2100);
        k.pop('camp-route-label', 2300);
      },
    },
    { type: 'walk', from: k.fracAtX(X.camp), to: 1, ms: 1900 },
  ],
  // §4 无线电：经过时电波发出、向大本营上报心跳，然后继续走
  'chap-4': (k) => [
    { type: 'walk', from: 0, to: k.fracAtX(X.radio), ms: 2300 },
    { type: 'hold', ms: 1700, fx: () => { k.pop('radio-w0', 100); k.pop('radio-w1', 380); k.pop('radio-w2', 660); k.pop('radio-msg', 500); } },
    { type: 'walk', from: k.fracAtX(X.radio), to: 1, ms: 1700 },
  ],
  // §5 行程治理：出发检查（三项打勾放行）→ 途中签到（路簿盖章）→ 终点确认。
  // 中途节点不再使用蓝色电波，避免与 §4 的无线电 / 心跳语义混淆。
  'chap-5': (k) => [
    { type: 'walk', from: 0, to: k.fracAtX(X.gate), ms: 1100 },
    {
      type: 'hold', ms: 2700, fx: () => {
        k.pop('gate-c0', 200);
        k.pop('gate-c1', 750);
        k.pop('gate-c2', 1300);
        k.pop('gate-open', 1850);
        k.pop('gate-pass', 2100);
      },
    },
    { type: 'walk', from: k.fracAtX(X.gate), to: k.fracAtX(X.waypoint), ms: 1500 },
    { type: 'hold', ms: 1800, fx: () => { k.pop('wp-stamp', 180); k.pop('wp-msg', 520); } },
    { type: 'walk', from: k.fracAtX(X.waypoint), to: 1, ms: 1700 },
    { type: 'hold', ms: 1900, fx: () => { k.pop('arrive-check', 150); k.pop('arrive-pill', 550); } },
  ],
  // §6 两条走法：明确走到分叉点 → 两条路线各自标注 → 沿主路走到旗子
  'chap-6': (k) => [
    { type: 'walk', from: 0, to: k.fracAtX(X.fork), ms: 2200 },
    { type: 'hold', ms: 1600, fx: () => { k.pop('fork-main', 150); k.pop('fork-branch', 550); } },
    { type: 'walk', from: k.fracAtX(X.fork), to: 1, ms: 2100 },
  ],
  // §7 语义验收：先在起点完成预检、开闸并经过 S₀，再抵达旗子左侧的 S_T；
  // 停下后用带箭头的橙色虚线明确画出 S_T → S₀ 的回溯比对方向。
  'chap-7': (k) => [
    { type: 'walk', from: 0, to: k.fracAtX(X.gate), ms: 900 },
    { type: 'hold', ms: 1900, fx: () => { k.pop('v-gate-check', 150); k.pop('v-gate-open', 760); k.pop('v-gate-pass', 980); } },
    { type: 'walk', from: k.fracAtX(X.gate), to: k.fracAtX(X.s0), ms: 520 },
    { type: 'hold', ms: 700, fx: () => { k.pop('s0-start', 100); } },
    { type: 'walk', from: k.fracAtX(X.s0), to: k.fracAtX(X.st), ms: 2600 },
    { type: 'hold', ms: 2100, fx: () => { k.pop('s0-flash', 150); k.pop('cmp-label', 450); k.pop('st-ok', 950); } },
    { type: 'walk', from: k.fracAtX(X.st), to: 1, ms: 380 },
  ],
  // §8 会话记录：第一次失败（红✗）→ 折返重试（绿✓）→ 两条都被写进记录
  'chap-8': (k) => [
    { type: 'walk', from: 0, to: k.fracAtX(290), ms: 1400 },
    { type: 'hold', ms: 800, fx: () => { k.pop('fail-x', 120); k.pop('note-l0', 250); } },
    { type: 'walk', from: k.fracAtX(290), to: k.fracAtX(250), ms: 700 },
    { type: 'walk', from: k.fracAtX(250), to: k.fracAtX(415), ms: 1500 },
    { type: 'hold', ms: 700, fx: () => { k.pop('ok-check', 100); k.pop('note-l1', 250); } },
    { type: 'hold', ms: 1300, fx: () => { k.pop('note-l2', 200); k.pop('note-note', 500); } },
  ],
  // §9 使用独立的三画面比较，由 TerrainModeTrio 自己负责动画。
  'chap-9': () => [],
  // §10 查完整记录：登顶后逐条弹出记录（协议 / 提升 / 边界）
  'chap-10': (k) => [
    { type: 'walk', from: 0, to: 1, ms: 3000 },
    { type: 'hold', ms: 2300, fx: () => { k.pop('end-check', 150); k.pop('end-r0', 500); k.pop('end-r1', 900); k.pop('end-r2', 1300); } },
  ],
};

const VARIANTS: Record<string, { flagColor: string; mapsTo: string; prop?: string; rocky?: boolean }> = {
  'chap-1': { flagColor: '#c43f52', prop: 'map', mapsTo: '地图 ↔ 组件分工与缺口' },
  'chap-2': { flagColor: '#c43f52', mapsTo: '走到 ≠ 到达 ↔ 执行结束 ≠ 任务完成' },
  'chap-3': { flagColor: '#228d5c', prop: 'camp', mapsTo: '大本营 ↔ 运行时 / OS 层' },
  'chap-4': { flagColor: '#228d5c', prop: 'radio', mapsTo: '同一频道 ↔ State-as-a-File' },
  'chap-5': { flagColor: '#228d5c', prop: 'gate', mapsTo: '行程治理 ↔ Session 生命周期' },
  'chap-6': { flagColor: '#228d5c', prop: 'fork', mapsTo: '两种走法 ↔ Policy 流 / Agent 工具流' },
  'chap-7': { flagColor: '#228d5c', prop: 'signposts', mapsTo: '对回地图 ↔ 证据语义验收' },
  'chap-8': { flagColor: '#228d5c', prop: 'notebook', mapsTo: '手册只收验证过的路 ↔ 六步闭环' },
  'chap-9': { flagColor: '#228d5c', rocky: true, mapsTo: '逐层加险 ↔ 渐进验证 · 五层安全' },
  'chap-10': { flagColor: '#228d5c', prop: 'check', mapsTo: '查完整记录 ↔ 基准协议与边界' },
};

export const AnalogyScene: React.FC<WidgetProps> = ({ chapterId }) => {
  const v = VARIANTS[chapterId] ?? VARIANTS['chap-2'];
  const [reduced, setReduced] = useState(false);
  const baseRef = useRef<SVGPathElement>(null);
  const walkerRef = useRef<SVGGElement>(null);
  const hikerRef = useRef<SVGGElement>(null);
  const stageRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    setReduced(!!mq?.matches);
    const fn = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq?.addEventListener?.('change', fn);
    return () => mq?.removeEventListener?.('change', fn);
  }, []);

  useEffect(() => {
    const base = baseRef.current;
    const walker = walkerRef.current;
    const stage = stageRef.current;
    if (!base || !walker || !stage) return;
    const total = base.getTotalLength();
    const fracAtX = (x: number) => {
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < 26; i++) {
        const mid = (lo + hi) / 2;
        if (base.getPointAtLength(mid * total).x < x) lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    };
    const timeouts: number[] = [];
    const pop = (id: string, delay = 0) => {
      timeouts.push(
        window.setTimeout(() => {
          const el = stage.querySelector(`[data-fx="${id}"]`);
          if (!el) return;
          el.classList.remove('on');
          void el.getBoundingClientRect();
          el.classList.add('on');
        }, delay)
      );
    };
    const slip = () => {
      const inner = hikerRef.current;
      if (!inner) return;
      inner.classList.remove('on');
      void inner.getBoundingClientRect();
      inner.classList.add('on');
      timeouts.push(window.setTimeout(() => inner.classList.remove('on'), 700));
    };
    const kit: FxKit = { pop, slip, fracAtX };
    const script = SCRIPTS[chapterId]?.(kit) ?? [];
    const resetFx = () => stage.querySelectorAll('[data-fx].on').forEach((e) => e.classList.remove('on'));
    const placeWalker = (frac: number) => {
      const p = base.getPointAtLength(Math.max(0, Math.min(1, frac)) * total);
      walker.setAttribute('transform', `translate(${p.x} ${p.y})`);
    };

    if (reduced) {
      const walks = script.filter((s) => s.type === 'walk') as { to: number }[];
      placeWalker(walks.length ? walks[walks.length - 1].to : 0);
      return () => timeouts.forEach((t) => window.clearTimeout(t));
    }

    let stopped = false;
    let raf = 0;
    let segIdx = 0;
    let startT = 0;
    const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const runSeg = () => {
      if (stopped) return;
      if (segIdx >= script.length) {
        timeouts.push(
          window.setTimeout(() => {
            if (stopped) return;
            resetFx();
            segIdx = 0;
            startT = performance.now();
            runSeg();
          }, 1100)
        );
        return;
      }
      const seg = script[segIdx];
      if (seg.type === 'hold') {
        seg.fx?.();
        timeouts.push(
          window.setTimeout(() => {
            if (stopped) return;
            segIdx++;
            startT = performance.now();
            runSeg();
          }, seg.ms)
        );
        return;
      }
      const marks = seg.marks ? [...seg.marks] : [];
      const step = (now: number) => {
        if (stopped) return;
        const t = Math.min(1, (now - startT) / seg.ms);
        const f = seg.from + (seg.to - seg.from) * ease(t);
        const p = base.getPointAtLength(f * total);
        walker.setAttribute('transform', `translate(${p.x} ${p.y})`);
        while (marks.length && f >= marks[0].frac) marks.shift()!.fx();
        if (t < 1) {
          raf = requestAnimationFrame(step);
        } else {
          segIdx++;
          startT = now;
          runSeg();
        }
      };
      raf = requestAnimationFrame(step);
    };
    placeWalker(script.length && script[0].type === 'walk' ? (script[0] as { from: number }).from : 0);
    startT = performance.now();
    runSeg();
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      timeouts.forEach((t) => window.clearTimeout(t));
    };
  }, [chapterId, reduced]);

  if (chapterId === 'chap-9') return <TerrainModeTrio />;

  const chipText = v.mapsTo;
  const chipW = Math.min(330, chipText.length * 11.5 + 26);

  return (
    <svg ref={stageRef} className="analogy-svg" viewBox="0 0 560 150" role="img" aria-label="徒步类比场景">
      {/* 远山 / 近地 */}
      <path d="M 0 96 Q 90 46 190 84 T 380 74 T 560 88 L 560 150 L 0 150 Z" fill={v.rocky ? '#9fb0c8' : '#b8c9a7'} opacity={v.rocky ? 0.4 : 0.55} />
      <path d="M 0 116 Q 140 92 300 116 T 560 108 L 560 150 L 0 150 Z" fill="#76906a" opacity={0.28} />

      {/* 测量基准路径（不可见） */}
      <path ref={baseRef} d={TRAIL} fill="none" stroke="none" />

      {/* 路径：起点与中段平整（§9 平缓段只画到碎石层起点，其后由地形层接管） */}
      <path d={TRAIL} fill="none" stroke="#dce7d5" strokeWidth={9} strokeLinecap="round" />
      {v.rocky ? (
        <path d="M 28 105 L 150 105 C 205 105 240 94 257 92" fill="none" stroke="#92400e" strokeWidth={3.4} strokeLinecap="round" opacity={0.8} />
      ) : (
        <path d={TRAIL} fill="none" stroke="#92400e" strokeWidth={3.4} strokeLinecap="round" opacity={0.8} />
      )}

      {/* §2 路径中断：实线止于断点，其后为虚线 */}
      {chapterId === 'chap-2' ? (
        <g>
          <path d={TRAIL_SOLID} fill="none" stroke="#dce7d5" strokeWidth={9} strokeLinecap="round" />
          <path d={TRAIL_SOLID} fill="none" stroke="#92400e" strokeWidth={3.4} strokeLinecap="round" />
          <path d={TRAIL_DASH} fill="none" stroke="#dce7d5" strokeWidth={5} strokeLinecap="round" />
          <path d={TRAIL_DASH} fill="none" stroke="#c43f52" strokeWidth={2.6} strokeDasharray="6 6" strokeLinecap="round" opacity={0.75} />
          <line x1={385} y1={78} x2={385} y2={98} stroke="#c43f52" strokeWidth={2} />
          <text x={394} y={112} fontSize={11} fill="#c43f52" fontWeight={600}>
            路径在此中断：走到了 ≠ 到达了
          </text>
        </g>
      ) : null}

      {/* §6 支线 */}
      {chapterId === 'chap-6' ? <path d={FORK} fill="none" stroke="#92400e" strokeWidth={3} strokeLinecap="round" strokeDasharray="6 6" opacity={0.7} /> : null}

      {/* §9 地形：三段路面常驻可见，进入时弹标签 */}
      {chapterId === 'chap-9' ? (
        <g>
          {/* 碎石层（深棕 + 石块，贴曲线） */}
          <path d="M 257 92 C 278 89.5 292 88.5 305 88 L 385 88" fill="none" stroke="#8a6b4a" strokeWidth={3.6} strokeLinecap="round" />
          {[[266, 91.5], [292, 89.5], [320, 88], [348, 88], [374, 88]].map(([x, y], i) => (
            <path key={i} d={`M ${x - 4} ${y} l 4 -5 l 4 5 z`} fill="#6b5236" />
          ))}
          <g data-fx="terr-rock-label" className="fx">
            <text x={322} y={112} textAnchor="middle" fontSize={10.5} fill="#6b5236" fontWeight={700}>
              碎石层 · 动力学与碰撞
            </text>
          </g>
          {/* 冰面层（蓝 + 反光） */}
          <path d="M 385 88 C 450 88 500 70 524 58" fill="none" stroke="#6aa7cc" strokeWidth={3.8} strokeLinecap="round" />
          {[[414, 84], [442, 82], [470, 74]].map(([x, y], i) => (
            <line key={i} x1={x} y1={y} x2={x + 9} y2={y - 3} stroke="#cfe8f5" strokeWidth={2} strokeLinecap="round" />
          ))}
          <g data-fx="terr-ice-label" className="fx">
            <text x={462} y={44} textAnchor="middle" fontSize={10.5} fill="#3d7ba6" fontWeight={700}>
              冰面层 · 噪声·延迟·安全
            </text>
          </g>
          {/* 平缓段（普通棕色路面）：常驻说明 */}
          <text x={140} y={90} textAnchor="middle" fontSize={10} fill="#8a9b7a" fontWeight={700}>
            平缓段 · 只考察认知
          </text>
        </g>
      ) : null}

      {/* 道具与本章 FX */}
      {v.prop === 'map' ? (
        <g>
          <rect x={30} y={16} width={92} height={60} rx={7} fill="#fff" stroke="#d7deea" strokeWidth={1.6} />
          <path d="M 44 64 Q 78 28 108 36" fill="none" stroke="#27446e" strokeWidth={2.2} strokeLinecap="round" />
          <circle cx={108} cy={36} r={4} fill="#228d5c" />
          <text x={76} y={92} textAnchor="middle" fontSize={11} fill="#68778f">角色地图</text>
          <rect data-fx="map-glow" className="fx fx-glow" x={26} y={12} width={100} height={68} rx={9} fill="none" stroke="#f07e47" strokeWidth={2.4} />
        </g>
      ) : null}

      {v.prop === 'notebook' ? (
        <g>
          <rect x={34} y={16} width={86} height={56} rx={7} fill="#fff" stroke="#d7deea" strokeWidth={1.6} />
          {[
            { id: 'note-l0', y: 30, c: '#c43f52' },
            { id: 'note-l1', y: 42, c: '#228d5c' },
            { id: 'note-l2', y: 54, c: '#228d5c' },
          ].map((l) => (
            <g key={l.id}>
              <line x1={46} y1={l.y} x2={106} y2={l.y} stroke="#e2e8f1" strokeWidth={2.6} strokeLinecap="round" />
              <line data-fx={l.id} className="fx-line" x1={46} y1={l.y} x2={106} y2={l.y} stroke={l.c} strokeWidth={2.6} strokeLinecap="round" />
            </g>
          ))}
          <text x={77} y={88} textAnchor="middle" fontSize={11} fill="#68778f">会话记录</text>
        </g>
      ) : null}

      {v.prop === 'gate' ? (
        <g>
          <line x1={92} y1={105} x2={92} y2={76} stroke="#92400e" strokeWidth={3.4} strokeLinecap="round" />
          <line x1={136} y1={105} x2={136} y2={76} stroke="#92400e" strokeWidth={3.4} strokeLinecap="round" />
          <path data-fx="gate-open" className="gate-arc" d="M 92 79 Q 114 92 136 79" fill="none" stroke="#f07e47" strokeWidth={3.2} strokeLinecap="round" />
          <text x={114} y={118} textAnchor="middle" fontSize={10.5} fill="#f07e47" fontWeight={600}>出发前检查</text>
          {/* 途中签到：路簿与印章，不再使用蓝色电波，避免和 §4 无线电混淆 */}
          <line x1={316} y1={88} x2={316} y2={53} stroke="#92400e" strokeWidth={2.4} strokeLinecap="round" />
          <rect x={294} y={39} width={44} height={17} rx={4} fill="#fffaf5" stroke="#f07e47" strokeWidth={1.4} />
          <text x={316} y={51} textAnchor="middle" fontSize={8.5} fill="#b85c1e" fontWeight={800}>途中签到</text>
          <rect x={302} y={62} width={28} height={20} rx={3} fill="#fff" stroke="#d7deea" strokeWidth={1.2} />
          <line x1={307} y1={68} x2={325} y2={68} stroke="#d7deea" strokeWidth={1.4} />
          <line x1={307} y1={74} x2={322} y2={74} stroke="#d7deea" strokeWidth={1.4} />
          <g data-fx="wp-stamp" className="fx">
            <circle cx={323} cy={74} r={6.5} fill="#e9f5ef" stroke="#228d5c" strokeWidth={1.5} />
            <path d="M 319 74 l 3 3 l 5 -7" fill="none" stroke="#228d5c" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <text x={316} y={104} textAnchor="middle" fontSize={10} fill="#92400e" fontWeight={700}>路簿 · 会话状态</text>
          {/* 终点：到达后验收确认 */}
          <text x={512} y={84} textAnchor="middle" fontSize={10} fill="#228d5c" fontWeight={600}>终点确认</text>
          <g fontSize={9.5} fontWeight={700}>
            <Pill id="gate-c0" x={200} y={44} text="✓ 观测模态" tone="green" />
            <Pill id="gate-c1" x={200} y={66} text="✓ 动作语义" tone="green" />
            <Pill id="gate-c2" x={200} y={88} text="✓ 控制频率" tone="green" />
          </g>
        </g>
      ) : null}

      {v.prop === 'camp' ? (
        <g>
          <path d="M 306 88 L 330 54 L 354 88 Z" fill="#e7ddc8" stroke="#92400e" strokeWidth={2.4} strokeLinejoin="round" />
          <path d="M 330 54 L 330 88" stroke="#92400e" strokeWidth={1.6} opacity={0.7} />
          <line x1={358} y1={88} x2={358} y2={46} stroke="#92400e" strokeWidth={2.2} />
          <path className="flag-cloth" d="M 358 46 L 380 53 L 358 60 Z" fill="#228d5c" />
          <text x={330} y={106} textAnchor="middle" fontSize={10.5} fill="#228d5c" fontWeight={600}>大本营 · 系统层</text>
          <g fontSize={10} fontWeight={700}>
            <text data-fx="camp-fx0" className="fx" x={296} y={50} textAnchor="middle" fill="#27446e">📋 记录</text>
            <text data-fx="camp-fx1" className="fx" x={330} y={38} textAnchor="middle" fill="#27446e">🎒 检查</text>
            <text data-fx="camp-fx2" className="fx" x={364} y={50} textAnchor="middle" fill="#27446e">📦 补给</text>
          </g>
          <path data-fx="camp-route" className="camp-route" d={SUPPLY} fill="none" stroke="#228d5c" strokeWidth={2} strokeDasharray="5 5" opacity={0.55} />
          <g data-fx="camp-pack" className="fx-move">
            <text x={0} y={-4} textAnchor="middle" fontSize={11}>📦</text>
          </g>
          <text data-fx="camp-route-label" className="fx" x={452} y={84} textAnchor="middle" fontSize={9.5} fill="#1c7a4e" fontWeight={700}>补给路线 → 终点</text>
        </g>
      ) : null}

      {v.prop === 'radio' ? (
        <g>
          <line x1={345} y1={88} x2={345} y2={44} stroke="#27446e" strokeWidth={2.6} strokeLinecap="round" />
          <circle cx={345} cy={40} r={3.4} fill="#27446e" />
          <rect x={318} y={84} width={54} height={7} rx={3.5} fill="#27446e" opacity={0.5} />
          <text x={345} y={106} textAnchor="middle" fontSize={10.5} fill="#27446e" fontWeight={600}>同一频道 · 共享状态</text>
          {[0, 1, 2].map((i) => (
            <circle key={i} data-fx={`radio-w${i}`} className="fx-ripple" cx={345} cy={38} r={8} fill="none" stroke="#27446e" strokeWidth={2} />
          ))}
        </g>
      ) : null}

      {v.prop === 'signposts' ? (
        <g>
          {/* 起点预检门：通过后才进入 S₀ */}
          <line x1={92} y1={105} x2={92} y2={76} stroke="#92400e" strokeWidth={3.2} strokeLinecap="round" />
          <line x1={136} y1={105} x2={136} y2={76} stroke="#92400e" strokeWidth={3.2} strokeLinecap="round" />
          <path data-fx="v-gate-open" className="gate-arc" d="M 92 79 Q 114 92 136 79" fill="none" stroke="#f07e47" strokeWidth={3.2} strokeLinecap="round" />
          <text x={114} y={118} textAnchor="middle" fontSize={9.5} fill="#b85c1e" fontWeight={700}>出发前检测</text>

          <line x1={154} y1={105} x2={154} y2={66} stroke="#92400e" strokeWidth={2.4} />
          <rect x={137} y={52} width={34} height={16} rx={4} fill="#fff" stroke="#d7deea" />
          <text x={154} y={64} textAnchor="middle" fontSize={10} fill="#27446e" fontWeight={700}>S₀</text>
          {/* S_T 靠近旗子左侧，但与旗杆/旗面保持清晰间距 */}
          <line x1={496} y1={70} x2={496} y2={42} stroke="#92400e" strokeWidth={2.4} />
          <rect x={479} y={28} width={34} height={16} rx={4} fill="#fff" stroke="#d7deea" />
          <text x={496} y={40} textAnchor="middle" fontSize={10} fill="#27446e" fontWeight={700}>S_T</text>
          {/* 箭头从终态回指初态：S_T → S₀ */}
          <path data-fx="s0-flash" className="fx-blink" d="M 488 64 C 410 20 250 22 162 92" fill="none" stroke="#f07e47" strokeWidth={2} strokeDasharray="5 5" markerEnd="url(#as-arrow)" />
        </g>
      ) : null}

      {v.prop === 'check' ? (
        <g data-fx="end-check" className="fx">
          <circle cx={496} cy={30} r={13} fill="#228d5c" opacity={0.14} />
          <path d="M 490 30 L 495 35 L 504 24" fill="none" stroke="#228d5c" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ) : null}

      <Flag color={v.flagColor} />

      <defs>
        <marker id="as-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#f07e47" />
        </marker>
      </defs>

      {/* 本章 FX（随时间线弹出） */}
      {chapterId === 'chap-1' ? (
        <g>
          <Pill id="q1" x={250} y={56} text="这些步骤谁来负责？" tone="blue" />
          <Pill id="noowner" x={424} y={100} text="验证 · 记录：No owner" tone="red" fs={10} />
        </g>
      ) : null}
      {chapterId === 'chap-2' ? (
        <g>
          <Pill id="q-break" x={372} y={52} text="为什么够不到旗子？" tone="red" fs={10} />
          {/* 红圈包住「旗面 + 旗杆」整体（外接框 524–548 × 22–58，中心 ≈ 536,40） */}
          <circle data-fx="flag-dim" className="fx fx-glow" cx={536} cy={40} r={22} fill="none" stroke="#c43f52" strokeWidth={2} />
        </g>
      ) : null}
      {chapterId === 'chap-3' ? <Pill id="camp-rest" x={264} y={66} text="整备中…" tone="green" fs={10} /> : null}
      {chapterId === 'chap-4' ? <Pill id="radio-msg" x={244} y={62} text="上报: state=running ✓" tone="blue" fs={10} /> : null}
      {chapterId === 'chap-5' ? (
        <g>
          <Pill id="gate-pass" x={205} y={100} text="预检通过 · 放行" tone="green" fs={10} />
          <Pill id="wp-msg" x={400} y={42} text="路簿已签到 · 心跳正常 ✓" tone="green" fs={9.5} />
          {/* 终点确认：到达旗子后验收打勾 */}
          <g data-fx="arrive-check" className="fx">
            <circle cx={496} cy={30} r={13} fill="#228d5c" opacity={0.14} />
            <path d="M 490 30 L 495 35 L 504 24" fill="none" stroke="#228d5c" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <Pill id="arrive-pill" x={434} y={104} text="到达 · 终点确认 ✓" tone="green" fs={10} />
        </g>
      ) : null}
      {chapterId === 'chap-6' ? (
        <g>
          <Pill id="fork-main" x={442} y={70} text="实线 · Policy 流 → 旗子" tone="green" fs={10} />
          <Pill id="fork-branch" x={442} y={132} text="虚线 · Agent 工具流 → 汇入同一终点" tone="blue" fs={9.5} />
        </g>
      ) : null}
      {chapterId === 'chap-7' ? (
        <g>
          <Pill id="v-gate-check" x={220} y={86} text="契约与安全检查" tone="orange" fs={9.5} />
          <Pill id="v-gate-pass" x={214} y={110} text="预检通过 · 放行" tone="green" fs={9.5} />
          <Pill id="s0-start" x={184} y={42} text="记录初态 S₀" tone="blue" fs={9.5} />
          <Pill id="cmp-label" x={344} y={48} text="S_T → S₀ 回溯比对" tone="orange" fs={9.5} />
          <Pill id="st-ok" x={420} y={112} text="变化由本次执行造成 ✓" tone="green" fs={10} />
        </g>
      ) : null}
      {chapterId === 'chap-8' ? (
        <g>
          <Pill id="fail-x" x={290} y={56} text="✗ 第一次失败" tone="red" fs={10} />
          <Pill id="ok-check" x={415} y={56} text="✓ 重试成功" tone="green" fs={10} />
          <Pill id="note-note" x={166} y={62} text="失败与成功都追加进记录" tone="blue" fs={9.5} />
        </g>
      ) : null}
      {chapterId === 'chap-9' ? <Pill id="terr-done" x={266} y={46} text="同一套认知，逐层加回物理" tone="blue" fs={10} /> : null}
      {chapterId === 'chap-10' ? (
        <g fontSize={10.5} fontWeight={700}>
          <Pill id="end-r0" x={360} y={118} text="协议 ✓" tone="green" fs={10.5} />
          <Pill id="end-r1" x={430} y={118} text="提升 ✓" tone="green" fs={10.5} />
          <Pill id="end-r2" x={500} y={118} text="边界 ⚠" tone="orange" fs={10.5} />
        </g>
      ) : null}

      {/* 隐喻 ↔ 论文 对应标签 */}
      <g>
        <rect x={280 - chipW / 2} y={8} width={chipW} height={20} rx={10} fill="#fff" stroke="#d7deea" strokeWidth={1.4} />
        <text x={280} y={22} textAnchor="middle" fontSize={10.5} fill="#27446e" fontWeight={700}>{chipText}</text>
      </g>

      {/* 主角：位置由 rAF 时间线精确驱动（脚踩在路径上） */}
      <g ref={walkerRef} className="analogy-walker">
        <g ref={hikerRef} className="hiker-bounce">
          <Hiker />
        </g>
      </g>
    </svg>
  );
};

export default AnalogyScene;
