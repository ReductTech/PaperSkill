import React, { useEffect, useRef, useState } from 'react';
import { clamp, easeInOutQuad, setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = { bg: '#f5f8f0', desk: '#b8c9a7', dark: '#76906a', wood: '#92400e', blue: '#27446e', green: '#228d5c', frameGreen: '#63b887', red: '#c43f52', orange: '#d97706', purple: '#7c3aed', ink: '#21324a', muted: '#68778f', line: '#d7deea' };

function useCanvas(width: number, height: number, draw: (ctx: CanvasRenderingContext2D, t: number) => void, deps: React.DependencyList) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, width, height); } catch { return; }
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    let raf = 0;
    const tick = (time: number) => {
      draw(ctx, time / 1000);
      canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, deps);
  return ref;
}

function clear(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = C.desk; ctx.fillRect(0, h - 20, w, 20);
}

function receipt(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#fff'; ctx.strokeStyle = C.line; ctx.lineWidth = 1.5;
  ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = '#dfe5ec';
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x + 14, y + 18 + i * 16); ctx.lineTo(x + w - 14, y + 18 + i * 16); ctx.stroke(); }
  ctx.fillStyle = C.ink; ctx.font = '700 13px Segoe UI, sans-serif'; ctx.fillText('TEH  2026', x + 16, y + 35);
}

function magnifier(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, scale = 1) {
  ctx.strokeStyle = color; ctx.lineWidth = 5 * scale;
  ctx.beginPath(); ctx.arc(x, y, 24 * scale, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 18 * scale, y + 18 * scale); ctx.lineTo(x + 42 * scale, y + 42 * scale); ctx.stroke();
  ctx.lineCap = 'butt';
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = C.ink, align: CanvasTextAlign = 'left') {
  ctx.fillStyle = color; ctx.font = '600 12px Segoe UI, sans-serif'; ctx.textAlign = align; ctx.fillText(text, x, y); ctx.textAlign = 'left';
}

function ArchiveScene({ scene, side }: { scene: number; side?: 'old' | 'new' }) {
  const w = side ? 320 : 244;
  const h = side ? 150 : 130;
  const canvasRef = useCanvas(w, h, (ctx, t) => {
    clear(ctx, w, h);
    const p = (Math.sin(t * 2.1) + 1) / 2;
    receipt(ctx, side ? 28 : 18, side ? 24 : 20, side ? 176 : 144, side ? 92 : 78);
    if (side) {
      const old = side === 'old';
      const textStartX = 44;
      const textBaselineY = 59;
      const targetText = 'TEH  2026';
      ctx.font = '700 13px Segoe UI, sans-serif';
      const textMetrics = ctx.measureText(targetText);
      const textWidth = Math.ceil(textMetrics.width);
      const textAscent = Math.ceil(textMetrics.actualBoundingBoxAscent || 10);
      const textDescent = Math.ceil(textMetrics.actualBoundingBoxDescent || 3);
      const tightBox = {
        x: textStartX - 4,
        y: textBaselineY - textAscent - 4,
        width: textWidth + 8,
        height: textAscent + textDescent + 8,
      };
      const box = old
        ? { x: tightBox.x - 2, y: tightBox.y + 1, width: tightBox.width + 4, height: tightBox.height + 3 }
        : tightBox;
      ctx.strokeStyle = old ? C.red : C.frameGreen;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(box.x, box.y, box.width, box.height);
      const scanP = (t * .42) % 1;
      magnifier(ctx, textStartX + scanP * textWidth, textBaselineY - 3, old ? C.red : C.frameGreen, .42);
      label(ctx, old ? 'THE 2026' : 'TEH 2026', 218, 62, old ? C.red : C.green);
      label(ctx, old ? '语言改写' : '忠实转录', 218, 86, C.ink);
      return;
    }
    if (scene === 1) {
      magnifier(ctx, 58 + p * 78, 56, p > .72 ? C.green : C.blue, .68); label(ctx, '对准原字', 122, 111, C.green, 'center');
    } else if (scene === 2) {
      const x = 35 + p * 45; ctx.strokeStyle = C.blue; ctx.lineWidth = 3; ctx.strokeRect(x, 38, 96, 40); label(ctx, '框住一行', 122, 111, C.green, 'center');
    } else {
      ctx.save(); ctx.translate(112, 62); ctx.rotate(-.35 + p * .7); ctx.fillStyle = 'rgba(39,68,110,.16)'; ctx.strokeStyle = C.blue; ctx.lineWidth = 3; ctx.fillRect(-54, -7, 108, 14); ctx.strokeRect(-54, -7, 108, 14); ctx.restore(); label(ctx, '位置 / 内容', 122, 111, C.green, 'center');
    }
  }, [scene, side]);
  const ariaLabel = side === 'old'
    ? '通用VLM：红色检测框覆盖完整 TEH 2026，红色放大镜从左向右扫描；输出 THE 2026'
    : side === 'new'
      ? 'PP-OCRv6：浅绿色检测框覆盖完整 TEH 2026，浅绿色放大镜从左向右扫描；输出 TEH 2026'
      : '档案票据核验动画';
  return <canvas ref={canvasRef} width={w} height={h} role="img" aria-label={ariaLabel} />;
}

