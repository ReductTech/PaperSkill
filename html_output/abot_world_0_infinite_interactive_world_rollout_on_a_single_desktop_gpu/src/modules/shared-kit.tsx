import React, { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, setupCanvas, observeCanvas } from '../lib/canvasKit';

export const COLORS = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', support: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#d97706',
  purple: '#7c3aed', text: '#21324a', muted: '#68778f', border: '#d7deea', white: '#ffffff',
};

type WorldKind = 'stress' | 'repair' | 'data' | 'action' | 'window' | 'compare' | 'steps' | 'drift' | 'architecture' | 'deployment' | 'benchmark';
type BasicProps = { chapterId: string; moduleId: string };

const W = 560;
const H = 240;

function clearSet(ctx: CanvasRenderingContext2D, w = W, h = H) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = COLORS.light;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(18, h - 28); ctx.lineTo(w - 18, h - 28); ctx.stroke();
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = COLORS.text, size = 13) {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", sans-serif`;
  ctx.fillText(text, x, y);
}

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, stroke = COLORS.border, line = 1) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = stroke; ctx.lineWidth = line; ctx.stroke();
}

function drawGimbal(ctx: CanvasRenderingContext2D, x: number, y: number, color = COLORS.blue) {
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = COLORS.support; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(-5, 28); ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.strokeRect(-14, -8, 28, 17);
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawRoute(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width = 4) {
  ctx.strokeStyle = COLORS.border; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = width;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}

function drawActor(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = COLORS.green; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 18, y); ctx.lineTo(x + 18, y); ctx.moveTo(x, y - 18); ctx.lineTo(x, y + 18); ctx.stroke();
}

function bar(ctx: CanvasRenderingContext2D, name: string, value: number, x: number, y: number, color: string, max = 1, suffix = '') {
  label(ctx, name, x, y - 5, COLORS.muted, 12);
  rounded(ctx, x, y, 150, 13, COLORS.white);
  ctx.fillStyle = color; ctx.fillRect(x + 2, y + 2, 146 * clamp(value / max, 0, 1), 9);
  label(ctx, `${value}${suffix}`, x + 158, y + 11, color, 12);
}

function qualitativeBar(ctx: CanvasRenderingContext2D, name: string, level: 0 | 1 | 2, x: number, y: number, color: string) {
  const words = ['低', '中', '高'];
  label(ctx, name, x, y - 5, COLORS.muted, 12);
  for (let i = 0; i < 3; i += 1) {
    rounded(ctx, x + i * 48, y, 38, 13, i <= level ? color : COLORS.white, i <= level ? color : COLORS.border);
  }
  label(ctx, words[level], x + 158, y + 11, color, 12);
}

const deploymentRows = [
  { id: 'base', name: 'Base', oom: true }, { id: 'sage', name: 'SageAttention2', oom: true },
  { id: 'lightvae', name: 'LightVAE', dit: 1191.081, vae: 78.276, fps: 9.117, vram: 20.491 },
  { id: 'fp8', name: 'FP8', dit: 845.180, vae: 75.980, fps: 12.405, vram: 15.925 },
  { id: 'fastrope', name: 'FP8+Fast-RoPE', dit: 786.871, vae: 71.730, fps: 13.269, vram: 19.281 },
  { id: 'mxfp6', name: 'MXFP6', dit: 718.281, vae: 85.994, fps: 14.098, vram: 18.287 },
  { id: 'mxfp4', name: 'MXFP4', dit: 638.843, vae: 72.957, fps: 15.831, vram: 17.148 },
] as const;

