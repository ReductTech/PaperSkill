import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 760;
const H = 230;
const C = { bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', route: '#92400e', blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47', purple: '#7c3aed', text: '#21324a', muted: '#68778f', axis: '#d7deea' };

function useCanvas(draw: (ctx: CanvasRenderingContext2D) => void) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    let raf = 0;
    const render = () => { ctx.clearRect(0, 0, W, H); draw(ctx); if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready'); };
    const tick = () => { render(); raf = requestAnimationFrame(tick); };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => { stop(); disconnect(); };
  }, [draw]);
  return ref;
}

function Scene({ variant = 0, active = 0.65 }: { variant?: number; active?: number }) {
  const ref = useCanvas((ctx) => {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    const t = Date.now() / 1000;
    ctx.fillStyle = C.light; ctx.fillRect(36, 36, 688, 156);
    ctx.strokeStyle = C.dark; ctx.lineWidth = 4; ctx.strokeRect(36, 36, 688, 156);
    ctx.fillStyle = C.text; ctx.font = '18px Segoe UI, sans-serif';
    if (variant === 0) {
      ctx.fillText('扫描覆盖', 54, 62); ctx.strokeStyle = C.route; ctx.lineWidth = 5; ctx.beginPath();
      ctx.moveTo(90, 160); ctx.lineTo(180, 92); ctx.lineTo(300, 145); ctx.lineTo(430, 75); ctx.lineTo(610, 142); ctx.stroke();
      const x = 90 + ((t * 100) % 500); ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(x, 140, 17, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.green; ctx.fillRect(570, 62, 90, 42); ctx.fillStyle = C.text; ctx.fillText('已覆盖', 580, 89);
    } else if (variant === 1) {
      ctx.fillText('表面融合', 54, 62); ctx.strokeStyle = C.route; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(110, 158); ctx.lineTo(210, 88); ctx.lineTo(350, 124); ctx.lineTo(505, 76); ctx.lineTo(650, 145); ctx.stroke();
      ctx.strokeStyle = C.blue; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(110, 152); ctx.lineTo(210, 82); ctx.lineTo(350, 118); ctx.lineTo(505, 70); ctx.lineTo(650, 139); ctx.stroke();
      ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(650, 145, 18 + active * 6, 0, Math.PI * 2); ctx.fill();
    } else if (variant === 2) {
      ctx.fillText('实例画笔', 54, 62); for (let i = 0; i < 8; i++) { ctx.fillStyle = [C.blue, C.green, C.orange, C.purple][i % 4]; ctx.fillRect(86 + (i % 4) * 145, 82 + Math.floor(i / 4) * 45, 112, 28); }
      const x = 142 + Math.sin(t) * 42; ctx.strokeStyle = C.red; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, 96, 24, 0, Math.PI * 2); ctx.stroke();
    } else if (variant === 3) {
      ctx.fillText('众包复核', 54, 62); for (let i = 0; i < 5; i++) { ctx.fillStyle = i < 3 ? C.green : C.orange; ctx.fillRect(92 + i * 118, 94, 78, 48); ctx.fillStyle = C.text; ctx.fillText(i < 3 ? '✓' : '?', 124 + i * 118, 125); }
      ctx.strokeStyle = C.blue; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(120, 170); ctx.lineTo(630, 170); ctx.stroke();
    } else if (variant === 4) {
      ctx.fillText('CAD 对齐', 54, 62); ctx.strokeStyle = C.dark; ctx.lineWidth = 4; ctx.strokeRect(180, 84, 240, 72); ctx.save(); ctx.translate(300 + Math.sin(t) * 32, 120); ctx.rotate(Math.sin(t * 0.7) * .15); ctx.fillStyle = C.green; ctx.fillRect(-92, -24, 184, 48); ctx.restore();
    } else if (variant === 5) {
      ctx.fillText('体素窗口', 54, 62); for (let z = 0; z < 3; z++) for (let x = 0; x < 8; x++) { ctx.strokeStyle = C.axis; ctx.strokeRect(90 + x * 48 - z * 10, 82 + z * 18, 40, 32); } ctx.strokeStyle = C.orange; ctx.lineWidth = 5; ctx.strokeRect(90 + ((t * 35) % 260), 82, 126, 68);
    } else if (variant === 6) {
      ctx.fillText('网络推理', 54, 62); const xs = [110, 280, 450, 620]; xs.forEach((x, i) => { ctx.fillStyle = i < 3 ? C.blue : C.green; ctx.fillRect(x, 104, 90, 38); if (i < 3) { ctx.strokeStyle = C.route; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 90, 123); ctx.lineTo(x + 170, 123); ctx.stroke(); } });
    } else if (variant === 7) {
      ctx.fillText('跨域检索', 54, 62); ctx.strokeStyle = C.route; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(100, 150); ctx.lineTo(240, 100); ctx.lineTo(380, 150); ctx.stroke(); ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(240, 100, 20, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(600, 112, 28, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = C.green; ctx.beginPath(); ctx.moveTo(260, 100); ctx.lineTo(570, 112); ctx.stroke();
    } else {
      ctx.fillText('档案核对', 54, 62); for (let i = 0; i < 3; i++) { ctx.fillStyle = i < 2 ? C.green : C.orange; ctx.fillRect(110 + i * 180, 92, 130, 55); ctx.fillStyle = C.text; ctx.fillText(i < 2 ? '通过' : '待查', 148 + i * 180, 125); }
    }
  });
  return <canvas ref={ref} width={W} height={H} aria-label="ScanNet 章节类比动画" />;
}

export const ScanNetAnalogy: React.FC<WidgetProps> = ({ chapterId }) => {
  const n = Number(chapterId.replace('chap-', '')) || 1;
  return <Scene variant={n - 1} active={0.8} />;
};
export const HeroContrast: React.FC<WidgetProps> = ({ moduleId }) => {
  const old = moduleId === 'old';
  const ref = useCanvas((ctx) => {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = C.light; ctx.fillRect(40, 45, 290, 125); ctx.fillRect(430, 45, 290, 125);
    ctx.strokeStyle = old ? C.red : C.green; ctx.lineWidth = 4; ctx.strokeRect(40, 45, 290, 125);
    ctx.strokeRect(430, 45, 290, 125);
    for (let i = 0; i < (old ? 5 : 18); i++) { const x = (old ? 60 : 445) + i * (old ? 48 : 15); ctx.fillStyle = old ? C.red : C.blue; ctx.fillRect(x, 92 + (i % 3) * 13, old ? 25 : 10, 8); }
    ctx.fillStyle = C.text; ctx.font = '18px Segoe UI, sans-serif'; ctx.fillText(old ? '局部、稀疏' : '连续、可标注', old ? 62 : 472, 35);
  });
  return <canvas ref={ref} width={W} height={H} aria-label={old ? '旧方法对比' : 'ScanNet 对比'} />;
};

function Bar({ x, y, w, h, value, color, label, max = 1, ctx }: { x: number; y: number; w: number; h: number; value: number; color: string; label: string; max?: number; ctx: CanvasRenderingContext2D }) {
  ctx.fillStyle = C.axis; ctx.fillRect(x, y, w, h); ctx.fillStyle = color; ctx.fillRect(x, y, w * clamp(value / max, 0, 1), h);
  ctx.fillStyle = C.text; ctx.font = '16px Segoe UI, sans-serif'; ctx.fillText(label, x, y - 7);
}

export const ScaleExplorer: React.FC<WidgetProps> = () => {
  const [v, setV] = useState(0.72);
  const setFromPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setV(clamp((e.clientX - rect.left) / rect.width, 0, 1));
  };
  const ref = useCanvas((ctx) => {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    Bar({ x: 70, y: 65, w: 280, h: 24, value: 0.05 + v * 0.1, color: C.red, label: '旧数据集：100 扫描', ctx });
    Bar({ x: 70, y: 125, w: 280, h: 24, value: v, color: C.green, label: 'ScanNet：1513 扫描', ctx });
    Bar({ x: 420, y: 65, w: 280, h: 24, value: 0.05 + v * 0.2, color: C.red, label: '旧：少量帧', ctx });
    Bar({ x: 420, y: 125, w: 280, h: 24, value: v * 0.95, color: C.blue, label: 'ScanNet：2.5M 帧', ctx });
    ctx.fillStyle = C.text; ctx.font = '18px Segoe UI, sans-serif'; ctx.fillText('覆盖程度', 70, 190);
  });
  return <><canvas ref={ref} width={W} height={H} onPointerDown={setFromPointer} onPointerMove={(e) => e.buttons > 0 && setFromPointer(e)} style={{ cursor: 'ew-resize' }} /><div className="ctrl"><label>覆盖强度 <span className="val">{Math.round(v * 100)}%</span></label><input aria-label="覆盖强度" type="range" min="0" max="100" value={Math.round(v * 100)} onChange={(e) => setV(Number(e.target.value) / 100)} /></div><div className={`feedback ${v > 0.55 ? 'good' : 'bad'}`}>{v > 0.55 ? '绿色区域说明：规模和标注开始形成可用监督。' : '红色区域说明：数据仍然太稀疏，难以支撑真实三维学习。'}</div></>;
};