export const HeroOld: React.FC<WidgetProps> = () => <ArchiveScene scene={1} side="old" />;
export const HeroNew: React.FC<WidgetProps> = () => <ArchiveScene scene={1} side="new" />;
export const Analogy1: React.FC<WidgetProps> = () => <ArchiveScene scene={1} />;
export const Analogy2: React.FC<WidgetProps> = () => <ArchiveScene scene={2} />;
export const Analogy3: React.FC<WidgetProps> = () => <ArchiveScene scene={3} />;

export const Ch1Stress: React.FC<WidgetProps> = () => {
  const [difficulty, setDifficulty] = useState(25);
  const canvasRef = useCanvas(560, 250, (ctx) => {
    clear(ctx, 560, 250); receipt(ctx, 28, 36, 292, 154);
    const d = difficulty / 100;
    ctx.strokeStyle = C.green; ctx.lineWidth = 2; ctx.strokeRect(70, 80, 142, 38);
    ctx.strokeStyle = difficulty >= 70 ? C.red : difficulty >= 35 ? C.orange : C.blue; ctx.lineWidth = 3;
    ctx.strokeRect(70 + d * 34, 80 - d * 14, 142 - d * 24, 38 + d * 18);
    label(ctx, '真实文字区域', 70, 70, C.green); label(ctx, '通用输出框', 196, 137, difficulty >= 70 ? C.red : C.blue, 'center');
    const bars = [['定位偏移', d], ['字符改写', Math.max(0, d - .16)], ['计算负担', .86]] as const;
    bars.forEach(([name, v], i) => { const y = 62 + i * 48; label(ctx, name, 354, y); ctx.fillStyle = C.line; ctx.fillRect(354, y + 10, 160, 12); ctx.fillStyle = i === 2 ? C.orange : v > .62 ? C.red : C.blue; ctx.fillRect(354, y + 10, 160 * v, 12); });
    label(ctx, `难度 ${difficulty}`, 514, 218, C.orange, 'right');
  }, [difficulty]);
  const feedback = difficulty >= 70 ? ['输出通顺却已偏离图像证据', 'bad'] : difficulty >= 35 ? ['定位开始漂移，文字仍像真的', ''] : ['简单样本掩盖了专用能力差异', ''];
  return <div><canvas ref={canvasRef} width={560} height={250} /><div className="ctrl"><label>场景难度 <span className="val">{difficulty}</span></label><input aria-label="场景难度" type="range" min="0" max="100" value={difficulty} onChange={e => setDifficulty(Number(e.target.value))} /></div><div className={`feedback ${feedback[1]}`}>{feedback[0]}</div></div>;
};

export const Ch1Compare: React.FC<WidgetProps> = () => {
  const [run, setRun] = useState(0);
  const started = useRef(0);
  useEffect(() => { if (run) started.current = performance.now(); }, [run]);
  const canvasRef = useCanvas(560, 235, (ctx, t) => {
    clear(ctx, 560, 235); const elapsed = run ? clamp((t * 1000 - started.current) / 1800, 0, 1) : 0; const p = easeInOutQuad(elapsed);
    [0, 1].forEach(side => { const x = 20 + side * 278; receipt(ctx, x + 12, 45, 198, 120); const good = side === 1; ctx.strokeStyle = good ? C.green : C.red; ctx.lineWidth = 3; ctx.strokeRect(x + 45 + (good ? 0 : p * 22), 84, 104, 28); label(ctx, good ? '专用 OCR' : '通用改写', x + 110, 28, good ? C.green : C.red, 'center'); label(ctx, good ? 'TEH' : (p > .7 ? 'THE' : 'TEH'), x + 226, 103, good ? C.green : C.red); });
    label(ctx, run && p >= 1 ? '同源输入，目标不同' : '同一张票据', 280, 213, C.blue, 'center');
  }, [run]);
  return <div><canvas ref={canvasRef} width={560} height={235} /><div className="step-ctrl"><button onClick={() => setRun(v => v + 1)}>开始核验</button></div><div className={`feedback ${run ? 'good' : ''}`}>{run ? '专用模型把视觉证据放在语言顺滑之前。' : '两边从同一张票据开始。'}</div></div>;
};

