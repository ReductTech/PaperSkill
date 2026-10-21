import React from 'react';
import type { WidgetProps } from './registry';
import { useCanvas, C, FONT_SANS } from './kit';
import { makeScene, evaluate, toImageData, N } from './ir-scene';

// 封面左：自建合成红外帧上的局部对比检测（阈值固定为 0.70）。绿圈 = 命中目标，红圈 = 虚警。
export const HeroOld: React.FC<WidgetProps> = () => {
  const Wd = 460;
  const Ht = 236;
  const ref = useCanvas(
    Wd,
    Ht,
    (ctx) => {
      const s = makeScene();
      const e = evaluate(s, 0.7);
      ctx.fillStyle = C.plate;
      ctx.fillRect(0, 0, Wd, Ht);
      const off = document.createElement('canvas');
      off.width = N;
      off.height = N;
      const octx = off.getContext('2d');
      if (!octx) return;
      octx.putImageData(toImageData(octx, s.img), 0, 0);
      const size = 216;
      const ox = (Wd - size) / 2;
      const oy = 10;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, ox, oy, size, size);
      const k = size / N;
      for (const r of e.regions) {
        ctx.strokeStyle = r.matched ? C.greenD : C.redD;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(ox + (r.cx + 0.5) * k, oy + (r.cy + 0.5) * k, 7, 0, Math.PI * 2);
        ctx.stroke();
      }
    },
    []
  );
  return <canvas ref={ref} style={{ width: Wd, height: Ht }} role="img" aria-label="合成红外帧上的局部对比检测，绿圈为命中目标，红圈为虚警" />;
};

// 封面右：SCTransNet 的骨架示意（据 Fig.2 简化）。四条跳连都经过 SCTB；每个 SCTB 同时读取四层特征。
export const HeroNew: React.FC<WidgetProps> = () => {
  const ys = [42, 92, 142, 192];
  const ex = 70;
  const dx = 390;
  return (
    <svg viewBox="0 0 460 250" width="100%" style={{ display: 'block', background: C.paper }} role="img" aria-label="SCTransNet 骨架示意：编码器四层特征经 SCTB 交互后送回四个解码层">
      <defs>
        <marker id="hn-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,1 L9,5 L0,9 z" fill={C.muted} />
        </marker>
      </defs>
      <g fontFamily={FONT_SANS}>
        <text x={ex} y={16} textAnchor="middle" fill={C.muted} fontSize="12">编码器</text>
        <text x={dx} y={16} textAnchor="middle" fill={C.muted} fontSize="12">解码输出</text>
        {ys.map((y, i) => (
          <g key={i}>
            <path d={`M ${ex + 30} ${y} C 160 ${y}, 170 117, 200 117`} stroke={C.purple} strokeOpacity={0.7} strokeWidth={1.4} fill="none" />
            <path d={`M 260 117 C 290 117, 300 ${y}, ${dx - 32} ${y}`} stroke={C.purple} strokeOpacity={0.7} strokeWidth={1.4} fill="none" markerEnd="url(#hn-arr)" />
            <rect x={ex - 30} y={y - 15} width={60} height={30} rx={5} fill="#eef2f8" stroke={C.blue} strokeWidth={1.3} />
            <text x={ex} y={y + 5} textAnchor="middle" fill={C.blue} fontWeight={600} fontSize="14">
              E{'₁₂₃₄'[i]}
            </text>
            <rect x={dx - 30} y={y - 15} width={60} height={30} rx={5} fill="#eef6f1" stroke={C.green} strokeWidth={1.3} />
            <text x={dx} y={y + 5} textAnchor="middle" fill={C.green} fontWeight={600} fontSize="14">
              F{'₁₂₃₄'[i]}
            </text>
            {i < 3 ? <line x1={ex} y1={y + 15} x2={ex} y2={ys[i + 1] - 17} stroke={C.muted} markerEnd="url(#hn-arr)" /> : null}
            {i < 3 ? <line x1={dx} y1={ys[i + 1] - 15} x2={dx} y2={y + 17} stroke={C.muted} markerEnd="url(#hn-arr)" /> : null}
          </g>
        ))}
        <path d={`M ${ex} 207 C ${ex} 238, 210 238, 230 238 C 250 238, ${dx} 238, ${dx} 209`} stroke={C.muted} fill="none" markerEnd="url(#hn-arr)" />
        <rect x={200} y={80} width={60} height={74} rx={8} fill="#f3effc" stroke={C.purple} strokeWidth={1.6} />
        <text x={230} y={113} textAnchor="middle" fill={C.purple} fontWeight={700} fontSize="14">
          SCTB
        </text>
        <text x={230} y={133} textAnchor="middle" fill={C.purple} fontSize="12.5">
          × 4
        </text>
      </g>
    </svg>
  );
};
