import React, { useEffect, useRef, useState } from 'react';
import { clamp, setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { PALETTE, clearConsole, drawConsole, drawFader } from './stage-scenes';

const W = 560;
const H = 260;

type Choice = 'mask' | 'drift';
type Stream = 'speech' | 'sfx' | 'joint';
type Direction = 'none' | 'sp-sfx' | 'sfx-sp' | 'both';
type NodeId = 'video-enc' | 'video' | 'fusion' | 'speech' | 'sfx' | 'audio' | 'decoder';
type Mode = 'T2AV' | 'TI2AV' | 'A2V' | 'V2A';
type Metric = 'PQ' | 'DS' | 'LSE-C' | 'USER';

function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, color = PALETTE.text, size = 14, weight = 600) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Segoe UI", sans-serif`;
  ctx.fillText(value, x, y);
}

function centeredText(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, color = PALETTE.text, size = 14, weight = 600) {
  ctx.save();
  ctx.textAlign = 'center';
  text(ctx, value, x, y, color, size, weight);
  ctx.restore();
}

function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, title?: string) {
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = PALETTE.border;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 9); ctx.fill(); ctx.stroke();
  if (title) text(ctx, title, x + 12, y + 21, PALETTE.text, 13, 700);
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, active = true) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = active ? 4 : 2;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 10 * Math.cos(a - 0.45), y2 - 10 * Math.sin(a - 0.45));
  ctx.lineTo(x2 - 10 * Math.cos(a + 0.45), y2 - 10 * Math.sin(a + 0.45));
  ctx.closePath(); ctx.fill();
}

function node(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string, active: boolean, color = PALETTE.blue) {
  ctx.fillStyle = active ? color : '#eef2f7';
  ctx.strokeStyle = active ? PALETTE.text : PALETTE.border;
  ctx.lineWidth = active ? 3 : 1.5;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 7); ctx.fill(); ctx.stroke();
  text(ctx, label, x + 9, y + h / 2 + 5, active ? '#fff' : PALETTE.text, 12, 700);
}

type BarLayout = {
  labelWidth?: number;
  barWidth?: number;
  valueGap?: number;
  rowGap?: number;
};

function drawBars(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  values: {label: string; value: number; color: string}[],
  max = 1,
  layout: BarLayout = {},
) {
  const labelWidth = layout.labelWidth ?? 52;
  const barWidth = layout.barWidth ?? 120;
  const valueGap = layout.valueGap ?? 8;
  const rowGap = layout.rowGap ?? 30;
  values.forEach((item, i) => {
    const yy = y + i * rowGap;
    text(ctx, item.label, x, yy + 12, PALETTE.muted, 12, 600);
    ctx.fillStyle = '#edf1f5'; ctx.fillRect(x + labelWidth, yy, barWidth, 16);
    ctx.fillStyle = item.color; ctx.fillRect(x + labelWidth, yy, barWidth * clamp(item.value / max, 0, 1), 16);
    text(ctx, item.value.toFixed(2), x + labelWidth + barWidth + valueGap, yy + 13, item.color, 12, 700);
  });
}

