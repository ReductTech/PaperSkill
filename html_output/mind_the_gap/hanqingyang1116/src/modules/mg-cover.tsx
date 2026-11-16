import React from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import { C, Cello, Fader, Mic, Meter, Tape, Track } from './studioKit';
import './studio.css';

/** 封面：同一段旋律两条轨——旧法一路狂录越录越偏；新法盯表停手，再另开一路近场。 */
export function MgCover({ moduleId }: { moduleId: string }) {
  const { progress } = useCoverPlayback();
  const isNew = moduleId === 'newMethod';
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const t = reduced ? 1 : Math.max(0, Math.min(1, progress));

  const drift = isNew ? Math.min(1, t / 0.42) : t;
  const cents = isNew ? -2 - 11 * drift : -2 - 34 * t;
  const stopped = isNew && t > 0.42;
  const nearOn = isNew && t > 0.45;
  const nearLevel = isNew ? Math.min(1, (t - 0.45) / 0.3) : 0;

  return (
    <div className="studio-cover">
      <svg viewBox="0 0 700 250" role="img" aria-label={isNew ? '盯住音分表，到阈值停手，再另开一路近场麦并合轨' : '一路持续试录，音分差越来越大，旧片段失真'}>
        <rect x="0" y="0" width="700" height="250" fill={C.bg} />
        <rect x="0" y="212" width="700" height="38" fill={C.light} opacity="0.5" />
        <path d="M0 212 H700" stroke={C.wood} strokeWidth="3" opacity="0.5" />
        {Array.from({ length: 9 }, (_, i) => (
          <rect key={i} x={14 + i * 78} y={12 + (i % 2) * 5} width={56} height={30} rx={5} fill={C.light} opacity={0.3} />
        ))}

        <Cello x={116} y={146} s={0.52} />
        <Mic x={182} y={62} s={0.46} color={C.blue} hang active={!isNew || t > 0.1} />
        <Mic x={54} y={140} s={0.4} color={C.green} hang={false} active={nearOn} />

        <Meter x={330} y={118} s={0.58} cents={cents} alpha={isNew ? 12 : null} label="两轨音分差" />

        <Track x={392} y={60} w={250} h={34} color={C.blue} amp={1} gap={isNew ? 0 : -0.12 * drift} seed={1} />
        <Track x={392} y={112} w={250} h={34} color={nearOn ? C.green : C.muted} amp={nearOn ? 0.9 : 0.1} gap={isNew ? 0.03 * nearLevel : -0.45} seed={3} />
        <text x={517} y={52} textAnchor="middle" fontSize={15} fill={C.muted}>参考轨</text>
        <text x={517} y={104} textAnchor="middle" fontSize={15} fill={C.muted}>近场轨</text>

        <Tape x={170} y={196} label={isNew ? (stopped ? '已停手 · 间隙稳住' : '正在试录') : t > 0.55 ? '旧片段已失真' : '持续试录'} tone={isNew ? (stopped ? 'green' : 'blue') : 'red'} w={150} />
        {isNew ? <Fader x={660} y={150} h={54} t={0.5 * nearLevel} color={C.green} label="β=4" /> : null}

        <text x={16} y={26} fontSize={16} fill={C.muted}>
          {isNew ? '先把偏差稳在出厂附近，再另开一路近场拾音' : '每一遍都更自信，但偏差一路走远'}
        </text>
      </svg>
    </div>
  );
}
