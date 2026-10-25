import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';

const C = { bg: '#f5f8f0', blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47', purple: '#7c3aed', text: '#21324a', muted: '#68778f', line: '#d7deea', env: '#b8c9a7' };

function base(canvas: HTMLCanvasElement, w: number, h: number) {
  const dpr = window.devicePixelRatio || 1; canvas.width = w * dpr; canvas.height = h * dpr; canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Canvas context unavailable'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h); return ctx;
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size = 18, color = C.text, weight = 'normal') { ctx.fillStyle = color; ctx.font = `${weight} ${size}px Segoe UI`; ctx.textAlign = 'left'; ctx.fillText(text, x, y); }

export const C1PressureV3: React.FC<WidgetProps> = () => {
  const canvas = useRef<HTMLCanvasElement>(null); const [frame, setFrame] = useState(0); const [playing, setPlaying] = useState(false); const [method, setMethod] = useState<'baseline' | 'adacm'>('baseline'); const [inspect, setInspect] = useState(false);
  useEffect(() => { if (!playing) return; const id = window.setInterval(() => setFrame(f => f >= 100 ? 0 : f + 1), 80); return () => window.clearInterval(id); }, [playing]);
  useEffect(() => { if (playing && method === 'baseline' && frame >= 77) setPlaying(false); }, [frame, method, playing]);
  useEffect(() => { const cv = canvas.current; if (!cv) return; const ctx = base(cv, 1080, 300); const tokens = method === 'baseline' ? Math.round(256 + frame * 18.2) : Math.round(256 + 420 * (1 - Math.exp(-frame / 14))); const memory = method === 'baseline' ? Math.min(1.22, 0.08 + frame * 0.012) : Math.min(0.42, 0.08 + frame * 0.0028); const oom = memory >= 1;
    label(ctx, `Frame ${String(frame).padStart(3, '0')} / 100`, 55, 30, 20, C.text, 'bold'); label(ctx, playing ? '● PLAYING' : 'Ⅱ PAUSED', 300, 30, 18, playing ? C.green : C.orange, 'bold'); label(ctx, method === 'baseline' ? '视觉单模态压缩' : 'AdaCM² · Query-guided', 720, 30, 18, method === 'baseline' ? C.red : C.green, 'bold');
    ctx.strokeStyle = C.line; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(70, 88); ctx.lineTo(1010, 88); ctx.stroke(); ctx.fillStyle = method === 'baseline' ? C.red : C.green; ctx.beginPath(); ctx.arc(70 + frame * 9.4, 88, 10, 0, Math.PI * 2); ctx.fill();
    // Keep the token grid in its own left column; the memory meter starts at x=620.
    // The previous 74px spacing let the second row reach into that meter on narrow screens.
    for (let i = 0; i < 16; i++) { const x = 70 + (i % 8) * 62; const y = 125 + Math.floor(i / 8) * 48; const recent = i >= 12; const important = i === 5 || i === 6; const keep = method === 'adacm' ? recent || important : recent || i % 3 === 0; ctx.fillStyle = keep ? (important ? C.green : C.blue) : C.line; ctx.fillRect(x, y, 42, 26); if (important) { label(ctx, '10', x + 12, y + 19, 13, '#fff', 'bold'); } }
    label(ctx, 'Visual tokens in current cache', 70, 245, 17, C.muted); label(ctx, `${tokens.toLocaleString()} tokens`, 350, 245, 20, C.text, 'bold'); ctx.fillStyle = C.line; ctx.fillRect(620, 190, 300, 35); ctx.fillStyle = oom ? C.red : method === 'adacm' ? C.green : C.blue; ctx.fillRect(620, 190, Math.min(300, memory * 300), 35); label(ctx, `${Math.round(memory * 100)}% GPU budget`, 620, 178, 18, oom ? C.red : C.text, 'bold'); if (oom) { ctx.fillStyle = C.red; ctx.font = 'bold 29px Segoe UI'; ctx.fillText('MEMORY LIMIT · OOM', 620, 275); } else if (inspect) { label(ctx, 'Cache inspector: recent 4 frames protected · historical token 10 is ' + (method === 'adacm' ? 'conserved' : 'at risk'), 70, 278, 17, method === 'adacm' ? C.green : C.red, 'bold'); }
    cv.classList.add('is-ready');
  }, [frame, playing, method, inspect]);
  const oom = method === 'baseline' && frame >= 77;
  return <div><canvas ref={canvas} width={1080} height={300} role="img" aria-label="教学模拟：视频进度、缓存 token 数量与显存压力" /><div className="ctrl-row"><button className="btn" disabled={oom} onClick={() => setPlaying(!playing)}>{oom ? '已到显存上限' : playing ? '暂停播放' : '播放视频流'}</button><button className="btn secondary" disabled={oom} onClick={() => setFrame(f => Math.min(100, f + 5))}>推进 5 帧</button><button className="btn secondary" onClick={() => { setFrame(0); setPlaying(false); }}>回到开头</button><button className="btn secondary" onClick={() => setInspect(!inspect)}>检查当前 Cache</button></div><div className="chip-row"><button className={`chip ${method === 'baseline' ? 'active' : ''}`} onClick={() => { setMethod('baseline'); setPlaying(false); }}>视觉单模态</button><button className={`chip ${method === 'adacm' ? 'active' : ''}`} onClick={() => { setMethod('adacm'); setPlaying(false); }}>AdaCM²</button></div><div className="ctrl"><label>教学进度 <span className="val">Frame {frame} / 100</span></label><input type="range" min="0" max="100" value={frame} aria-label="教学模拟的视频帧进度" onChange={e => { setFrame(+e.target.value); setPlaying(false); }} /></div><div className={`feedback ${oom ? 'bad' : method === 'adacm' && frame > 70 ? 'good' : ''}`}>{oom ? '基线在压力舱中触发 OOM，自动播放已停止；可切换到 AdaCM² 继续比较。' : method === 'adacm' && frame > 70 ? 'AdaCM² 继续运行：最近材料受保护，历史线索按 query 选择性留下。' : '拖动或播放教学时间轴，暂停后检查当前 Cache 的 token 命运。'}</div></div>;
};

export const C3Microscope: React.FC<WidgetProps> = () => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [query, setQuery] = useState(2);
  const [topK, setTopK] = useState(12);
  const [pinned, setPinned] = useState(18);
  const queries = ['人在做什么？', '球衣是什么颜色？', '背后的号码是多少？'];
  const hot = query === 0 ? [26, 27, 34, 35] : query === 1 ? [20, 21, 28, 29] : [18, 19, 26, 27];
  const scores = Array.from({ length: 64 }, (_, i) => hot.includes(i) ? 0.82 + ((i + query) % 4) * 0.025 : 0.02 + ((i * 17 + query * 11) % 20) / 1000);
  const ranking = scores.map((score, i) => ({ score, i })).sort((a, b) => b.score - a.score || a.i - b.i);
  const kept = new Set(ranking.slice(0, topK).map(({ i }) => i));
  const pinRank = ranking.findIndex(({ i }) => i === pinned) + 1;
  const pinKept = kept.has(pinned);
  const mass = Math.round(100 * ranking.slice(0, topK).reduce((sum, item) => sum + item.score, 0) / scores.reduce((sum, score) => sum + score, 0));
  useEffect(() => {
    const cv = canvas.current; if (!cv) return;
    const ctx = base(cv, 1080, 330);
    label(ctx, `Pinned Token #${pinned}`, 60, 28, 19, C.orange, 'bold');
    label(ctx, `保留 Top-${topK} · 累计 Attention ${mass}%`, 710, 28, 18, C.text, 'bold');
    for (let i = 0; i < 64; i++) {
      const x = 55 + (i % 8) * 45, y = 55 + Math.floor(i / 8) * 20;
      ctx.fillStyle = kept.has(i) ? (hot.includes(i) ? C.green : C.blue) : '#dfe6e8';
      ctx.fillRect(x, y, 36, 14);
      if (i === pinned) { ctx.strokeStyle = C.orange; ctx.lineWidth = 3; ctx.strokeRect(x - 3, y - 3, 42, 20); }
    }
    label(ctx, 'Visual token map', 55, 235, 17, C.muted);
    label(ctx, 'Attention heatmap', 470, 70, 17, C.muted);
    for (let i = 0; i < 64; i++) {
      ctx.fillStyle = `rgba(39,68,110,${Math.min(0.95, 0.12 + scores[i])})`;
      ctx.fillRect(475 + (i % 8) * 28, 85 + Math.floor(i / 8) * 19, 23, 15);
    }
    label(ctx, 'Score ranking', 790, 70, 17, C.muted);
    ranking.slice(0, 18).forEach(({ score }, i) => {
      const h = Math.max(7, score * 110);
      ctx.fillStyle = i < topK ? C.green : C.env;
      ctx.fillRect(795 + i * 13, 220 - h, 9, h);
    });
    label(ctx, `#${pinned} · rank ${pinRank}/64 · score ${scores[pinned].toFixed(2)}`, 790, 255, 15, C.text);
    label(ctx, pinKept ? '保留在 Top-K 内' : '当前未进入 Top-K', 790, 282, 17, pinKept ? C.green : C.red, 'bold');
    cv.classList.add('is-ready');
  }, [query, topK, pinned]);
  return <div>
    <canvas ref={canvas} width={1080} height={330} role="img" aria-label="教学模拟：视觉 token、注意力热图与 Top-K 排名" />
    <div className="chip-row">{queries.map((q, i) => <button key={q} className={`chip ${query === i ? 'active' : ''}`} onClick={() => setQuery(i)}>{q}</button>)}<button className="chip" onClick={() => setPinned(pinned === 18 ? 31 : 18)}>Pin Token #{pinned === 18 ? 31 : 18}</button></div>
    <div className="ctrl"><label>保留边界 Top-K <span className="val">{topK} / 64</span></label><input type="range" min="4" max="32" value={topK} aria-label="保留视觉 token 数量 Top-K" onChange={e => setTopK(+e.target.value)} /></div>
    <div className={`feedback ${pinKept ? 'good' : 'bad'}`}>教学模拟：Token #{pinned} 在当前问题下排第 {pinRank}，{pinKept ? '进入' : '未进入'} Top-{topK} 保留区；累计注意力为 {mass}%。</div>
  </div>;
};

