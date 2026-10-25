import React, { useState, useRef, useEffect } from 'react';
import type { WidgetProps } from './registry';

/* =========================================================================
 * 每章开头的类比互动——按章节内容定制，10 章 10 个场景。
 * 已放大到 720×210，字号加大，去除重复/冗余说明，只留关键信息。
 * ========================================================================= */

/* ---------- 共用视觉原语（加大） ---------- */

function Person({ x, y, color = '#2563eb', hat = '#ea580c', done = false, scale = 1.25 }: {
  x: number; y: number; color?: string; hat?: string; done?: boolean; scale?: number;
}) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <circle r="12" fill={done ? '#16a34a' : color} />
      <circle r="12" fill="none" stroke={done ? '#128a4a' : '#1d4ed8'} strokeWidth="2" />
      <rect x="-9" y="-26" width="18" height="28" rx="7" fill={done ? '#128a4a' : '#1d4ed8'} />
      <rect x="-6" y="-7" width="12" height="8" rx="3" fill={hat} />
      {done && <path d="M -4 0 l 4 4 l 8 -8" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
    </g>
  );
}

function Door({ x, label, y = 100, h = 70 }: { x: number; label: string; y?: number; h?: number }) {
  return (
    <g>
      <rect x={x - 30} y={y} width="60" height={h} rx="10" fill="#f2b23b" />
      <rect x={x - 30} y={y} width="60" height={h} rx="10" fill="none" stroke="#d98f1f" strokeWidth="2.5" />
      <rect x={x - 19} y={y + 12} width="38" height={h - 24} rx="7" fill="#fff8ea" />
      <circle cx={x + 16} cy={y + 34} r="4" fill="#d98f1f" />
      <rect x={x - 36} y={y - 14} width="72" height="20" rx="8" fill="#7c3aed" />
      <text x={x} y={y} textAnchor="middle" fontSize="17" fill="#fff" fontWeight="700">{label}</text>
    </g>
  );
}

function Frame({ children, bar }: { children: React.ReactNode; bar: React.ReactNode }) {
  return (
    <div className="ana-wrap">
      <svg viewBox="0 0 720 210" className="ana-svg" role="img">{children}</svg>
      <div className="ana-bar">{bar}</div>
    </div>
  );
}

function Chip({ x, y, children, tone = 'n', size = 19 }: { x: number; y: number; children: React.ReactNode; tone?: string; size?: number }) {
  const cls = tone === 'g' ? 'ana-chip g' : tone === 'b' ? 'ana-chip b' : 'ana-chip';
  return <text x={x} y={y} textAnchor="middle" fontSize={size} className={cls}>{children}</text>;
}

/* ---------- 1 · 真实 vs 仿真（切换） ---------- */

