import React, { useMemo, useState } from 'react';
import { C, fmt } from './tailorKit';
import './tailor.css';

/** 确定性伪随机，保证拖动 λ 时点云只是“变形”，不是每帧乱跳 */
function makeRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** p2：旧类不留样衣，只按“尺码册”（µ、Σ）造替身；样本少时要用协方差收缩。 */
export function RapfGaussian() {
  const [lambda, setLambda] = useState(0.18);

  const base = { sxx: 0.78, sxy: 0.52, syy: 0.58 };
  const tr = base.sxx + base.syy;
  const sxx = (1 - lambda) * base.sxx + lambda * (tr / 2);
  const syy = (1 - lambda) * base.syy + lambda * (tr / 2);
  const sxy = (1 - lambda) * base.sxy;

  const mean = (sxx + syy) / 2;
  const rad = Math.sqrt(((sxx - syy) / 2) ** 2 + sxy * sxy);
  const l1 = Math.max(1e-4, mean + rad);
  const l2 = Math.max(1e-4, mean - rad);
  const angle = (0.5 * Math.atan2(2 * sxy, sxx - syy) * 180) / Math.PI;

  const cx = 610;
  const cy = 292;
  const rx = 128 * Math.sqrt(l1) * 1.35;
  const ry = 128 * Math.sqrt(l2) * 1.35;

  const points = useMemo(() => {
    const rand = makeRand(20240719);
    const chol11 = Math.sqrt(Math.max(1e-6, sxx));
    const chol21 = sxy / chol11;
    const chol22 = Math.sqrt(Math.max(1e-6, syy - chol21 * chol21));
    return Array.from({ length: 64 }, () => {
      const u1 = Math.max(1e-9, rand());
      const u2 = rand();
      const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const z2 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
      const dx = chol11 * z1;
      const dy = chol21 * z1 + chol22 * z2;
      return { x: cx + 128 * dx, y: cy - 128 * dy };
    });
  }, [sxx, sxy, syy, cx, cy]);

  const tone = lambda < 0.1 ? 'bad' : lambda > 0.72 ? 'warn' : 'ok';
  const feedback =
    lambda < 0.1
      ? '几乎不收缩：细类样本太少，协方差被噪声拉成一条线，连求逆都不稳。'
      : lambda > 0.72
      ? '收缩过头：椭球被抹成圆，类别原本的方向信息丢了，替身彼此难分。'
      : '收缩适中：既保证满秩可采样，又保留了“细长”的类别方向。';

  return (
    <div className="tailor-page">
      <div className="tailor-scene">
        <svg viewBox="0 0 900 560" role="img" aria-label={`收缩强度 ${lambda.toFixed(2)}，紫色采样点来自旧类的尺码册`}>
          <rect x="0" y="0" width="900" height="560" fill={C.bg} />

          {/* 尺码册 */}
          <g>
            <rect x={28} y={92} width={260} height={330} rx={14} fill="#fffdf7" stroke={C.wood} strokeWidth={3} />
            <path d="M28 132 H288" stroke={C.wood} strokeWidth={3} opacity="0.5" />
            <text x={158} y={122} textAnchor="middle" fontSize={24} fill={C.wood} fontWeight={700}>
              老款 · 尺码册
            </text>
            <text x={158} y={176} textAnchor="middle" fontSize={22} fill={C.ink}>
              箱龟
            </text>
            <ellipse cx={158} cy={244} rx={70} ry={40} transform="rotate(-20 158 244)" fill="none" stroke={C.red} strokeWidth={3} />
            <circle cx={158} cy={244} r={5} fill={C.red} />
            <text x={158} y={304} textAnchor="middle" fontSize={20} fill={C.muted}>
              µ（均值）Σ（协方差）
            </text>
            <text x={158} y={344} textAnchor="middle" fontSize={20} fill={C.muted}>
              没有样衣，只剩这两个数
            </text>
            <path d="M288 244 H360" stroke={C.orange} strokeWidth={4} strokeDasharray="8 6" />
            <path d="M348 236 L362 244 L348 252" fill={C.orange} />
          </g>

          {/* 特征平面 */}
          <rect x={372} y={96} width={500} height={380} rx={14} fill="#ffffff" stroke={C.line} strokeWidth={2} />
          <text x={388} y={128} fontSize={20} fill={C.muted}>
            特征平面（示意）
          </text>

          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} transform={`rotate(${angle} ${cx} ${cy})`} fill="none" stroke={C.orange} strokeWidth={3} strokeDasharray="9 7" />
          <circle cx={cx} cy={cy} r={5} fill={C.orange} />

          <defs>
            <clipPath id="rapf-plane-clip">
              <rect x={372} y={96} width={500} height={380} rx={14} />
            </clipPath>
          </defs>
          <g clipPath="url(#rapf-plane-clip)">
            {points
              .filter((pt) => pt.x > 380 && pt.x < 864 && pt.y > 104 && pt.y < 468)
              .map((pt, i) => (
                <circle key={i} cx={pt.x} cy={pt.y} r={5} fill={C.purple} opacity={0.75} />
              ))}
          </g>

          <circle cx={cx - 118} cy={cy + 96} r={11} fill="none" stroke={C.purple} strokeWidth={3} />
          <text x={cx - 118} y={cy + 140} textAnchor="middle" fontSize={20} fill={C.purple}>
            替身样本
          </text>

          <text x={24} y={524} fontSize={21} fill={C.muted}>
            虚线椭圆 = 当前协方差；紫点 = 按它采出的 64 个替身
          </text>
        </svg>
      </div>

      <aside className="tailor-side">
        <div className="tailor-panel">
          <h4>满秩与方向</h4>
          <p style={{ margin: 0 }}>旧类不留样衣，就记下均值与协方差，需要时按它采样。</p>
        </div>
        <label className="tailor-muted" htmlFor="lambda">
          协方差收缩强度 λ = {fmt(lambda)}
        </label>
        <input
          id="lambda"
          className="tailor-slider"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={lambda}
          onChange={(e) => setLambda(Number(e.target.value))}
        />
        <div className={`tailor-feedback ${tone}`}>{feedback}</div>
        <div className="tailor-src">
          论文只说明细类样本不足时按前作采用协方差收缩，未给出具体系数；此页的收缩公式与点云是教学示意。
        </div>
      </aside>
    </div>
  );
}
