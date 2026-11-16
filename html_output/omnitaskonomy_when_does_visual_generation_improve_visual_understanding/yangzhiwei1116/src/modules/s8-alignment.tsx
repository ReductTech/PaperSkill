import React, { useRef, useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f5f8f0', wood: '#92400e', woodSoft: '#f3e6d2', envL: '#b8c9a7', envD: '#76906a',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  ink: '#21324a', muted: '#68778f', line: '#d7deea',
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const OX = 236;
const OY = 404;
const LEN = 306;

export function S8Alignment(_props: WidgetProps) {
  const [angle, setAngle] = useState(30);
  const [deff, setDeff] = useState(16);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragging = useRef(false);

  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const score = Math.sqrt(deff) * cos;
  const tone = Math.abs(cos) < 0.15 ? C.blue : cos > 0 ? C.green : C.red;
  const tipX = OX + LEN * cos;
  const tipY = OY - LEN * Math.sin(rad);

  const setFromPointer = (event: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 700;
    const y = ((event.clientY - rect.top) / rect.height) * 500;
    const deg = (Math.atan2(OY - y, Math.max(x - OX, 1)) * 180) / Math.PI;
    setAngle(Math.round(clamp(deg, 0, 180)));
  };

  return (
    <div style={{ display: 'flex', gap: 28, width: 1472, height: 622 }}>
      <div style={{ flex: 1, background: C.bg, border: `2px solid ${C.line}`, borderRadius: 18, padding: '10px 14px', boxSizing: 'border-box' }}>
        <svg ref={svgRef} viewBox="0 0 700 500" width="700" height="500" role="application"
          aria-label={`两个梯度方向的夹角 ${angle} 度，余弦 ${cos.toFixed(3)}，对齐分数 ${score.toFixed(2)}`}
          style={{ cursor: 'ew-resize', touchAction: 'pan-y' }}
          onPointerDown={(event) => { dragging.current = true; event.currentTarget.setPointerCapture(event.pointerId); setFromPointer(event); }}
          onPointerMove={(event) => { if (dragging.current) setFromPointer(event); }}
          onPointerUp={() => { dragging.current = false; }}
          onPointerLeave={() => { dragging.current = false; }}>
          <line x1="60" y1={OY} x2="660" y2={OY} stroke={C.line} strokeWidth="2" />
          <line x1={OX} y1="40" x2={OX} y2="460" stroke={C.line} strokeWidth="2" />
          <circle cx={OX} cy={OY} r="6" fill={C.ink} />
          <line x1={OX} y1={OY} x2={OX + LEN} y2={OY} stroke={C.blue} strokeWidth="6" strokeLinecap="round" />
          <text x={OX + LEN + 10} y={OY + 8} fontSize="22" fill={C.blue}>u_I2T</text>
          <line x1={OX} y1={OY} x2={tipX} y2={tipY} stroke={C.orange} strokeWidth="6" strokeLinecap="round" />
          <circle cx={tipX} cy={tipY} r="10" fill={C.orange} />
          <text x={tipX + 12} y={tipY - 8} fontSize="22" fill={C.orange}>u_I2I</text>
          <path d={`M ${OX + 92} ${OY} A 92 92 0 0 0 ${OX + 92 * cos} ${OY - 92 * Math.sin(rad)}`} fill="none" stroke={C.ink} strokeWidth="2.5" />
          <text x={OX + 104 * Math.cos(rad / 2)} y={OY - 104 * Math.sin(rad / 2) + 8} fontSize="24" fill={C.ink}>θ={angle}°</text>
          <line x1={tipX} y1={tipY} x2={tipX} y2={OY} stroke={C.muted} strokeWidth="2" strokeDasharray="7 6" />
          <line x1={OX} y1={OY + 18} x2={tipX} y2={OY + 18} stroke={tone} strokeWidth="5" />
          <text x={(OX + tipX) / 2} y={OY + 46} fontSize="22" fill={tone} textAnchor="middle">投影长度 = cos θ = {cos.toFixed(2)}</text>
          <text x="60" y="60" fontSize="22" fill={C.muted}>拖动橙色箭头改变夹角；两条箭头都已是单位长度</text>
        </svg>
      </div>

      <div style={{ width: 660, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ padding: '16px 20px', background: '#fff', border: `2px solid ${C.line}`, borderRadius: 16 }}>
          <div style={{ fontSize: 26, lineHeight: 1.5, color: C.ink }}>
            <SymbolHint meaning="u_I2I：生成任务的梯度方向，已按 L2 归一化。">u_I2I</SymbolHint> 与{' '}
            <SymbolHint meaning="u_I2T：理解任务的梯度方向，同样已归一化；两者在同一参数块上比较。">u_I2T</SymbolHint> 的夹角决定同向程度，
            再乘上该参数块的 <SymbolHint meaning="d_eff：投影后梯度分布的有效维度，用来让不同参数块的分数可比。">d_eff</SymbolHint> 平方根：
          </div>
          <div style={{ fontSize: 30, fontFamily: 'ui-monospace, Consolas, monospace', color: C.ink, marginTop: 10, lineHeight: 1.5 }}>
            s = √d_eff · cos(θ)
            <br />
            <span style={{ color: tone, fontWeight: 700 }}>
              = √{deff} · {cos.toFixed(2)} = {score.toFixed(2)}
            </span>
          </div>
          <div style={{ fontSize: 20, color: C.muted, marginTop: 6 }}>
            <SymbolHint meaning="P：共享的无中心 PCA 方向矩阵，保留累计 99% 方差的主成分；余弦在这个子空间内计算。">P</SymbolHint>{' '}
            与 <SymbolHint meaning="s：对齐分数，无量纲；正为同向，负为反向。">s</SymbolHint> 的含义见悬停说明。
          </div>
        </div>

        <div style={{ padding: '14px 20px', background: '#fff', border: `2px solid ${C.line}`, borderRadius: 16 }}>
          <label htmlFor="angle" style={{ display: 'block', fontSize: 24, color: C.ink }}>夹角 θ：{angle}°</label>
          <input id="angle" type="range" min={0} max={180} step={1} value={angle}
            onChange={(event) => setAngle(Number(event.target.value))}
            style={{ width: '100%', accentColor: C.orange }} />
          <label htmlFor="deff" style={{ display: 'block', fontSize: 24, color: C.ink, marginTop: 10 }}>有效维度 d_eff：{deff}（示意域）</label>
          <input id="deff" type="range" min={1} max={48} step={1} value={deff}
            onChange={(event) => setDeff(Number(event.target.value))}
            style={{ width: '100%', accentColor: C.blue }} />
        </div>

        <div style={{ padding: '16px 20px', borderRadius: 16, background: '#fff', border: `2px solid ${tone}`, fontSize: 25, lineHeight: 1.5, color: C.ink, flex: 1 }}>
          {cos > 0.15
            ? `θ=${angle}° → cos≈${cos.toFixed(2)}，s≈${score.toFixed(2)}：两个任务要改的方向接近，更新互相加强。`
            : cos < -0.15
              ? `θ=${angle}° → cos≈${cos.toFixed(2)}，s≈${score.toFixed(2)}：方向相反，更新互相抵消，这类配对在论文里对应更差的迁移。`
              : `θ=${angle}° → cos≈${cos.toFixed(2)}，s≈${score.toFixed(2)}：接近正交，两个任务几乎不动同一批参数。`}
          <div style={{ fontSize: 21, color: C.muted, marginTop: 8 }}>
            二维夹角只是可视化；论文在 PCA 子空间里算高维余弦，d_eff 的取值域为示意。
          </div>
        </div>
      </div>
    </div>
  );
}
