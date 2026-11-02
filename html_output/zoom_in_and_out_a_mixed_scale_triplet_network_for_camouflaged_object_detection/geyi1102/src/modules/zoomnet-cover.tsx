import { useState } from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import type { WidgetProps } from './registry';

const C = {
    bg: '#f5f8f0',
    light: '#b8c9a7',
    dark: '#76906a',
    route: '#92400e',
    blue: '#27446e',
    green: '#228d5c',
    red: '#c43f52',
    orange: '#f07e47',
    purple: '#7c3aed',
    ink: '#21324a',
    muted: '#68778f',
    line: '#d7deea',
};

function Grass({ y, tone = C.dark }: { y: number; tone?: string }) {
    return (
        <g>
            {[70, 150, 230, 310, 390, 470, 550, 630, 710].map((x, i) => (
                <path
                    key={x}
                    d={`M${x},${y + 60} C${x + 6},${y + 20} ${x - 10},${y - 10} ${x + 4},${y - 40}`}
                    stroke={i % 3 === 0 ? C.light : tone}
                    strokeWidth={7}
                    fill="none"
                    strokeLinecap="round"
                />
            ))}
        </g>
    );
}

function Bug({ cx, cy, s, mode }: { cx: number; cy: number; s: number; mode: 'blob' | 'body' | 'legs' }) {
    return (
        <g transform={`translate(${cx} ${cy}) scale(${s})`} fill="none" stroke={C.ink} strokeWidth={2.2} strokeLinecap="round">
            {mode === 'blob' ? (
                <ellipse rx={34} ry={15} fill={C.dark} opacity={0.8} stroke="none" />
            ) : (
                <>
                    {mode === 'body' && <ellipse rx={46} ry={25} fill="none" stroke={C.muted} strokeWidth={2} strokeDasharray="7 6" />}
                    <rect x={-30} y={-9} width={56} height={18} rx={9} fill={C.light} />
                    <circle cx={30} cy={0} r={6.5} fill={C.light} />
                    {mode === 'legs' && (
                        <g>
                            <line x1={-4} y1={-9} x2={-16} y2={-26} />
                            <line x1={2} y1={-9} x2={-10} y2={-28} />
                            <line x1={-4} y1={9} x2={-16} y2={26} />
                            <line x1={2} y1={9} x2={-10} y2={28} />
                            <line x1={26} y1={0} x2={38} y2={-14} />
                            <line x1={26} y1={0} x2={36} y2={16} />
                        </g>
                    )}
                </>
            )}
        </g>
    );
}

/* ---------------- cover ---------------- */