const metricNames = ['Strict Acc.', 'Partial Acc.', 'Trajectory', 'Aesthetic', 'Imaging', 'Mechanics', 'Memory'];
const benchmarkRows = [
  { name: 'Genie 3', values: [0.4700, 0.6608, 0.6719, 0.4711, 0.4757, 0.5454, 0.6073] },
  { name: 'HappyOyster', values: [0.5317, 0.7631, 0.7737, 0.5235, 0.4377, 0.5395, 0.6309] },
  { name: 'LingBot-World', values: [0.3235, 0.4198, 0.4094, 0.2898, 0.2875, 0.2777, 0.3006] },
  { name: 'HY-World 1.5', values: [0.1640, 0.2088, 0.2015, 0.1400, 0.1236, 0.1115, 0.1562] },
  { name: 'ABot-World-0', values: [0.5266, 0.7290, 0.6752, 0.5039, 0.4651, 0.5223, 0.5041] },
];

export const SharedKit: React.FC<BasicProps> = () => <span hidden aria-hidden="true" />;

export const WorldWidget: React.FC<BasicProps & { kind: WorldKind }> = ({ chapterId, moduleId, kind }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [value, setValue] = useState(kind === 'drift' ? 10 : kind === 'stress' ? 0 : 20);
  const [toggle, setToggle] = useState(false);
  const [source, setSource] = useState<'game'|'sim'|'internet'>('game');
  const [masks, setMasks] = useState([0, 0, 0, 0]);
  const [slot, setSlot] = useState(0);
  const [history, setHistory] = useState(4);
  const [chunk, setChunk] = useState(3);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0);
  const [node, setNode] = useState('action');
  const [config, setConfig] = useState('lightvae');
  const [metric, setMetric] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running || (kind !== 'compare' && kind !== 'benchmark')) return;
    setProgress(0);
    const timer = window.setInterval(() => setProgress(p => {
      if (p >= 1) { window.clearInterval(timer); setRunning(false); return 1; }
      return Math.min(1, p + 0.04);
    }), 50);
    return () => window.clearInterval(timer);
  }, [running, kind]);

  const feedback = useMemo(() => {
    if (kind === 'stress') return value === 2 ? ['高滚动压力下，误差回灌、响应与记忆问题会同时暴露；这里是概念示意，不是论文实验读数。', 'bad'] : value === 1 ? ['进入闭环后，模型开始面对训练时较少见的自生成上下文。', ''] : ['短片阶段看起来尚可，但还没有经历长时自反馈。', ''];
    if (kind === 'repair') return toggle ? ['完整闭环让动作、滚动分布与运行时预算共同约束下一段画面。', 'good'] : ['画面会生成，但动作反馈、长时稳定和单卡运行仍彼此脱节。', 'bad'];
    if (kind === 'data') return source === 'game' ? ['动作真值可靠，但风格范围可能偏窄。', ''] : source === 'sim' ? ['轨迹可设计、标签确定，但仍需主动覆盖困难状态。', 'good'] : ['视觉多样性高，动作来自位姿估计，必须保留噪声边界。', ''];
    if (kind === 'action') return toggle ? ['动作控制运动；参考角色记忆额外提供外观线索。', 'good'] : masks.some(Boolean) ? ['四帧动作拼成 32 维 token，并在 patchify 阶段相加注入。', ''] : ['尚无动作，模型只沿当前状态继续。', ''];
    if (kind === 'window') return history >= chunk ? ['当前块只依赖蓝色历史与本块动作，满足在线因果条件。', 'good'] : ['较短历史仍合法，但可用上下文更少；论文没有声称任意长度都同样稳定。', ''];
    if (kind === 'compare') return progress >= 1 ? ['双向教师适合作为高质量目标；因果学生的信息结构才与在线部署一致。', 'good'] : ['两侧从同一首帧、同一时刻开始。', ''];
    if (kind === 'steps') return [['先观察双向教师与在线需求的错配。', ''], ['先把双向能力迁移到因果信息结构。', ''], ['在同一因果条件下学习 ODE 干净终点，减少去噪步数。', ''], ['让监督覆盖误差已经累积的后段上下文。', 'good']][stage] as string[];
    if (kind === 'drift') return value < 30 ? ['差异在较早阶段并不突出。', ''] : toggle ? ['扩展教师覆盖更晚的自生成上下文，报告曲线显示错误积累更少。', 'good'] : ['匹配监督较短时，报告中的后半程质量与伪影指标逐渐拉开。', 'bad'];
    if (kind === 'architecture') return [{id:'action',t:'8×4=32 维动作 token 在 patchify 阶段相加注入。'},{id:'memory',t:'视频 token 可读取参考角色记忆；记忆不被轨迹反向写回。'},{id:'dit',t:'因果 DiT 只用过去视觉上下文预测下一视频块。'},{id:'kv',t:'有界局部 KV 缓存通过滚动淘汰避免随时长无限增长。'},{id:'vae',t:'LightVAE 降低整块解码的时间与峰值内存。'},{id:'stream',t:'报告设置中 3 个潜在帧生成 12 个解码帧。'}].find(x=>x.id===node)?.t ? [[{id:'action',t:'8×4=32 维动作 token 在 patchify 阶段相加注入。'},{id:'memory',t:'视频 token 可读取参考角色记忆；记忆不被轨迹反向写回。'},{id:'dit',t:'因果 DiT 只用过去视觉上下文预测下一视频块。'},{id:'kv',t:'有界局部 KV 缓存通过滚动淘汰避免随时长无限增长。'},{id:'vae',t:'LightVAE 降低整块解码的时间与峰值内存。'},{id:'stream',t:'报告设置中 3 个潜在帧生成 12 个解码帧。'}].find(x=>x.id===node)!.t, node==='stream'?'good':''] : ['', ''];
    if (kind === 'deployment') { const row = deploymentRows.find(r=>r.id===config)!; return 'oom' in row ? ['更快的注意力单独不足以让完整管线装入单卡。', 'bad'] : config === 'lightvae' ? ['这是表中首个可运行配置：9.117 FPS，20.491 GiB。', ''] : config === 'fp8' ? ['在匹配配置中，FP8 同时提高吞吐并降低峰值显存。', 'good'] : ['更激进低比特扩展吞吐上沿，但论文把 FP8 作为质量导向默认点。', '']; }
    if (kind === 'benchmark') { const vals = benchmarkRows.map(r=>r.values[metric]); const best = Math.max(...vals); const a = vals[4]; return [`${metricNames[metric]}：ABot-World-0 为 ${a.toFixed(4)}，最高值 ${best.toFixed(4)}；所有所列子指标均为越高越好。`, a === best ? 'good' : '']; }
    return ['', ''];
  }, [kind, value, toggle, source, masks, history, chunk, progress, stage, node, config, metric]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const render = () => {
      clearSet(ctx);
      if (kind === 'stress' || kind === 'repair') {
        const stressLevel = kind === 'stress' ? value as 0 | 1 | 2 : 2;
        const stress = stressLevel * 42;
        const fixed = kind === 'repair' && toggle;
        const color = fixed ? COLORS.green : stress >= 60 ? COLORS.red : COLORS.blue;
        const endY = fixed ? 105 : 105 + stress * 0.55;
        drawRoute(ctx, 35, 105, 320, endY, color); drawGimbal(ctx, 70 + stress * 2.1, 105 + (endY-105)*0.65, color); drawActor(ctx, 320, 105);
        label(ctx, fixed ? '动作 + 长时对齐 + 系统协同' : '闭环自反馈 · 概念示意', 35, 35, color, 14);
        qualitativeBar(ctx, '误差累积', fixed ? 0 : stressLevel, 370, 55, color);
        qualitativeBar(ctx, '响应负担', fixed ? 1 : stressLevel, 370, 105, color);
        qualitativeBar(ctx, '记忆压力', fixed ? 1 : stressLevel, 370, 155, color);
      } else if (kind === 'data') {
        const xs=[35,205,375]; const ids=['game','sim','internet']; const names=['AAA 游戏','仿真引擎','互联网视频'];
        ids.forEach((id,i)=>{rounded(ctx,xs[i],30,145,48,id===source?'#e9f0fb':COLORS.white,id===source?COLORS.blue:COLORS.border,id===source?3:1);label(ctx,names[i],xs[i]+18,59,id===source?COLORS.blue:COLORS.text,14)});
        const sourceFacts = source === 'game'
          ? ['动作：原生 API 真值', '边界：特定游戏与视觉风格']
          : source === 'sim'
            ? ['动作：确定标签', '优势：轨迹可设计、环境可控']
            : ['动作：位姿估计伪标签', '优势：真实动态与视觉多样性'];
        rounded(ctx,55,106,450,48,COLORS.white,COLORS.blue,2);label(ctx,sourceFacts[0],72,135,COLORS.blue,14);
        rounded(ctx,55,164,450,38,COLORS.white,COLORS.green,2);label(ctx,sourceFacts[1],72,188,COLORS.green,14);
        label(ctx,'全来源统一进入：14 项检查 · 6 个质量维度',55,225,COLORS.text,13);
      } else if (kind === 'action') {
        const keys=['W','A','S','D','I','J','K','L']; keys.forEach((k,i)=>{const on=Boolean(masks[slot]&(1<<i));rounded(ctx,24+(i%4)*50,30+Math.floor(i/4)*45,40,34,on?COLORS.blue:COLORS.white,on?COLORS.blue:COLORS.border);label(ctx,k,38+(i%4)*50,53,on?COLORS.white:COLORS.text,14)});
        masks.forEach((m,i)=>{rounded(ctx,245+i*68,35,54,42,i===slot?'#fff3db':COLORS.white,i===slot?COLORS.orange:COLORS.border,2);label(ctx,`帧${i+1}`,255+i*68,55);label(ctx,m.toString(2).padStart(8,'0'),250+i*68,72,COLORS.blue,9)});
        rounded(ctx,245,105,258,45,COLORS.white,COLORS.blue,2); label(ctx,'32 维 = 4 × 8',320,133,COLORS.blue,15);
        if(toggle){rounded(ctx,245,170,180,36,'#f1eafe',COLORS.purple,2);label(ctx,'参考角色记忆（独立通道）',258,193,COLORS.purple,13)}
      } else if (kind === 'window') {
        const cell=42; for(let i=0;i<history+chunk;i++){const past=i<history;rounded(ctx,30+i*cell,68,34,52,past?'#dce8f7':'#fff3db',past?COLORS.blue:COLORS.orange,2);label(ctx,past?'历史':'预测',34+i*cell,98,past?COLORS.blue:COLORS.orange,10)}
        label(ctx,`v₀:ₜ₋₁ = ${history} 格`,30,38,COLORS.blue,14); label(ctx,`L = ${chunk}`,350,38,COLORS.orange,14); label(ctx,'条件：历史 v + 本块动作 a + 多模态 c',30,160,COLORS.text,14);
      } else if (kind === 'compare') {
        [['双向教师',35,COLORS.green],['因果学生',300,COLORS.blue]].forEach(([name,x,color])=>{rounded(ctx,x as number,28,225,160,COLORS.white,color as string,2);label(ctx,name as string,(x as number)+65,52,color as string,14);const p=progress;drawRoute(ctx,(x as number)+20,130,(x as number)+195,130+(name==='因果学生'?8*p:0),color as string);drawGimbal(ctx,(x as number)+40+145*p,130,color as string);label(ctx,name==='双向教师'?'可见完整分镜':'只见过去画面',(x as number)+48,175,COLORS.muted,12)});
      } else if (kind === 'steps') {
        const names=['双向教师','教师强制','ODE 蒸馏','LongForcing']; names.forEach((n,i)=>{const active=i<=stage;drawRoute(ctx,45+i*130,95,45+Math.min(i+1,3)*130,95,active?COLORS.blue:COLORS.border,active?4:2);rounded(ctx,20+i*130,65,105,60,active?(i===3?'#e5f6ed':'#e9f0fb'):COLORS.white,active?(i===3?COLORS.green:COLORS.blue):COLORS.border,active?3:1);label(ctx,n,32+i*130,100,active?(i===3?COLORS.green:COLORS.blue):COLORS.muted,12)}); label(ctx,['完整时域目标','清洁历史 + 因果掩码','少步干净终点','长自滚动分布'][stage],155,168,stage===3?COLORS.green:COLORS.blue,14);
      } else if (kind === 'drift') {
        const late=Math.max(0,(value-30)/30); const fixed=toggle; const end=110+(fixed?8:55*late); drawRoute(ctx,30,90,275,end,fixed?COLORS.green:late>.5?COLORS.red:COLORS.blue);drawGimbal(ctx,55+value*3.3,90+(end-90)*.8,fixed?COLORS.green:COLORS.red);drawActor(ctx,275,90);label(ctx,`${value} 秒`,30,35,COLORS.orange,15);
        const names=['HPSv3 ↑','高饱和 ↓','感知模糊 ↓','patch 重复 ↓'];names.forEach((n,i)=>{label(ctx,n,325,50+i*42,COLORS.muted,12);ctx.strokeStyle=fixed?COLORS.green:COLORS.red;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(405,45+i*42);ctx.lineTo(530,45+i*42+(fixed?0:(i===0?18:-18)*late));ctx.stroke()});
      } else if (kind === 'architecture') {
        const nodes=[['action','动作适配器',30,55],['memory','参考记忆',30,145],['dit','因果 DiT',220,95],['kv','有界 KV',220,175],['vae','LightVAE',390,95],['stream','流式输出',470,95]] as const;
        ctx.strokeStyle=COLORS.border;ctx.lineWidth=3;[[130,80,220,110],[130,165,220,115],[315,110,390,110],[315,190,315,125],[465,110,470,110]].forEach(p=>{ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(p[2],p[3]);ctx.stroke()});
        nodes.forEach(([id,n,x,y])=>{const active=id===node;rounded(ctx,x,y,100,id==='stream'?44:50,active?'#e9f0fb':COLORS.white,active?COLORS.blue:COLORS.border,active?4:1);label(ctx,n,x+10,y+29,active?COLORS.blue:COLORS.text,12)});label(ctx,node==='memory'?'仅 memory → video，禁止反向写回':node==='kv'?'局部上下文 + 滚动淘汰':'选择节点查看职责与活动路径',28,225,node==='memory'||node==='kv'?COLORS.red:COLORS.muted,12);
      } else if (kind === 'deployment') {
        const row=deploymentRows.find(r=>r.id===config)!;label(ctx,'RTX 5090 · 1280×704 · batch 1 · 3 latent → 12 frames/chunk',25,28,COLORS.muted,12);
        if('oom' in row){label(ctx,'OOM',220,130,COLORS.red,48);label(ctx,'完整管线无法装入显存',180,170,COLORS.red,14)} else {bar(ctx,'DiT ms/chunk',row.dit!,35,62,COLORS.orange,1200);bar(ctx,'VAE ms/chunk',row.vae!,300,62,COLORS.purple,100);bar(ctx,'FPS ↑',row.fps!,35,142,COLORS.green,16);bar(ctx,'VRAM GiB ↓',row.vram!,300,142,COLORS.blue,22)}
      } else if (kind === 'benchmark') {
        const vals=benchmarkRows.map(r=>r.values[metric]);const best=Math.max(...vals);benchmarkRows.forEach((r,i)=>{const v=r.values[metric]*progress;label(ctx,r.name,25,48+i*36,r.name==='ABot-World-0'?COLORS.blue:COLORS.text,12);ctx.fillStyle=r.name==='ABot-World-0'?COLORS.blue:COLORS.light;ctx.fillRect(135,35+i*36,360*v,18);label(ctx,(r.values[metric]*progress).toFixed(4),505,49+i*36,r.values[metric]===best?COLORS.green:COLORS.muted,11);if(progress===1&&r.values[metric]===best)label(ctx,'★',475,50+i*36,COLORS.green,15)});label(ctx,`${metricNames[metric]} · higher is better`,25,225,COLORS.muted,12);
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const disconnect=observeCanvas(canvas,render,()=>{}); render(); return disconnect;
  }, [kind,value,toggle,source,masks,slot,history,chunk,progress,stage,node,config,metric]);

  const control = () => {
    if (kind === 'stress') return <div className="ctrl"><label>滚动压力 <span className="val">{['低','中','高'][value]}</span></label><input aria-label="滚动压力" type="range" min="0" max="2" step="1" value={value} onChange={e=>setValue(Number(e.target.value))}/><span className="concept-note">概念示意，非论文实验数据</span></div>;
    if (kind === 'repair') return <div className="chips"><button className={!toggle?'chip active':'chip'} aria-pressed={!toggle} onClick={()=>setToggle(false)}>只做短片</button><button className={toggle?'chip active':'chip'} aria-pressed={toggle} onClick={()=>setToggle(true)}>动作 + LongForcing + 系统优化</button></div>;
    if (kind === 'data') return <div className="chips">{([['game','AAA 游戏'],['sim','仿真引擎'],['internet','互联网视频']] as const).map(([id,n])=><button key={id} className={source===id?'chip active':'chip'} aria-pressed={source===id} onClick={()=>setSource(id)}>{n}</button>)}</div>;
    if (kind === 'action') { const keys=['W','A','S','D','I','J','K','L']; return <><div className="chips">{keys.map((k,i)=><button key={k} className={masks[slot]&(1<<i)?'chip active':'chip'} onClick={()=>setMasks(m=>m.map((v,j)=>j===slot?v^(1<<i):v))}>{k}</button>)}</div><div className="ctrl"><button onClick={()=>setSlot(s=>Math.max(0,s-1))} disabled={slot===0}>上一帧</button><span className="val">帧 {slot+1}/4</span><button onClick={()=>setSlot(s=>Math.min(3,s+1))} disabled={slot===3}>下一帧</button><button className={toggle?'chip active':'chip'} aria-pressed={toggle} onClick={()=>setToggle(v=>!v)}>参考角色记忆</button></div></> }
    if (kind === 'window') return <div className="ctrl"><label>历史 {history}</label><input type="range" min="2" max="8" value={history} onChange={e=>setHistory(Number(e.target.value))}/><label>块长 L={chunk}</label><input type="range" min="1" max="4" value={chunk} onChange={e=>setChunk(Number(e.target.value))}/></div>;
    if (kind === 'compare') return <div className="ctrl"><button onClick={()=>{setProgress(0);setRunning(true)}}>同步开始</button><span className="val">{Math.round(progress*100)}%</span></div>;
    if (kind === 'steps') return <div className="ctrl"><button onClick={()=>setStage(s=>Math.max(0,s-1))} disabled={stage===0}>上一步</button><span className="val">阶段 {stage}/3</span><button onClick={()=>setStage(s=>Math.min(3,s+1))} disabled={stage===3}>下一步</button></div>;
    if (kind === 'drift') return <><div className="ctrl"><label>滚动秒数 <span className="val">{value}s</span></label><input type="range" min="0" max="60" value={value} onChange={e=>setValue(Number(e.target.value))}/></div><div className="chips"><button className={!toggle?'chip active':'chip'} onClick={()=>setToggle(false)}>较短监督</button><button className={toggle?'chip active':'chip'} onClick={()=>setToggle(true)}>LongForcing</button></div></>;
    if (kind === 'architecture') return <div className="chips">{([['action','动作适配器'],['memory','参考记忆'],['dit','因果 DiT'],['kv','有界 KV'],['vae','LightVAE'],['stream','流式输出']] as const).map(([id,n])=><button key={id} className={node===id?'chip active':'chip'} onClick={()=>setNode(id)}>{n}</button>)}</div>;
    if (kind === 'deployment') return <div className="chips">{deploymentRows.filter(r=>['base','lightvae','fp8','mxfp4'].includes(r.id)).map(r=><button key={r.id} className={config===r.id?'chip active':'chip'} onClick={()=>setConfig(r.id)}>{r.name}</button>)}</div>;
    if (kind === 'benchmark') return <><div className="chips">{metricNames.map((n,i)=>({n,i})).filter(({i})=>[0,3,6].includes(i)).map(({n,i})=><button key={n} className={metric===i?'chip active':'chip'} onClick={()=>{setMetric(i);setProgress(0)}}>{n}</button>)}</div><div className="ctrl"><button onClick={()=>{setProgress(0);setRunning(true)}}>{progress===1?'再次比较':'开始比较'}</button></div></>;
    return null;
  };

  return <div><canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H}/>{control()}<div className={`feedback ${feedback[1]}`}>{feedback[0]}</div>{kind==='data'&&source==='internet'?<div className="feedback">被动视频无法由采集智能体操控；其动作来自位姿估计。</div>:null}{kind==='deployment'?<details className="deep-reading"><summary>深入阅读：Table 2 完整配置</summary><div className="table-scroll"><table className="paper"><thead><tr><th>配置</th><th>DiT ms/chunk</th><th>VAE ms/chunk</th><th>FPS ↑</th><th>VRAM GiB ↓</th></tr></thead><tbody>{deploymentRows.map(r=><tr key={r.id}><td>{r.name}</td>{'oom' in r?<><td>—</td><td>—</td><td>OOM</td><td>OOM</td></>:<><td>{r.dit}</td><td>{r.vae}</td><td>{r.fps}</td><td>{r.vram}</td></>}</tr>)}</tbody></table></div></details>:null}{kind==='benchmark'?<><div className="feedback">结论是 competitive（有竞争力），不是所有指标 SOTA；长时与物理结论也不构成无限稳定或严格物理保证。</div><details className="deep-reading"><summary>深入阅读：Table 3 全部所列子指标</summary><div className="table-scroll"><table className="paper"><thead><tr><th>模型</th>{metricNames.map(n=><th key={n}>{n}</th>)}</tr></thead><tbody>{benchmarkRows.map(row=><tr key={row.name}><td>{row.name}</td>{row.values.map((v,i)=><td key={i}>{v.toFixed(4)}</td>)}</tr>)}</tbody></table></div></details></>:null}</div>;
};