function Scene1() {
  const [side, setSide] = useState<'real' | 'sim'>('sim');
  return (
    <Frame bar={<>
      <span className="ana-action">送货员：真实 vs 仿真</span>
      <span className="ana-hint">点两侧面板切换</span>
    </>}>
      <line x1="24" y1="178" x2="696" y2="178" stroke="#e3ddcf" strokeWidth="2" />
      <line x1="360" y1="18" x2="360" y2="196" stroke="#e3ddcf" strokeWidth="1.5" strokeDasharray="6 6" />
      {/* 真实侧 */}
      <g onClick={() => setSide('real')} className={side === 'real' ? 'ana-side on' : 'ana-side'} style={{ cursor: 'pointer' }}>
        <rect x="30" y="30" width="306" height="24" rx="8" fill="#f1e8d8" />
        <text x="183" y="47" textAnchor="middle" fontSize="19" fill="#8a7d66">真实世界</text>
        <Person x={120} y={158} color="#8a93a1" hat="#b0803a" />
        <circle cx="140" cy="136" r="3.5" fill="#8ec8d8" />
        <rect x="40" y="84" width="240" height="32" rx="9" fill="#f6efe3" stroke="#c9a84b" strokeWidth="2" />
        <text x="160" y="105" textAnchor="middle" fontSize="18" fill="#8a6d2f">慢 · 危险 · 贵</text>
        <rect x="100" y="126" width="150" height="28" rx="14" fill="#f6efe3" stroke="#c9a84b" strokeWidth="2" />
        <text x="175" y="145" textAnchor="middle" fontSize="17" fill="#8a6d2f">难复现</text>
      </g>
      {/* 仿真侧 */}
      <g onClick={() => setSide('sim')} className={side === 'sim' ? 'ana-side on' : 'ana-side'} style={{ cursor: 'pointer' }}>
        <rect x="384" y="30" width="306" height="24" rx="8" fill="#e3f3e9" />
        <text x="537" y="47" textAnchor="middle" fontSize="19" fill="#177245">Habitat 仿真</text>
        <Person x={470} y={158} color="#16a34a" hat="#ea580c" />
        <path d="M 434 152 l -28 0 M 434 162 l -22 0" stroke="#7fbf96" strokeWidth="4" strokeLinecap="round" />
        <Door x={600} label="送达" y={108} h={62} />
        <rect x="394" y="84" width="260" height="32" rx="9" fill="#e9f7ef" stroke="#16a34a" strokeWidth="2" />
        <text x="524" y="105" textAnchor="middle" fontSize="18" fill="#128a4a">数千~上万 fps · 安全 · 便宜</text>
        <rect x="470" y="126" width="130" height="28" rx="14" fill="#e9f7ef" stroke="#16a34a" strokeWidth="2" />
        <text x="535" y="145" textAnchor="middle" fontSize="17" fill="#128a4a">可复现</text>
      </g>
      {side === 'real'
        ? <Chip x={360} y={42} tone="b">真实训练慢、贵、难复现——这是问题</Chip>
        : <Chip x={360} y={42} tone="g">仿真快进、安全、可复现——这是解法</Chip>}
    </Frame>
  );
}

/* ---------- 2 · 旧模拟器：任务·平台·数据集绑死（换单/换楼失败） ---------- */

function Scene2() {
  const [tryCount, setTryCount] = useState(0);
  const fail = () => { setTryCount((c) => c + 1); };
  return (
    <Frame bar={<>
      <button className="ana-play" onClick={fail}>换个订单（任务）</button>
      <button className="ana-play alt" onClick={fail}>换栋楼（数据集）</button>
      <span className="ana-hint">旧模拟器 = 专属仓库：一套只接一种单</span>
    </>}>
      {/* 楼（数据集） */}
      <rect x="50" y="50" width="230" height="120" rx="12" fill="#f6f4ef" stroke="#e0d8c6" strokeWidth="2.5" />
      <rect x="50" y="50" width="230" height="32" rx="12" fill="#8a93a1" />
      <text x="165" y="71" textAnchor="middle" fontSize="18" fill="#fff">只认这栋楼（数据集）</text>
      <rect x="72" y="96" width="30" height="20" rx="4" fill="#dcd6c6" />
      <rect x="116" y="96" width="30" height="20" rx="4" fill="#dcd6c6" />
      <rect x="72" y="126" width="30" height="20" rx="4" fill="#dcd6c6" />
      <rect x="116" y="126" width="30" height="20" rx="4" fill="#dcd6c6" />
      {/* 送货员 + 反馈 */}
      <Person x={360} y={160} color="#9aa5b1" hat="#b0803a" />
      <rect x="286" y="52" width="196" height="30" rx="15" fill={tryCount > 0 ? '#fdeaea' : '#f6efe3'} stroke={tryCount > 0 ? '#dc2626' : '#d8cbb4'} strokeWidth="2" />
      <text x="384" y="72" textAnchor="middle" fontSize="18" fill={tryCount > 0 ? '#b91c1c' : '#8a7d66'} fontWeight="700">
        {tryCount > 0 ? '× 不通用，得重搭' : '换个单就送不了'}
      </text>
      {/* 新楼（无法到达） */}
      <Door x={560} label="新楼" y={108} h={62} />
      <path d="M 402 158 C 450 158 480 150 530 146" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeDasharray="7 5" />
      <text x={560} y={186} textAnchor="middle" fontSize="17" fill="#b91c1c">连不上：写死了</text>
    </Frame>
  );
}

