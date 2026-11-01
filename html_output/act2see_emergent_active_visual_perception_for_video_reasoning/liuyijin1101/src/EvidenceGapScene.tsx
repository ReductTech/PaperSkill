import { useEffect, useState } from 'react';

type CupSceneProps = {
  time: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const progress = (time: number, start: number, end: number) => clamp((time - start) / (end - start), 0, 1);
const between = (start: number, end: number, amount: number) => start + (end - start) * amount;

/** One four-second teaching scene, evaluated at the exact sampled time. */
export function CupScene({ time }: CupSceneProps) {
  const t = Number.isFinite(time) ? clamp(time, 0, 4) : 0;
  const cupX = t < 2.4 ? 67 : t < 2.7 ? between(67, 164, progress(t, 2.4, 2.7)) : 164;
  const cupY = t < 2.2 ? 113 : t < 2.4 ? between(113, 74, progress(t, 2.2, 2.4))
    : t < 2.7 ? 74 : t < 2.95 ? between(74, 113, progress(t, 2.7, 2.95)) : 113;
  const holding = t >= 2.2 && t < 2.95;
  const reaching = t >= 1.85 && t < 2.2;
  const retracting = t >= 2.95 && t < 3.3;
  const handX = t < 1.85 ? 292 : t < 2.2 ? between(292, 111, progress(t, 1.85, 2.2))
    : t < 2.95 ? cupX + 44 : t < 3.3 ? between(208, 292, progress(t, 2.95, 3.3)) : 292;
  const handY = t < 1.85 ? 112 : t < 2.2 ? between(112, 127, progress(t, 1.85, 2.2))
    : t < 2.95 ? cupY + 14 : t < 3.3 ? between(127, 112, progress(t, 2.95, 3.3)) : 112;
  const state = t < 1.85 ? '杯子静置在桌面' : t < 2.2 ? '手伸向杯子'
    : t < 2.4 ? '杯子被拿起' : t < 2.7 ? '杯子被拿起并移动'
      : t < 2.95 ? '杯子被放到桌面另一处' : '杯子已移动到桌面另一处';

  return <svg viewBox="0 0 360 220" role="img" aria-label={`${t.toFixed(2)} 秒：${state}。教学示意，非论文原始视频帧。`} style={{ display: 'block', width: '100%', height: 'auto' }}>
    <rect width="360" height="220" rx="9" fill="#f0f5f8"/>
    <rect x="0" y="0" width="360" height="151" fill="#e6eef4"/>
    <path d="M0 59H360" stroke="#d4e0e9" strokeWidth="2"/>
    <rect x="20" y="149" width="320" height="17" rx="3" fill="#a98c77"/>
    <rect x="30" y="166" width="12" height="54" fill="#806a5b"/>
    <rect x="318" y="166" width="12" height="54" fill="#806a5b"/>
    <path d="M20 151H340" stroke="#766557" strokeWidth="3"/>
    <circle cx="327" cy="59" r="18" fill="#f1c3a1" stroke="#c99478" strokeWidth="2"/>
    <path d="M306 88Q327 76 349 89L356 151H292Z" fill="#617f99"/>
    <path d="M311 101Q300 94 291 107" fill="none" stroke="#e5ad89" strokeWidth="16" strokeLinecap="round"/>
    <path d={`M292 107 Q${between(288, handX, 0.52).toFixed(1)} ${between(90, handY, 0.35).toFixed(1)} ${handX.toFixed(1)} ${handY.toFixed(1)}`} fill="none" stroke="#e5ad89" strokeWidth="13" strokeLinecap="round"/>
    <ellipse cx={cupX + 18} cy="151" rx={cupY < 105 ? 24 : 19} ry="4" fill="#66594f" opacity={cupY < 105 ? '.20' : '.32'}/>
    <g transform={`translate(${cupX.toFixed(1)} ${cupY.toFixed(1)})`}>
      <path d="M34 8Q53 4 51 18Q49 31 34 26" fill="none" stroke="#9e2c40" strokeWidth="6"/>
      <path d="M1 3H36L33 35H4Z" fill="#c43f52" stroke="#9e2c40" strokeWidth="2"/>
      <ellipse cx="18.5" cy="3" rx="18" ry="4" fill="#e47079" stroke="#9e2c40" strokeWidth="2"/>
      <path d="M7 12L9 28" stroke="#f4b2b6" strokeWidth="3" strokeLinecap="round" opacity=".72"/>
    </g>
    {(holding || reaching || retracting) && <circle cx={handX} cy={handY} r="8" fill="#f1c3a1" stroke="#c99478" strokeWidth="1.5"/>}
  </svg>;
}

/** The same scene plays continuously in §1.1; §1.2 evaluates exact still times. */
export function FullCupAnimation() {
  const [time, setTime] = useState(0);

  useEffect(() => {
    let frame = 0;
    const startedAt = performance.now();
    const animate = (now: number) => {
      setTime(((now - startedAt) / 1000) % 4);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return <div className="eg-video" role="img" aria-label="四秒循环教学动画：杯子最初在桌上，随后被拿起，向右移动并放到桌面另一处。教学示意，非论文原始视频。">
    <div className="eg-video-stage" aria-hidden="true"><CupScene time={time}/></div>
    <small className="eg-video-note">教学示意，非论文原始视频</small>
  </div>;
}