export const CaptureExplorer: React.FC<WidgetProps> = () => {
  const [v, setV] = useState(0.65);
  const setFromPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setV(clamp((e.clientX - rect.left - 70) / (rect.width - 140), 0, 1));
  };
  const ref = useCanvas((ctx) => {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = C.dark; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(70, 160); ctx.lineTo(180, 90); ctx.lineTo(320, 130); ctx.lineTo(470, 70); ctx.lineTo(680, 120); ctx.stroke();
    const x = lerp(70, 680, v); const y = 160 - 42 * Math.sin(v * Math.PI * 3);
    ctx.fillStyle = v > 0.35 && v < 0.9 ? C.blue : C.red; ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.fill();
    Bar({ x: 70, y: 190, w: 610, h: 16, value: v > 0.35 && v < 0.9 ? 0.86 : 0.2, color: v > 0.35 && v < 0.9 ? C.green : C.red, label: '特征丰富度', ctx });
  });
  return <><canvas ref={ref} width={W} height={H} onPointerDown={setFromPointer} onPointerMove={(e) => e.buttons > 0 && setFromPointer(e)} style={{ cursor: 'crosshair' }} /><div className="ctrl"><label>扫描位置 <span className="val">{Math.round(v * 100)}%</span></label><input aria-label="扫描位置" type="range" min="0" max="100" value={Math.round(v * 100)} onChange={(e) => setV(Number(e.target.value) / 100)} /></div><div className={`feedback ${v > 0.35 && v < 0.9 ? 'good' : 'bad'}`}>{v > 0.35 && v < 0.9 ? '蓝色路径：继续移动，跟踪约束较稳定。' : '红色路径：纹理不足，建议换一个视角再扫。'}</div></>;
};

