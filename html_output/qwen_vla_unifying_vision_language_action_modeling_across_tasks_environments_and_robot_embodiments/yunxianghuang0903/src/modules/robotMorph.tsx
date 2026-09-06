import React, { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../lib/motion';

export type RobotKind = 'widowx' | 'aloha' | 'nav';

const VIEW = '0 0 120 80';

export function RobotSvgDetailed({
  kind,
  className = '',
  style,
}: {
  kind: RobotKind;
  className?: string;
  style?: React.CSSProperties;
}) {
  if (kind === 'widowx') {
    return (
      <svg viewBox={VIEW} className={className} style={style} aria-hidden="true">
        <rect x="38" y="52" width="44" height="14" rx="4" fill="#b8c9a7" stroke="#76906a" strokeWidth="1.5" />
        <path d="M60 52V38M60 38L78 24M60 38L42 24" stroke="#34476f" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="78" cy="24" r="6" fill="#d97706" stroke="#34476f" strokeWidth="1.5" />
        <rect x="36" y="22" width="8" height="8" rx="2" fill="#76906a" />
      </svg>
    );
  }
  if (kind === 'aloha') {
    return (
      <svg viewBox={VIEW} className={className} style={style} aria-hidden="true">
        <rect x="42" y="48" width="36" height="10" rx="3" fill="#dce6d5" stroke="#76906a" strokeWidth="1.5" />
        <path d="M18 40L42 48M102 40L78 48" stroke="#228d5c" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M18 40L10 22M102 40L110 22" stroke="#228d5c" strokeWidth="2.5" fill="none" />
        <circle cx="10" cy="22" r="5" fill="#d97706" />
        <circle cx="110" cy="22" r="5" fill="#d97706" />
      </svg>
    );
  }
  return (
    <svg viewBox={VIEW} className={className} style={style} aria-hidden="true">
      <rect x="22" y="50" width="76" height="14" rx="5" fill="#27446e" />
      <circle cx="32" cy="64" r="7" fill="#1a3050" stroke="#34476f" strokeWidth="1.5" />
      <circle cx="88" cy="64" r="7" fill="#1a3050" stroke="#34476f" strokeWidth="1.5" />
      <path d="M60 50V32" stroke="#34476f" strokeWidth="2.5" />
      <polygon points="60,20 72,32 48,32" fill="#d97706" opacity="0.9" />
      <circle cx="92" cy="28" r="4" fill="none" stroke="#d97706" strokeWidth="2" strokeDasharray="2 2" />
    </svg>
  );
}

/** Cross-fade robot transition — overlap ≤120ms, same slot. */
export function RobotTransition({ kind }: { kind: RobotKind }) {
  const [current, setCurrent] = useState(kind);
  const [previous, setPrevious] = useState<RobotKind | null>(null);
  const [phase, setPhase] = useState<'idle' | 'out' | 'in'>('idle');
  const currentRef = useRef(kind);
  currentRef.current = current;

  useEffect(() => {
    if (kind === currentRef.current) return;
    if (prefersReducedMotion()) {
      setCurrent(kind);
      setPrevious(null);
      setPhase('idle');
      return;
    }
    const prev = currentRef.current;
    setPrevious(prev);
    setPhase('out');
    const t1 = window.setTimeout(() => {
      setPrevious(null);
      setCurrent(kind);
      setPhase('in');
    }, 120);
    const t2 = window.setTimeout(() => setPhase('idle'), 420);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [kind]);

  const outStyle: React.CSSProperties =
    phase === 'out'
      ? { opacity: 0, transform: 'scale(0.98)', transition: 'opacity 120ms cubic-bezier(0.22,0.61,0.36,1), transform 120ms cubic-bezier(0.22,0.61,0.36,1)' }
      : { opacity: 0, pointerEvents: 'none' };

  const inStyle: React.CSSProperties =
    phase === 'in'
      ? { opacity: 1, transform: 'translateY(0)', transition: 'opacity 260ms cubic-bezier(0.22,0.61,0.36,1) 40ms, transform 260ms cubic-bezier(0.22,0.61,0.36,1) 40ms' }
      : phase === 'idle'
        ? { opacity: 1, transform: 'translateY(0)' }
        : { opacity: 0, transform: 'translateY(6px)' };

  return (
    <div className="robot-transition-slot">
      {previous ? (
        <RobotSvgDetailed kind={previous} className="robot-svg-layer robot-svg-out" style={outStyle} />
      ) : null}
      <RobotSvgDetailed kind={current} className="robot-svg-layer robot-svg-in" style={inStyle} />
    </div>
  );
}

export const EMB_DATA: Record<
  RobotKind,
  { label: string; prompt: string; sem: string; protocol: string }
> = {
  widowx: {
    label: 'WidowX',
    prompt: '单臂 · 操纵 · ΔEEF + gripper',
    sem: 'ΔEEF + gripper',
    protocol: '单臂机器人操纵',
  },
  aloha: {
    label: 'Mobile ALOHA',
    prompt: '双臂 · 操纵 · ΔEEF / joint',
    sem: 'ΔEEF / joint + gripper',
    protocol: '双臂机器人操纵',
  },
  nav: {
    label: 'VLN',
    prompt: '移动机器人 · waypoint',
    sem: 'Δx / Δy / Δθ',
    protocol: '视觉-语言导航',
  },
};

export const ROBOT_ORDER: RobotKind[] = ['widowx', 'aloha', 'nav'];
