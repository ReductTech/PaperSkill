import React, { useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, Chips, Readouts, Feedback, Source, FONT_SANS, FONT_MONO } from './kit';

// 模块 5.2：位置编码遇到尺寸变化。训练裁剪为 256×256，嵌入网格为 16×16，绝对位置编码按这 16×16 个位置学习。
// 测试图像尺寸不同（§III-B2 提到测试阶段输入分辨率可变），“SSCA w PE”变体用插值缩放位置编码矩阵（§IV-E2）。
// 在右侧网格上拖动或点击一个位置，左侧显示它的编码由原网格中哪几个编码按什么权重混合而来。
// 插值方式原文未写明，这里以双线性插值（角点对齐）为例；编码数值本身未知，左图色块只代表“不同位置的不同编码”。

const SRC = 16;

export const PeLab: React.FC<WidgetProps> = () => {
  const [size, setSize] = useState(384);
  const n = size / 16;
  const [sel, setSel] = useState<[number, number]>([7, 9]);
  const r = Math.min(sel[0], n - 1);
  const c = Math.min(sel[1], n - 1);
  // 角点对齐的双线性映射
  const sy = n === 1 ? 0 : (r * (SRC - 1)) / (n - 1);
  const sx = n === 1 ? 0 : (c * (SRC - 1)) / (n - 1);
  const y0 = Math.floor(sy);
  const x0 = Math.floor(sx);
  const fy = sy - y0;
  const fx = sx - x0;
  const nb = [
    { y: y0, x: x0, w: (1 - fy) * (1 - fx) },
    { y: y0, x: Math.min(SRC - 1, x0 + 1), w: (1 - fy) * fx },
    { y: Math.min(SRC - 1, y0 + 1), x: x0, w: fy * (1 - fx) },
    { y: Math.min(SRC - 1, y0 + 1), x: Math.min(SRC - 1, x0 + 1), w: fy * fx },
  ].filter((p) => p.w > 1e-6);
  const maxW = Math.max(...nb.map((p) => p.w));

  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const W = 880;
  const H = 330;
  const L = { x: 40, y: 40, s: 240 };
  const R = { x: 520, y: 40, s: 240 };
  const cs = L.s / SRC;
  const cr = R.s / n;
  const hue = (y: number, x: number) => {
    const v = 0.5 + 0.25 * Math.sin((x / SRC) * Math.PI * 2) + 0.25 * Math.cos((y / SRC) * Math.PI * 1.5);
    const g = Math.round(225 - v * 120);
    return `rgb(${g},${g + 6},${g + 16})`;
  };
  const pick = (ev: React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.getBoundingClientRect();
    const px = ((ev.clientX - pt.left) / pt.width) * W;
    const py = ((ev.clientY - pt.top) / pt.height) * H;
    const cc = Math.floor((px - R.x) / cr);
    const rr = Math.floor((py - R.y) / cr);
    if (cc >= 0 && rr >= 0 && cc < n && rr < n) setSel([rr, cc]);
  };

  const cells = useMemo(() => {
    const out: JSX.Element[] = [];
    for (let y = 0; y < SRC; y++) for (let x = 0; x < SRC; x++) out.push(<rect key={`${y}-${x}`} x={L.x + x * cs} y={L.y + y * cs} width={cs} height={cs} fill={hue(y, x)} />);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exact = nb.length === 1;
  return (
    <div className="sx-lab">
      <Chips
        label="测试图像边长"
        value={size}
        onChange={(v) => setSize(v)}
        options={[256, 320, 384, 512].map((v) => ({ value: v, label: v === 256 ? '256（与训练相同）' : `${v}` }))}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        className="sx-diagram sx-draggable"
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as Element).setPointerCapture?.(e.pointerId);
          pick(e);
        }}
        onPointerMove={(e) => dragging.current && pick(e)}
        onPointerUp={() => (dragging.current = false)}
        role="img"
        aria-label="训练时的 16×16 位置编码网格与测试时插值后的网格"
      >
        <g fontFamily={FONT_SANS}>
          <text x={L.x + L.s / 2} y={24} textAnchor="middle" fontSize={12.5} fill={C.muted}>
            训练时学到的位置编码：16×16
          </text>
          <text x={R.x + R.s / 2} y={24} textAnchor="middle" fontSize={12.5} fill={C.muted}>
            测试时需要的位置编码：{n}×{n}
          </text>
          {cells}
          <rect x={L.x} y={L.y} width={L.s} height={L.s} fill="none" stroke={C.ink2} />
          {nb.map((p, i) => (
            <g key={i}>
              <rect x={L.x + p.x * cs} y={L.y + p.y * cs} width={cs} height={cs} fill={C.orange} fillOpacity={0.15 + 0.7 * (p.w / maxW)} stroke={C.orange} strokeWidth={1.5} />
            </g>
          ))}
          <circle cx={L.x + (sx + 0.5) * cs} cy={L.y + (sy + 0.5) * cs} r={3} fill={C.blue} />
          {Array.from({ length: n }, (_, y) =>
            Array.from({ length: n }, (_, x) => {
              const syy = n === 1 ? 0 : (y * (SRC - 1)) / (n - 1);
              const sxx = n === 1 ? 0 : (x * (SRC - 1)) / (n - 1);
              const ya = Math.floor(syy);
              const xa = Math.floor(sxx);
              const ty = syy - ya;
              const tx = sxx - xa;
              // 近似显示插值后的灰度（双线性）
              const v = (yy: number, xx: number) => 0.5 + 0.25 * Math.sin((xx / SRC) * Math.PI * 2) + 0.25 * Math.cos((yy / SRC) * Math.PI * 1.5);
              const xb = Math.min(SRC - 1, xa + 1);
              const yb = Math.min(SRC - 1, ya + 1);
              const val = (1 - ty) * ((1 - tx) * v(ya, xa) + tx * v(ya, xb)) + ty * ((1 - tx) * v(yb, xa) + tx * v(yb, xb));
              const g = Math.round(225 - val * 120);
              return <rect key={`${y}-${x}`} x={R.x + x * cr} y={R.y + y * cr} width={cr} height={cr} fill={`rgb(${g},${g + 6},${g + 16})`} />;
            })
          )}
          <rect x={R.x} y={R.y} width={R.s} height={R.s} fill="none" stroke={C.ink2} />
          <rect x={R.x + c * cr} y={R.y + r * cr} width={cr} height={cr} fill="none" stroke={C.blue} strokeWidth={2.2} />
          <path d={`M ${R.x - 12} ${R.y + (r + 0.5) * cr} C ${R.x - 90} ${R.y + (r + 0.5) * cr}, ${L.x + L.s + 80} ${L.y + (sy + 0.5) * cs}, ${L.x + (sx + 0.5) * cs + 8} ${L.y + (sy + 0.5) * cs}`} fill="none" stroke={C.blue} strokeOpacity={0.5} strokeDasharray="4 4" />
          <text x={R.x + R.s / 2} y={R.y + R.s + 26} textAnchor="middle" fontSize={12} fill={C.muted}>
            拖动或点击选择一个位置
          </text>
        </g>
      </svg>
      <Readouts
        cols={3}
        items={[
          { k: '所选位置', v: `(${r}, ${c})`, tone: 'blue' },
          { k: '映射到原网格', v: `(${sy.toFixed(2)}, ${sx.toFixed(2)})` },
          { k: '参与混合的原编码', v: nb.length, unit: '个', tone: exact ? 'green' : 'orange' },
        ]}
      />
      <Feedback tone={exact ? 'good' : 'warn'}>
        {exact ? (
          <>该位置正好落在原网格的格点上，直接使用一个学到的编码，没有混合。</>
        ) : (
          <>
            这个位置没有“自己的”编码，而是由原网格中 {nb.length} 个相邻编码按 {nb.map((p) => p.w.toFixed(2)).join(' / ')} 的权重混合而成。对只占一两个嵌入位置的小目标而言，它拿到的位置信息是邻近位置的折中。
          </>
        )}
      </Feedback>
      <Source>
        依据：§IV-E2 对 “SSCA w PE” 的描述（为适应不同尺寸的测试图像，用插值缩放位置编码矩阵）及作者对其性能下降的解释。SSCA 本身不使用位置编码（§III-B1）。插值方式、编码数值均为示意，原文未给出。
      </Source>
    </div>
  );
};