export const ReconstructionExplorer: React.FC<WidgetProps> = () => {
  const [drift, setDrift] = useState(0.25); const [fused, setFused] = useState(false);
  const ref = useCanvas((ctx) => {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = C.route; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(90, 160); ctx.lineTo(190, 80); ctx.lineTo(330, 105); ctx.lineTo(470, 65); ctx.lineTo(650, 150); ctx.stroke();
    ctx.strokeStyle = fused ? C.green : C.red; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(90 + drift * 35, 160); ctx.lineTo(190 + drift * 35, 80); ctx.lineTo(330 + drift * 35, 105); ctx.lineTo(470 + drift * 35, 65); ctx.lineTo(650 + drift * 35, 150); ctx.stroke();
    ctx.fillStyle = C.text; ctx.font = '18px Segoe UI, sans-serif'; ctx.fillText(fused ? '融合后：单层表面' : '漂移：双层表面', 70, 35);
  });
  return <><canvas ref={ref} width={W} height={H} /><div className="ctrl"><label>位姿误差 <span className="val">{Math.round(drift * 100)}%</span></label><input aria-label="位姿误差" type="range" min="0" max="100" value={Math.round(drift * 100)} onChange={(e) => { setDrift(Number(e.target.value) / 100); setFused(false); }} /><button onClick={() => setFused(true)}>自动融合</button></div><div className={`feedback ${fused ? 'good' : drift > 0.45 ? 'bad' : ''}`}>{fused ? '体积融合把多帧证据收成一个表面。' : drift > 0.45 ? '位姿漂移会制造重影和错位。' : '误差尚可，但仍需要融合。'}</div></>;
};

