import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';

const C = { bg: '#f5f8f0', blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47', purple: '#7c3aed', text: '#21324a', muted: '#68778f', line: '#d7deea', env: '#b8c9a7' };

function canvasBase(canvas: HTMLCanvasElement, w: number, h: number) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  return ctx;
}

function pill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string, color: string, active = false) {
  ctx.fillStyle = active ? color : '#fff';
  ctx.strokeStyle = color;
  ctx.lineWidth = active ? 3 : 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = active ? '#fff' : C.text;
  ctx.font = 'bold 18px Segoe UI';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h / 2 + 6);
}

export const C2Map: React.FC<WidgetProps> = () => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [area, setArea] = useState(1);
  const areas = [
    { label: '短视频理解', color: C.blue, note: '关注动作与场景，是传统视频理解的入口。' },
    { label: '视觉压缩', color: C.orange, note: '减少 token 可以省显存，但单模态规则不知道问题。' },
    { label: '跨模态记忆', color: C.green, note: 'AdaCM² 位于这里：用文本问题指导视觉记忆保留。' },
  ];
  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = canvasBase(cv, 1080, 250);
    const xs = [120, 430, 740];
    areas.forEach((item, i) => {
      const active = i === area;
      pill(ctx, xs[i], 76, 220, 70, item.label, item.color, active);
      if (i < 2) {
        ctx.strokeStyle = C.line;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(xs[i] + 220, 111); ctx.lineTo(xs[i + 1], 111); ctx.stroke();
      }
    });
    ctx.fillStyle = C.text; ctx.font = 'bold 21px Segoe UI'; ctx.textAlign = 'center';
    ctx.fillText('问题 Query', 540, 38);
    ctx.strokeStyle = C.purple; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(540, 46); ctx.lineTo(540, 74); ctx.stroke();
    ctx.fillStyle = C.muted; ctx.font = '18px Segoe UI';
    ctx.fillText('从“看见什么”走向“当前问题需要什么”', 540, 198);
    cv.classList.add('is-ready');
  }, [area]);
  return <div><canvas ref={canvas} width={1080} height={250} /><div className="chip-row">{areas.map((x, i) => <button key={x.label} className={`chip ${area === i ? 'active' : ''}`} onClick={() => setArea(i)}>{x.label}</button>)}</div><div className={`feedback ${area === 2 ? 'good' : ''}`}>{areas[area].note}</div></div>;
};

export const C4LayerDistance: React.FC<WidgetProps> = () => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [distance, setDistance] = useState(1);
  const [layer, setLayer] = useState(8);
  const layers = [2, 4, 6, 8, 10, 12];
  useEffect(() => {
    const cv = canvas.current; if (!cv) return;
    const ctx = canvasBase(cv, 1080, 270);
    ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(75, 220); ctx.lineTo(1010, 220); ctx.lineTo(1010, 35); ctx.stroke();
    layers.forEach((l, i) => { ctx.strokeStyle = l === layer ? C.green : `${C.blue}66`; ctx.lineWidth = l === layer ? 5 : 2; ctx.beginPath(); for (let d = 1; d <= 20; d++) { const x = 75 + d * 46; const sim = Math.max(0.48, 0.98 - d * (l >= 8 ? 0.008 : 0.025) - Math.abs(l - layer) * 0.005); const y = 220 - sim * 165; d === 1 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); });
    const selected = Math.max(0.48, 0.98 - distance * (layer >= 8 ? 0.008 : 0.025));
    ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(75 + distance * 46, 220 - selected * 165, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.text; ctx.font = 'bold 20px Segoe UI'; ctx.textAlign = 'left'; ctx.fillText(`Layer ${layer} · distance ${distance} · cosine ${selected.toFixed(2)}`, 75, 30); ctx.fillStyle = C.muted; ctx.font = '17px Segoe UI'; ctx.fillText('最近五帧的相似度观察超过 90%；深层曲线在更远距离下降更慢。', 75, 252); cv.classList.add('is-ready');
  }, [distance, layer]);
  return <div><canvas ref={canvas} width={1080} height={270} /><div className="chip-row">{layers.map(l => <button key={l} className={`chip ${layer === l ? 'active' : ''}`} onClick={() => setLayer(l)}>Layer {l}</button>)}</div><div className="ctrl"><label>Adjacent Frame Distance <span className="val">{distance}</span></label><input type="range" aria-label="相邻帧距离" min="1" max="20" value={distance} onChange={e => setDistance(+e.target.value)} /></div><div className={`feedback ${layer >= 8 && distance <= 5 ? 'good' : ''}`}>{layer >= 8 && distance <= 5 ? '深层且相邻：注意力形状高度相似，存在明显冗余。' : '比较不同层与帧距，观察为什么需要 layer-wise reduction。'}</div></div>;
};

