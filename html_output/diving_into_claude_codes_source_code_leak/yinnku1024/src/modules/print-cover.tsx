import React, { useRef } from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import { INK, Sheet } from './kit';

/* 封面对比：左边是"只看成品"的黑盒，右边是"能翻的校样"。
   两侧共用同一个 6 秒时钟，保证"从外到内"这件事是在同一段时间里发生的。 */
export function PrintCover({ moduleId }: { chapterId: string; moduleId: string }) {
  const { progress } = useCoverPlayback();
  const previous = useRef(0);
  const finished = useRef(false);
  if (progress < previous.current) finished.current = true;
  previous.current = progress;
  const t = finished.current ? 1 : Math.max(0, Math.min(1, (progress - 0.08) / 0.74));
  return moduleId === 'newMethod' ? <OpenProof t={t} /> : <ClosedBook t={t} />;
}

function ClosedBook({ t }: { t: number }) {
  const lensX = 168 + 14 * Math.sin(t * Math.PI * 2);
  const lensY = 78 + 168 * t;
  return (
    <svg viewBox="0 0 664 360" role="img" aria-label="合上的书，放大镜只能看到封面">
      <rect x="40" y="300" width="584" height="16" rx="8" fill={INK.wood} opacity="0.22" />
      <g>
        <rect x="196" y="54" width="272" height="238" rx="10" fill="#2f3f57" stroke="#1b2738" strokeWidth="3" />
        <rect x="196" y="54" width="26" height="238" rx="10" fill="#243248" />
        <rect x="240" y="86" width="196" height="3" fill="#7e8ea6" />
        <text x="338" y="150" textAnchor="middle" fill="#c9d4e4" fontSize="30" fontFamily="inherit">未公开</text>
        <rect x="286" y="196" width="92" height="64" rx="8" fill="#45566f" stroke="#8fa0b8" strokeWidth="3" />
        <path d="M306 196 V182 Q306 160 332 160 Q358 160 358 182 V196" fill="none" stroke="#8fa0b8" strokeWidth="7" />
        <circle cx="332" cy="226" r="7" fill="#8fa0b8" />
      </g>
      <g transform={`translate(${lensX} ${lensY})`}>
        <circle r="56" fill="#cfe0f3" fillOpacity="0.35" stroke={INK.blue} strokeWidth="8" />
        <path d="M40 40 L82 82" stroke={INK.blue} strokeWidth="16" strokeLinecap="round" />
        <text x="0" y="14" textAnchor="middle" fill={INK.blue} fontSize="42" fontWeight="700">?</text>
      </g>
      <text x="332" y="342" textAnchor="middle" fill={INK.muted} fontSize="30">
        {t > 0.55 ? '封面之下，一个判断也看不见' : '只能从行为反推内部'}
      </text>
    </svg>
  );
}

function OpenProof({ t }: { t: number }) {
  const tabs = [
    { color: INK.blue, label: '判定' },
    { color: INK.green, label: '成本' },
    { color: INK.orange, label: '边界' },
  ];
  return (
    <svg viewBox="0 0 664 360" role="img" aria-label="摊开的校样，露出三处设计取舍">
      <rect x="40" y="300" width="584" height="16" rx="8" fill={INK.wood} opacity="0.22" />
      <path d="M332 74 Q238 54 120 78 L120 292 Q238 268 332 288 Z" fill={INK.paper} stroke={INK.edgeStrong} strokeWidth="3" />
      <path d="M332 74 Q426 54 544 78 L544 292 Q426 268 332 288 Z" fill={INK.paper} stroke={INK.edgeStrong} strokeWidth="3" />
      <path d="M332 74 V288" stroke={INK.edgeStrong} strokeWidth="3" />
      <Sheet x={150} y={104} w={150} h={150} tone={INK.edgeStrong} lines={4} />
      <Sheet x={360} y={104} w={150} h={150} tone={INK.edgeStrong} lines={3} />
      <g opacity={Math.max(0, Math.min(1, (t - 0.12) / 0.2))}>
        <rect x="196" y="126" width="86" height="26" rx="6" fill={INK.blue} opacity="0.85" />
        <rect x="196" y="166" width="112" height="26" rx="6" fill={INK.blue} opacity="0.45" />
      </g>
      <g opacity={Math.max(0, Math.min(1, (t - 0.34) / 0.2))}>
        <rect x="392" y="126" width="96" height="26" rx="6" fill={INK.green} opacity="0.8" />
        <rect x="392" y="166" width="70" height="26" rx="6" fill={INK.green} opacity="0.4" />
      </g>
      {tabs.map((tab, i) => {
        const appear = Math.max(0, Math.min(1, (t - (0.42 + i * 0.14)) / 0.14));
        return (
          <g key={tab.label} transform={`translate(${100 - 26 * (1 - appear)} ${96 + i * 62})`} opacity={appear}>
            <rect x="0" y="0" width="128" height="46" rx="8" fill={tab.color} />
            <text x="64" y="32" textAnchor="middle" fill="#fff" fontSize="30" fontWeight="700">{tab.label}</text>
          </g>
        );
      })}
      <g transform="translate(470 232) rotate(-8)" opacity={Math.max(0, Math.min(1, (t - 0.7) / 0.18))}>
        <rect x="0" y="0" width="118" height="52" rx="8" fill="none" stroke={INK.green} strokeWidth="4" />
        <text x="59" y="36" textAnchor="middle" fill={INK.green} fontSize="30" fontWeight="700">可读</text>
      </g>
      <text x="332" y="342" textAnchor="middle" fill={INK.muted} fontSize="30">
        {t > 0.55 ? '每一处取舍，都对应一段可读的代码' : '翻到校样页：取舍开始可见'}
      </text>
    </svg>
  );
}
