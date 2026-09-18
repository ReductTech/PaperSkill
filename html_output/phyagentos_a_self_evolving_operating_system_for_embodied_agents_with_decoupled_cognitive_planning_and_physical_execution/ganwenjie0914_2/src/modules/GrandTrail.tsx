import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';

// Lab 10.3 — Grand Trail：全机制总览（V2 融合版）。
//
// 设计原则：不再把各机制画成「一条路上先后路过的站点」（那是机械拼接），
// 而是按论文的真实结构组织为一张图：
//
//   1. 整张图 = 一条 Session 生命周期环路（编译→预检→执行→证据→验收→归档→检索→出发）。
//      「路」本身就是执行轨迹 τ：S₀ 与 S_T 之间每一步的状态 Sₜ 都是中间态，
//      验收 V(G, S₀, S_T, τ, H) 看的是整条轨迹，不是只看两端（论文 §4.2）。
//   2. 渐进验证 = 同一条环路走三圈，逐层加险（论文 §5：same protocol files and
//      runtime infrastructure are used at every tier）。第①圈 Game 只测认知（路面干净，
//      动作忠实执行）；第②圈 Simulation 加回动力学与碰撞（碎石叠加在原路面上）；
//      第③圈 Real 再加噪声、延迟与硬件约束（冰面再叠加）。碎石/冰面不是「最后一段路」，
//      而是同一条路在不同圈里被加上去的外界因素——所以它们严格叠画在同一段路面上。
//   3. 双执行流 = 执行段的两条车道：实线 Policy 闭环 / 虚线 Agent 工具环。
//      论文 §3.5：两条流「converge at the same architectural boundary」——
//      各自走完整个执行段，在同一个证据→验收边界汇合，不在中途合并。
//   4. OS 运行时层 + State-as-a-File = 画面中央的「大本营底座」，通过服务连线
//      支撑环路上的每个节点（预检/执行/验收/记忆）——它们是贯穿全程的基底，
//      不是路上的某一站。人物每经过一个节点，就向底座上报一次状态（右上角小气泡）。
//   5. First→Final：第②圈在碎石上滑倒 = First 记 ✗；replan 生成子会话、
//      从当前物理状态重新进入（虚线橙色回边），复验通过 = Final 记 ✓。
//      差值就是「验证与恢复救回了多少」。
//   6. 拦杆：绿色横杆两端精确连在两根立柱顶端，预检通过后抬起（不再悬空）。
//
// 排版约定（避免重叠）：1120×384 画布分带——顶部 y<32 放标题/圈数/徽章；
// 路面上方 y 88–126 放 S₀/S_T 牌与地形标注（x 互不重叠的固定槽位）；
// 路面下方 y 140–180 放双车道与其标注（x 分段）；环路中央只放底座与其连线；
// 环路下方 y>340 放检索回环标注。所有弹出气泡都使用互不冲突的固定槽位。

const TRACK =
  'M 138 130 L 962 130 A 38 38 0 0 1 1000 168 L 1000 292 A 38 38 0 0 1 962 330 ' +
  'L 138 330 A 38 38 0 0 1 100 292 L 100 168 A 38 38 0 0 1 138 130 Z';
// 碎石/冰面叠加段：执行段的直线部分（与主路完全共线，保证贴合）
const STRETCH = 'M 252 130 L 960 130';
// Agent 工具环侧道：与主路平行，在进入右弯（=证据边界）前并入主路
const LANE = 'M 252 142 L 928 142 C 950 142 956 136 962 131';
// replan 子会话回边：从验收台回到执行段中途（从当前物理状态重新进入）。
// 尾端从路面中心线发出，藏在路面描边下方，不会在路外侧凸出；
// 指示完成后（角色落回子会话入口）整条回边淡出，避免长期压在图上。
const REPLAN = 'M 1000 246 C 942 236 820 200 700 160 L 670 149';

type Verdict = 'success' | 'failure' | 'replan';

const TONE: Record<string, { fill: string; stroke: string; text: string }> = {
  blue: { fill: '#eef3fb', stroke: '#27446e', text: '#27446e' },
  green: { fill: '#e9f5ef', stroke: '#228d5c', text: '#1c7a4e' },
  red: { fill: '#fbedef', stroke: '#c43f52', text: '#c43f52' },
  orange: { fill: '#fdf0e7', stroke: '#f07e47', text: '#b85c1e' },
  purple: { fill: '#f5f3ff', stroke: '#7c3aed', text: '#7c3aed' },
};

const VERDICT_FX: Record<Verdict, string> = {
  success: 'gt-v-succ',
  failure: 'gt-v-fail',
  replan: 'gt-v-replan',
};

const TANGENT_SAMPLE_PX = 1;
const HORIZONTAL_THRESHOLD = 0.15;
const SIDE_THRESHOLD = 0.5;

// 更接近真实渲染宽度的估算：CJK ≈ 1em，拉丁 ≈ 0.56em
const estW = (s: string, fs: number) => {
  let w = 0;
  for (const ch of s) w += /[\u2E80-\u9FFF\uF900-\uFAFF\uFF01-\uFF60\u3000-\u303F]/.test(ch) ? fs : fs * 0.56;
  return w + 18;
};

