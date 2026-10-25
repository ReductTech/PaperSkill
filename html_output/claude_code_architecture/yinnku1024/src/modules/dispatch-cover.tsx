import React, { useRef } from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import { RW } from './kit';

/* 封面对比：左边是一条只跑一辆手推车的直线，右边是有信号机与调度台的图。
   两侧共用同一个 6 秒时钟，"从脚本到调度"发生在同一段时间里。 */
export function DispatchCover({ moduleId }: { chapterId: string; moduleId: string }) {
  const { progress } = useCoverPlayback();
  const previous = useRef(0);
  const finished = useRef(false);
  if (progress < previous.current) finished.current = true;
  previous.current = progress;
  const t = finished.current ? 1 : Math.max(0, Math.min(1, (progress - 0.08) / 0.74));
  return moduleId === 'newMethod' ? <DispatchBoard t={t} /> : <SingleCart t={t} />;
}

function SingleCart({ t }: { t: number }) {
  const x = 60 + 360 * t;
  return (
    <svg viewBox="0 0 664 360" role="img" aria-label="一辆手推车在单一轨道上从输入走到输出">
      <rect x="20" y="250" width="624" height="12" rx="4" fill={RW.rail} />
      <rect x="20" y="243" width="624" height="3" fill="#ffffff" opacity="0.6" />
      <g transform="translate(40 196)">
        <rect width="96" height="54" rx="6" fill={RW.panel} stroke={RW.lineStrong} strokeWidth="3" />
        <text x="48" y="36" textAnchor="middle" fill={RW.muted} fontSize="30">输入</text>
      </g>
      <g transform="translate(528 196)">
        <rect width="96" height="54" rx="6" fill={RW.panel} stroke={RW.lineStrong} strokeWidth="3" />
        <text x="48" y="36" textAnchor="middle" fill={RW.muted} fontSize="30">输出</text>
      </g>
      <g transform={`translate(${x} 186)`}>
        <rect width="120" height="46" rx="6" fill={RW.steel} opacity="0.18" />
        <rect width="120" height="46" rx="6" fill="none" stroke={RW.steel} strokeWidth="3" />
        <circle cx="28" cy="52" r="9" fill={RW.steelDark} />
        <circle cx="92" cy="52" r="9" fill={RW.steelDark} />
        <text x="60" y="32" textAnchor="middle" fill={RW.steelDark} fontSize="30">脚本</text>
      </g>
      <text x="332" y="330" textAnchor="middle" fill={RW.muted} fontSize="30">
        {t > 0.55 ? '没有中间站，也就没有地方放判断' : '输入进、输出出：唯一的路径'}
      </text>
    </svg>
  );
}

function DispatchBoard({ t }: { t: number }) {
  const posts = [150, 300, 450];
  return (
    <svg viewBox="0 0 664 360" role="img" aria-label="带信号机与调度台的调度图">
      <rect x="20" y="250" width="624" height="12" rx="4" fill={RW.rail} />
      <rect x="20" y="243" width="624" height="3" fill="#ffffff" opacity="0.6" />
      {posts.map((x, index) => {
        const on = t > 0.18 + index * 0.16;
        return (
          <g key={x} transform={`translate(${x} 210)`}>
            <rect x="-5" y="0" width="10" height="46" fill={RW.steel} />
            <circle cx="0" cy="-14" r="13" fill={on ? RW.green : '#ccd4de'} stroke={RW.steelDark} strokeWidth="3" />
            <text x="0" y="-40" textAnchor="middle" fill={on ? RW.green : RW.muted} fontSize="30">
              {index + 1}
            </text>
          </g>
        );
      })}
      <g transform={`translate(${40 + 300 * t} 186)`}>
        <rect width="96" height="46" rx="6" fill={RW.blue} opacity="0.16" />
        <rect width="96" height="46" rx="6" fill="none" stroke={RW.blue} strokeWidth="3" />
        <text x="48" y="32" textAnchor="middle" fill={RW.blue} fontSize="30">请求</text>
      </g>
      <g transform="translate(60 32)">
        <rect width="544" height="112" rx="8" fill={RW.panel} stroke={RW.lineStrong} strokeWidth="3" />
        <text x="20" y="34" fill={RW.muted} fontSize="30">调度台</text>
        {[0, 1, 2].map(row => (
          <g key={row}>
            <rect x="20" y={48 + row * 20} width={160 + 60 * row} height="8" rx="4" fill={RW.steel} opacity="0.35" />
            <rect x={200 + 60 * row} y={48 + row * 20} width={120} height="8" rx="4" fill={row === 0 && t > 0.5 ? RW.green : RW.lineStrong} opacity="0.8" />
          </g>
        ))}
      </g>
      <text x="332" y="330" textAnchor="middle" fill={RW.muted} fontSize="30">
        {t > 0.6 ? '每一站都有职责：错在哪一站，就修哪一站' : '把一条直线拆成有位置的图'}
      </text>
    </svg>
  );
}