export const LifeCanvas: React.FC<BasicProps & { variant?: 'old'|'new' }> = ({ chapterId, moduleId, variant }) => {
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{const canvas=ref.current;if(!canvas)return;let ctx:CanvasRenderingContext2D;try{ctx=setupCanvas(canvas,244,130)}catch{return}let raf=0;let active=true;const start=performance.now();const draw=()=>{if(!active)return;const t=((performance.now()-start)%3000)/3000;clearSet(ctx,244,130);const n=Number(chapterId.replace('chap-',''))||1;const good=variant==='new'||(!variant&&n%3!==1);const color=variant==='old'?COLORS.red:good?COLORS.green:COLORS.blue;const y=72+(variant==='old'?28*t:Math.sin(t*Math.PI*2)*4);drawRoute(ctx,22,72,218,variant==='old'?100:72,color);drawGimbal(ctx,35+165*t,y,color);drawActor(ctx,218,72);label(ctx,variant==='old'?'漂移累积':variant==='new'?'动作响应稳定':`第 ${n} 场：一镜到底`,14,22,color,12);if(!canvas.classList.contains('is-ready'))canvas.classList.add('is-ready');raf=requestAnimationFrame(draw)};const stop=()=>{active=false;cancelAnimationFrame(raf)};const begin=()=>{if(!active){active=true;raf=requestAnimationFrame(draw)}};const disconnect=observeCanvas(canvas,begin,stop);draw();return()=>{stop();disconnect()}},[chapterId,variant]);return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width="244" height="130"/>;
};