export function ZoomnetCover({ moduleId }: WidgetProps) {
    const { progress } = useCoverPlayback();
    const old = moduleId === 'oldMethod';
    const lock = progress <= 0.55 ? 0 : (progress - 0.55) / 0.45;
    const frame = old ? 1 : progress < 0.3 ? 0.5 : progress < 0.55 ? 1 : 1.5;
    const bugScale = 0.9 * (old ? 1 : frame);
    const focusX = old ? 250 + 70 * Math.sin(progress * Math.PI * 2) : 332;
    return (
        <svg viewBox="0 0 664 324" style={{ width: '100%', height: '100%' }} role="img" aria-label={old ? '定焦单拍找不到目标' : '三档变焦后锁定目标'}>
            <rect width={664} height={324} fill={C.bg} />
            <rect x={18} y={54} width={430} height={236} rx={10} fill="#eef3e6" stroke={C.muted} strokeWidth={2} />
            <Grass y={250} />
            <Bug cx={332} cy={228} s={bugScale} mode={old ? 'body' : lock > 0.4 ? 'legs' : 'body'} />
            <rect x={focusX - 40} y={188} width={80} height={80} fill="none" stroke={old ? C.red : C.green} strokeWidth={3} strokeDasharray="8 6" />
            {!old && lock > 0.3 && (
                <ellipse cx={332} cy={228} rx={62 * lock + 20} ry={40 * lock + 14} fill="none" stroke={C.green} strokeWidth={4} />
            )}
            <text x={30} y={42} fontSize={20} fill={C.muted}>{old ? '定焦：一档到底' : `变焦刻度 ${frame.toFixed(1)}×`}</text>
            <text x={30} y={310} fontSize={20} fill={old ? C.red : C.green}>{old ? '虫子和草一起糊掉' : lock > 0.5 ? '锁定，轮廓出来了' : '三档轮流看'}</text>
            <g transform="translate(470 84)">
                <rect width={172} height={188} rx={10} fill="#fff" stroke={C.line} />
                <text x={12} y={24} fontSize={18} fill={C.muted}>预测直方图</text>
                {Array.from({ length: 12 }).map((_, i) => {
                    const v = i / 11;
                    const h = old ? 92 * Math.exp(-((v - 0.5) ** 2) / 0.03) : 92 * Math.exp(-((v - 0.12) ** 2) / 0.006) + 78 * Math.exp(-((v - 0.9) ** 2) / 0.006);
                    return <rect key={i} x={14 + i * 12} y={168 - h} width={9} height={h} fill={old ? C.muted : C.green} opacity={0.85} />;
                })}
                <line x1={14} y1={168} x2={158} y2={168} stroke={C.line} />
                <text x={12} y={184} fontSize={16} fill={old ? C.red : C.green}>{old ? '堆在中间 = 犹豫' : '两极化 = 有把握'}</text>
            </g>
        </svg>
    );
}

/* ---------------- scale ---------------- */

export function ZnScale() {
    const [zoom, setZoom] = useState(1);
    const mode: 'blob' | 'body' | 'legs' = zoom < 0.9 ? 'blob' : zoom > 1.15 ? 'legs' : 'body';
    const legs = mode === 'legs';
    const body = mode !== 'blob';
    const outline = mode !== 'legs';
    const tone = zoom > 1.15 ? C.orange : zoom < 0.9 ? C.red : C.blue;
    const feedback =
        zoom < 0.9
            ? '缩得太小：整体轮廓还算完整，细肢糊成一片，边界靠猜。'
            : zoom <= 1.15
                ? '主尺度：细肢还没分开，整体又快到边了——两头都只看到一半。'
                : '放大了：细肢清楚，但目标整体已经出框，找不到它的完整形状。';
    const chips = [
        { name: '细肢（局部细节）', on: legs },
        { name: '躯干（主体）', on: body },
        { name: '整体轮廓', on: outline },
    ];
    return (
        <div style={{ display: 'flex', gap: 24, width: '100%', height: '100%' }}>
            <svg viewBox="0 0 780 560" style={{ width: 780, height: '100%' }}>
                <rect width={780} height={560} fill={C.bg} rx={16} />
                <rect x={24} y={40} width={732} height={430} rx={12} fill="#eef3e6" stroke={C.muted} strokeWidth={3} />
                <Grass y={430} />
                <Bug cx={390} cy={400} s={2.0 * zoom} mode={mode} />
                <line x1={24} y1={492} x2={756} y2={492} stroke={C.line} strokeWidth={2} />
                <text x={28} y={30} fontSize={24} fill={C.muted}>取景器：同一张底片，三个刻度</text>
                <text x={28} y={534} fontSize={24} fill={tone}>{zoom.toFixed(1)}× 时可见结构：{chips.filter((c) => c.on).map((c) => c.name.split('（')[0]).join(' + ') || '只剩色块'}</text>
            </svg>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <label style={{ fontSize: 28, color: C.ink }}>
                    变焦刻度 <b style={{ color: C.orange }}>{zoom.toFixed(1)}×</b>
                    <input
                        type="range"
                        min={0.5}
                        max={1.5}
                        step={0.1}
                        value={zoom}
                        aria-label="变焦刻度"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        style={{ width: '100%', marginTop: 10, accentColor: '#f07e47' }}
                    />
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                    {[0.5, 1, 1.5].map((v) => (
                        <button
                            key={v}
                            onClick={() => setZoom(v)}
                            aria-pressed={zoom === v}
                            style={{
                                flex: 1,
                                fontSize: 24,
                                padding: '10px 0',
                                borderRadius: 12,
                                border: `2px solid ${zoom === v ? C.blue : C.line}`,
                                background: zoom === v ? '#e8eef8' : '#fff',
                                cursor: 'pointer',
                            }}
                        >
                            {v.toFixed(1)}×
                        </button>
                    ))}
                </div>
                {chips.map((c) => (
                    <div
                        key={c.name}
                        style={{
                            fontSize: 24,
                            padding: '10px 16px',
                            borderRadius: 10,
                            border: `2px solid ${c.on ? C.green : C.line}`,
                            background: c.on ? 'rgba(34,141,92,0.10)' : '#fff',
                            color: c.on ? C.green : C.muted,
                        }}
                    >
                        {c.name}：{c.on ? '看得清' : '看不清'}
                    </div>
                ))}
                <p style={{ fontSize: 26, lineHeight: 1.45, color: tone, margin: 0 }}>{feedback}</p>
                <p style={{ fontSize: 20, color: C.muted, margin: 0 }}>
                    三个可见性阈值是为讲清「互补」而设的教学判据；论文的结论是三档尺度各含差异化信息（§1、§3）。
                </p>
            </div>
        </div>
    );
}