export const UnisonActive: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const dragRef = useRef(false);
  const [issue, setIssue] = useState<Choice>('mask');
  const [compareStart, setCompareStart] = useState<number | null>(null);
  const [stream, setStream] = useState<Stream>('joint');
  const [direction, setDirection] = useState<Direction>('none');
  const [mix, setMix] = useState(50);
  const [tv, setTv] = useState(0.5);
  const [ta, setTa] = useState(0.5);
  const [phase, setPhase] = useState(0);
  const [leader, setLeader] = useState<0 | 1>(1);
  const [selectedNode, setSelectedNode] = useState<NodeId>('fusion');
  const [mode, setMode] = useState<Mode>('TI2AV');
  const [metric, setMetric] = useState<Metric>('PQ');
  const [raceStart, setRaceStart] = useState<number | null>(null);

  const stateRef = useRef({ issue, compareStart, stream, direction, mix, tv, ta, phase, leader, selectedNode, mode, metric, raceStart });
  stateRef.current = { issue, compareStart, stream, direction, mix, tv, ta, phase, leader, selectedNode, mode, metric, raceStart };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const draw = (now: number) => {
      const s = stateRef.current;
      clearConsole(ctx, W, H);
      drawConsole(ctx, 8, 8, W - 16, H - 16);

      if (moduleId === '1.1') {
        panel(ctx, 24, 30, 238, 198, '音频内部');
        panel(ctx, 298, 30, 238, 198, '跨模态时间');
        const mask = s.issue === 'mask';
        centeredText(ctx, '归一化相对可闻度', 143, 75, PALETTE.muted, 11, 600);
        drawBars(ctx, 50, 90, [
          {label: '语音', value: mask ? 0.93 : 0.58, color: mask ? PALETTE.red : PALETTE.green},
          {label: '音效', value: mask ? 0.27 : 0.56, color: mask ? PALETTE.red : PALETTE.purple},
        ], 1, {labelWidth: 42, barWidth: 112, valueGap: 7, rowGap: 40});
        centeredText(ctx, mask ? '声学层次失衡' : '语音—音效近似均衡', 143, 202, mask ? PALETTE.red : PALETTE.green, 12, 700);

        centeredText(ctx, '视觉事件与声学事件位置', 417, 75, PALETTE.muted, 11, 600);
        ctx.strokeStyle = PALETTE.border; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(328, 130); ctx.lineTo(506, 130); ctx.stroke();
        const eventGap = mask ? 10 : 68;
        const visualX = 417 - eventGap / 2;
        const audioX = 417 + eventGap / 2;
        ctx.strokeStyle = PALETTE.blue; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(visualX, 94); ctx.lineTo(visualX, 166); ctx.stroke();
        ctx.strokeStyle = mask ? PALETTE.green : PALETTE.red; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(audioX, 94); ctx.lineTo(audioX, 166); ctx.stroke();
        centeredText(ctx, mask ? '事件基本同步' : '约 160 ms 概念偏移', 417, 202, mask ? PALETTE.green : PALETTE.red, 12, 700);
      } else if (moduleId === '1.2') {
        const progress = s.compareStart === null ? 0 : clamp((now - s.compareStart) / 1800, 0, 1);
        panel(ctx, 24, 30, 238, 198, '传统隐式融合');
        panel(ctx, 298, 30, 238, 198, 'Unison');
        const oldMask = 0.92, oldSfx = 0.26, oldOffset = 0.72;
        const newMask = 0.92 - 0.34 * progress, newSfx = 0.26 + 0.31 * progress, newOffset = 0.72 * (1 - progress);
        drawBars(ctx, 40, 74, [
          {label: '语音', value: oldMask, color: PALETTE.red},
          {label: '音效', value: oldSfx, color: PALETTE.red},
          {label: '偏差', value: oldOffset, color: PALETTE.red},
        ]);
        drawBars(ctx, 314, 74, [
          {label: '语音', value: newMask, color: progress > .85 ? PALETTE.green : PALETTE.blue},
          {label: '音效', value: newSfx, color: progress > .85 ? PALETTE.green : PALETTE.blue},
          {label: '偏差', value: newOffset, color: progress > .85 ? PALETTE.green : PALETTE.blue},
        ]);
        text(ctx, '归一化概念示意', 208, 246, PALETTE.muted, 11, 500);
      } else if (moduleId === '2.1') {
        panel(ctx, 24, 30, 285, 198, '同一时间轴上的双流');
        panel(ctx, 330, 30, 206, 198, '张量与身份');
        const speechActive = s.stream === 'speech' || s.stream === 'joint';
        const sfxActive = s.stream === 'sfx' || s.stream === 'joint';
        node(ctx, 52, 72, 115, 48, 'hˢᵖ 语音流', speechActive, PALETTE.green);
        node(ctx, 52, 145, 115, 48, 'hˢᶠˣ 音效流', sfxActive, PALETTE.purple);
        ctx.strokeStyle = PALETTE.border; ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(190 + i * 17, 61); ctx.lineTo(190 + i * 17, 205); ctx.stroke(); }
        text(ctx, '共享时间索引 N', 178, 222, PALETTE.blue, 12);
        text(ctx, 'h ∈ ℝ', 365, 91, PALETTE.text, 18, 700);
        text(ctx, 'B × 2 × N × D', 355, 127, PALETTE.orange, 16, 700);
        text(ctx, s.stream === 'joint' ? '双流并行，身份保持' : s.stream === 'speech' ? '语音流视图' : '音效流视图', 347, 178, PALETTE.blue, 12);
      } else if (moduleId === '3.1') {
        panel(ctx, 24, 30, 512, 198, 'Bi-ACA 信息交换');
        node(ctx, 70, 98, 130, 62, '语音流 hˢᵖ', true, PALETTE.green);
        node(ctx, 360, 98, 130, 62, '音效流 hˢᶠˣ', true, PALETTE.purple);
        const right = s.direction === 'sp-sfx' || s.direction === 'both';
        const left = s.direction === 'sfx-sp' || s.direction === 'both';
        arrow(ctx, 205, 112, 354, 112, right ? (s.direction === 'both' ? PALETTE.green : PALETTE.blue) : PALETTE.border, right);
        arrow(ctx, 354, 147, 205, 147, left ? (s.direction === 'both' ? PALETTE.green : PALETTE.blue) : PALETTE.border, left);
        text(ctx, right ? '语音上下文进入音效查询' : '该方向未激活', 210, 95, right ? PALETTE.blue : PALETTE.muted, 11);
        text(ctx, left ? '音效上下文进入语音查询' : '该方向未激活', 210, 178, left ? PALETTE.blue : PALETTE.muted, 11);
      } else if (moduleId === '4.1') {
        panel(ctx, 24, 30, 238, 198, '语义条件');
        panel(ctx, 298, 30, 238, 198, 'SCG 门值');
        const x = s.mix / 100;
        const gsp = x <= .5 ? .28 + (.48 - .28) * (x / .5) : .48 + (.68 - .48) * ((x - .5) / .5);
        const gsfx = x <= .5 ? .71 + (.52 - .71) * (x / .5) : .52 + (.32 - .52) * ((x - .5) / .5);
        drawFader(ctx, 87, 82, gsp, PALETTE.green); drawFader(ctx, 165, 82, gsfx, PALETTE.purple);
        text(ctx, '语音门', 61, 178, PALETTE.green, 12); text(ctx, '音效门', 139, 178, PALETTE.purple, 12);
        drawBars(ctx, 320, 82, [
          {label: 'gˢᵖ', value: gsp, color: PALETTE.green},
          {label: 'gˢᶠˣ', value: gsfx, color: PALETTE.purple},
        ]);
        text(ctx, '锚点来自 Fig.8；中间为图示插值', 318, 183, PALETTE.muted, 11, 500);
      } else if (moduleId === '5.1') {
        panel(ctx, 24, 24, 350, 212, '音频—视频联合时间步平面');
        panel(ctx, 394, 24, 142, 212, '方向判断');
        const x0 = 64, y0 = 204, size = 150;
        ctx.fillStyle = '#eef6f1'; ctx.fillRect(x0, y0 - size, size, size);
        ctx.strokeStyle = PALETTE.border; ctx.strokeRect(x0, y0 - size, size, size);
        ctx.strokeStyle = PALETTE.blue; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + size, y0 - size); ctx.stroke();
        ctx.fillStyle = 'rgba(34,141,92,.12)';
        ctx.beginPath(); ctx.moveTo(x0, y0 - size * .25); ctx.lineTo(x0 + size * .75, y0 - size); ctx.lineTo(x0 + size, y0 - size); ctx.lineTo(x0 + size, y0 - size * .75); ctx.lineTo(x0 + size * .25, y0); ctx.lineTo(x0, y0); ctx.closePath(); ctx.fill();
        const px = x0 + s.tv * size, py = y0 - s.ta * size;
        const valid = Math.abs(s.tv - s.ta) <= .25;
        ctx.fillStyle = valid ? PALETTE.orange : PALETTE.red; ctx.strokeStyle = PALETTE.text; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        text(ctx, 'tᵥ →', x0 + 116, y0 + 20, PALETTE.blue, 12); text(ctx, 'tₐ', x0 - 22, y0 - 134, PALETTE.blue, 12);
        const d = s.ta < s.tv ? 1 : 0;
        text(ctx, `tᵥ=${s.tv.toFixed(2)}`, 410, 70, PALETTE.blue, 13);
        text(ctx, `tₐ=${s.ta.toFixed(2)}`, 410, 96, PALETTE.blue, 13);
        text(ctx, `d=${d}`, 410, 128, PALETTE.orange, 18, 800);
        text(ctx, d ? '音频噪声较低' : s.ta === s.tv ? '相同噪声水平' : '视频噪声较低', 410, 157, valid ? PALETTE.green : PALETTE.red, 12);
        text(ctx, `|Δt|=${Math.abs(s.tv - s.ta).toFixed(2)}`, 410, 186, valid ? PALETTE.green : PALETTE.red, 12);
      } else if (moduleId === '6.1') {
        const names = ['I 同步热身', 'II 渐进解耦', 'III 完全独立'];
        const ratios = ['0.3', '0.4', '0.3'];
        names.forEach((name, i) => {
          panel(ctx, 24 + i * 174, 55, 158, 138, name);
          const active = i === s.phase;
          ctx.fillStyle = active ? (i === 2 ? PALETTE.green : PALETTE.blue) : '#e8edf4';
          ctx.beginPath(); ctx.roundRect(52 + i * 174, 100, 102, 38, 7); ctx.fill();
          text(ctx, i === 0 ? 'tᵥ = tₐ' : i === 1 ? '|Δt| ≤ 0.25' : '独立采样', 68 + i * 174, 124, active ? '#fff' : PALETTE.muted, 12);
          text(ctx, `阶段占比 ${ratios[i]}`, 55 + i * 174, 168, active ? PALETTE.orange : PALETTE.muted, 11);
        });
        text(ctx, '日程消融 DS↓：SyncOnly .17 · IndepOnly .14 · PF .08', 78, 224, PALETTE.text, 12, 600);
      } else if (moduleId === '7.1') {
        panel(ctx, 24, 30, 300, 198, '方向加权'); panel(ctx, 344, 30, 192, 198, '实时权重');
        const wv = s.leader === 1 ? 1.5 : 1.0;
        const wa = s.leader === 1 ? 1.0 : 1.5;
        node(ctx, 55, 74, 112, 48, '视频损失 Lᵛ', true, s.leader === 1 ? PALETTE.orange : PALETTE.blue);
        node(ctx, 55, 148, 112, 48, '音频损失 Lᵃ', true, s.leader === 0 ? PALETTE.orange : PALETTE.blue);
        arrow(ctx, 178, 97, 284, 97, s.leader === 1 ? PALETTE.orange : PALETTE.blue);
        arrow(ctx, 178, 171, 284, 171, s.leader === 0 ? PALETTE.orange : PALETTE.blue);
        drawBars(ctx, 356, 81, [
          {label: 'wᵥ', value: wv, color: s.leader === 1 ? PALETTE.orange : PALETTE.blue},
          {label: 'wₐ', value: wa, color: s.leader === 0 ? PALETTE.orange : PALETTE.blue},
        ], 1.5, {labelWidth: 32, barWidth: 84, valueGap: 6});
        text(ctx, 'λ = 0.5（本文设置）', 369, 176, PALETTE.muted, 11);
      } else if (moduleId === '8.1') {
        const nodes: {id: NodeId; x: number; y: number; label: string; color: string}[] = [
          {id:'video-enc',x:22,y:57,label:'视频编码',color:PALETTE.blue},
          {id:'video',x:130,y:57,label:'视频 29 层',color:PALETTE.blue},
          {id:'fusion',x:248,y:96,label:'双向融合',color:PALETTE.green},
          {id:'speech',x:130,y:139,label:'语音流',color:PALETTE.green},
          {id:'sfx',x:130,y:193,label:'音效流',color:PALETTE.purple},
          {id:'audio',x:354,y:166,label:'音频 23 层',color:PALETTE.purple},
          {id:'decoder',x:458,y:111,label:'输出解码',color:PALETTE.blue},
        ];
        arrow(ctx, 101, 80, 126, 80, PALETTE.border, false); arrow(ctx, 219, 80, 244, 112, PALETTE.border, false);
        arrow(ctx, 219, 162, 244, 127, PALETTE.border, false); arrow(ctx, 219, 216, 244, 132, PALETTE.border, false);
        arrow(ctx, 326, 122, 350, 188, PALETTE.border, false); arrow(ctx, 445, 188, 454, 139, PALETTE.border, false);
        nodes.forEach(n => node(ctx, n.x, n.y, n.id === 'fusion' ? 78 : 88, 45, n.label, s.selectedNode === n.id, n.color));
        const details: Record<NodeId,string[]> = {
          'video-enc':['视觉编码器','联合阶段：冻结'], video:['Wan2.2-5B','29 层；骨干冻结'], fusion:['帧级双向注意力','窗口 3，步长 1'], speech:['语音独立流','CFMˢᵖ 监督'], sfx:['音效独立流','CFMˢᶠˣ 监督'], audio:['MMAudio + Zipformer','23 层；可训练'], decoder:['视频/音频输出','按任务激活路径']
        };
        ctx.fillStyle = '#fff'; ctx.strokeStyle = PALETTE.border; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(352, 25, 184, 66, 7); ctx.fill(); ctx.stroke();
        text(ctx, details[s.selectedNode][0], 366, 51, PALETTE.text, 13, 700);
        text(ctx, details[s.selectedNode][1], 366, 75, s.selectedNode === 'video' ? PALETTE.blue : PALETTE.green, 11, 600);
      } else if (moduleId === '9.1') {
        panel(ctx, 24, 30, 512, 198, '条件 → 双分支系统 → 输出');
        const routes: Record<Mode,{inputs:string;outputs:string;evidence:string}> = {
          T2AV:{inputs:'文本',outputs:'视频 + 音频',evidence:'Table 1 定量'},
          TI2AV:{inputs:'文本 + 图像',outputs:'视频 + 音频',evidence:'Table 1 定量'},
          A2V:{inputs:'音频',outputs:'视频',evidence:'Fig.5 定性'},
          V2A:{inputs:'视频',outputs:'音频',evidence:'Fig.5 定性'},
        };
        const r = routes[s.mode];
        node(ctx, 52, 93, 118, 60, r.inputs, true, PALETTE.orange);
        node(ctx, 221, 82, 120, 82, 'Unison\n双分支', true, PALETTE.blue);
        node(ctx, 391, 93, 118, 60, r.outputs, true, PALETTE.green);
        arrow(ctx, 174, 123, 216, 123, PALETTE.blue); arrow(ctx, 345, 123, 386, 123, PALETTE.green);
        text(ctx, r.evidence, 246, 190, PALETTE.purple, 12, 700);
        text(ctx, '论文推理配置：50 步 · CFG 6.0 · 25 FPS', 137, 219, PALETTE.text, 12, 600);
      } else if (moduleId === '10.1') {
        const metricData: Record<Metric,{names:string[];values:number[];higher:boolean}> = {
          PQ:{names:['Universe-1','Ovi','UniAVGen','MOVA','LTX-2','Unison'],values:[5.95,6.25,6.18,6.28,6.30,6.34],higher:true},
          DS:{names:['Universe-1','Ovi','UniAVGen','MOVA','LTX-2','Unison'],values:[.50,.12,.15,.13,.10,.08],higher:false},
          'LSE-C':{names:['Universe-1','Ovi','UniAVGen','MOVA','LTX-2','Unison'],values:[2.32,2.81,2.89,3.24,3.45,3.30],higher:true},
          USER:{names:['UniAVGen','MOVA','LTX-2','Unison'],values:[3.48,2.48,2.05,1.68],higher:false},
        };
        const d = metricData[s.metric];
        const ranked = d.names
          .map((name, i) => ({name, value: d.values[i]}))
          .sort((a, b) => d.higher ? b.value - a.value : a.value - b.value);
        const elapsed = s.raceStart === null ? 0 : clamp((now - s.raceStart) / 1900, 0, 1);
        const min = Math.min(...d.values), max = Math.max(...d.values);
        const trackX = 142;
        const trackWidth = 330;
        ranked.forEach(({name, value: raw}, i) => {
          const y = 35 + i * (ranked.length === 6 ? 34 : 46);
          const magnitude = (raw - min) / Math.max(.0001, max - min);
          const width = (44 + (trackWidth - 44) * magnitude) * elapsed;
          ctx.fillStyle = '#edf1f5'; ctx.fillRect(trackX, y, trackWidth, 19);
          ctx.fillStyle = name === 'Unison' ? PALETTE.green : PALETTE.blue; ctx.fillRect(trackX, y, Math.min(width, trackWidth), 19);
          text(ctx, `${i + 1}.`, 24, y + 15, PALETTE.muted, 11, 700);
          text(ctx, name, 45, y + 15, name === 'Unison' ? PALETTE.green : PALETTE.text, 11, name === 'Unison' ? 800 : 600);
          text(ctx, raw.toFixed(2), 488, y + 15, PALETTE.text, 11, 700);
        });
        centeredText(ctx, `${s.metric === 'USER' ? '用户总体排名' : s.metric}${d.higher ? ' ↑' : ' ↓'} · 最优→较弱 · 柱长=原始值`, 280, 247, PALETTE.orange, 12, 700);
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(draw);
    };

    const pointFromEvent = (event: PointerEvent) => {
      if (moduleId !== '5.1') return;
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * W;
      const y = ((event.clientY - rect.top) / rect.height) * H;
      setTv(clamp((x - 64) / 150, 0, 1));
      setTa(clamp((204 - y) / 150, 0, 1));
    };
    const down = (e: PointerEvent) => { if (moduleId === '5.1') { dragRef.current = true; canvas.setPointerCapture(e.pointerId); pointFromEvent(e); } };
    const move = (e: PointerEvent) => { if (dragRef.current) pointFromEvent(e); };
    const up = () => { dragRef.current = false; };
    canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerup', up);

    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(draw); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop(); disconnect();
      canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', up);
    };
  }, [moduleId]);

  const chip = (selected: boolean, onClick: () => void, label: string) => (
    <button key={label} type="button" className={`chip ${selected ? 'selected' : ''}`} onClick={onClick} aria-pressed={selected}>{label}</button>
  );

  const controls = () => {
    if (moduleId === '1.1') return <div className="ctrl"><div className="chips">{chip(issue === 'mask', () => setIssue('mask'), '语音遮蔽')}{chip(issue === 'drift', () => setIssue('drift'), '时间错位')}</div></div>;
    if (moduleId === '1.2') return <div className="ctrl"><button type="button" onClick={() => setCompareStart(performance.now())}>开始同条件比较</button></div>;
    if (moduleId === '2.1') return <div className="ctrl"><div className="chips">{(['speech','sfx','joint'] as Stream[]).map(v => chip(stream === v, () => setStream(v), v === 'speech' ? '语音流' : v === 'sfx' ? '音效流' : '联合视图'))}</div></div>;
    if (moduleId === '3.1') return <div className="ctrl"><div className="chips">{(['none','sp-sfx','sfx-sp','both'] as Direction[]).map(v => chip(direction === v, () => setDirection(v), v === 'none' ? '无跨流交换' : v === 'sp-sfx' ? '语音→音效' : v === 'sfx-sp' ? '音效→语音' : '双向交换'))}</div></div>;
    if (moduleId === '4.1') return <div className="ctrl"><label>场景语义 <span className="val">{mix < 35 ? '语音主导' : mix > 65 ? '音效主导' : '均衡'}</span></label><input type="range" min="0" max="100" value={mix} onChange={e => setMix(Number(e.target.value))} /></div>;
    if (moduleId === '5.1') return <div className="ctrl"><label>视频 tᵥ <span className="val">{tv.toFixed(2)}</span></label><input aria-label="视频时间步" type="range" min="0" max="100" value={Math.round(tv*100)} onChange={e => setTv(Number(e.target.value)/100)} /><label>音频 tₐ <span className="val">{ta.toFixed(2)}</span></label><input aria-label="音频时间步" type="range" min="0" max="100" value={Math.round(ta*100)} onChange={e => setTa(Number(e.target.value)/100)} /></div>;
    if (moduleId === '6.1') return <div className="ctrl"><button type="button" onClick={() => setPhase(Math.max(0, phase - 1))} disabled={phase === 0}>上一步</button><span className="val">阶段 {phase + 1}/3</span><button type="button" onClick={() => setPhase(Math.min(2, phase + 1))} disabled={phase === 2}>下一步</button><button type="button" onClick={() => setPhase(0)}>重置</button></div>;
    if (moduleId === '7.1') return <div className="ctrl"><div className="chips">{chip(leader === 1, () => setLeader(1), '音频噪声较低（d=1）')}{chip(leader === 0, () => setLeader(0), '视频噪声较低（d=0）')}</div></div>;
    if (moduleId === '8.1') {
      const items: [NodeId,string][] = [['video-enc','视频编码'],['video','视频 29 层'],['fusion','双向融合'],['speech','语音流'],['sfx','音效流'],['audio','音频 23 层'],['decoder','输出解码']];
      return <div className="ctrl"><div className="chips">{items.map(([id,label]) => chip(selectedNode === id, () => setSelectedNode(id), label))}</div></div>;
    }
    if (moduleId === '9.1') return <div className="ctrl"><div className="chips">{(['T2AV','TI2AV','A2V','V2A'] as Mode[]).map(v => chip(mode === v, () => setMode(v), v))}</div></div>;
    return <div className="ctrl"><div className="chips">{(['PQ','DS','LSE-C','USER'] as Metric[]).map(v => chip(metric === v, () => { setMetric(v); setRaceStart(null); }, v === 'USER' ? '用户总体排名↓' : `${v}${v === 'DS' ? '↓' : '↑'}`))}</div><button type="button" onClick={() => setRaceStart(performance.now())}>开始比较</button></div>;
  };

  const feedback = (): {text: string; cls: string} => {
    if (moduleId === '1.1') return issue === 'mask' ? {text:'红色：语音能量占优，音效虽存在但可闻度明显降低。',cls:'bad'} : {text:'红色：总幅度未超限，但视觉事件与声学事件发生时间偏移。',cls:'bad'};
    if (moduleId === '1.2') return compareStart === null ? {text:'两种方法采用相同的归一化初始状态。',cls:''} : {text:'绿色：双流语音—音效协调改善声学层次，跨模态强迫改善时间对齐。',cls:'good'};
    if (moduleId === '2.1') return stream === 'joint' ? {text:'绿色：两条流共享时间索引，同时由双流维度和模态偏置保留身份。',cls:'good'} : {text:`蓝色：当前显示${stream === 'speech' ? '语音' : '音效'}流及其独立监督。`,cls:''};
    if (moduleId === '3.1') return direction === 'none' ? {text:'红色：两条流独立映射，缺少跨流声学上下文。',cls:'bad'} : direction === 'both' ? {text:'绿色：Bi-ACA 双向交换上下文后进入联合建模。',cls:'good'} : {text:'蓝色：单向交换只更新一侧，另一侧仍缺少对等的跨流信息。',cls:''};
    if (moduleId === '4.1') return mix >= 40 && mix <= 60 ? {text:'绿色：均衡场景中两门接近 0.5，但不要求所有样本都相等。',cls:'good'} : {text:'蓝色：门值随内容偏向保护当前更关键的声学成分。',cls:''};
    if (moduleId === '5.1') return Math.abs(tv-ta) > .25 ? {text:'红色：时间步差超过第二阶段的 Δmax=0.25；该状态仅适用于最终完全独立阶段。',cls:'bad'} : tv === ta ? {text:'蓝色：相同噪声水平适合同步热身，但不能形成明确的跨模态引导方向。',cls:''} : {text:`绿色：${ta < tv ? '音频' : '视频'}噪声水平较低，${ta < tv ? '视频' : '音频'}分支获得更大的损失权重。`,cls:'good'};
    if (moduleId === '6.1') return phase === 2 ? {text:'绿色：模型在稳定基础上进入完全独立时间步。',cls:'good'} : {text:phase === 0 ? '蓝色：同步热身先建立基础对齐。' : '蓝色：逐步引入不对称，并开始方向加权。',cls:''};
    if (moduleId === '7.1') return {text:`绿色：${leader === 1 ? '音频噪声较低，视频损失权重 wᵥ=1.5' : '视频噪声较低，音频损失权重 wₐ=1.5'}；两个权重不会同时增大。`,cls:'good'};
    if (moduleId === '8.1') return {text:selectedNode === 'video' ? '蓝色：联合训练阶段保持视频骨干冻结；该训练状态不可切换。' : '绿色：所选组件、下游路径及其训练状态同步突出显示。',cls:selectedNode === 'video' ? '' : 'good'};
    if (moduleId === '9.1') return mode === 'A2V' || mode === 'V2A' ? {text:'蓝色：论文为该方向提供定性样例，不应与 Table 1 的定量结果等同。',cls:''} : {text:'绿色：该任务可在 Table 1 对应协议内进行指标比较。',cls:'good'};
    if (raceStart === null) return {text:'请选择同一协议下的指标，并确认指标方向。',cls:''};
    if (metric === 'LSE-C') return {text:'蓝色：TI2AV 的 LSE-C 中，LTX-2 为 3.45，高于 Unison 的 3.30；Unison 并非所有指标最优。',cls:''};
    return {text:metric === 'PQ' ? '绿色：TI2AV 中 Unison 的 PQ 6.34 为该表最高。' : metric === 'DS' ? '绿色：TI2AV 中 Unison 的 DS 0.08 为该表最低。' : '绿色：用户总体排名中 Unison 为 1.68（越低越好），但唇音单项仍落后于 LTX-2。',cls:'good'};
  };

  const fb = feedback();
  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} aria-label={`Unison 交互模块 ${chapterId}-${moduleId}`} style={moduleId === '5.1' ? {cursor:'grab', touchAction:'none'} : undefined} />
      {controls()}
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default UnisonActive;
