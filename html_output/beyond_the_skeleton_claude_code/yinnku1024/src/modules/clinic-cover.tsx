import React, { useRef } from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import { HW } from './kit';

/* 封面对比：左边只有一张骨架 X 光片，右边是带脉搏曲线的完整体检报告。
   两侧共用 6 秒时钟：同一份代码，看得见的东西不一样。 */
export function ClinicCover({ moduleId }: { chapterId: string; moduleId: string }) {
  const { progress } = useCoverPlayback();
  const previous = useRef(0);
  const finished = useRef(false);
  if (progress < previous.current) finished.current = true;
  previous.current = progress;
  const t = finished.current ? 1 : Math.max(0, Math.min(1, (progress - 0.08) / 0.74));
  return moduleId === 'newMethod' ? <Report t={t} /> : <Xray t={t} />;
}

function Xray({ t }: { t: number }) {
  return (
    <svg viewBox="0 0 664 360" role="img" aria-label="只有骨架的 X 光片">
      <rect x="70" y="24" width="524" height="286" rx="10" fill="#1d2a38" />
      <rect x="70" y="24" width="524" height="286" rx="10" fill="none" stroke="#3c4a5c" strokeWidth="3" />
      <g stroke="#cfe0ef" strokeWidth="5" opacity={0.55 + 0.35 * t} fill="none" strokeLinecap="round">
        <path d="M332 60 V292" />
        {[0, 1, 2, 3, 4, 5].map(i => (
          <path key={i} d={`M332 ${86 + i * 34} Q${286 - i * 4} ${92 + i * 34} ${286 - i * 4} ${112 + i * 34} Q${286 - i * 4} ${132 + i * 34} 332 ${138 + i * 34}`} />
        ))}
        {[0, 1, 2, 3, 4, 5].map(i => (
          <path key={`r${i}`} d={`M332 ${86 + i * 34} Q${378 + i * 4} ${92 + i * 34} ${378 + i * 4} ${112 + i * 34} Q${378 + i * 4} ${132 + i * 34} 332 ${138 + i * 34}`} />
        ))}
      </g>
      <text x="332" y="342" textAnchor="middle" fill={HW.muted} fontSize="30">
        {t > 0.55 ? '骨架很清楚：循环、工具、权限管道' : '先看骨架：它是怎么搭起来的'}
      </text>
    </svg>
  );
}

function Report({ t }: { t: number }) {
  const points = Array.from({ length: 40 }, (_, i) => {
    const x = 40 + i * 13;
    const phase = i / 39;
    const visible = phase <= t;
    const y = 150 - Math.sin(phase * Math.PI * 6) * 26 - (i % 7 === 0 ? 16 : 0);
    return visible ? `${x},${y}` : null;
  }).filter(Boolean).join(' ');
  return (
    <svg viewBox="0 0 664 360" role="img" aria-label="带脉搏与指标的完整体检报告">
      <rect x="60" y="18" width="544" height="300" rx="10" fill="#ffffff" stroke={HW.lineStrong} strokeWidth="3" />
      <text x="86" y="58" fill={HW.ink} fontSize="30" fontWeight="700">体检报告</text>
      <text x="86" y="96" fill={HW.muted} fontSize="30">对象：Claude Code 2.1.88</text>
      {[0, 1, 2].map(i => (
        <rect key={i} x="86" y={116 + i * 26} width={230 - i * 40} height="8" rx="4" fill={HW.line} />
      ))}
      <polyline points={points} fill="none" stroke={HW.green} strokeWidth="4" strokeLinejoin="round" />
      <line x1="86" y1="150" x2="566" y2="150" stroke={HW.line} strokeDasharray="6 6" />
      {t > 0.55 && (
        <g opacity={Math.min(1, (t - 0.55) / 0.2)}>
          <rect x="86" y="196" width="470" height="1" fill={HW.line} />
          <text x="86" y="234" fill={HW.ink} fontSize="30">行为：验证独立于实现</text>
          <text x="86" y="272" fill={HW.ink} fontSize="30">成本：一条分界线省五位数</text>
          <g transform="translate(500 250) rotate(-6)">
            <rect width="118" height="46" rx="6" fill="none" stroke={HW.green} strokeWidth="4" />
            <text x="59" y="33" textAnchor="middle" fill={HW.green} fontSize="30" fontWeight="700">已阅</text>
          </g>
        </g>
      )}
      <text x="332" y="344" textAnchor="middle" fill={HW.muted} fontSize="30">
        {t > 0.6 ? '指标一起看：行为、睡眠、成本、安全' : '再看报告：它为什么这么想'}
      </text>
    </svg>
  );
}
