import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { SymbolHint } from '../components/SymbolHint';
import { AllBirds, C, LakeScene, TokenChip, clamp, dequantize, fmt, quantize, svgPoint } from './rex-kit';

const WIDTHS = [640, 1280, 2240];

export function S2Quantize(_: WidgetProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pt, setPt] = useState({ x: 476, y: 248 }); // scene coords 1000 × 560, on egret E3's head
  const [W, setW] = useState(2240);
  const [dragging, setDragging] = useState(false);
  const H = Math.round(W * 0.5625);
  const pxf = (pt.x / 1000) * W, pyf = (pt.y / 560) * H;
  const px = Math.round(pxf), py = Math.round(pyf);
  const kx = quantize(pxf, W), ky = quantize(pyf, H);
  const back = dequantize(kx, W);
  const err = Math.abs(pxf - back);
  const binPx = W / 1000;
  const move = (e: React.PointerEvent) => {
    if (!svgRef.current) return;
    const p = svgPoint(svgRef.current, e.clientX, e.clientY);
    setPt({ x: clamp(p.x, 0, 1000), y: clamp(p.y, 0, 560) });
  };
  const key = (e: React.KeyboardEvent) => {
    const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!d) return;
    e.preventDefault();
    setPt(p => ({ x: clamp(p.x + d[0] * (1000 / 999), 0, 1000), y: clamp(p.y + d[1] * (560 / 999), 0, 560) }));
  };
  const relDigits = [...String(kx).split(''), ',', ...String(ky).split('')];
  const absDigits = [...String(px).split(''), ',', ...String(py).split('')];
  return <div className="rx-page rx-s2">
    <div className="rx-s2-left">
      <div className="rx-ruler-labels rx-text rx-muted"><span>0</span><span>999</span></div>
      <svg ref={svgRef} viewBox="0 -50 1000 610" width="812" height="495" role="group" aria-label="拖动橙色标记，观察坐标如何变成词元"
        onPointerMove={e => dragging && move(e)} onPointerUp={() => setDragging(false)} onPointerLeave={() => setDragging(false)}>
        <rect x="0" y="-50" width="1000" height="50" fill="#ffffff" />
        <rect x="1" y="-40" width="998" height="22" fill="#f4f7fb" stroke={C.line} />
        {Array.from({ length: 11 }, (_, i) => <line key={i} x1={Math.min(999, Math.max(1, i * 100))} x2={Math.min(999, Math.max(1, i * 100))} y1="-40" y2="-18" stroke={C.muted} strokeWidth="2" />)}
        <rect x={Math.min(992, Math.max(0, kx * (1000 / 999) - 4))} y="-46" width="8" height="34" fill={C.orange} />
        <LakeScene><AllBirds /></LakeScene>
        <line x1={pt.x} x2={pt.x} y1="-18" y2={pt.y} stroke={C.orange} strokeWidth="2.5" strokeDasharray="8 6" />
        <line x1="0" x2={pt.x} y1={pt.y} y2={pt.y} stroke={C.orange} strokeWidth="2.5" strokeDasharray="8 6" />
        <g tabIndex={0} role="slider" aria-label="坐标点" aria-valuemin={0} aria-valuemax={999} aria-valuenow={kx}
          aria-valuetext={`x 词元 ${kx}，y 词元 ${ky}`} className="rx-drag" onKeyDown={key}
          onPointerDown={e => { (e.target as Element).setPointerCapture?.(e.pointerId); setDragging(true); move(e); }}>
          <circle cx={pt.x} cy={pt.y} r="34" fill="transparent" />
          <circle cx={pt.x} cy={pt.y} r="15" fill={C.orange} stroke="#fff" strokeWidth="4" />
        </g>
      </svg>
      <div className="rx-row rx-s2-widths" role="group" aria-label="图像宽度">
        <span className="rx-text">图像宽度</span>
        {WIDTHS.map(w => <button key={w} className={`rx-chip ${W === w ? 'is-on' : ''}`} aria-pressed={W === w} onClick={() => setW(w)}>{w} px</button>)}
      </div>
    </div>
    <div className="rx-s2-right">
      <div className="rx-formula rx-em">
        <SymbolHint meaning="k：坐标词元编号，取 0–999 中的一个整数，对应词表里的一个专用词元 <k>。"><i>k</i></SymbolHint> = round(
        <SymbolHint meaning="x：目标点的像素横坐标（纵坐标 y 用图像高度 H 同样处理）。"><i>x</i></SymbolHint> / <SymbolHint meaning="W：图像宽度（像素）。除以 W 后得到 0–1 之间的相对坐标，与分辨率无关。"><i>W</i></SymbolHint> × 999)
      </div>
      <p className="rx-text rx-muted">论文只说量化成 0–999，没写取整细节；这里用四舍五入示范。</p>
      <div className="rx-enc">
        <div><span className="rx-enc-name">专用词元</span><span className="rx-enc-toks"><TokenChip text={`<${kx}>`} kind="coord" /><TokenChip text={`<${ky}>`} kind="coord" /></span><b>2 个</b></div>
        <div><span className="rx-enc-name">相对·数字</span><span className="rx-enc-toks">{relDigits.map((d, i) => <TokenChip key={i} text={d} kind="text" />)}</span><b>{relDigits.length} 个</b></div>
        <div><span className="rx-enc-name">绝对坐标</span><span className="rx-enc-toks">{absDigits.map((d, i) => <TokenChip key={i} text={d} kind="faded" />)}</span><b>{absDigits.length} 个</b></div>
      </div>
      <div className="rx-mag" aria-label="当前坐标词元与相邻词元">
        {[-2, -1, 0, 1, 2].map(d => kx + d).filter(k => k >= 0 && k <= 999).map(k =>
          <span key={k} className={k === kx ? 'is-on' : ''}>{k}</span>)}
        <em className="rx-text rx-muted">每格 {fmt(binPx)} px</em>
      </div>
      <p className="rx-text" aria-live="polite">
        像素 ({px}, {py}) → 词元 <b className="rx-blue">&lt;{kx}&gt;&lt;{ky}&gt;</b>。换图像宽度，词元不变，绝对数字却变了。
        宽 {W} px 时一格 ≈ {fmt(binPx)} px，还原 x̂ = {fmt(back, 1)}，误差 {fmt(err, 2)} px（最多约半格）。
      </p>
    </div>
  </div>;
}