export const C4Cache: React.FC<WidgetProps> = () => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(0);
  const stages = ['Frame t', '视觉 token', 'Recent Cache', 'Previous Cache', '下一帧'];
  const notes = ['新帧刚刚到达，还没有进入记忆。', '编码器把画面变成带位置的视觉 token。', '最近材料先完整放在桌面上。', '更早材料进入档案区，等待相关性筛选。', '下一帧到来，流程继续而不是重新读取整段视频。'];
  useEffect(() => {
    const cv = canvas.current; if (!cv) return;
    const ctx = canvasBase(cv, 1080, 245);
    stages.forEach((s, i) => {
      const x = 55 + i * 205; const active = i === step; const passed = i < step;
      pill(ctx, x, 78, 150, 62, s, active ? C.orange : passed ? C.blue : C.line, active || passed);
      if (i < stages.length - 1) { ctx.strokeStyle = passed ? C.green : C.line; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 150, 109); ctx.lineTo(x + 198, 109); ctx.stroke(); }
    });
    ctx.fillStyle = C.text; ctx.font = 'bold 19px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(`${step + 1} / ${stages.length}`, 540, 205);
    cv.classList.add('is-ready');
  }, [step]);
  return <div><canvas ref={canvas} width={1080} height={245} /><div className="ctrl-row"><button className="btn secondary" disabled={step === 0} onClick={() => setStep(Math.max(0, step - 1))}>上一步</button><button className="btn" disabled={step === stages.length - 1} onClick={() => setStep(Math.min(stages.length - 1, step + 1))}>下一帧 / 下一步</button><button className="btn secondary" onClick={() => setStep(0)}>重置</button></div><div className={`feedback ${step >= 3 ? 'good' : ''}`}>{notes[step]}</div></div>;
};

export const C5Arena: React.FC<WidgetProps> = () => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [query, setQuery] = useState(0);
  const queries = ['人在做什么？', '球衣是什么颜色？', '背后的号码是多少？'];
  const focus = [[0, 1, 4], [2, 3, 5], [7, 8, 9]];
  useEffect(() => {
    const cv = canvas.current; if (!cv) return;
    const ctx = canvasBase(cv, 1080, 270);
    const values = focus[query];
    for (let i = 0; i < 12; i++) {
      const hot = values.includes(i); const x = 66 + (i % 6) * 72; const y = 42 + Math.floor(i / 6) * 64;
      ctx.fillStyle = hot ? (query === 2 ? C.green : C.blue) : '#e5ebf0'; ctx.fillRect(x, y, 54, 44);
      ctx.fillStyle = C.text; ctx.font = '16px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(`T${i + 1}`, x + 27, y + 27);
    }
    ctx.fillStyle = C.text; ctx.font = 'bold 19px Segoe UI'; ctx.textAlign = 'left'; ctx.fillText('Token Ranking', 590, 34);
    const ranked = [...Array(6).keys()].sort((a, b) => Number(values.includes(b)) - Number(values.includes(a)));
    ranked.forEach((token, i) => { const score = values.includes(token) ? 0.18 - i * 0.018 : 0.04 - i * 0.004; ctx.fillStyle = values.includes(token) ? C.green : C.env; ctx.fillRect(700, 53 + i * 29, Math.max(26, score * 700), 17); ctx.fillStyle = C.text; ctx.font = '16px Segoe UI'; ctx.fillText(`#${token + 1}  ${score.toFixed(3)}`, 590, 67 + i * 29); });
    ctx.fillStyle = C.muted; ctx.font = '17px Segoe UI'; ctx.fillText('教学模拟：根据预设 Query 映射注意力，不现场运行 Q-Former。', 66, 240);
    cv.classList.add('is-ready');
  }, [query]);
  return <div><canvas ref={canvas} width={1080} height={270} /><div className="chip-row">{queries.map((q, i) => <button key={q} className={`chip ${query === i ? 'active' : ''}`} onClick={() => setQuery(i)}>{q}</button>)}</div><div className={`feedback ${query === 2 ? 'good' : ''}`}>{query === 2 ? '号码 Query 让背部数字 token 排到前面，形成旧缓存的保留信号。' : '切换 Query 后，重要区域与 Token 排名会一起变化。'}</div></div>;
};