function Pill({ id, x, y, text, tone = 'blue', fs = 9.5, className = 'fx' }: { id: string; x: number; y: number; text: string; tone?: string; fs?: number; className?: string }) {
  const t = TONE[tone] ?? TONE.blue;
  const w = estW(text, fs);
  if (!text) return null;
  return (
    <g data-fx={id} className={className}>
      <rect x={x - w / 2} y={y - 9} width={w} height={18} rx={9} fill={t.fill} stroke={t.stroke} strokeWidth={1.2} />
      <text x={x} y={y + 3.4} textAnchor="middle" fontSize={fs} fontWeight={700} fill={t.text}>
        {text}
      </text>
    </g>
  );
}

function Hiker() {
  return (
    <g transform="translate(0 -13)">
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

type Mirror = 1 | -1;

/**
 * 把路径切线转换成人物姿态。返回新的水平镜像状态，让镜像只在人物接近直立时切换；
 * 转弯途中保持手脚的同一侧，避免跨过阈值时产生一次多余翻面。
 */
function facingForTangent(dx: number, dy: number, previousMirror: Mirror): { mirror: Mirror; transform: string } {
  const angle = Math.atan2(dy, dx);
  const verticalness = Math.abs(Math.sin(angle));
  const side = Math.sin(angle) >= 0 ? 1 : -1;
  const mirror: Mirror = verticalness < HORIZONTAL_THRESHOLD ? (dx >= 0 ? 1 : -1) : previousMirror;

  if (verticalness >= SIDE_THRESHOLD) {
    // 侧边姿态本身使用 -1 镜像；同步保存该状态，转入底部弯道时就不会先恢复
    // previousMirror、随后又因水平反向再次翻面。
    return { mirror: -1, transform: `scale(-1 1) rotate(${90 * side} 0 -2)` };
  }

  const tilt = (-side * 90 * verticalness * Math.PI) / 180;
  const rotation = (Math.atan2(mirror * Math.sin(tilt), Math.cos(tilt)) * 180) / Math.PI;
  return { mirror, transform: `scale(${mirror} 1) rotate(${rotation} 0 -2)` };
}

// ---------------------------------------------------------------- 时间线脚本

type Seg =
  | { type: 'walk'; from: number; to: number; ms: number; marks?: { frac: number; fx: () => void }[] }
  | { type: 'hold'; ms: number; fx?: () => void }
  | { type: 'jump'; to: number; fx?: () => void };

interface FxKit {
  pop: (id: string, delay?: number) => void;
  fade: (id: string, delay?: number) => void;
  verdict: (value: Verdict, delay?: number) => void;
  slip: () => void;
  say: (i: number) => void;
  msg: (text: string) => void;
  msg2: (text: string) => void;
  fracTop: (x: number) => number;
  fracRight: (y: number) => number;
  fracBot: (x: number) => number;
}

// CAPTIONS[i] 与脚本触发点一一对应；圈数徽章由 caption 推导
const CAPTIONS: { name: string; desc: string }[] = [
  { name: '出发线 · 第①圈 Game 层', desc: '同一条环路将走三遍（Game→Sim→Real）：第①圈动作忠实执行、无噪声，专测认知。出发先过 Session 预检——契约不匹配，绿色拦杆不抬起。' },
  { name: '执行段 · 同一条路的两条走法', desc: '实线是 Policy 闭环（观测→策略→动作块），虚线是 Agent 工具环（观测→决策→工具调用）。谁在循环里做决策都可以——监督、安全与证据接口完全相同。' },
  { name: '路桩 · τ 是完整的执行轨迹', desc: 'S₀ 只是起点、S_T 只是终点：路上每个 Sₜ（S₁·S₂·S₃…）都被记录进执行轨迹 τ 与历史 H。语义验收看的是整条轨迹，不是只看两端。' },
  { name: '终点前 · S_T 与证据箱', desc: '「跑完了」只是 runtime 终止。语义验收需要五件证据：目标 G、初始态 S₀、终态 S_T、轨迹 τ、历史 H——先立 S₀，S_T 的变化才有对账依据。' },
  { name: '验收台 · 语义裁决', desc: 'V(G, S₀, S_T, τ, H) → success / failure / replan。return code = 0 只说明控制器没报错；任务是否真的完成，由证据决定。' },
  { name: '归档 · 只写复验过的经验', desc: '成功模式进 KNOWLEDGE，失败教训进 LESSONS。没被下一次成功复验的「修复假设」不会变成事实——这是记忆不被污染的关键。' },
  { name: '回到出发线 · 检索先于编译', desc: '下一次会话编译前，先按目标/环境/风险检索记忆、注入上下文。PhyAgentOS 的自我进化不走神经训练——是这一步让经验跨会话生效。' },
  { name: '第②圈 Simulation · 切换到碎石模式', desc: '三层不是一条路的三段，而是同一环路在三种独立模式下重复测试。Simulation 首次保持 Game 的快速速度，因动力学与碰撞失败，问题因此定位在物理执行。' },
  { name: '失败 ≠ 白跑 · First → Final', desc: 'First 在碎石上滑倒；replan 生成子会话后显著减速，复验通过记 Final ✓。角色抵达归档位后才写入第二条记忆，再回到出发点。' },
  { name: '第③圈 Real · 减速通过冰面', desc: '人物回到出发点后，路面才切换为冰面并重新预检。真实位移速度明显变慢；验收、归档第三条记忆后，人物跑回初始点才结束本轮。' },
];

const SCRIPT = (k: FxKit): Seg[] => {
  const g = k.fracTop(172);
  const laneIn = k.fracTop(330);
  const f360 = k.fracTop(360);
  const f380 = k.fracTop(380);
  const f500 = k.fracTop(500);
  const f560 = k.fracTop(560);
  const f620 = k.fracTop(620);
  const f700 = k.fracTop(700);
  const f740 = k.fracTop(740);
  const f760 = k.fracTop(760);
  const sT = k.fracTop(930);
  const ver = k.fracRight(246);
  const arch = k.fracBot(800);
  const reenter = k.fracTop(664);
  return [
    // ---- 第①圈 Game：预检 → 双车道 → τ 路桩 → S_T → 验收 → 归档 → 检索
    { type: 'walk', from: 0, to: g, ms: 900, marks: [{ frac: 0.0001, fx: () => k.say(0) }] },
    {
      type: 'hold', ms: 2300, fx: () => {
        k.pop('gt-bar', 150);
        k.pop('gt-pass', 500);
        k.msg('预检 ✓ 契约匹配');
        k.pop('gt-hub', 650);
      },
    },
    { type: 'walk', from: g, to: laneIn, ms: 800, marks: [{ frac: laneIn, fx: () => k.say(1) }] },
    { type: 'hold', ms: 1700 },
    {
      type: 'walk', from: laneIn, to: f760, ms: 2500, marks: [
        { frac: f360, fx: () => k.say(2) },
        { frac: f380, fx: () => k.pop('gt-s1') },
        { frac: f500, fx: () => k.pop('gt-s2') },
        { frac: f560, fx: () => { k.msg('上报 state=running ✓'); k.pop('gt-hub'); } },
        { frac: f620, fx: () => k.pop('gt-s3') },
        { frac: f740, fx: () => k.pop('gt-s4') },
      ],
    },
    { type: 'walk', from: f760, to: sT, ms: 650, marks: [{ frac: sT, fx: () => k.say(3) }] },
    { type: 'hold', ms: 1500, fx: () => k.pop('gt-ev', 150) },
    { type: 'walk', from: sT, to: ver, ms: 1300, marks: [{ frac: ver, fx: () => k.say(4) }] },
    { type: 'hold', ms: 1900, fx: () => k.verdict('success', 150) },
    { type: 'walk', from: ver, to: arch, ms: 1000, marks: [{ frac: arch, fx: () => k.say(5) }] },
    { type: 'hold', ms: 1700, fx: () => k.pop('gt-m-game', 150) },
    { type: 'walk', from: arch, to: 0.9999, ms: 1500, marks: [{ frac: arch + 0.004, fx: () => k.say(6) }] },
    {
      type: 'hold', ms: 1500, fx: () => {
        k.fade('gt-bar');
        k.fade('gt-pass');
        k.msg('检索：Game 经验已在出发点注入 ✓');
        k.pop('gt-hub', 150);
      },
    },
    // ---- 第②圈 Simulation：切换到碎石模式 → 首次保持 Game 的快速速度并失败
    // → replan 后显著减速复验 → 到达归档位才写入第二条记忆。
    {
      type: 'hold', ms: 1600, fx: () => {
        k.say(7);
        k.pop('gt-rubble', 250);
      },
    },
    { type: 'walk', from: 0.0001, to: g, ms: 700 },
    { type: 'hold', ms: 1300, fx: () => { k.pop('gt-bar', 120); k.pop('gt-pass', 430); k.msg('Simulation 预检 ✓ 放行'); } },
    { type: 'walk', from: g, to: f700, ms: 3000, marks: [{ frac: f700, fx: () => { k.say(8); k.slip(); k.msg2('✗ 首次保持 Game 速度 · 碎石滑倒'); k.pop('gt-dyn2', 60); } }] },
    {
      type: 'walk', from: f700, to: ver, ms: 1600,
    },
    {
      type: 'hold', ms: 2300, fx: () => {
        k.verdict('failure', 120);
        k.msg('replan：子会话 · 降速后从当前状态重启');
        k.pop('gt-replan', 1000);
        k.verdict('replan', 1000);
        k.pop('gt-hub', 1100);
      },
    },
    { type: 'jump', to: reenter, fx: () => { k.pop('gt-cs', 60); k.fade('gt-replan', 500); } },
    { type: 'walk', from: reenter, to: ver, ms: 3600, marks: [{ frac: f740, fx: () => { k.msg2('✓ replan 后实质降速'); k.pop('gt-dyn2', 60); } }] },
    { type: 'hold', ms: 1900, fx: () => { k.verdict('success', 120); k.pop('gt-ff', 650); k.fade('gt-cs', 400); } },
    { type: 'walk', from: ver, to: arch, ms: 1000 },
    { type: 'hold', ms: 1500, fx: () => { k.pop('gt-m-sim', 120); k.msg('归档：Simulation 恢复经验 ✓'); k.pop('gt-hub', 280); } },
    { type: 'walk', from: arch, to: 0.9999, ms: 1500 },
    // ---- 第③圈 Real：人物已回到初始点，先落闸并把路面切换为冰面；
    // 再次预检放行后，用更长时长把“减速策略”真实体现在位移速度上。
    {
      type: 'hold', ms: 1900, fx: () => {
        k.fade('gt-bar');
        k.fade('gt-pass');
        k.say(9);
        k.fade('gt-rubble');
        k.pop('gt-ice', 500);
        k.msg('检索：碎石恢复经验已在出发点注入 ✓');
        k.pop('gt-hub', 180);
        k.msg2('');
      },
    },
    { type: 'walk', from: 0.0001, to: g, ms: 700 },
    { type: 'hold', ms: 1300, fx: () => { k.pop('gt-bar', 120); k.pop('gt-pass', 430); k.msg('Real Robot 预检 ✓ 放行'); } },
    {
      type: 'walk', from: g, to: sT, ms: 5600,
      marks: [{ frac: f700, fx: () => { k.msg2('✓ 冰面明显减速 · 复用上一圈教训'); k.pop('gt-dyn2', 60); } }],
    },
    { type: 'walk', from: sT, to: ver, ms: 1500 },
    {
      type: 'hold', ms: 1900, fx: () => {
        k.verdict('success', 120);
      },
    },
    { type: 'walk', from: ver, to: arch, ms: 1000 },
    { type: 'hold', ms: 1500, fx: () => { k.pop('gt-m-real', 120); k.msg('归档：Real Robot 通过经验 ✓'); k.pop('gt-hub', 280); } },
    { type: 'walk', from: arch, to: 0.9999, ms: 1700 },
    { type: 'hold', ms: 2100, fx: () => { k.fade('gt-bar'); k.fade('gt-pass'); k.msg('三轮完成 · 人物已回到初始点'); k.pop('gt-hub', 150); k.pop('gt-badge', 700); } },
  ];
};

export const GrandTrail: React.FC<WidgetProps> = () => {
  const [reduced, setReduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const [inView, setInView] = useState(false);
  const [caption, setCaption] = useState(0);
  const [hubMsg, setHubMsg] = useState('');
  const [dyn2Msg, setDyn2Msg] = useState('');
  const [playing, setPlaying] = useState(true);
  const [runKey, setRunKey] = useState(0);
  const baseRef = useRef<SVGPathElement>(null);
  const walkerRef = useRef<SVGGElement>(null);
  const facingRef = useRef<SVGGElement>(null);
  const hikerRef = useRef<SVGGElement>(null);
  const stageRef = useRef<SVGSVGElement>(null);
  const playingRef = useRef(true);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    setReduced(!!mq?.matches);
    const fn = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq?.addEventListener?.('change', fn);
    return () => mq?.removeEventListener?.('change', fn);
  }, []);

  // 第十章在用户到达 Grand Trail 之前还要经过两个实验室。只有画布真正进入视口
  // 才从第一阶段播放，避免用户滚到这里时动画已经跑到 Final 或下一圈。
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (!('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35 }
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const base = baseRef.current;
    const walker = walkerRef.current;
    const facing = facingRef.current;
    const stage = stageRef.current;
    if (!base || !walker || !facing || !stage || (!inView && !reduced)) return;
    const total = base.getTotalLength();

    // 采样整条环路：三个分段查找器（顶边 x 递增 / 右边 y 递增 / 底边 x 递减）
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i <= 1000; i++) {
      const p = base.getPointAtLength((i / 1000) * total);
      pts.push({ x: p.x, y: p.y });
    }
    const fracTop = (x: number) => {
      for (let i = 0; i < pts.length; i++) if (pts[i].x >= x) return i / 1000;
      return 0.999;
    };
    const fracRight = (y: number) => {
      for (let i = 0; i < pts.length; i++) if (pts[i].x > 999 && pts[i].y >= y) return i / 1000;
      return 0.999;
    };
    const fracBot = (x: number) => {
      let seen = false;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (p.x > 999) seen = true;
        if (seen && p.x <= x) return i / 1000;
      }
      return 0.999;
    };
    // 人物朝向只取决于当前位置的路径切线，不能使用「上一帧 → 当前帧」的位移。
    // replan 会把人物从验收台瞬移回执行段；若把这次跳跃当作行走方向，镜像会先
    // 错翻一次、下一帧再翻回来，正是 First → Final 后闪烁的根因。
    // 水平段（顶/底边）：直立行走，镜像 faceSx 随路径切线方向翻转；
    // 侧边段（左/右边）：横躺，头朝环路内侧、腹部朝行进方向（正面朝前）；
    // 弯道（0.05<v<0.5）：直立并朝内侧连续倾斜，rot 经 atan2 补偿镜像使世界朝向连续。
    // 镜像只在接近直立（v<0.15）时翻转——弯道中途翻镜像会让四肢瞬间跳到路的另一侧。
    let faceSx: Mirror = 1;
    const pointAtWrappedDistance = (distance: number) => {
      const wrapped = ((distance % total) + total) % total;
      return base.getPointAtLength(wrapped);
    };
    const placeWalker = (frac: number) => {
      const clamped = Math.max(0, Math.min(0.9999, frac));
      const distance = clamped * total;
      const p = base.getPointAtLength(distance);
      walker.setAttribute('transform', `translate(${p.x} ${p.y})`);

      // 用路径前后各 1px 的点求局部切线。闭合路径在首尾处用环绕采样，避免重播
      // 跨过 0/1 接缝时出现一个错误方向帧。
      const before = pointAtWrappedDistance(distance - TANGENT_SAMPLE_PX);
      const after = pointAtWrappedDistance(distance + TANGENT_SAMPLE_PX);
      const dx = after.x - before.x;
      const dy = after.y - before.y;
      const pose = facingForTangent(dx, dy, faceSx);
      faceSx = pose.mirror;
      facing.setAttribute('transform', pose.transform);
    };

    // 所有延迟特效都使用“有效播放时间”，因此暂停会同时冻结人物、闸门、裁决灯和记忆写入。
    const scheduled: { remaining: number; run: () => void }[] = [];
    const schedule = (delay: number, run: () => void) => {
      if (delay <= 0) run();
      else scheduled.push({ remaining: delay, run });
    };
    const advanceScheduled = (dt: number) => {
      for (let i = scheduled.length - 1; i >= 0; i--) {
        scheduled[i].remaining -= dt;
        if (scheduled[i].remaining <= 0) {
          const [job] = scheduled.splice(i, 1);
          job.run();
        }
      }
    };
    const pop = (id: string, delay = 0) => {
      schedule(delay, () => {
        const el = stage.querySelector(`[data-fx="${id}"]`);
        if (!el) return;
        el.classList.remove('on');
        void el.getBoundingClientRect();
        el.classList.add('on');
      });
    };
    const slip = () => {
      const inner = hikerRef.current;
      if (!inner) return;
      inner.classList.remove('on');
      void inner.getBoundingClientRect();
      inner.classList.add('on');
      schedule(700, () => inner.classList.remove('on'));
    };
    const fade = (id: string, delay = 0) => {
      schedule(delay, () => stage.querySelector(`[data-fx="${id}"]`)?.classList.remove('on'));
    };
    const verdict = (value: Verdict, delay = 0) => {
      schedule(delay, () => {
        stage.querySelectorAll('.gt-lamp.on').forEach((el) => el.classList.remove('on'));
        const el = stage.querySelector(`[data-fx="${VERDICT_FX[value]}"]`);
        if (!el) return;
        void el.getBoundingClientRect();
        el.classList.add('on');
      });
    };
    const say = (i: number) => setCaption(i);
    const msg = (t: string) => setHubMsg(t);
    const msg2 = (t: string) => setDyn2Msg(t);
    const kit: FxKit = { pop, fade, verdict, slip, say, msg, msg2, fracTop, fracRight, fracBot };
    const script = SCRIPT(kit);
    const resetFx = () => stage.querySelectorAll('[data-fx].on').forEach((e) => e.classList.remove('on'));

    if (reduced) {
      placeWalker(fracRight(246));
      setCaption(CAPTIONS.length - 1);
      stage.querySelectorAll('[data-fx]').forEach((e) => e.classList.add('on'));
      stage.querySelector(`[data-fx="${VERDICT_FX.failure}"]`)?.classList.remove('on');
      stage.querySelector(`[data-fx="${VERDICT_FX.replan}"]`)?.classList.remove('on');
      return () => {
        scheduled.length = 0;
        resetFx();
      };
    }

    let stopped = false;
    let raf = 0;
    let segIdx = 0;
    let segElapsed = 0;
    let lastNow = 0;
    let segmentStarted = false;
    let activeMarks: { frac: number; fx: () => void }[] = [];
    let loopDelay = 0;
    const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const restart = () => {
      resetFx();
      scheduled.length = 0;
      segIdx = 0;
      segElapsed = 0;
      segmentStarted = false;
      activeMarks = [];
      loopDelay = 0;
      setCaption(0);
      setHubMsg('');
      setDyn2Msg('');
      placeWalker(0);
    };
    const beginSegment = () => {
      // jump 不消耗时间；连续处理，直到抵达 walk / hold 或脚本末尾。
      while (segIdx < script.length && !segmentStarted) {
        const seg = script[segIdx];
        segElapsed = 0;
        if (seg.type === 'jump') {
          placeWalker(seg.to);
          seg.fx?.();
          segIdx++;
          continue;
        }
        segmentStarted = true;
        activeMarks = seg.type === 'walk' && seg.marks ? [...seg.marks] : [];
        if (seg.type === 'hold') seg.fx?.();
      }
    };
    const tick = (now: number) => {
      if (stopped) return;
      const dt = Math.min(50, lastNow ? now - lastNow : 0);
      lastNow = now;

      if (playingRef.current) {
        advanceScheduled(dt);
        beginSegment();
        if (segIdx >= script.length) {
          loopDelay += dt;
          if (loopDelay >= 1400) restart();
        } else {
          const seg = script[segIdx];
          if (seg.type === 'jump') {
            // beginSegment 会在同一帧消费 jump；此分支只用于让类型收窄保持显式。
            placeWalker(seg.to);
            seg.fx?.();
            segIdx++;
            segmentStarted = false;
            raf = requestAnimationFrame(tick);
            return;
          }
          segElapsed += dt;
          if (seg.type === 'walk') {
            const t = Math.min(1, segElapsed / seg.ms);
            const f = seg.from + (seg.to - seg.from) * ease(t);
            placeWalker(f);
            while (activeMarks.length && f >= activeMarks[0].frac) activeMarks.shift()!.fx();
          }
          if (segElapsed >= seg.ms) {
            if (seg.type === 'walk') placeWalker(seg.to);
            segIdx++;
            segElapsed = 0;
            segmentStarted = false;
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    restart();
    raf = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      scheduled.length = 0;
      resetFx();
    };
  }, [inView, reduced, runKey]);

  const cap = CAPTIONS[caption];
  const lap = caption < 7 ? 0 : caption < 9 ? 1 : 2;
  const lapChips = [
    { label: '① Game · 认知', hint: '动作忠实执行' },
    { label: '② Simulation · 物理', hint: '加回动力学' },
    { label: '③ Real · 真机', hint: '噪声·延迟·硬件' },
  ];
  const togglePlaying = () => setPlaying((value) => !value);
  const resetRun = () => {
    playingRef.current = true;
    setPlaying(true);
    setRunKey((value) => value + 1);
  };

  return (
    <div className="lab gt-lab">
      <div className="gl-caption" aria-live="polite">
        <div className="gl-caption-head">
          <span className="gl-phase-num">{caption + 1}/{CAPTIONS.length}</span>
          <b>{cap.name}</b>
        </div>
        <p className="gl-caption-desc">{cap.desc}</p>
      </div>

      <div className="lab-stage">
        <svg ref={stageRef} className="analogy-svg" viewBox="0 0 1120 384" role="img" aria-label="全机制总览：一条 Session 生命周期环路在 Game、Simulation、Real Robot 三种独立模式下各走一圈">
          {/* 顶部带：标题 / 圈数 / 终点徽章（互不重叠的固定槽位） */}
          <g>
            <rect x={410} y={10} width={300} height={22} rx={11} fill="#fff" stroke="#d7deea" strokeWidth={1.4} />
            <text x={560} y={25} textAnchor="middle" fontSize={10.5} fill="#27446e" fontWeight={700}>
              一条 Session 环路 × 三层渐进验证 — 全机制总览
            </text>
          </g>
          <g fontSize={8.5} fontWeight={700}>
            {lapChips.map((c, i) => (
              <g key={c.label}>
                <rect x={36 + i * 96} y={11} width={90} height={20} rx={10}
                  fill={lap === i ? '#fdf0e7' : '#fff'} stroke={lap === i ? '#f07e47' : '#d7deea'} strokeWidth={lap === i ? 1.6 : 1.2} />
                <text x={36 + i * 96 + 45} y={24} textAnchor="middle" fill={lap === i ? '#b85c1e' : '#68778f'}>{c.label}</text>
              </g>
            ))}
          </g>

          {/* 测量基准路径（不可见）：动画取样用；可见路线整体包在 translate(-14,0) 分组里，
              给右侧验收台留出人物横躺后的空间 */}
          <path ref={baseRef} d={TRACK} fill="none" stroke="none" />
          <g transform="translate(-14 0)">
          {/* 底座服务连线（最先画，压在最底层）：大本营 → 门 / 车道 / 验收台 / 记忆 */}
          <g stroke="#b9c6d8" strokeWidth={1.3} strokeDasharray="3 3" fill="none" opacity={0.85}>
            <path d="M 434 240 L 152 132" />
            <path d="M 444 225 L 444 144" />
            <path d="M 714 255 L 1028 255" />
            <path d="M 654 295 L 806 297" />
          </g>
          <circle cx={444} cy={144} r={2.4} fill="#b9c6d8" />

          {/* 环路主路：实线 = Policy 闭环执行段；整条环路 = 一次 Session 生命周期 */}
          <path d={TRACK} fill="none" stroke="#dce7d5" strokeWidth={9} strokeLinecap="round" />
          <path d={TRACK} fill="none" stroke="#92400e" strokeWidth={3.4} strokeLinecap="round" opacity={0.85} />
          <text x={330} y={118} textAnchor="middle" fontSize={9} fill="#92400e" fontWeight={700}>实线 · Policy 闭环主路</text>

          {/* Agent 工具环侧道：走完整段执行，在右弯（证据边界）处并入同一条验收路 */}
          <path d={LANE} fill="none" stroke="#27446e" strokeWidth={2.4} strokeLinecap="round" strokeDasharray="5 5" opacity={0.75} />
          <text x={330} y={168} textAnchor="middle" fontSize={9} fill="#27446e" fontWeight={700}>虚线 · Agent 工具环（同一验收）</text>

          {/* τ 路桩：S₀ 与 S_T 之间的中间态（验收看整条轨迹） */}
          <g>
            {[
              { x: 380, t: 'S₁' },
              { x: 500, t: 'S₂' },
              { x: 620, t: 'S₃' },
              { x: 740, t: 'S₄' },
            ].map((s, i) => (
              <g key={s.t} data-fx={`gt-s${i + 1}`} className="fx">
                <rect x={s.x - 13} y={123} width={26} height={14} rx={4} fill="#fff" stroke="#9db1c9" strokeWidth={1.1} />
                <text x={s.x} y={133.5} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#52657f">{s.t}</text>
              </g>
            ))}
            <text x={575} y={172} textAnchor="middle" fontSize={9} fill="#52657f" fontWeight={700}>
              执行轨迹 τ：每个中间态 Sₜ 都进证据
            </text>
          </g>

          {/* S₀ / S_T 路牌 */}
          <g>
            <line x1={240} y1={130} x2={240} y2={106} stroke="#92400e" strokeWidth={2.2} />
            <rect x={222} y={92} width={36} height={15} rx={4} fill="#fff" stroke="#d7deea" strokeWidth={1.2} />
            <text x={240} y={103.5} textAnchor="middle" fontSize={9.5} fill="#27446e" fontWeight={800}>S₀</text>
            <line x1={930} y1={130} x2={930} y2={106} stroke="#92400e" strokeWidth={2.2} />
            <rect x={912} y={92} width={36} height={15} rx={4} fill="#fff" stroke="#d7deea" strokeWidth={1.2} />
            <text x={930} y={103.5} textAnchor="middle" fontSize={9.5} fill="#27446e" fontWeight={800}>S_T</text>
          </g>

          {/* 碎石层（第②圈叠加）：与主路完全共线的直线段 + 沿路面取点的石块 */}
          <g data-fx="gt-rubble" className="fx-fade">
            <path d={STRETCH} fill="none" stroke="#8a6b4a" strokeWidth={5} strokeLinecap="round" opacity={0.55} />
            {[[455, 128.6], [555, 128.4], [665, 128.6], [775, 128.4], [855, 128.6], [905, 128.5]].map(([x, y], i) => (
              <path key={i} d={`M ${x - 4.4} ${y} l 4.4 -5.6 l 4.4 5.6 z`} fill="#6b5236" />
            ))}
            <text x={828} y={94} textAnchor="middle" fontSize={9} fill="#6b5236" fontWeight={700}>碎石 · 动力学与碰撞</text>
          </g>
          {/* 冰面层（第③圈再叠加）：同样严格共线 */}
          <g data-fx="gt-ice" className="fx-fade">
            <path d={STRETCH} fill="none" stroke="#6aa7cc" strokeWidth={5} strokeLinecap="round" opacity={0.5} />
            {[[430, 126], [530, 125.4], [700, 126], [810, 125.4], [880, 125.8]].map(([x, y], i) => (
              <line key={i} x1={x} y1={y} x2={x + 10} y2={y - 3.4} stroke="#eaf6fd" strokeWidth={2.2} strokeLinecap="round" />
            ))}
            <text x={828} y={78} textAnchor="middle" fontSize={9} fill="#3d7ba6" fontWeight={700}>冰面 · 噪声·延迟·硬件</text>
          </g>

          {/* 出发检查门：绿色拦杆两端连在立柱顶端，预检通过后抬起 */}
          <g>
            <line x1={150} y1={130} x2={150} y2={100} stroke="#92400e" strokeWidth={3.2} strokeLinecap="round" />
            <line x1={194} y1={130} x2={194} y2={100} stroke="#92400e" strokeWidth={3.2} strokeLinecap="round" />
            <line data-fx="gt-bar" className="gt-bar" x1={150} y1={100} x2={194} y2={100} stroke="#d97706" strokeWidth={5} strokeLinecap="round" />
            <text x={172} y={148} textAnchor="middle" fontSize={9} fill="#b85c1e" fontWeight={700}>出发 · Session 预检</text>
          </g>
          <Pill id="gt-pass" x={172} y={76} text="✓ 预检通过 · 放行" tone="green" fs={9} />

          {/* 事件气泡槽位（执行段上方，x 与地形标注错开） */}
          <Pill id="gt-dyn2" x={700} y={84} text={dyn2Msg} tone="orange" fs={9} />

          {/* 记忆归档（底边内侧）：每圈抵达归档位后才追加一条，最终正好三条。 */}
          <g>
            <rect x={750} y={274} width={108} height={49} rx={7} fill="#fff" stroke="#c6d3e2" strokeWidth={1.4} />
            <text x={804} y={286} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="#68778f">验证后记忆 · 3 圈</text>
            {[297, 307, 317].map((y) => (
              <line key={y} x1={764} y1={y} x2={844} y2={y} stroke="#e2e8f1" strokeWidth={2.8} strokeLinecap="round" />
            ))}
            <line data-fx="gt-m-game" className="fx-line" x1={764} y1={297} x2={844} y2={297} stroke="#228d5c" strokeWidth={2.8} strokeLinecap="round" />
            <line data-fx="gt-m-sim" className="fx-line" x1={764} y1={307} x2={844} y2={307} stroke="#7c3aed" strokeWidth={2.8} strokeLinecap="round" />
            <line data-fx="gt-m-real" className="fx-line" x1={764} y1={317} x2={844} y2={317} stroke="#7c3aed" strokeWidth={2.8} strokeLinecap="round" />
          </g>

          {/* 检索回环标注：底边外侧固定槽位 */}
          <g>
            <path d="M 150 344 L 830 344" stroke="#9db1c9" strokeWidth={1.2} strokeDasharray="4 4" />
            <path d="M 150 344 l 7 -4 l 0 8 z" fill="#9db1c9" />
            <text x={490} y={362} textAnchor="middle" fontSize={9} fill="#52657f" fontWeight={700}>
              检索 · 下一次出发前注入上一圈经验（记忆 → 新会话上下文）
            </text>
          </g>

          {/* replan 子会话回边：从验收台回到执行段中途（从当前物理状态重新进入） */}
          <g data-fx="gt-replan" className="fx-fade">
            <path d={REPLAN} fill="none" stroke="#f07e47" strokeWidth={2.2} markerEnd="url(#gt-arrow)" />
            <text x={880} y={196} textAnchor="middle" fontSize={8.5} fill="#b85c1e" fontWeight={700}>子会话 · 当前状态重启</text>
          </g>
          <g data-fx="gt-cs" className="fx-fade">
            <circle cx={664} cy={130} r={10} fill="none" stroke="#f07e47" strokeWidth={2.4} />
          </g>
          </g>

          {/* 大本营底座：OS 运行时 + State-as-a-File（贯穿全程的服务，不是路上的一站） */}
          <g>
            <rect x={420} y={225} width={280} height={70} rx={9} fill="#f4f7fb" stroke="#9db1c9" strokeWidth={1.5} />
            <text x={560} y={243} textAnchor="middle" fontSize={10} fontWeight={800} fill="#27446e">
              大本营 · OS 运行时层（贯穿全程）
            </text>
            <g fontSize={8} fontWeight={700}>
              <rect x={430} y={251} width={116} height={15} rx={7.5} fill="#fff" stroke="#c6d3e2" />
              <text x={488} y={262} textAnchor="middle" fill="#27446e">调度 · Session 生命周期</text>
              <rect x={552} y={251} width={140} height={15} rx={7.5} fill="#fff" stroke="#c6d3e2" />
              <text x={622} y={262} textAnchor="middle" fill="#27446e">状态文件 · State-as-a-File</text>
              <rect x={430} y={271} width={116} height={15} rx={7.5} fill="#fff" stroke="#c6d3e2" />
              <text x={488} y={282} textAnchor="middle" fill="#27446e">心跳 · 看门狗监督</text>
              <rect x={552} y={271} width={140} height={15} rx={7.5} fill="#fff" stroke="#c6d3e2" />
              <text x={622} y={282} textAnchor="middle" fill="#27446e">记忆 · 检索与归档</text>
            </g>
          </g>
          {/* 状态上报气泡：固定槽位（底座右上角上方），整场只有一个 */}
          <Pill id="gt-hub" x={660} y={214} text={hubMsg} tone="blue" fs={8.5} />

          {/* 验收台：证据箱 + 三种裁决（右侧固定区域） */}
          <Pill id="gt-ev" x={1064} y={182} text="证据 G·S₀·S_T·τ·H" tone="purple" fs={8.5} />
          <g>
            <rect x={1014} y={196} width={100} height={94} rx={8} fill="#fff" stroke="#9db1c9" strokeWidth={1.5} />
            <text x={1064} y={212} textAnchor="middle" fontSize={10} fontWeight={800} fill="#27446e">验收台</text>
            <text x={1064} y={224} textAnchor="middle" fontSize={7} fontWeight={700} fill="#68778f" fontFamily="var(--ui-font-mono, monospace)">SessionVerifier</text>
            <g className="gt-lamp" data-fx="gt-v-succ">
              <rect x={1026} y={232} width={76} height={15} rx={7.5} fill="#e9f5ef" stroke="#228d5c" strokeWidth={1.2} />
              <text x={1064} y={243} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#1c7a4e">success ✓</text>
            </g>
            <g className="gt-lamp" data-fx="gt-v-fail">
              <rect x={1026} y={251} width={76} height={15} rx={7.5} fill="#fbedef" stroke="#c43f52" strokeWidth={1.2} />
              <text x={1064} y={262} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#c43f52">failure ✗</text>
            </g>
            <g className="gt-lamp" data-fx="gt-v-replan">
              <rect x={1026} y={270} width={76} height={15} rx={7.5} fill="#fdf0e7" stroke="#f07e47" strokeWidth={1.2} />
              <text x={1064} y={281} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#b85c1e">replan ↻</text>
            </g>
          </g>
          <Pill id="gt-ff" x={1064} y={306} text="First ✗ → Final ✓" tone="green" fs={8.5} />

          <text x={36} y={236} textAnchor="middle" fontSize={8} fill="#68778f" fontWeight={700}>回到出发线 ↻</text>

          {/* 终点徽章（顶部右侧固定槽位） */}
          <g data-fx="gt-badge" className="fx">
            <circle cx={1078} cy={30} r={13} fill="#228d5c" opacity={0.14} />
            <path d="M 1072 30 L 1077 35 L 1086 24" fill="none" stroke="#228d5c" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            <text x={1078} y={54} textAnchor="middle" fontSize={8} fill="#1c7a4e" fontWeight={700}>闭环提升 ✓</text>
          </g>

          <defs>
            <marker id="gt-arrow" viewBox="0 0 10 10" refX={8.5} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#f07e47" />
            </marker>
          </defs>

          {/* 主角（与可见路线同处一个位移分组，保证沿路面行走） */}
          <g transform="translate(-14 0)">
            <g ref={walkerRef} className="analogy-walker">
              <g ref={facingRef}>
                <g ref={hikerRef} className="hiker-bounce">
                  <Hiker />
                </g>
              </g>
            </g>
          </g>
        </svg>
      </div>

      <div className="gl-controls gt-controls">
        <button type="button" className="lab-btn lab-btn-primary" onClick={togglePlaying} aria-pressed={!playing}>
          {playing ? '⏸ 暂停' : '▶ 继续'}
        </button>
        <button type="button" className="lab-btn lab-btn-ghost" onClick={resetRun}>
          ↺ 重置
        </button>
        <span className="gt-control-note">暂停会冻结人物、裁决、闸门与记忆写入</span>
      </div>

      {/* 道具 ↔ 论文机制 图例 */}
      <div className="gt-legend">
        <span className="gt-legend-label">图例（道具 ↔ 论文机制）：</span>
        <span className="gt-legend-item"><i style={{ background: '#228d5c' }} />绿杆+立柱 → Session 预检门</span>
        <span className="gt-legend-item"><i style={{ background: '#92400e' }} />实线主路 / <i style={{ background: '#27446e', marginLeft: 0 }} />虚线侧道 → Policy 闭环 / Agent 工具环（同一验收）</span>
        <span className="gt-legend-item"><i style={{ background: '#9db1c9' }} />S₁…S_T 路桩 → 执行轨迹 τ（中间态全部留痕）</span>
        <span className="gt-legend-item"><i style={{ background: '#7c3aed' }} />验收台 → V(G, S₀, S_T, τ, H) 语义裁决</span>
        <span className="gt-legend-item"><i style={{ background: '#6b5236' }} />碎石 / <i style={{ background: '#6aa7cc', marginLeft: 0 }} />冰面切换 → 同一环路在三种独立模式重复验证</span>
        <span className="gt-legend-item"><i style={{ background: '#b9c6d8' }} />中央底座 → OS 运行时 · State-as-a-File（贯穿全程）</span>
        <span className="gt-legend-item"><i style={{ background: '#68778f' }} />底边回环 → 记忆归档与检索（First→Final）</span>
      </div>
    </div>
  );
};

export default GrandTrail;