/* ---------- 3 · 三层软件栈（点击逐层点亮） ---------- */

function Scene3() {
  const [step, setStep] = useState(0);
  const layers = [
    { label: 'Datasets 数据集', x: 180 },
    { label: 'Habitat-Sim 引擎', x: 360 },
    { label: 'Habitat-API 任务', x: 540 },
  ];
  return (
    <Frame bar={<>
      <button className="ana-play" onClick={() => setStep((s) => (s >= 4 ? 0 : s + 1))}>
        {step === 0 ? '▶ 开始派单' : step === 4 ? '↺ 重来' : '下一层'}
      </button>
      <span className="ana-hint">依次点亮三层：数据 → 引擎 → 任务</span>
    </>}>
      <line x1="24" y1="178" x2="696" y2="178" stroke="#e3ddcf" strokeWidth="2" />
      {layers.map((L, i) => {
        const on = step > i;
        return (
          <g key={L.label}>
            <rect x={L.x - 118} y="70" width="236" height="80" rx="16" fill={on ? '#eef3fb' : '#f6f4ef'} stroke={on ? '#2563eb' : '#e0d8c6'} strokeWidth="2.5" />
            {on && <circle cx={L.x - 100} cy="110" r="15" fill="#2563eb" />}
            {on && <path d={`M ${L.x - 106} 110 l 6 6 l 10 -12`} fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
            <text x={L.x} y={108} textAnchor="middle" fontSize="20" fontWeight="700" fill={on ? '#1d4ed8' : '#8a93a1'}>{L.label}</text>
            <text x={L.x} y={130} textAnchor="middle" fontSize="16" fill={on ? '#6b7a8c' : '#b9b2a2'}>送到哪算成功</text>
          </g>
        );
      })}
      {step === 0 && <Person x={52} y={160} />}
      {step === 1 && <Person x={180} y={160} />}
      {step === 2 && <Person x={360} y={160} />}
      {step === 3 && <Person x={540} y={160} />}
      {step === 4 && <Person x={650} y={160} done />}
      {step === 4 && <Door x={668} label="到货" y={108} h={62} />}
      {step === 4 && <Chip x={360} y={52} tone="g">三层打通：数据→引擎→任务 一套标准</Chip>}
    </Frame>
  );
}

/* ---------- 4 · Habitat-Sim：单 pass 多输出（一次渲染多传感器） ---------- */

function Scene4() {
  const [frame, setFrame] = useState(0);
  const sensors = [
    { label: 'RGB', x: 120, y: 46 },
    { label: 'Depth', x: 360, y: 24 },
    { label: 'Semantic', x: 600, y: 46 },
  ];
  return (
    <Frame bar={<>
      <button className="ana-play" onClick={() => { setFrame((f) => f + 1); }}>▶ 渲染一帧（单 pass）</button>
      <span className="ana-hint">一次 uber-shader 同时出全部传感器画面</span>
    </>}>
      <circle cx="360" cy="130" r="26" fill="#2563eb" />
      <text x="360" y="136" textAnchor="middle" fontSize="17" fill="#fff" fontWeight="700">相机</text>
      {sensors.map((s) => (
        <g key={s.label}>
          <rect x={s.x - 66} y={s.y} width="132" height="66" rx="12" fill="#f6f4ef" stroke={frame > 0 ? '#16a34a' : '#e0d8c6'} strokeWidth="2.5" />
          <text x={s.x} y={s.y + 30} textAnchor="middle" fontSize="19" fontWeight="700" fill={frame > 0 ? '#128a4a' : '#8a93a1'}>{s.label}</text>
          <text x={s.x} y={s.y + 52} textAnchor="middle" fontSize="16" fill={frame > 0 ? '#128a4a' : '#b9b2a2'}>{frame > 0 ? '✓ 已渲染' : '待渲染'}</text>
          <line x1="360" y1="110" x2={s.x} y2={s.y + 66} stroke={frame > 0 ? '#16a34a' : '#d8d2c4'} strokeWidth={frame > 0 ? 3 : 2} strokeDasharray={frame > 0 ? '0' : '6 5'} />
        </g>
      ))}
      <rect x="300" y="182" width="120" height="26" rx="13" fill={frame > 0 ? '#e9f7ef' : '#f6f4ef'} stroke={frame > 0 ? '#16a34a' : '#e0d8c6'} strokeWidth="2" />
      <text x="360" y="200" textAnchor="middle" fontSize="18" fill={frame > 0 ? '#128a4a' : '#8a7d66'} fontWeight="700">
        {frame === 0 ? 'fps：—' : frame === 1 ? 'fps：4,093' : 'fps：10,592（5 进程）'}
      </text>
    </Frame>
  );
}

/* ---------- 5 · 组装 Episode（填单：场景→起点→目标→最短路径） ---------- */

function Scene5() {
  const [s, setS] = useState(0);
  const next = () => setS((v) => (v >= 4 ? 0 : v + 1));
  const steps = ['① 选场景', '② 定起点', '③ 定目标', '④ 生成最近路线'];
  return (
    <Frame bar={<>
      <button className="ana-play" onClick={next}>{s >= 4 ? '↺ 重填' : '下一步：' + steps[s]}</button>
      <span className="ana-hint">一张送货单 = 一个 Episode</span>
    </>}>
      <rect x="50" y="40" width="420" height="128" rx="12" fill="#f6f4ef" stroke="#e0d8c6" strokeWidth="2.5" />
      <text x="66" y="64" fontSize="18" fill="#8a93a1">场景 scene（MP3D / Gibson）</text>
      {s >= 1 && <circle cx="108" cy="140" r="16" fill="#2563eb" />}
      {s >= 1 && <text x="108" y="145" textAnchor="middle" fontSize="16" fill="#fff" fontWeight="700">起</text>}
      {s >= 2 && <Door x={420} label="目标" y={100} h={62} />}
      {s >= 3 && <path d="M 108 140 C 200 140 300 122 388 122" fill="none" stroke="#16a34a" strokeWidth="3.5" strokeDasharray="8 5" />}
      {s >= 4 && <Person x={420} y={120} done />}
      {s < 1 && <text x={260} y={120} textAnchor="middle" fontSize="19" fill="#a29b8c">填好起点、目标、最近路线，就是一个可执行的导航回合</text>}
      {s === 4 && <Chip x={260} y={196} tone="g">Episode 组装完成：场景 + 起点 + 目标 + 路径</Chip>}
    </Frame>
  );
}

/* ---------- 6 · PointGoal：遥控送货员（动作 + 奖励） ---------- */

function Scene6() {
  const [pos, setPos] = useState({ x: 110, y: 138 });
  const goal = { x: 540, y: 116 };
  const [done, setDone] = useState(false);
  const dist = Math.hypot(pos.x - goal.x, pos.y - goal.y);
  const move = (dx: number, dy: number) => {
    if (done) return;
    const nx = Math.max(76, Math.min(600, pos.x + dx));
    const ny = Math.max(84, Math.min(160, pos.y + dy));
    setPos({ x: nx, y: ny });
    if (Math.hypot(nx - goal.x, ny - goal.y) < 34) setDone(true);
  };
  const reset = () => { setPos({ x: 110, y: 138 }); setDone(false); };
  return (
    <Frame bar={<>
      <span className="ana-kbd"><button onClick={() => move(-20, 0)}>◀ 左</button><button onClick={() => move(0, -20)}>▲ 前</button><button onClick={() => move(20, 0)}>右 ▶</button></span>
      <button className="ana-play alt" onClick={reset}>↺ 重置</button>
      <span className="ana-hint">{done ? '已送达！' : '用按钮遥控送货员摸到目标门'}</span>
    </>}>
      <rect x="50" y="40" width="600" height="128" rx="12" fill="#f6f4ef" stroke="#e0d8c6" strokeWidth="2.5" />
      <rect x="50" y="40" width="16" height="128" fill="#eae4d6" />
      <rect x="634" y="40" width="16" height="128" fill="#eae4d6" />
      <text x="240" y="64" fontSize="18" fill="#8a93a1">房间（有墙，会滑）</text>
      <Door x={goal.x} label="目标" y={86} h={82} />
      {!done && <Person x={pos.x} y={pos.y} />}
      {done && <Person x={goal.x} y={goal.y - 8} done />}
      {done && <Chip x={360} y={196} tone="g">送到（0.2m 内）→ 奖励 s=10 ✓</Chip>}
      {!done && <text x={360} y={196} textAnchor="middle" fontSize="18" fill="#a29b8c">离目标 {Math.round(dist)}px · 动作：转向 / 前进</text>}
    </Frame>
  );
}

/* ---------- 7 · 评估：直路 vs 绕路 算 SPL ---------- */

function Scene7() {
  const [route, setRoute] = useState<'straight' | 'detour' | null>(null);
  const [show, setShow] = useState(false);
  const startX = 80, endX = 620;
  const play = (r: 'straight' | 'detour') => { setRoute(r); setShow(false); setTimeout(() => setShow(true), 700); };
  return (
    <Frame bar={<>
      <button className="ana-play" onClick={() => play('straight')}>直路（抄近路）</button>
      <button className="ana-play alt" onClick={() => play('detour')}>绕路</button>
      {show && <span className="ana-hint">{route === 'straight' ? '直路 SPL = 1.0 ✓' : '绕路 SPL < 1，扣分'}</span>}
    </>}>
      <line x1="30" y1="178" x2="690" y2="178" stroke="#e3ddcf" strokeWidth="2" />
      <circle cx={startX} cy="160" r="16" fill="#fff" stroke="#d8d2c4" strokeWidth="2.5" strokeDasharray="5 4" />
      <text x={startX} y="196" textAnchor="middle" fontSize="17" fill="#a29b8c">起点</text>
      <Door x={endX} label="目标" y={100} h={62} />
      {route === 'straight' && show && <line x1={startX} y1="160" x2={endX} y2="160" stroke="#16a34a" strokeWidth="4" />}
      {route === 'detour' && show && <path d={`M ${startX} 160 L 160 86 L 430 86 L 520 130 L ${endX} 160`} fill="none" stroke="#ea580c" strokeWidth="4" strokeLinejoin="round" />}
      {route && !show && <Person x={startX + 24} y={160} />}
      {route && show && route === 'straight' && <Person x={endX} y={160} done />}
      {route && show && route === 'detour' && <Person x={endX} y={160} color="#ea580c" hat="#c2410c" />}
      {!route && <Person x={startX + 24} y={160} />}
      {show && (
        <Chip x={360} y={44} tone={route === 'straight' ? 'g' : 'b'} size={22}>
          SPL = S·l / max(p, l) = {route === 'straight' ? '1.0' : '0.50'}
        </Chip>
      )}
    </Frame>
  );
}

/* ---------- 8 · 学习 vs SLAM：训练曲线超越老师傅 ---------- */

function Scene8() {
  const [step, setStep] = useState(0);
  const maxStep = 6;
  const pts = ['0', '12M', '25M', '38M', '50M', '62M', '75M'];
  const ys = [0.10, 0.22, 0.36, 0.50, 0.60, 0.66, 0.70];
  const px = 90 + step * 88;
  const py = 172 - ys[step] * 140;
  const ahead = ys[step] > 0.59;
  const run = () => setStep((s) => (s >= maxStep ? 0 : s + 1));
  return (
    <Frame bar={<>
      <button className="ana-play" onClick={run}>{step >= maxStep ? '↺ 重训' : '▶ 训练（推进训练步数）'}</button>
      <span className="ana-hint">Depth 练得够久，就超过 SLAM 老师傅线</span>
    </>}>
      <line x1="80" y1="172" x2="690" y2="172" stroke="#d8d2c4" strokeWidth="2" />
      <line x1="80" y1="40" x2="80" y2="172" stroke="#d8d2c4" strokeWidth="2" />
      <line x1="80" y1={172 - 0.59 * 140} x2="690" y2={172 - 0.59 * 140} stroke="#f2b23b" strokeWidth="3" strokeDasharray="8 5" />
      <text x="690" y={172 - 0.59 * 140 - 8} textAnchor="end" fontSize="17" fill="#d98f1f">SLAM 0.59（老师傅，恒定）</text>
      <path d={pts.map((_, i) => `${i === 0 ? 'M' : 'L'} ${90 + i * 88} ${172 - ys[i] * 140}`).join(' ')} fill="none" stroke="#2563eb" strokeWidth="4" />
      {pts.slice(0, step + 1).map((_, i) => <circle key={i} cx={90 + i * 88} cy={172 - ys[i] * 140} r="5" fill="#2563eb" />)}
      {step > 0 && (
        <g>
          <circle cx={px} cy={py} r="7" fill={ahead ? '#16a34a' : '#2563eb'} />
          <text x={px} y={py - 12} textAnchor="middle" fontSize="18" fontWeight="700" fill={ahead ? '#128a4a' : '#1d4ed8'}>SPL {ys[step].toFixed(2)}</text>
        </g>
      )}
      {pts.map((p, i) => <text key={p} x={90 + i * 88} y={190} textAnchor="middle" fontSize="15" fill="#a29b8c">{p}</text>)}
      <text x="84" y="60" fontSize="17" fill="#a29b8c">SPL</text>
      {step >= maxStep && <Chip x={360} y={46} tone="g">学徒反超老师傅：RL 练到 75M 步 &gt; SLAM</Chip>}
    </Frame>
  );
}

/* ---------- 9 · 换栋楼送货：跨数据集泛化 ---------- */

function Scene9() {
  const [phase, setPhase] = useState<'idle' | 'moving' | 'done'>('idle');
  const raf = useRef<number | null>(null);
  const S = { depth: { x: 120, y: 130 }, rgbd: { x: 215, y: 130 } };
  const E = { depth: { x: 600, y: 142 }, rgbd: { x: 425, y: 142 } };
  const [pos, setPos] = useState(S);
  const startMove = () => {
    if (phase !== 'idle') return;
    setPhase('moving');
    const t0 = performance.now();
    const dur = 1500;
    const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / dur);
      const k = ease(t);
      setPos({
        depth: { x: S.depth.x + (E.depth.x - S.depth.x) * k, y: S.depth.y + (E.depth.y - S.depth.y) * k },
        rgbd: { x: S.rgbd.x + (E.rgbd.x - S.rgbd.x) * k, y: S.rgbd.y + (E.rgbd.y - S.rgbd.y) * k },
      });
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else setPhase('done');
    };
    raf.current = requestAnimationFrame(tick);
  };
  const reset = () => { if (raf.current) cancelAnimationFrame(raf.current); setPos(S); setPhase('idle'); };
  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);
  const g = pos.depth, r = pos.rgbd;
  return (
    <Frame bar={<>
      <button className="ana-play" onClick={phase === 'done' ? reset : startMove}>{phase === 'done' ? '↺ 回原楼' : '▶ 搬到新楼（MP3D）'}</button>
      <span className="ana-hint">换数据集测试：只看距离的 Depth 最稳</span>
    </>}>
      {/* 原楼 */}
      <rect x="36" y="44" width="256" height="126" rx="12" fill="#f6f4ef" stroke="#e0d8c6" strokeWidth="2.5" />
      <rect x="36" y="44" width="256" height="30" rx="12" fill="#eef0f3" />
      <text x="164" y="65" textAnchor="middle" fontSize="17" fill="#4a5b6b" fontWeight="700">原楼 Gibson（训练）</text>
      {/* 新楼 */}
      <rect x="336" y="44" width="348" height="126" rx="12" fill={phase === 'done' ? '#eef7f1' : '#f6f4ef'} stroke={phase === 'done' ? '#16a34a' : '#e0d8c6'} strokeWidth="2.5" />
      <rect x="336" y="44" width="348" height="30" rx="12" fill="#e3eef8" />
      <text x="510" y="65" textAnchor="middle" fontSize="17" fill="#1d4ed8" fontWeight="700">新楼 MP3D（测试）</text>
      <Door x={648} label="送达" y={102} h={62} />
      {/* Depth */}
      <Person x={g.x} y={g.y} color="#16a34a" done={phase === 'done'} />
      <text x={g.x} y={g.y - 32} textAnchor="middle" fontSize="17" fontWeight="700" fill={phase === 'done' ? '#128a4a' : '#4a5b6b'}>Depth</text>
      <text x={g.x} y={g.y - 12} textAnchor="middle" fontSize="14" fill={phase === 'done' ? '#128a4a' : '#a29b8c'}>{phase === 'done' ? 'SPL 0.68 ✓' : 'SPL 0.79'}</text>
      {/* RGBD */}
      <Person x={r.x} y={r.y} color={phase === 'done' ? '#b91c1c' : '#2563eb'} />
      <text x={r.x} y={r.y - 32} textAnchor="middle" fontSize="17" fontWeight="700" fill={phase === 'done' ? '#b91c1c' : '#4a5b6b'}>RGBD</text>
      <text x={r.x} y={r.y - 12} textAnchor="middle" fontSize="14" fill={phase === 'done' ? '#b91c1c' : '#a29b8c'}>{phase === 'done' ? '跌到 0.53 ✗' : 'SPL 0.70'}</text>
      {phase === 'done' && <text x={r.x} y={190} textAnchor="middle" fontSize="14" fill="#b91c1c">迷路了</text>}
      {phase === 'done' && <Chip x={360} y={30} tone="g">Depth 跨楼稳定（-0.11）；RGBD 掉 0.17</Chip>}
    </Frame>
  );
}