export const C6Rescue: React.FC<WidgetProps> = () => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'forget' | 'balanced' | 'hoard'>('balanced');
  const [executed, setExecuted] = useState(false);
  const config = { forget: { a: 0.05, b: 0.05, label: '健忘模式' }, balanced: { a: 0.1, b: 0.1, label: '论文平衡模式' }, hoard: { a: 0.45, b: 0.65, label: '囤积模式' } }[mode];
  useEffect(() => {
    const cv = canvas.current; if (!cv) return;
    const ctx = canvasBase(cv, 1080, 250); const keep = Math.round(100 * (config.a + (1 - config.a) * config.b));
    for (let i = 0; i < 20; i++) { const recent = i >= 15; const relevant = i === 4; const alive = !executed || recent || (relevant && mode !== 'forget') || i % 6 === 0; const color = !executed ? C.line : recent ? C.blue : alive ? C.green : C.red; ctx.fillStyle = color; ctx.globalAlpha = alive ? 1 : 0.28; ctx.fillRect(55 + i * 48, 82, 32, 54); ctx.globalAlpha = 1; if (relevant) { ctx.fillStyle = C.text; ctx.font = 'bold 16px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('10', 71 + i * 48, 113); } }
    ctx.strokeStyle = C.orange; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(55 + 15 * 48 - 8, 55); ctx.lineTo(55 + 15 * 48 - 8, 163); ctx.stroke();
    ctx.fillStyle = C.text; ctx.font = 'bold 20px Segoe UI'; ctx.textAlign = 'left'; ctx.fillText(`α=${config.a.toFixed(2)}   β=${config.b.toFixed(2)}   保留约 ${keep}%`, 55, 38); ctx.fillStyle = C.muted; ctx.font = '16px Segoe UI'; ctx.fillText('左侧 Previous Cache ｜ 橙线右侧 Recent Cache', 55, 205); cv.classList.add('is-ready');
  }, [config, executed, mode]);
  const failed = executed && mode === 'forget';
  const modeLabels = { forget: '健忘模式', balanced: '论文平衡模式', hoard: '囤积模式' };
  return <div><canvas ref={canvas} width={1080} height={250} /><div className="chip-row">{(['forget', 'balanced', 'hoard'] as const).map(k => <button key={k} className={`chip ${mode === k ? 'active' : ''}`} onClick={() => { setMode(k); setExecuted(false); }}>{modeLabels[k]}</button>)}<button className="btn" onClick={() => setExecuted(true)}>执行压缩</button></div><div className={`feedback ${failed ? 'bad' : executed ? 'good' : ''}`}>{!executed ? '先猜一个设置，再执行压缩：目标是 Memory < 30%，同时救回号码 10。' : failed ? '关键历史线索已丢失：β 太低，号码 10 被淘汰。' : mode === 'hoard' ? '线索存活，但囤积了大量旧缓存，记忆压力较高。' : '关键线索存活：最近信息全留，旧缓存按相关性精选。'}</div></div>;
};

export const C7LayerBoard: React.FC<WidgetProps> = () => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [layer, setLayer] = useState(2);
  const layers = [2, 4, 6, 8, 10, 12];
  const keptByLayer: Record<number, number[]> = {
    2: [2, 10, 18, 27], 4: [3, 11, 19, 28], 6: [4, 12, 20, 29],
    8: [5, 13, 21, 30], 10: [6, 14, 22, 31], 12: [7, 15, 23, 32],
  };
  useEffect(() => {
    const cv = canvas.current; if (!cv) return; const ctx = canvasBase(cv, 1080, 240);
    const selected = new Set(keptByLayer[layer]);
    ctx.fillStyle = C.text; ctx.font = 'bold 23px Segoe UI'; ctx.textAlign = 'left'; ctx.fillText(`Layer ${layer}`, 70, 48);
    ctx.fillStyle = C.blue; ctx.fillText('α=0.10', 310, 48); ctx.fillStyle = C.orange; ctx.fillText('β=0.10', 520, 48);
    ctx.fillStyle = C.green; ctx.fillText('示意保留 8/40', 730, 48);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = i >= 36 ? C.blue : selected.has(i) ? C.green : C.line;
      ctx.fillRect(60 + (i % 20) * 50, 90 + Math.floor(i / 20) * 58, 34, 36);
    }
    ctx.fillStyle = C.muted; ctx.font = '17px Segoe UI';
    ctx.fillText('蓝色：最近 4 格全留；绿色：旧缓存中按当前层得分保留的 4 格。', 70, 225);
    cv.classList.add('is-ready');
  }, [layer]);
  return <div><canvas ref={canvas} width={1080} height={240} role="img" aria-label="教学示意：各层使用相同参数，不同旧 token 被保留" /><div className="chip-row">{layers.map(x => <button key={x} className={`chip ${layer === x ? 'active' : ''}`} onClick={() => setLayer(x)}>Layer {x}</button>)}</div><div className="feedback">Layer {layer}：α=β=0.10；最近 4 格全留，旧缓存保留第 {keptByLayer[layer].map(i => i + 1).join('、')} 格。位置与卡片数量为教学示意。</div></div>;
};