export const AnnotationExplorer: React.FC<WidgetProps> = () => {
  const [count, setCount] = useState(1);
  const paintAt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const col = Math.floor(clamp((e.clientX - rect.left - 80) / (rect.width - 160), 0, .999) * 3);
    const row = Math.floor(clamp((e.clientY - rect.top - 55) / 110, 0, .999) * 2);
    setCount(Math.max(count, row * 3 + col + 1));
  };
  const ref = useCanvas((ctx) => {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.fillStyle = C.light; ctx.fillRect(80, 55, 600, 110);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i < count ? [C.blue, C.green, C.orange, C.purple, C.red, C.dark][i] : '#eef2ea'; ctx.fillRect(100 + (i % 3) * 190, 70 + Math.floor(i / 3) * 50, 150, 30); }
    ctx.fillStyle = C.text; ctx.font = '18px Segoe UI, sans-serif'; ctx.fillText(`已标注片段：${count}/6`, 80, 35);
  });
  return <><canvas ref={ref} width={W} height={H} onPointerDown={paintAt} style={{ cursor: 'cell' }} /><div className="ctrl"><button onClick={() => setCount((c) => c >= 6 ? 1 : c + 1)}>涂下一片</button><span className="val">{count}/6</span></div><div className={`feedback ${count >= 4 ? 'good' : ''}`}>{count >= 4 ? '覆盖率达到可提交阈值。' : '点击表面片段进行标注，避免跨对象乱涂。'}</div></>;
};

export const CrowdExplorer: React.FC<WidgetProps> = () => {
  const [multi, setMulti] = useState(true);
  const ref = useCanvas((ctx) => {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    Bar({ x: 100, y: 70, w: 560, h: 26, value: multi ? 0.82 : 0.58, color: C.green, label: '覆盖率', ctx });
    Bar({ x: 100, y: 145, w: 560, h: 26, value: multi ? 0.9 : 0.64, color: multi ? C.blue : C.orange, label: '一致性检查机会', ctx });
  });
  return <><canvas ref={ref} width={W} height={H} /><div className="ctrl"><button onClick={() => setMulti(false)} className={!multi ? 'active' : ''}>单人快速标注</button><button onClick={() => setMulti(true)} className={multi ? 'active' : ''}>多工人复核</button></div><div className="feedback">{multi ? '复核增加成本，但给异常标签更多被发现的机会。' : '速度更快，覆盖和一致性检查都更弱。'}</div></>;
};

