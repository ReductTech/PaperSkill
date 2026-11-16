import React, { useRef, useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';

type Point = { x: number; y: number };
type Drag = 'a' | 'b' | null;

const initialA = { x: 290, y: 170 };
const initialB = { x: 290, y: 255 };
const testPoint = { x: 530, y: 210 };

function cosine(point: Point) {
  const denominator = Math.hypot(point.x - 340, point.y - 210) * Math.hypot(testPoint.x - 340, testPoint.y - 210);
  const dot = (point.x - 340) * (testPoint.x - 340) + (point.y - 210) * (testPoint.y - 210);
  return dot / Math.max(1, denominator);
}

export function RpCh3Ncm() {
  const [a, setA] = useState<Point>(initialA);
  const [b, setB] = useState<Point>(initialB);
  const [drag, setDrag] = useState<Drag>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const scoreA = cosine(a);
  const scoreB = cosine(b);
  const difference = Math.abs(scoreA - scoreB);
  const winner = scoreA >= scoreB ? 'A' : 'B';
  const separable = difference > 0.08;

  const move = (clientX: number, clientY: number) => {
    if (!drag || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = (clientX - rect.left) * 680 / rect.width;
    const y = (clientY - rect.top) * 420 / rect.height;
    const point = { x: Math.max(105, Math.min(575, x)), y: Math.max(75, Math.min(350, y)) };
    if (drag === 'a') setA(point);
    else setB(point);
  };

  const nudge = (point: Point, dx: number, dy: number) => ({
    x: Math.max(105, Math.min(575, point.x + dx)),
    y: Math.max(75, Math.min(350, point.y + dy)),
  });

  return (
    <div className="rp-widget rp-two-col rp-ncm-widget">
      <section className="rp-panel rp-canvas-panel">
        <div className="rp-panel-heading">
          <span>二维类均值平面</span>
          <strong>拖动橙色标记</strong>
        </div>
        <svg
          ref={svgRef}
          viewBox="0 0 680 420"
          role="img"
          aria-label="两个类均值与测试特征的二维余弦空间"
          onPointerMove={(event) => move(event.clientX, event.clientY)}
          onPointerUp={() => setDrag(null)}
          onPointerLeave={() => setDrag(null)}
        >
          <circle cx="340" cy="210" r="145" className="rp-radar-ring" />
          <circle cx="340" cy="210" r="95" className="rp-radar-ring" />
          <line x1="95" y1="210" x2="585" y2="210" className="rp-plane-axis" />
          <line x1="340" y1="45" x2="340" y2="375" className="rp-plane-axis" />
          <line x1="340" y1="210" x2={a.x} y2={a.y} className="rp-vector-line is-a" />
          <line x1="340" y1="210" x2={b.x} y2={b.y} className="rp-vector-line is-b" />
          <line x1="340" y1="210" x2={testPoint.x} y2={testPoint.y} className="rp-vector-line is-test" />
          <circle
            cx={a.x}
            cy={a.y}
            r="22"
            tabIndex={0}
            role="button"
            aria-label="类别 A 均值，可拖动或用方向键移动"
            className={`rp-prototype is-a ${drag === 'a' ? 'is-dragging' : ''}`}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              setDrag('a');
            }}
            onKeyDown={(event) => {
              if (!event.key.startsWith('Arrow')) return;
              event.preventDefault();
              setA(nudge(a, event.key === 'ArrowRight' ? 8 : event.key === 'ArrowLeft' ? -8 : 0,
                event.key === 'ArrowDown' ? 8 : event.key === 'ArrowUp' ? -8 : 0));
            }}
          />
          <circle
            cx={b.x}
            cy={b.y}
            r="22"
            tabIndex={0}
            role="button"
            aria-label="类别 B 均值，可拖动或用方向键移动"
            className={`rp-prototype is-b ${drag === 'b' ? 'is-dragging' : ''}`}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              setDrag('b');
            }}
            onKeyDown={(event) => {
              if (!event.key.startsWith('Arrow')) return;
              event.preventDefault();
              setB(nudge(b, event.key === 'ArrowRight' ? 8 : event.key === 'ArrowLeft' ? -8 : 0,
                event.key === 'ArrowDown' ? 8 : event.key === 'ArrowUp' ? -8 : 0));
            }}
          />
          <circle cx={testPoint.x} cy={testPoint.y} r="15" className="rp-test-point" />
          <text x={a.x + 28} y={a.y - 18} className="rp-svg-label is-a">cA</text>
          <text x={b.x + 28} y={b.y + 28} className="rp-svg-label is-b">cB</text>
          <text x={testPoint.x - 42} y={testPoint.y - 22} className="rp-svg-label is-test">f测试</text>
        </svg>
      </section>

      <section className="rp-panel rp-controls-panel">
        <div className="rp-score-pair rp-ncm-scores">
          <div>
            <span>类别 A 余弦</span>
            <i style={{ width: `${Math.max(3, (scoreA + 1) * 50)}%` }} />
            <b>{scoreA.toFixed(3)}</b>
          </div>
          <div>
            <span>类别 B 余弦</span>
            <i style={{ width: `${Math.max(3, (scoreB + 1) * 50)}%` }} />
            <b>{scoreB.toFixed(3)}</b>
          </div>
          <strong>{`分数差 ${difference.toFixed(3)} · 最近类 ${winner}`}</strong>
        </div>
        <div className="rp-formula-strip">
          <SymbolHint meaning="类别 y 的类均值向量">c_y</SymbolHint>
          {' · '}
          <SymbolHint meaning="测试特征向量">f_test</SymbolHint>
          {' · '}
          <SymbolHint meaning="最近类均值分类使用余弦相似度排序">s_y=cosine(f_test,c_y)</SymbolHint>
        </div>
        <button type="button" className="rp-secondary-button" onClick={() => { setA(initialA); setB(initialB); }}>
          重置位置
        </button>
        <div className={`rp-feedback ${separable ? 'is-green' : 'is-red'}`}>
          <strong>{separable ? '类别仍可分离' : '共同基线正在误导余弦'}</strong>
          <span>
            两个原型越靠近同一叶脉方向，余弦会一起升高而差值缩小。二维坐标和雷达环是教学构造。
          </span>
        </div>
      </section>
    </div>
  );
}
