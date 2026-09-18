import React, { useEffect, useState } from 'react';

type ThumbProps = { chapterId: string };

const labels = {
  blue: '#27446e',
  green: '#4d7c5b',
  orange: '#c76b36',
  red: '#b94b4b',
  ink: '#21324a',
  soft: '#edf3f8',
  line: '#cbd6e2',
};

function ThumbFrame({ title, children }: { title: string; children: React.ReactNode }) {
  const [playing, setPlaying] = useState(true);
  return (
    <div className={`mechanism-thumb ${playing ? 'is-playing' : ''}`} onMouseLeave={() => setPlaying(true)}>
      <div className="mechanism-thumb-head"><span>{title}</span><button type="button" onClick={() => setPlaying((v) => !v)}>{playing ? '暂停' : '播放'}</button></div>
      <svg className="mechanism-thumb-svg" viewBox="0 0 560 150" role="img" aria-label={title}>{children}</svg>
    </div>
  );
}

function ResearchThumb() {
  return <ThumbFrame title="三节点决策闭环"><defs><marker id="thumb-arrow-loop" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill={labels.blue}/></marker></defs><path className="thumb-flow" d="M110 68 C155 18 215 18 250 56" fill="none" stroke={labels.blue} strokeWidth="3" markerEnd="url(#thumb-arrow-loop)"/><path className="thumb-flow delay-1" d="M330 62 C390 20 435 35 450 70" fill="none" stroke={labels.green} strokeWidth="3" markerEnd="url(#thumb-arrow-loop)"/><path className="thumb-flow delay-2" d="M426 108 C340 143 214 140 126 104" fill="none" stroke={labels.orange} strokeWidth="3" markerEnd="url(#thumb-arrow-loop)"/><circle cx="95" cy="82" r="28" fill={labels.soft} stroke={labels.blue} strokeWidth="3"/><circle cx="280" cy="58" r="28" fill="#eff7f0" stroke={labels.green} strokeWidth="3"/><circle cx="455" cy="91" r="28" fill="#fff2e9" stroke={labels.orange} strokeWidth="3"/><text x="95" y="86" textAnchor="middle">语言模型</text><text x="280" y="62" textAnchor="middle">世界模型</text><text x="455" y="95" textAnchor="middle">环境反馈</text><circle className="thumb-particle" cx="145" cy="43" r="4" fill={labels.orange}/></ThumbFrame>;
}

function PriorThumb() {
  const bars = [42, 82, 58, 28];
  return <ThumbFrame title="候选动作先验"><line x1="52" y1="122" x2="510" y2="122" stroke={labels.line}/>{bars.map((h, i) => <g key={i} className={`thumb-bar-group delay-${i}`}><rect x={78 + i * 105} y={122 - h} width="48" height={h} rx="4" fill={i === 1 ? labels.orange : labels.blue} opacity={i === 1 ? .95 : .65}/><text x={102 + i * 105} y="140" textAnchor="middle">{['左转', '前进', '右转', '停留'][i]}</text><text x={102 + i * 105} y={116 - h} textAnchor="middle" fill={labels.ink}>{[0.18, 0.35, 0.27, 0.20][i].toFixed(2)}</text></g>)}</ThumbFrame>;
}

function RootThumb() {
  return <ThumbFrame title="根节点注入"><defs><marker id="thumb-arrow-root" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill={labels.orange}/></marker></defs><path d="M280 42 V82 M280 82 L150 120 M280 82 L280 120 M280 82 L410 120" fill="none" stroke={labels.line} strokeWidth="4"/><circle cx="280" cy="35" r="21" fill={labels.green}/><text x="280" y="39" textAnchor="middle" fill="#fff">根</text>{[[150,'左 0.24'],[280,'前 0.48'],[410,'右 0.28']].map(([x,t], i) => <g key={i}><circle cx={Number(x)} cy="122" r="16" fill={i === 1 ? labels.orange : labels.blue}/><text x={Number(x)} y="126" textAnchor="middle" fill="#fff">a{i + 1}</text><rect x={Number(x) - 34} y="82" width="68" height="5" rx="2" fill={i === 1 ? labels.orange : labels.blue}/><text x={Number(x)} y="76" textAnchor="middle">{t}</text></g>)}<path className="thumb-signal" d="M95 35 H245" stroke={labels.orange} strokeWidth="5" markerEnd="url(#thumb-arrow-root)"/><text x="85" y="30" textAnchor="middle" fill={labels.orange}>πLLM</text></ThumbFrame>;
}