export const C6Surgery: React.FC<WidgetProps> = () => {
  const canvas = useRef<HTMLCanvasElement>(null); const [token, setToken] = useState<'number' | 'action'>('number'); const [counter, setCounter] = useState(false); const [step, setStep] = useState(0);
  const isSafe = token === 'number' && !counter; const title = token === 'number' ? '号码 10 的视觉线索' : '动作姿态的视觉线索'; const score = isSafe ? '0.84' : counter ? '0.12' : '0.29';
  useEffect(() => { const cv = canvas.current; if (!cv) return; const ctx = base(cv, 1080, 300); const stages = ['示意帧中的线索', 'Recent protected', 'Previous ranking', isSafe ? '✓ Conserved' : '✕ Evicted']; stages.forEach((s, i) => { const x = 55 + i * 250; ctx.fillStyle = i === step ? C.orange : i < step ? (isSafe ? C.green : C.red) : '#fff'; ctx.strokeStyle = i === step ? C.orange : i < step ? (isSafe ? C.green : C.red) : C.line; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x, 90, 190, 68, 10); ctx.fill(); ctx.stroke(); ctx.fillStyle = i <= step ? '#fff' : C.text; ctx.font = 'bold 17px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(s, x + 95, 130); if (i < 3) { ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(x + 190, 124); ctx.lineTo(x + 240, 124); ctx.stroke(); } }); label(ctx, title, 55, 40, 22, C.text, 'bold'); label(ctx, `教学示意分数 ${score} · ${isSafe ? 'Top 7%' : 'rank 73%'}`, 55, 235, 19, isSafe ? C.green : C.red, 'bold'); label(ctx, counter ? '反事实问题：What is he playing?' : '当前问题：What is the number on the jersey?', 55, 270, 17, C.muted); cv.classList.add('is-ready'); }, [token, counter, step, isSafe, title, score]);
  return <div><canvas ref={canvas} width={1080} height={300} role="img" aria-label="教学示意：视觉线索从最近缓存到旧缓存的保留过程" /><div className="chip-row"><button className={`chip ${token === 'number' ? 'active' : ''}`} onClick={() => { setToken('number'); setCounter(false); setStep(0); }}>号码线索</button><button className={`chip ${token === 'action' ? 'active' : ''}`} onClick={() => { setToken('action'); setCounter(false); setStep(0); }}>动作线索</button><button className={`chip ${counter ? 'active' : ''}`} onClick={() => { setCounter(!counter); setStep(0); }}>反事实重跑 Query</button></div><div className="ctrl-row"><button className="btn" disabled={step === 3} onClick={() => setStep(step + 1)}>推进生命史</button><button className="btn secondary" onClick={() => setStep(0)}>回放</button></div><div className={`feedback ${isSafe && step === 3 ? 'good' : counter || token === 'action' ? 'bad' : ''}`}>{step < 3 ? '教学示意：点击“推进生命史”，跟踪线索从当前帧到最终缓存的命运。' : isSafe ? '✓ Conserved：当前问题让号码线索穿过 Recent → Previous → Final Cache。' : 'EVICTED：问题变化后，同一线索可能不再进入最终缓存。'}</div></div>;
};

export const C8Trace: React.FC<WidgetProps> = () => {
  const canvas = useRef<HTMLCanvasElement>(null); const [reverse, setReverse] = useState(true); const [stage, setStage] = useState(0);
  const backward = ['答案 10', 'Vicuna 输出', '可学习 query', '跨模态注意力', '保留的视觉线索', '视频中的球衣', '球衣背部局部'];
  const stages = reverse ? backward : [...backward].reverse();
  useEffect(() => { const cv = canvas.current; if (!cv) return; const ctx = base(cv, 1080, 300); stages.forEach((s, i) => { const x = reverse ? 950 - i * 145 : 50 + i * 145; const active = i <= stage; ctx.fillStyle = active ? (i === 0 ? C.green : C.blue) : '#fff'; ctx.strokeStyle = active ? (i === 0 ? C.green : C.blue) : C.line; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x, 95, 118, 58, 9); ctx.fill(); ctx.stroke(); ctx.fillStyle = active ? '#fff' : C.text; ctx.font = 'bold 15px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(s, x + 59, 128); if (i < stages.length - 1) { ctx.strokeStyle = active ? C.green : C.line; ctx.beginPath(); ctx.moveTo(reverse ? x : x + 118, 124); ctx.lineTo(reverse ? x - 27 : x + 145, 124); ctx.stroke(); } }); label(ctx, reverse ? 'Answer → Evidence · 反向溯源' : 'Evidence → Answer · 正向推理', 55, 42, 22, C.text, 'bold'); label(ctx, stage === 6 ? '教学链路完成：球衣局部支持论文案例答案 10。' : `已追踪 ${stage + 1} / 7 个节点`, 55, 235, 19, stage === 6 ? C.green : C.orange, 'bold'); cv.classList.add('is-ready'); }, [reverse, stage]);
  return <div><canvas ref={canvas} width={1080} height={300} role="img" aria-label="教学示意：论文架构中的答案与视觉证据路径" /><div className="chip-row"><button className={`chip ${reverse ? 'active' : ''}`} onClick={() => { setReverse(true); setStage(0); }}>反向溯源 Answer → Token</button><button className={`chip ${!reverse ? 'active' : ''}`} onClick={() => { setReverse(false); setStage(0); }}>正向推理 Frame → Answer</button></div><div className="ctrl-row"><button className="btn" disabled={stage === 6} onClick={() => setStage(stage + 1)}>追踪下一节点</button><button className="btn secondary" onClick={() => setStage(0)}>从头追踪</button></div><div className={`feedback ${stage === 6 ? 'good' : ''}`}>{stage === 6 ? '✅ 教学示意链路已完成；论文未提供逐 token 的真实推理日志。' : '点击追踪下一节点，观察答案、query、cache 与视频线索的示意关系。'}</div></div>;
};

export const C10Mystery: React.FC<WidgetProps> = () => {
  const canvas = useRef<HTMLCanvasElement>(null); const [time, setTime] = useState(0); const [search, setSearch] = useState(false); const marks = ['00:00:34', '00:27:11', '00:50:53', '01:40:08', '02:02:02', '02:10:13'];
  const found = search && time === 5;
  useEffect(() => { const cv = canvas.current; if (!cv) return; const ctx = base(cv, 1080, 310); ctx.strokeStyle = C.line; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(80, 115); ctx.lineTo(1000, 115); ctx.stroke(); ctx.strokeStyle = C.blue; ctx.beginPath(); ctx.moveTo(80, 115); ctx.lineTo(80 + time * 184, 115); ctx.stroke(); marks.forEach((m, i) => { const x = 80 + i * 184; ctx.fillStyle = i <= time ? (i === 5 ? C.green : C.blue) : C.line; ctx.beginPath(); ctx.arc(x, 115, 15, 0, Math.PI * 2); ctx.fill(); label(ctx, m, x - 35, 75, 15, C.text); }); label(ctx, 'What is the number on the back of the man\'s white football jersey?', 80, 35, 20, C.text, 'bold'); ctx.fillStyle = found ? C.green : C.env; ctx.beginPath(); ctx.roundRect(370, 175, 340, 62, 12); ctx.fill(); label(ctx, found ? 'Memory Vault · retained clue: 10' : search ? '尚未找到终章线索' : '搜索历史 Memory Vault', 420, 214, 20, found ? '#fff' : C.text, 'bold'); if (found) { ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(860, 205, 42, 0, Math.PI * 2); ctx.fill(); label(ctx, '10', 845, 214, 29, '#fff', 'bold'); label(ctx, '教学示意：球衣局部 → 保留的视觉线索 → 答案', 80, 280, 18, C.green, 'bold'); } cv.classList.add('is-ready'); }, [time, search, found]);
  return <div><canvas ref={canvas} width={1080} height={310} role="img" aria-label="Ego4D 案例时间轴与教学示意 Memory Vault" /><div className="ctrl"><label>长程视频播放头 <span className="val">{marks[time]}</span></label><input type="range" min="0" max="5" value={time} aria-label="Ego4D 案例时间轴" onChange={e => { setTime(+e.target.value); setSearch(false); }} /></div><div className="ctrl-row"><button className="btn" onClick={() => setSearch(true)}>搜索 Memory Vault</button><button className="btn secondary" onClick={() => { setTime(5); setSearch(false); }}>跳到案例结尾</button></div><div className={`feedback ${found ? 'good' : search ? 'bad' : ''}`}>{!search ? '沿时间轴检查关键节点，最后打开 Memory Vault 找回被保留下来的线索。' : found ? '✅ 论文 Figure 2 的回答是 10；球衣局部到答案的追踪链为教学示意。' : '当前时间点尚未找到终章线索；请继续到 02:10:13。'}</div></div>;
};