export const Ch2Representation: React.FC<WidgetProps> = () => {
  const [width, setWidth] = useState(.62);
  const canvasRef = useCanvas(560, 260, (ctx) => {
    clear(ctx, 560, 260); receipt(ctx, 28, 24, 504, 88); const cropW = 120 + width * 250;
    ctx.strokeStyle = width < .45 ? C.red : width > .74 ? C.orange : C.blue; ctx.lineWidth = 3; ctx.strokeRect(76, 48, cropW, 38);
    label(ctx, '二维检测金字塔', 36, 145, C.ink); [4, 8, 16, 32].forEach((s, i) => { ctx.fillStyle = i === 0 ? C.blue : C.line; ctx.fillRect(36 + i * 58, 162 + i * 8, 48, 40 - i * 7); label(ctx, `${s}`, 60 + i * 58, 222, C.muted, 'center'); });
    label(ctx, '一维识别序列 B×C×1×W', 300, 145, C.ink); const tokens = Math.round(5 + width * 10); for (let i = 0; i < tokens; i++) { ctx.fillStyle = i % 2 ? C.blue : '#8aa0be'; ctx.fillRect(300 + i * (210 / tokens), 166, 12, 42); }
    label(ctx, `序列位置 ${tokens}`, 510, 226, C.orange, 'right');
  }, [width]);
  const cls = width < .45 ? 'bad' : width <= .74 ? 'good' : '';
  const msg = width < .45 ? '裁得太紧：序列缺字。' : width <= .74 ? '二维定位与一维序列同时可用。' : '背景变多：识别仍需边界鲁棒性。';
  return <div><canvas ref={canvasRef} width={560} height={260} /><div className="ctrl"><label>裁剪宽度 <span className="val">{Math.round(width * 100)}%</span></label><input aria-label="裁剪宽度" type="range" min="28" max="92" value={Math.round(width * 100)} onChange={e => setWidth(Number(e.target.value) / 100)} /></div><div className={`feedback ${cls}`}>{msg}</div></div>;
};

type MixerMode = 'legacy' | 'token' | 'channel' | 'full';
export const Ch3Mixers: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<MixerMode>('legacy');
  const modes: [MixerMode, string][] = [['legacy', '旧式串联'], ['token', '空间混合'], ['channel', '通道混合'], ['full', '完整 LCNetV4']];
  const canvasRef = useCanvas(560, 250, (ctx, t) => {
    clear(ctx, 560, 250); receipt(ctx, 24, 42, 210, 132); const pulse = .6 + .4 * Math.sin(t * 3);
    const nodes = [{x:286,w:105,name:'Token Mixer',key:'token'}, {x:425,w:105,name:'Channel Mixer',key:'channel'}];
    nodes.forEach(n => { const active = mode === n.key || mode === 'full'; ctx.fillStyle = active ? (n.key === 'token' ? `rgba(39,68,110,${.12 + pulse * .12})` : `rgba(217,119,6,${.12 + pulse * .12})`) : '#fff'; ctx.strokeStyle = active ? (n.key === 'token' ? C.blue : C.orange) : C.line; ctx.lineWidth = active ? 3 : 1.5; ctx.fillRect(n.x, 70, n.w, 72); ctx.strokeRect(n.x, 70, n.w, 72); label(ctx, n.name, n.x + n.w/2, 103, active ? (n.key === 'token' ? C.blue : C.orange) : C.muted, 'center'); });
    ctx.strokeStyle = mode === 'legacy' ? C.red : mode === 'full' ? C.green : C.line; ctx.lineWidth = mode === 'legacy' || mode === 'full' ? 4 : 2; ctx.beginPath(); ctx.moveTo(234, 106); ctx.lineTo(286, 106); ctx.moveTo(391,106); ctx.lineTo(425,106); ctx.stroke();
    label(ctx, mode === 'legacy' ? '职责耦合' : mode === 'full' ? '空间与通道可独立设计' : mode === 'token' ? '3×3 DW 聚合邻域' : 'C→2C→C', 408, 180, mode === 'legacy' ? C.red : mode === 'full' ? C.green : C.blue, 'center');
  }, [mode]);
  const feedback: Record<MixerMode, [string,string]> = { legacy:['旧式块把两类职责绑在一起。','bad'], token:['空间混合只处理邻域。',''], channel:['通道混合只处理每个位置的通道。',''], full:['拆分后可独立设计并保留残差。','good'] };
  return <div><canvas ref={canvasRef} width={560} height={250} /><div className="chip-row">{modes.map(([v,l]) => <button key={v} className={`chip ${mode===v?'selected':''}`} onClick={() => setMode(v)}>{l}</button>)}</div><div className={`feedback ${feedback[mode][1]}`}>{feedback[mode][0]}</div></div>;
};