export const CadExplorer: React.FC<WidgetProps> = () => {
  const [x, setX] = useState(0.5); const [r, setR] = useState(0.5);
  const dragModel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = clamp((e.clientX - rect.left - 175) / 300, 0, 1);
    const py = clamp((e.clientY - rect.top - 65) / 100, 0, 1);
    setX(px); setR(py);
  };
  const ref = useCanvas((ctx) => {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = C.dark; ctx.lineWidth = 4; ctx.strokeRect(175, 65, 300, 100);
    ctx.save(); ctx.translate(325 + (x - 0.5) * 220, 115); ctx.rotate((r - 0.5) * 1.2); ctx.fillStyle = C.green; ctx.fillRect(-90, -28, 180, 56); ctx.restore();
    ctx.fillStyle = C.text; ctx.font = '18px Segoe UI, sans-serif'; ctx.fillText('扫描轮廓', 185, 45); ctx.fillText('候选 CAD', 530, 105);
  });
  return <><canvas ref={ref} width={W} height={H} onPointerDown={dragModel} onPointerMove={(e) => e.buttons > 0 && dragModel(e)} style={{ cursor: 'move' }} /><div className="ctrl"><label>位置</label><input aria-label="CAD 位置" type="range" min="0" max="100" value={Math.round(x * 100)} onChange={(e) => setX(Number(e.target.value) / 100)} /><label>旋转</label><input aria-label="CAD 旋转" type="range" min="0" max="100" value={Math.round(r * 100)} onChange={(e) => setR(Number(e.target.value) / 100)} /></div><div className={`feedback ${Math.abs(x - 0.5) < 0.08 && Math.abs(r - 0.5) < 0.08 ? 'good' : ''}`}>{Math.abs(x - 0.5) < 0.08 && Math.abs(r - 0.5) < 0.08 ? '候选模型与扫描轮廓基本重合。' : '在轮廓框内拖动模型，直接调整位置和方向。'}</div></>;
};

export const VoxelExplorer: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const ref = useCanvas((ctx) => {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); const ox = 160 + step * 32, oy = 70 + (step % 2) * 18;
    for (let z = 0; z < 4; z++) for (let y = 0; y < 4; y++) for (let x = 0; x < 5; x++) { const px = ox + x * 42 - z * 12, py = oy + y * 25 - z * 12; ctx.strokeStyle = (x === 2 && y === 2) ? C.orange : C.axis; ctx.strokeRect(px, py, 36, 20); }
    ctx.fillStyle = C.text; ctx.font = '18px Segoe UI, sans-serif'; ctx.fillText(`窗口偏移：${step}`, 70, 40); ctx.fillText('2×31×31×62', 560, 190);
  });
  return <><canvas ref={ref} width={W} height={H} /><div className="ctrl"><button onClick={() => setStep((s) => (s + 1) % 5)}>移动窗口</button><span className="val">表面占比 {step < 3 ? '≥2%' : '<2%'}</span></div><div className={`feedback ${step < 3 ? 'good' : 'bad'}`}>{step < 3 ? '样本满足表面占比与标注有效率条件。' : '该窗口太空，按论文条件会被丢弃。'}</div></>;
};

export const NetworkExplorer: React.FC<WidgetProps> = () => {
  const [node, setNode] = useState(0);
  const names = ['体素窗口', '卷积层', '中心列', '类别分数'];
  const shapes = ['2×31×31×62', '局部特征', '62 个体素', '21 类'];
  const chooseNode = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.round(clamp((e.clientX - rect.left - 90) / (rect.width * .72), 0, 1) * 3);
    setNode(i);
  };
  const ref = useCanvas((ctx) => {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 4; i++) { const x = 90 + i * 210; ctx.strokeStyle = i <= node ? C.blue : C.axis; ctx.lineWidth = i === node ? 6 : 3; ctx.fillStyle = i <= node ? '#dbe7f4' : '#fff'; ctx.fillRect(x, 86, 130, 60); ctx.strokeRect(x, 86, 130, 60); if (i < 3) { ctx.strokeStyle = i < node ? C.green : C.axis; ctx.beginPath(); ctx.moveTo(x + 130, 116); ctx.lineTo(x + 210, 116); ctx.stroke(); } ctx.fillStyle = C.text; ctx.font = '15px Segoe UI, sans-serif'; ctx.fillText(names[i], x + 12, 112); }
    ctx.fillStyle = C.muted; ctx.font = '16px Segoe UI, sans-serif'; ctx.fillText(shapes[node], 90, 45);
  });
  return <><canvas ref={ref} width={W} height={H} onPointerDown={chooseNode} style={{ cursor: 'pointer' }} /><div className="ctrl">{names.map((n, i) => <button key={n} onClick={() => setNode(i)} className={node === i ? 'active' : ''}>{n}</button>)}</div><div className="feedback">{node < 3 ? '蓝色路径：直接点击节点，追踪信息如何向中心列传播。' : '中心列得到 62 个体素的类别分数。'}</div></>;
};