/* ---------------- triplet (Tab.3) ---------------- */

type Combo = '1.0' | '0.5' | '1.5' | '0.5+1.0' | '0.5+1.5' | '1.0+1.5' | '0.5+1.0+1.5';
type Fuse = 'none' | 'add' | 'siu';

const T3: Record<string, { v: number[]; rel: string }> = {
    '1.0|none': { v: [0.797, 0.649, 0.063, 0.704, 0.875], rel: '基线（相对 0）' },
    '0.5|none': { v: [0.746, 0.553, 0.076, 0.616, 0.833], rel: '↓ 12.03%' },
    '1.5|none': { v: [0.82, 0.683, 0.059, 0.737, 0.89], rel: '↑ 4.05%' },
    '0.5+1.0|add': { v: [0.801, 0.647, 0.062, 0.702, 0.876], rel: '↑ 0.31%' },
    '0.5+1.0|siu': { v: [0.806, 0.658, 0.059, 0.709, 0.879], rel: '↑ 1.86%' },
    '0.5+1.5|add': { v: [0.82, 0.68, 0.058, 0.735, 0.894], rel: '↑ 4.43%' },
    '0.5+1.5|siu': { v: [0.822, 0.687, 0.056, 0.74, 0.893], rel: '↑ 5.33%' },
    '1.0+1.5|add': { v: [0.819, 0.685, 0.058, 0.738, 0.892], rel: '↑ 4.47%' },
    '1.0+1.5|siu': { v: [0.826, 0.697, 0.056, 0.745, 0.897], rel: '↑ 5.97%' },
    '0.5+1.0+1.5|add': { v: [0.821, 0.69, 0.056, 0.742, 0.894], rel: '↑ 5.43%' },
    '0.5+1.0+1.5|siu': { v: [0.827, 0.7, 0.054, 0.751, 0.898], rel: '↑ 6.91%' },
};

const COMBOS: Combo[] = ['1.0', '0.5', '1.5', '0.5+1.0', '0.5+1.5', '1.0+1.5', '0.5+1.0+1.5'];
const METRIC_NAMES = ['Sm', 'Fωβ', 'Fβ', 'Em'];

