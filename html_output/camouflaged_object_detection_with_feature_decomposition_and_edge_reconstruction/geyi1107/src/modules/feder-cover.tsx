import React from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import type { WidgetProps } from './registry';

function LeafField({ children }: { children: React.ReactNode }) {
    return <svg viewBox="0 0 660 330" role="img" aria-label="灌木叶片上的伪装昆虫">
        <rect width="660" height="330" fill="#edf3e8" />
        <path d="M0 230 Q120 130 250 220 T510 175 T660 210 V330 H0Z" fill="#b8c9a7" />
        <path d="M-40 120 Q110 35 245 122 T520 95 T720 135" fill="none" stroke="#76906a" strokeWidth="40" opacity=".65" />
        <path d="M0 278 Q130 220 260 286 T540 260 T700 285" fill="none" stroke="#63835e" strokeWidth="11" opacity=".65" />
        {children}
    </svg>;
}

function Insect({ x, y, visible, contour, scale = 1 }: { x: number; y: number; visible: number; contour: boolean; scale?: number }) {
    return <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={visible} aria-hidden="true">
        <ellipse cx="0" cy="8" rx="45" ry="17" fill="#667958" stroke={contour ? '#228d5c' : '#607052'} strokeWidth={contour ? 5 : 2} />
        <path d="M-34 4 L-66 -18 M-30 12 L-66 30 M34 4 L66 -18 M30 12 L66 30" stroke={contour ? '#228d5c' : '#607052'} strokeWidth={contour ? 5 : 3} strokeLinecap="round" />
        <path d="M-10 -7 Q0 -35 10 -7" fill="none" stroke={contour ? '#228d5c' : '#72835d'} strokeWidth="5" />
        {contour && <circle cx="0" cy="8" r="58" fill="none" stroke="#228d5c" strokeWidth="3" strokeDasharray="8 8" />}
    </g>;
}

export function FederCover({ moduleId }: WidgetProps) {
    const { progress } = useCoverPlayback();
    const feder = moduleId === 'newMethod';
    const reveal = feder ? Math.min(1, progress * 1.35) : Math.min(1, progress * .8);
    return <div style={{ display: 'grid', gap: 10, height: '100%', alignContent: 'center' }}>
        <div style={{ position: 'relative', border: `2px solid ${feder ? '#228d5c' : '#c43f52'}`, background: '#f5f8f0', borderRadius: 12, overflow: 'hidden' }}>
            <LeafField>
                {feder ? <>
                    <Insect x={330} y={170} visible={.92} contour={reveal > .4} scale={1 + reveal * .12} />
                    <path d={`M110 64 H${110 + reveal * 115} M110 78 H${110 + reveal * 76}`} stroke="#f07e47" strokeWidth="8" strokeLinecap="round" opacity={reveal} />
                    <path d={`M500 255 H${500 - reveal * 130} M500 270 H${500 - reveal * 84}`} stroke="#7c3aed" strokeWidth="7" strokeLinecap="round" opacity={reveal} />
                    <text x="28" y="38" fill="#27446e" fontSize="24" fontWeight="700">高低频线索</text>
                    <text x="490" y="305" fill="#7c3aed" fontSize="22" fontWeight="700">边缘辅助</text>
                </> : <>
                    <Insect x={330} y={170} visible={.22 + reveal * .08} contour={false} />
                    <rect x={250 + Math.sin(progress * 8) * 90} y="128" width="160" height="95" fill="none" stroke="#c43f52" strokeWidth="4" strokeDasharray="12 8" opacity=".85" />
                    <text x="28" y="38" fill="#c43f52" fontSize="24" fontWeight="700">背景相似，目标消失</text>
                </>}
            </LeafField>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#21324a', fontSize: 20 }}>
            <span>{feder ? '拆分线索，再补轮廓' : '只看整体，定位和边界都犹豫'}</span>
            <strong style={{ color: feder ? '#228d5c' : '#c43f52' }}>{reveal >= .85 ? (feder ? '轮廓锁定' : '仍未定位') : '观察中…'}</strong>
        </div>
    </div>;
}
