import React from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import type { WidgetProps } from './registry';

const field = '#f5f8f0';
function CoverArt({ progress, joint }: { progress: number; joint: boolean }) {
	const p = Math.max(0, Math.min(1, progress));
	const accent = joint ? '#228d5c' : '#c43f52';
	return <svg className="run-viz" viewBox="0 0 900 430" role="img" aria-label={joint ? '掩码和 RGB 重建共同核验隐蔽区域' : '仅用掩码处理隐蔽区域'}>
		<rect width="900" height="430" fill={field} /><path d="M0 330Q160 210 300 300T600 260T900 320V430H0Z" fill="#b8c9a7" />
		<path d="M170 60Q220 45 270 65L290 355Q225 390 160 350Z" fill="#f3efe1" stroke="#76906a" strokeWidth="4" />
		<path d="M185 160Q230 100 275 165M175 230Q235 180 283 238M170 300Q230 255 285 310" fill="none" stroke="#9aab78" strokeWidth="36" />
		<path d={`M${185 - 12 * p} 190Q225 ${120 + 30 * p} 274 190L270 275Q223 ${325 - 12 * p} 182 275Z`} fill={joint ? '#228d5c88' : '#27446e77'} stroke={accent} strokeWidth="7" strokeDasharray={joint ? 'none' : '13 8'} />
		<path d="M330 95h500v250H330z" fill="#fff" stroke="#d7deea" strokeWidth="3" /><path d={`M365 285Q430 ${265 - 35 * p} 500 260T790 ${240 - 25 * p}`} fill="none" stroke={accent} strokeWidth="12" />
		<text x="365" y="145" fill="#21324a" fontSize="30">{joint ? '掩码 + RGB 重建' : '仅掩码域'}</text><text x="365" y="385" fill={accent} fontSize="25">{joint ? '共同检查冲突区域' : '颜色冲突仍未解释'}</text>
	</svg>;
}
export function CoverMask({ }: WidgetProps) { const { progress } = useCoverPlayback(); return <CoverArt progress={progress} joint={false} />; }
export function CoverRun({ }: WidgetProps) { const { progress } = useCoverPlayback(); return <CoverArt progress={progress} joint />; }