/* ---------- 10 · 结论：验收清单 ---------- */

function Scene10() {
  const items = ['可扩展（规模/并行）', '通用可复现', '跨数据集泛化', '超越 SLAM 基线'];
  const [n, setN] = useState(0);
  const go = () => setN((v) => (v >= items.length ? 0 : v + 1));
  return (
    <Frame bar={<>
      <button className="ana-play" onClick={go}>{n >= items.length ? '↺ 重新验收' : '▶ 验收下一项'}</button>
      <span className="ana-hint">结论：平台让“一键换场景”的实验成为可能</span>
    </>}>
      <rect x="40" y="40" width="400" height="140" rx="12" fill="#f6f4ef" stroke="#e0d8c6" strokeWidth="2.5" />
      {items.map((it, i) => (
        <g key={it}>
          <circle cx="72" cy={70 + i * 28} r="13" fill={i < n ? '#16a34a' : '#fff'} stroke={i < n ? '#128a4a' : '#d8d2c4'} strokeWidth="2.5" />
          {i < n && <path d={`M 66 ${70 + i * 28} l 4 4 l 9 -10`} fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
          <text x="96" y={76 + i * 28} fontSize="19" fill={i < n ? '#1d5c3a' : '#8a7d66'}>{it}</text>
        </g>
      ))}
      <Person x={560} y={160} color="#2563eb" done={n >= items.length} />
      <Door x={640} label="结论" y={100} h={70} />
      <text x={560} y={196} textAnchor="middle" fontSize="18" fill="#a29b8c">{n < items.length ? `已验收 ${n}/${items.length} 项` : '全部验收 ✓'}</text>
      {n >= items.length && <Chip x={360} y={30} tone="g">四结论全成立——这就是 Habitat 平台的意义</Chip>}
    </Frame>
  );
}

/* ---------- 按章节分发 ---------- */

const SCENES: Record<string, React.FC<WidgetProps>> = {
  'chap-1': Scene1,
  'chap-2': Scene2,
  'chap-3': Scene3,
  'chap-4': Scene4,
  'chap-5': Scene5,
  'chap-6': Scene6,
  'chap-7': Scene7,
  'chap-8': Scene8,
  'chap-9': Scene9,
  'chap-10': Scene10,
};

export const DeliveryAnalogy: React.FC<WidgetProps> = (props) => {
  const S = SCENES[props.chapterId] ?? Scene1;
  return <S {...props} />;
};

export default DeliveryAnalogy;