export const C8Stepper: React.FC<WidgetProps> = () => {
  const canvas = useRef<HTMLCanvasElement>(null); const [step, setStep] = useState(0);
  const stages = ['Encode', 'Attention', 'Score', 'Reduce', 'Query', 'Answer'];
  const notes = ['EVA-CLIP/ViT-G/14 产生当前帧视觉特征。', 'Q-Former 让文本与视觉 token 发生跨模态交互。', '按列累加得到旧视觉 token 的相关性分数。', 'Recent 全留，Previous 取 Top-β。', '有限查询表示汇总长视频信息。', 'Vicuna-7B 根据查询表示生成回答。'];
  useEffect(() => { const cv = canvas.current; if (!cv) return; const ctx = canvasBase(cv, 1080, 250); stages.forEach((s, i) => { const x = 40 + i * 170; pill(ctx, x, 78, 126, 62, s, i === step ? C.orange : i < step ? C.blue : C.line, i <= step); if (i < 5) { ctx.strokeStyle = i < step ? C.green : C.line; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 126, 109); ctx.lineTo(x + 164, 109); ctx.stroke(); } }); ctx.fillStyle = C.text; ctx.font = 'bold 19px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(`${step + 1} / 6`, 540, 205); cv.classList.add('is-ready'); }, [step]);
  return <div><canvas ref={canvas} width={1080} height={250} /><div className="ctrl-row"><button className="btn secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>上一步</button><button className="btn" disabled={step === 5} onClick={() => setStep(step + 1)}>{step === 5 ? '已完成' : '推进一段'}</button><button className="btn secondary" onClick={() => setStep(0)}>重置</button></div><div className={`feedback ${step === 5 ? 'good' : ''}`}>{notes[step]}</div></div>;
};

export const C9Evidence: React.FC<WidgetProps> = () => {
  const canvas = useRef<HTMLCanvasElement>(null); const [claim, setClaim] = useState(0);
  const claims = [
    { label: 'LVU 平均', line: 'Top-1：MA-LMM 63.0 → AdaCM² 67.5', detail: 'Table 1 · 七项任务平均', tag: '论文表格', color: C.green },
    { label: '显存', line: '最高约 65% GPU memory reduction', detail: 'Figure 6 · 限论文报告设置', tag: '论文实测', color: C.blue },
    { label: '长期上界', line: 'r<1 时 token cache 有有限上界', detail: 'Eq.8 · 不保证固定 GPU GB', tag: '数学推导', color: C.purple },
    { label: '随机淘汰', line: 'AdaCM² 优于同预算随机淘汰', detail: 'Figure 7 · 不推断逐点数值', tag: '论文图示', color: C.orange },
  ];
  useEffect(() => {
    const cv = canvas.current; if (!cv) return; const ctx = canvasBase(cv, 1080, 230); const item = claims[claim];
    ctx.fillStyle = item.color; ctx.fillRect(70, 70, 170, 82);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 24px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(item.label, 155, 120);
    ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(260, 111); ctx.lineTo(330, 111); ctx.stroke();
    ctx.fillStyle = C.text; ctx.font = 'bold 22px Segoe UI'; ctx.textAlign = 'left'; ctx.fillText(item.tag, 355, 93);
    ctx.font = '19px Segoe UI'; ctx.fillText(item.line, 355, 128);
    ctx.fillStyle = C.muted; ctx.font = '17px Segoe UI'; ctx.fillText(item.detail, 355, 162);
    ctx.fillText('只按对应的证据类型解读，不把图示当作新增实验。', 355, 195);
    cv.classList.add('is-ready');
  }, [claim]);
  return <div><canvas ref={canvas} width={1080} height={230} role="img" aria-label="论文主张与对应证据类型" /><div className="chip-row">{claims.map((x, i) => <button key={x.label} className={`chip ${claim === i ? 'active' : ''}`} onClick={() => setClaim(i)}>{x.label}</button>)}</div><div className="feedback good">{claims[claim].tag}：{claims[claim].line}。{claims[claim].detail}。</div></div>;
};

export const C10Timeline: React.FC<WidgetProps> = () => {
  const canvas = useRef<HTMLCanvasElement>(null); const [time, setTime] = useState(0); const [revealed, setRevealed] = useState(false);
  const marks = ['00:00:34', '00:27:11', '00:50:53', '01:40:08', '02:02:02', '02:10:13'];
  useEffect(() => { const cv = canvas.current; if (!cv) return; const ctx = canvasBase(cv, 1080, 250); ctx.strokeStyle = C.line; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(75, 116); ctx.lineTo(1005, 116); ctx.stroke(); ctx.strokeStyle = C.blue; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(75, 116); ctx.lineTo(75 + time * 186, 116); ctx.stroke(); marks.forEach((m, i) => { const x = 75 + i * 186; ctx.fillStyle = i <= time ? (i === 5 ? C.green : C.blue) : C.line; ctx.beginPath(); ctx.arc(x, 116, 15, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = C.text; ctx.font = '15px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(m, x, 72); }); ctx.fillStyle = revealed ? C.green : C.env; ctx.beginPath(); ctx.roundRect(420, 165, 240, 50, 10); ctx.fill(); ctx.fillStyle = revealed ? '#fff' : C.text; ctx.font = 'bold 23px Segoe UI'; ctx.fillText(revealed ? '号码：10' : '打开保留线索', 540, 197); cv.classList.add('is-ready'); }, [time, revealed]);
  return <div><canvas ref={canvas} width={1080} height={250} /><div className="ctrl"><label>案例时间轴 <span className="val">{marks[time]}</span></label><input type="range" min="0" max="5" value={time} onChange={e => { setTime(+e.target.value); setRevealed(false); }} /></div><button className="btn" onClick={() => setRevealed(true)}>打开 Memory Vault</button><div className={`feedback ${revealed && time === 5 ? 'good' : revealed ? 'bad' : ''}`}>{!revealed ? '拖到 02:10:13，再打开保留线索。' : time === 5 ? '✅ Ego4D 定性案例：白色球衣背后的号码是 10。' : '还没有到论文案例的关键时间点；继续沿时间轴寻找。'}</div></div>;
};