export const LossExplorer: React.FC<WidgetProps> = () => {
  const [weighted, setWeighted] = useState(true);
  const ref = useCanvas((ctx) => {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    const vals = weighted ? [0.42, 0.55, 0.68, 0.76] : [0.8, 0.42, 0.18, 0.1];
    vals.forEach((v, i) => Bar({ x: 80 + i * 160, y: 175 - v * 120, w: 90, h: v * 120, value: 1, color: weighted ? C.green : C.red, label: ['墙', '椅子', '窗', '浴缸'][i], ctx }));
    ctx.fillStyle = C.text; ctx.font = '18px Segoe UI, sans-serif'; ctx.fillText(weighted ? '稀有类别获得更多学习信号' : '多数类别主导梯度', 80, 35);
  });
  return <><canvas ref={ref} width={W} height={H} /><div className="ctrl"><button onClick={() => setWeighted(false)} className={!weighted ? 'active' : ''}>普通损失</button><button onClick={() => setWeighted(true)} className={weighted ? 'active' : ''}>逆对数加权</button></div><div className={`feedback ${weighted ? 'good' : 'bad'}`}>{weighted ? '少数类不会被频率优势完全淹没。' : '常见类别占据大部分梯度。'}</div></>;
};

export const BenchmarkExplorer: React.FC<WidgetProps> = () => {
  const [train, setTrain] = useState<'ShapeNet' | 'SceneNN' | 'ScanNet'>('ScanNet');
  const vals = { ShapeNet: { scene: 68.2, scan: 39.5 }, SceneNN: { scene: 69.8, scan: 48.2 }, ScanNet: { scene: 78.8, scan: 74.9 } };
  const ref = useCanvas((ctx) => { const v = vals[train]; ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); Bar({ x: 100, y: 80, w: 560, h: 28, value: v.scene, color: C.blue, label: `SceneNN 测试：${v.scene.toFixed(1)}%`, max: 100, ctx }); Bar({ x: 100, y: 155, w: 560, h: 28, value: v.scan, color: C.green, label: `ScanNet 测试：${v.scan.toFixed(1)}%`, max: 100, ctx }); });
  return <><canvas ref={ref} width={W} height={H} /><div className="ctrl">{(['ShapeNet', 'SceneNN', 'ScanNet'] as const).map((n) => <button key={n} onClick={() => setTrain(n)} className={train === n ? 'active' : ''}>{n} 训练</button>)}</div><div className={`feedback ${train === 'ScanNet' ? 'good' : ''}`}>{train === 'ScanNet' ? '真实数据训练在两个真实测试集上都更有迁移力。' : '合成或小型真实集能学到局部规律，但跨域性能有限。'}</div></>;
};

export const ResultsExplorer: React.FC<WidgetProps> = () => {
  const [run, setRun] = useState(0);
  const ref = useCanvas((ctx) => { ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); const rows = [['体素标注', 73, '312 个测试场景'], ['分类·ScanNet', 74.9, '平均实例准确率'], ['混合训练', 76.6, 'ScanNet 测试']]; rows.forEach((r, i) => { const shown = run > i ? Number(r[1]) : 0; Bar({ x: 100, y: 48 + i * 52, w: 520, h: 25, value: shown, color: i === 0 ? C.blue : C.green, label: String(r[0]), max: 100, ctx }); if (run > i) { ctx.fillStyle = C.text; ctx.font = '16px Segoe UI, sans-serif'; ctx.fillText(`${r[1]}% · ${r[2]}`, 635, 66 + i * 52); } }); });
  return <><canvas ref={ref} width={W} height={H} /><div className="ctrl"><button onClick={() => setRun((r) => r >= 3 ? 0 : r + 1)}>开始核对</button><span className="val">{run}/3</span></div><div className={`feedback ${run === 3 ? 'good' : ''}`}>{run === 3 ? '三类基准都已显示，结论必须连同协议一起阅读。' : '逐项查看每个结果及其评估协议。'}</div></>;
};