export function ZnTriplet() {
    const [combo, setCombo] = useState<Combo>('0.5+1.0+1.5');
    const [fuse, setFuse] = useState<Fuse>('siu');
    const single = combo === '1.0' || combo === '0.5' || combo === '1.5';
    const effFuse: Fuse = single ? 'none' : fuse;
    const row = T3[`${combo}|${effFuse}`] ?? T3['1.0|none'];
    const up = row.rel.includes('↑');
    const down = row.rel.includes('↓');
    const tone = down ? C.red : up ? C.green : C.blue;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', height: '100%' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 24, color: C.muted }}>输入尺度</span>
                {COMBOS.map((c) => (
                    <button
                        key={c}
                        onClick={() => setCombo(c)}
                        aria-pressed={combo === c}
                        style={{
                            fontSize: 24,
                            padding: '8px 14px',
                            borderRadius: 999,
                            border: `2px solid ${combo === c ? C.blue : C.line}`,
                            background: combo === c ? '#e8eef8' : '#fff',
                            cursor: 'pointer',
                        }}
                    >
                        {c}×
                    </button>
                ))}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 24, color: C.muted }}>融合方式</span>
                {([
                    ['none', '无（单尺度）'],
                    ['add', '直接相加'],
                    ['siu', 'SIU 注意力'],
                ] as [Fuse, string][]).map(([k, name]) => (
                    <button
                        key={k}
                        disabled={single && k !== 'none'}
                        onClick={() => setFuse(k)}
                        aria-pressed={effFuse === k}
                        style={{
                            fontSize: 24,
                            padding: '8px 16px',
                            borderRadius: 999,
                            border: `2px solid ${effFuse === k ? C.orange : C.line}`,
                            background: effFuse === k ? '#fdeee5' : '#fff',
                            color: single && k !== 'none' ? C.muted : C.ink,
                            cursor: single && k !== 'none' ? 'not-allowed' : 'pointer',
                            opacity: single && k !== 'none' ? 0.5 : 1,
                        }}
                    >
                        {name}
                    </button>
                ))}
                {single && <span style={{ fontSize: 20, color: C.muted }}>单尺度没有可融合的尺度</span>}
            </div>
            <svg viewBox="0 0 1400 300" style={{ width: '100%', height: 300 }}>
                <rect width={1400} height={300} fill="#fff" stroke={C.line} rx={14} />
                <text x={24} y={30} fontSize={20} fill={C.muted}>CAMO + COD10K 平均（Tab.3）</text>
                <line x1={110} y1={262} x2={1360} y2={262} stroke={C.line} />
                {[0, 1, 3, 4].map((idx, i) => {
                    const v = row.v[idx];
                    const h = v * 170;
                    const x = 180 + i * 180;
                    return (
                        <g key={idx}>
                            <rect x={x} y={262 - h} width={96} height={h} rx={8} fill={C.green} opacity={i === 3 ? 0.95 : 0.6} />
                            <text x={x + 6} y={262 - h - 10} fontSize={24} fill={C.ink}>{v.toFixed(3)}</text>
                            <text x={x + 16} y={292} fontSize={24} fill={C.muted}>{METRIC_NAMES[i]} ↑</text>
                        </g>
                    );
                })}
            </svg>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                <div style={{ fontSize: 30, color: C.ink }}>
                    MAE ↓ <b style={{ color: C.red }}>{row.v[2].toFixed(3)}</b>
                </div>
                <div style={{ fontSize: 30, color: tone }}>五指标平均相对变化：<b>{row.rel}</b></div>
            </div>
            <p style={{ fontSize: 24, lineHeight: 1.4, color: tone, margin: 0 }}>
                {single
                    ? combo === '0.5'
                        ? '只用 0.5× 会掉 12%：缩小尺度单独使用是有害的。'
                        : '单尺度是这张表的基线，所有收益都要和它比。'
                    : effFuse === 'add'
                        ? '简单相加只多拿到一点：辅助尺度里的信息没有被筛选。'
                        : '三尺度全给 SIU 时提升最大（6.91%），但仍需注意这是五指标平均。'}
            </p>
        </div>
    );
}
