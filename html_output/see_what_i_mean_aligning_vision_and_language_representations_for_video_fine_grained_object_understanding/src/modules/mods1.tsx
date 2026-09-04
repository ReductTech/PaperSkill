import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawFlower, drawFocusRing, drawHeat, drawGaussian, sceneLabel } from './kit';

const W = 560;
const H = 240;

// ===========================================================================
// Mod1Focus — Ch1 (P1 slider, hybrid): alignment supervision strength vs focus.
// ===========================================================================
export const Mod1Focus: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ s: 0.02, auto: false, elapsed: 0 });
  const lastFrameRef = useRef(0);
  const [val, setVal] = useState(0.02);
  const [auto, setAuto] = useState(false);
  const [fb, setFb] = useState({ text: '把「对齐监督强度」拉高，观察注意力如何从弥散变为聚焦。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    let raf = 0;
    const render = () => {
      const s = stateRef.current.s;
      clearScene(ctx, W, H);
      const fx = 170; const fy = 150;
      // Start with a deliberately broad, scene-level response. Supervision contracts
      // both the heat map and focus frame, while moving their centre onto the flower.
      const inv = 1 - s;
      const spread = 12 + inv * inv * 82;
      const focusY = fy - (16 + s * 20);
      const ringW = 19 + inv * inv * 68;
      const ringH = 14 + inv * inv * 50;
      drawFlower(ctx, fx, fy, 1.5, 0.4 + 0.6 * s);
      drawHeat(ctx, fx, focusY, spread, s > 0.6 ? C.green : s > 0.25 ? C.blue : C.red, 0, 0, 360, 218);
      drawFocusRing(ctx, fx, focusY, ringW, ringH, s > 0.6 ? C.green : s > 0.25 ? C.blue : C.red, 0.5);
      sceneLabel(ctx, '对焦范围', 14, 14, C.ink, 14);
      // technical inset: attention distribution curve
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.fillRect(360, 120, 186, 92);
      ctx.strokeRect(360, 120, 186, 92);
      const sigma = 9 + inv * inv * 62;
      drawGaussian(ctx, 453, 190, 60, sigma, s > 0.6 ? C.green : C.red, 362, 182);
      sceneLabel(ctx, '注意力分布', 372, 128, C.muted, 12);
      ctx.beginPath(); ctx.moveTo(362, 190); ctx.lineTo(544, 190); ctx.strokeStyle = C.border; ctx.stroke();
    };
    const tick = (now: number) => {
      if (!lastFrameRef.current) lastFrameRef.current = now;
      const dt = Math.min(0.05, (now - lastFrameRef.current) / 1000);
      lastFrameRef.current = now;
      if (stateRef.current.auto) {
        // 5.2s contraction + 1.2s hold. Then restart from the diffuse state.
        stateRef.current.elapsed = (stateRef.current.elapsed + dt) % 6.4;
        const raw = Math.min(1, stateRef.current.elapsed / 5.2);
        const eased = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
        stateRef.current.s = 0.02 + eased * 0.98;
        setVal(stateRef.current.s);
      }
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => cancelAnimationFrame(raf);
    const start = () => { raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => { stop(); disconnect(); };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const s = Number(e.target.value) / 100;
    stateRef.current.s = s;
    stateRef.current.auto = false;
    setAuto(false);
    setVal(s);
    setFb(
      s > 0.6
        ? { text: '显式对齐让物体名词的注意力牢牢聚焦到目标区域（绿，锐利）。', cls: 'good' }
        : s > 0.25
        ? { text: '监督仍不足，注意力开始发散（蓝，中间态）。', cls: '' }
        : { text: '几乎没有对齐监督，注意力像失焦一样弥散开（红）。', cls: 'bad' }
    );
  };

  const toggleAuto = () => {
    const next = !stateRef.current.auto;
    stateRef.current.auto = next;
    if (next) {
      stateRef.current.elapsed = 0;
      stateRef.current.s = 0.02;
      setVal(0.02);
      setFb({ text: '自动演示：注意力将从整体弥散逐渐收缩并聚焦到花朵。', cls: '' });
    }
    setAuto(next);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>对齐监督强度 <span className="val">{(val * 100).toFixed(0)}%</span></label>
        <input type="range" min={0} max={100} value={Math.round(val * 100)} onChange={onChange} />
        <button type="button" className="tiny ghost" onClick={toggleAuto}>{auto ? '暂停动画' : '播放动画'}</button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

// ===========================================================================
// Mod2Words — Ch2 (P5 clickable tokens, technical): word type vs focus range.
// ===========================================================================
const WORDS = [
  { id: 'man', label: '男人', kind: 'noun', heat: 86, x: 280, y: 128, color: C.red },
  { id: 'shirt', label: '衬衫', kind: 'noun', heat: 68, x: 280, y: 151, color: C.red },
  { id: 'cap', label: '棒球帽', kind: 'noun', heat: 58, x: 280, y: 70, color: C.red },
  { id: 'stripe', label: '条纹', kind: 'attr', heat: 18, x: 280, y: 152, color: C.green },
  { id: 'blue', label: '蓝色', kind: 'attr', heat: 17, x: 280, y: 67, color: C.green },
  { id: 'brown', label: '棕色', kind: 'attr', heat: 16, x: 268, y: 80, color: C.green },
];

export const Mod2Words: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ heat: 86, x: 280, y: 128, targetHeat: 86, targetX: 280, targetY: 128, color: C.red, label: '男人', kind: 'noun' });
  const [sel, setSel] = useState('man');
  const [fb, setFb] = useState({ text: '点击句子里的词，观察它对视觉区域的「对焦范围」。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    let raf = 0;
    const render = () => {
      const st = stateRef.current;
      st.heat += (st.targetHeat - st.heat) * 0.1;
      st.x += (st.targetX - st.x) * 0.1;
      st.y += (st.targetY - st.y) * 0.1;
      clearScene(ctx, W, H);
      // feature grid
      const gx = 40; const gy = 40; const cols = 8; const rows = 5; const cw = 56; const ch = 36;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        ctx.fillStyle = (r + c) % 2 ? '#eef3fb' : '#f6f8fc';
        ctx.fillRect(gx + c * cw, gy + r * ch, cw - 4, ch - 4);
      }
      // Minimal person feature map: cap/hair/head/beard/shirt stripes provide real
      // spatial referents for the prompt words used in the paper's Fig. 2 analysis.
      // Shoulders and striped shirt.
      ctx.fillStyle = '#e9edf4';
      ctx.beginPath(); ctx.moveTo(218, 208); ctx.quadraticCurveTo(220, 137, 251, 128); ctx.lineTo(309, 128); ctx.quadraticCurveTo(340, 137, 342, 208); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#6f8fbd'; ctx.lineWidth = 5;
      for (let yy = 141; yy < 204; yy += 15) { ctx.beginPath(); ctx.moveTo(224, yy); ctx.lineTo(336, yy); ctx.stroke(); }
      // Neck, ears and face.
      ctx.fillStyle = '#dca77f'; ctx.fillRect(267, 116, 26, 24);
      ctx.beginPath(); ctx.arc(253, 99, 6, 0, Math.PI * 2); ctx.arc(307, 99, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e7b58e'; ctx.beginPath(); ctx.ellipse(280, 98, 27, 32, 0, 0, Math.PI * 2); ctx.fill();
      // Brown hair beneath a blue baseball cap.
      ctx.fillStyle = '#6b4636';
      ctx.beginPath(); ctx.arc(280, 87, 27, Math.PI, Math.PI * 2); ctx.lineTo(304, 96); ctx.quadraticCurveTo(298, 78, 280, 76); ctx.quadraticCurveTo(262, 78, 256, 96); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#5f82b3'; ctx.beginPath(); ctx.ellipse(280, 69, 35, 11, 0, Math.PI, Math.PI * 2); ctx.fill();
      ctx.fillRect(256, 62, 48, 10);
      ctx.beginPath(); ctx.ellipse(308, 73, 23, 5, 0.08, 0, Math.PI * 2); ctx.fill();
      // Eyes, nose, mouth and beard make the figure immediately human-readable.
      ctx.fillStyle = '#26364c'; ctx.beginPath(); ctx.arc(270, 96, 2, 0, Math.PI * 2); ctx.arc(290, 96, 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#b77b5c'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(280, 98); ctx.lineTo(277, 107); ctx.lineTo(282, 107); ctx.stroke();
      ctx.fillStyle = '#65463b'; ctx.beginPath(); ctx.ellipse(280, 115, 19, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e7b58e'; ctx.beginPath(); ctx.ellipse(280, 111, 12, 5, 0, 0, Math.PI * 2); ctx.fill();

      drawHeat(ctx, st.x, st.y, st.heat, st.color, cols * cw, rows * ch, gx, gy);
      // Explicit token-cell heat map. This is intentionally stronger than the soft
      // glow so the attention distribution remains legible on every display.
      ctx.save();
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const cellX = gx + c * cw;
        const cellY = gy + r * ch;
        const px = cellX + (cw - 4) / 2;
        const py = cellY + (ch - 4) / 2;
        const dx = px - st.x;
        const dy = py - st.y;
        const sigma = Math.max(10, st.heat * 0.72);
        const intensity = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
        ctx.globalAlpha = 0.08 + intensity * 0.78;
        ctx.fillStyle = st.color;
        ctx.fillRect(cellX, cellY, cw - 4, ch - 4);
        if (intensity > 0.42) {
          ctx.globalAlpha = 0.45 + intensity * 0.4;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(cellX + 1, cellY + 1, cw - 6, ch - 6);
        }
      }
      ctx.restore();
      // High-contrast attention contours remain visible over every feature color.
      ctx.save();
      ctx.strokeStyle = st.color;
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 4;
      [1, 0.68, 0.38].forEach((scale, index) => {
        ctx.globalAlpha = 0.95 - index * 0.22;
        ctx.beginPath();
        ctx.ellipse(st.x, st.y, Math.max(7, st.heat * scale), Math.max(6, st.heat * scale * 0.7), 0, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      ctx.fillStyle = st.color;
      ctx.beginPath(); ctx.arc(st.x, st.y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = C.border; ctx.lineWidth = 1;
      ctx.strokeRect(gx, gy, cols * cw, rows * ch);
      sceneLabel(ctx, `「${st.label}」`, gx, gy - 25, st.color, 13);
      sceneLabel(ctx, st.kind === 'attr' ? '局部、锐利' : '宽泛、弥散', 420, gy - 25, st.color, 12);
    };
    const tick = () => { render(); if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready'); raf = requestAnimationFrame(tick); };
    const stop = () => cancelAnimationFrame(raf);
    const start = () => { raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => { stop(); disconnect(); };
  }, []);

  const pick = (w: typeof WORDS[number]) => {
    stateRef.current.targetHeat = w.heat;
    stateRef.current.targetX = w.x;
    stateRef.current.targetY = w.y;
    stateRef.current.color = w.color;
    stateRef.current.label = w.label;
    stateRef.current.kind = w.kind;
    setSel(w.id);
    setFb(
      w.kind === 'noun'
        ? { text: `「${w.label}」是物体名词，注意力弥散，说明缺对齐监督。`, cls: 'bad' }
        : { text: `「${w.label}」是属性词，注意力锐利且局部，天然对得上。`, cls: 'good' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {WORDS.map((w) => (
          <button key={w.id} className={`chip ${sel === w.id ? 'selected' : ''}`} onClick={() => pick(w)}>
            {w.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

// ===========================================================================
// Mod3Compare — Ch3 (P3 synchronized comparison, technical): attr vs noun.
// ===========================================================================
export const Mod3Compare: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t0Ref = useRef<number>(0);
  const [run, setRun] = useState(false);
  const [fb, setFb] = useState({ text: '点击开始，让左右两张「对焦图」从同一时刻同步生成。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    let raf = 0;
    const render = (t: number) => {
      const prog = run ? Math.min(1, t / 1.6) : 0;
      clearScene(ctx, W, H);
      const halfW = W / 2 - 10;
      // left: attribute word (sharp, green)
      const lx = 14 + halfW / 2; const ly = 130;
      const lspread = 10 + (1 - prog) * 34;
      drawHeat(ctx, lx, ly, lspread, C.green, 14, 10, halfW, 210);
      sceneLabel(ctx, '属性词 · 锐利', 24, 16, C.green, 14);
      ctx.strokeStyle = C.border; ctx.lineWidth = 1; ctx.strokeRect(14, 10, halfW, 210);
      // right: object noun (diffuse, red)
      const rx = 14 + halfW + 20 + halfW / 2; const ry = 130;
      const rspread = 12 + (1 - prog) * 44;
      drawHeat(ctx, rx, ry, rspread, C.red, 14 + halfW + 20, 10, halfW, 210);
      sceneLabel(ctx, '物体名词 · 弥散', 24 + halfW + 20, 16, C.red, 14);
      ctx.strokeStyle = C.border; ctx.strokeRect(14 + halfW + 20, 10, halfW, 210);
      if (prog >= 1) {
        ctx.fillStyle = C.ink;
        sceneLabel(ctx, '同一画面，两种词的对焦范围明显不同', 24, 232, C.ink, 13);
      }
    };
    const tick = () => {
      if (run) render((performance.now() - t0Ref.current) / 1000);
      else render(0);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => cancelAnimationFrame(raf);
    const start = () => { raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => { stop(); disconnect(); };
  }, [run]);

  const start = () => {
    t0Ref.current = performance.now();
    setRun(true);
    setFb({ text: '属性词激活集中成尖峰（绿），物体名词激活弥散（红）——这就是系统性错位。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny" onClick={start}>{run ? '重新播放对比' : '开始对比'}</button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