function AlphaThumb() {
  return <ThumbFrame title="α 权重融合"><defs><marker id="thumb-arrow-alpha" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill={labels.green}/></marker></defs><rect x="70" y="48" width="128" height="48" rx="10" fill={labels.soft} stroke={labels.blue} strokeWidth="2"/><text x="134" y="77" textAnchor="middle" fill={labels.blue}>π_WM</text><rect x="362" y="48" width="128" height="48" rx="10" fill="#fff2e9" stroke={labels.orange} strokeWidth="2"/><text x="426" y="77" textAnchor="middle" fill={labels.orange}>π_LLM</text><line x1="208" y1="72" x2="352" y2="72" stroke={labels.line} strokeWidth="8" strokeLinecap="round"/><circle className="thumb-particle" cx="280" cy="72" r="14" fill={labels.green}/><text x="280" y="77" textAnchor="middle" fill="#fff">α</text><path d="M280 96 V122 H426" fill="none" stroke={labels.green} strokeWidth="3" markerEnd="url(#thumb-arrow-alpha)"/><text x="275" y="138" textAnchor="middle" fill={labels.green}>只改变根节点混合比例</text></ThumbFrame>;
}

function RepresentationThumb() {
  return <ThumbFrame title="表示边界"><defs><marker id="thumb-arrow-repr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill={labels.blue}/></marker></defs><rect x="44" y="52" width="110" height="48" rx="9" fill={labels.soft} stroke={labels.blue} strokeWidth="2"/><text x="99" y="81" textAnchor="middle">H_t 历史</text><path d="M154 76 H224" stroke={labels.blue} strokeWidth="3" markerEnd="url(#thumb-arrow-repr)"/><rect x="235" y="24" width="116" height="42" rx="9" fill="#fff2e9" stroke={labels.orange} strokeWidth="2"/><text x="293" y="50" textAnchor="middle" fill={labels.orange}>C_t 文本</text><rect x="235" y="88" width="116" height="42" rx="9" fill="#eff7f0" stroke={labels.green} strokeWidth="2"/><text x="293" y="114" textAnchor="middle" fill={labels.green}>z_t latent</text><path d="M351 45 C400 45 420 60 448 72" stroke={labels.orange} strokeWidth="3" fill="none"/><path d="M351 109 C400 109 420 92 448 78" stroke={labels.green} strokeWidth="3" fill="none"/><circle cx="470" cy="76" r="27" fill="#fff" stroke={labels.line} strokeWidth="3"/><text x="470" y="80" textAnchor="middle">根</text><line x1="388" y1="22" x2="388" y2="130" stroke={labels.red} strokeWidth="2" strokeDasharray="6 6"/><text x="397" y="26" fill={labels.red}>边界</text></ThumbFrame>;
}

function MctsThumb() {
  return <ThumbFrame title="MCTS 四阶段"><path d="M280 28 L180 68 M280 28 L380 68 M180 68 L120 112 M180 68 L235 112 M380 68 L335 112 M380 68 L435 112" stroke={labels.line} strokeWidth="3" fill="none"/><circle className="mcts-select" cx="280" cy="28" r="13" fill={labels.blue}/><circle cx="180" cy="68" r="11" fill={labels.green}/><circle cx="380" cy="68" r="11" fill={labels.green}/>{[120,235,335,435].map((x) => <circle key={x} cx={x} cy="112" r="9" fill={labels.orange}/>) }<text x="28" y="25" fill={labels.blue}>① Selection</text><text x="28" y="52" fill={labels.green}>② Expansion</text><text x="28" y="79" fill={labels.orange}>③ Simulation</text><text x="28" y="106" fill={labels.red}>④ Backpropagation</text><path className="mcts-pulse" d="M280 28 L180 68 L120 112" stroke={labels.orange} strokeWidth="4" fill="none"/></ThumbFrame>;
}

function WorldThumb() {
  const cells = Array.from({ length: 24 }, (_, i) => i);
  return <ThumbFrame title="World Model 想象轨迹"><g transform="translate(28 18)">{cells.map((i) => <rect key={i} x={(i % 6) * 38} y={Math.floor(i / 6) * 22} width="37" height="21" fill={i % 5 === 0 ? '#e6eee4' : '#f9fbfc'} stroke={labels.line}/>) }<path className="thumb-route" d="M20 98 L58 76 L96 76 L134 54 L172 54 L210 32" fill="none" stroke={labels.orange} strokeWidth="4"/><circle cx="20" cy="98" r="7" fill={labels.blue}/><circle className="thumb-state" cx="210" cy="32" r="7" fill={labels.green}/></g><text x="300" y="48">当前状态 s<tspan baselineShift="sub">t</tspan></text><text x="300" y="78" fill={labels.orange}>动作 → 想象状态</text><text x="300" y="108" fill={labels.green}>r<tspan baselineShift="sub">t</tspan> + γv<tspan baselineShift="sub">t+1</tspan></text></ThumbFrame>;
}

function ValueThumb() {
  const colors = ['#e8f2e9', '#c8dfcc', '#8fbe98', '#5f956e', '#376d4a'];
  return <ThumbFrame title="Value Guidance"><g transform="translate(44 22)">{Array.from({ length: 30 }, (_, i) => <rect key={i} x={(i % 6) * 32} y={Math.floor(i / 6) * 21} width="31" height="20" fill={colors[(i * 3 + Math.floor(i / 6)) % colors.length]} stroke="#fff"/>) }<path className="value-route" d="M16 94 L48 73 L80 73 L112 52 L144 52 L176 31" fill="none" stroke="#fff" strokeWidth="6"/><path d="M16 94 L48 73 L80 73 L112 52 L144 52 L176 31" fill="none" stroke={labels.orange} strokeWidth="2"/></g><text x="270" y="48">低价值</text><rect x="270" y="58" width="160" height="13" fill="url(#value-gradient)"/><defs><linearGradient id="value-gradient"><stop stopColor="#e8f2e9"/><stop offset="1" stopColor="#376d4a"/></linearGradient></defs><text x="270" y="94">高价值路径 ↑</text></ThumbFrame>;
}

function LoopThumb() {
  return <ThumbFrame title="Alternating RLFT"><defs><marker id="thumb-arrow-loop-2" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill={labels.green}/></marker></defs><circle cx="280" cy="76" r="50" fill="none" stroke={labels.green} strokeWidth="5" strokeDasharray="90 18" className="thumb-loop"/><path d="M280 26 C210 22 175 55 190 92" fill="none" stroke={labels.blue} strokeWidth="4" markerEnd="url(#thumb-arrow-loop-2)"/><path d="M330 76 C350 120 300 142 250 124" fill="none" stroke={labels.orange} strokeWidth="4" markerEnd="url(#thumb-arrow-loop-2)"/><circle cx="280" cy="76" r="25" fill={labels.soft} stroke={labels.blue} strokeWidth="2"/><text x="280" y="80" textAnchor="middle">价值信号</text><text x="68" y="43" fill={labels.blue}>世界模型训练</text><text x="405" y="118" fill={labels.orange}>LLM 微调</text></ThumbFrame>;
}

function TrainThumb() {
  const items = ['数据', '先验', '世界模型', '价值', '策略'];
  return <ThumbFrame title="训练流程时间轴"><line x1="48" y1="73" x2="510" y2="73" stroke={labels.line} strokeWidth="6"/>{items.map((item, i) => <g key={item} className={`timeline-node delay-${i}`}><circle cx={70 + i * 105} cy="73" r="16" fill={i < 3 ? labels.blue : labels.green}/><text x={70 + i * 105} y="78" textAnchor="middle" fill="#fff">{i + 1}</text><text x={70 + i * 105} y="112" textAnchor="middle">{item}</text></g>)}<path className="timeline-progress" d="M48 73 H280" stroke={labels.orange} strokeWidth="6"/></ThumbFrame>;
}

function InferenceThumb() {
  const items = ['状态', '先验', 'MCTS', '价值', '动作'];
  return <ThumbFrame title="推理数据流"><defs><marker id="thumb-arrow-pipe" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill={labels.blue}/></marker></defs>{items.map((item, i) => <g key={item}><rect x={24 + i * 105} y="54" width="78" height="40" rx="8" fill={i === 4 ? '#eff7f0' : labels.soft} stroke={i === 4 ? labels.green : labels.blue}/><text x={63 + i * 105} y="79" textAnchor="middle">{item}</text>{i < 4 ? <path d={`M102 ${74} H${123 + i * 105}`} stroke={labels.blue} strokeWidth="3" markerEnd="url(#thumb-arrow-pipe)"/> : null}</g>)}<circle className="thumb-data-dot" cx="44" cy="74" r="5" fill={labels.orange}/></ThumbFrame>;
}

function ExperimentThumb() {
  return <ThumbFrame title="实验结果对比"><line x1="48" y1="120" x2="510" y2="120" stroke={labels.line}/><polyline className="thumb-chart-line" points="60,102 160,83 260,91 360,54 460,42" fill="none" stroke={labels.green} strokeWidth="4"/><polyline points="60,107 160,101 260,104 360,89 460,76" fill="none" stroke={labels.blue} strokeWidth="3"/><g>{[50,130,210,290].map((h, i) => <rect key={i} x={78 + i * 100} y={120 - h / 2} width="28" height={h / 2} fill={i === 3 ? labels.green : labels.blue} opacity=".75"/>)}</g><text x="410" y="25" fill={labels.green}>PriorZero</text><text x="410" y="45" fill={labels.blue}>Baseline</text></ThumbFrame>;
}

function TermsThumb() {
  const [flip, setFlip] = useState(false);
  return <ThumbFrame title="术语与总结"><g className={`term-card ${flip ? 'flipped' : ''}`} onClick={() => setFlip((v) => !v)}><rect x="46" y="28" width="130" height="88" rx="10" fill={flip ? '#eff7f0' : labels.soft} stroke={labels.blue} strokeWidth="2"/><text x="111" y="68" textAnchor="middle" fontSize="22" fill={labels.blue}>{flip ? '根节点先验' : 'P_root'}</text><text x="111" y="94" textAnchor="middle">点击翻转</text></g><path d="M205 72 H350 M305 48 L350 72 L305 96" stroke={labels.line} strokeWidth="3" fill="none"/><circle cx="420" cy="72" r="35" fill={labels.green}/><text x="420" y="68" textAnchor="middle" fill="#fff">Prior</text><text x="420" y="86" textAnchor="middle" fill="#fff">Zero</text></ThumbFrame>;
}

export function MechanismThumb({ chapterId }: ThumbProps) {
  const [tick, setTick] = useState(0);
  useEffect(() => { const timer = window.setInterval(() => setTick((v) => v + 1), 1200); return () => window.clearInterval(timer); }, []);
  void tick;
  const map: Record<string, React.FC> = {
    'chap-1': ResearchThumb,
    'chap-2': PriorThumb,
    'chap-3': RootThumb,
    'chap-4': AlphaThumb,
    'chap-5': RepresentationThumb,
    'chap-6': MctsThumb,
    'chap-7': WorldThumb,
    'chap-8': LoopThumb,
    'chap-9': ExperimentThumb,
    'chap-10': TermsThumb,
  };
  const Thumb = map[chapterId] || ResearchThumb;
  return <Thumb />;
}
