import { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';

const N = 50;
const X0 = 90;
const X1 = 1330;
const Y0 = 300;
const Y1 = 60;

const px = (i: number) => X0 + (i / (N - 1)) * (X1 - X0);
const py = (v: number) => Y0 - ((v + 1) / 2) * (Y0 - Y1);

const target = (i: number) => 0.34 * Math.sin((i / (N - 1)) * Math.PI * 1.6) + 0.12;
const rnd = (i: number) => {
  const x = Math.sin(i * 12.9898 + 4.1) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
};

function pathFor(k: number) {
  const amp = 1 - k / 10;
  const pts: string[] = [];
  for (let i = 0; i < N; i += 1) {
    const v = target(i) + amp * 0.92 * rnd(i);
    pts.push(`${i === 0 ? 'M' : 'L'}${px(i).toFixed(1)},${py(v).toFixed(1)}`);
  }
  return pts.join(' ');
}

export function FlowDenoise(_: { chapterId: string; moduleId: string }) {
  const [k, setK] = useState(0);
  const amp = 1 - k / 10;
  const tau = 1 - k / 10;
  const color = k === 0 ? '#c43f52' : k < 10 ? '#27446e' : '#228d5c';
  const feedback =
    k === 0
      ? '第 0 步：这是一整块纯噪声，还看不出任何动作。'
      : k < 10
      ? `第 ${k} 步：沿预测的向量场走一小段，抖动在退，轨迹开始连贯。`
      : '第 10 步：得到 50 步的连续动作块，再按 50 Hz 下发。';

  return (
    <div className="pi-col">
      <svg viewBox="0 0 1472 380" width="100%" height="380" role="img" aria-label="流匹配去噪过程">
        <rect width="1472" height="380" fill="#f7f3ec" />
        <line x1={X0} y1={Y0} x2={X1} y2={Y0} stroke="#d7deea" strokeWidth="2" />
        <line x1={X0} y1={Y1} x2={X0} y2={Y0} stroke="#d7deea" strokeWidth="2" />
        <text x={X0 - 12} y={Y1 + 6} fontSize="18" fill="#68778f" textAnchor="end">
          关节角
        </text>
        <text x={X1} y={Y0 + 28} fontSize="18" fill="#68778f" textAnchor="end">
          动作块内 50 步
        </text>

        <path d={pathFor(10)} fill="none" stroke="#228d5c" strokeWidth="3" strokeDasharray="8 6" opacity={k < 10 ? 0.45 : 1} />
        <path d={pathFor(k)} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" />

        {k < 10 &&
          [6, 16, 26, 36, 44].map((i) => {
            const v = target(i) + amp * 0.92 * rnd(i);
            const tv = target(i);
            return (
              <g key={i}>
                <line x1={px(i)} y1={py(v)} x2={px(i)} y2={py(tv)} stroke="#f07e47" strokeWidth="2" opacity="0.8" />
                <circle cx={px(i)} cy={py(tv)} r="3" fill="#f07e47" />
              </g>
            );
          })}

        <text x={X0 + 16} y="42" fontSize="20" fill="#21324a" fontWeight="700">
          红：当前含噪动作 a(τ,ω)　橙箭头：模型预测的向量场 ω − a　绿虚线：目标动作块
        </text>
      </svg>

      <div className="pi-row pi-row-tight">
        <label className="pi-slider">
          <span>去噪步数</span>
          <input type="range" min={0} max={10} step={1} value={k} onChange={(e) => setK(Number(e.target.value))} />
          <b>
            {k} / 10 步 · <SymbolHint meaning="流匹配时间索引，0 到 1；去噪越深 τ 越小。">τ</SymbolHint> = {tau.toFixed(2)}
          </b>
        </label>
        <div className="pi-stats">
          <span>剩余噪声幅度 <b>{amp.toFixed(2)}</b></span>
          <span>动作块 <b>50</b> 步</span>
        </div>
      </div>
      <p className="pi-feedback" style={{ color }}>
        {feedback}
      </p>
      <p className="pi-body pi-muted">
        后训练用流匹配表示动作分布：训练时用离散 FAST token 跑得快，推理时用这 10 步去噪换回连续动作。
        图上曲线是教学用的插值示意，不是真实模型输出。
      </p>
    </div>
  );
}
