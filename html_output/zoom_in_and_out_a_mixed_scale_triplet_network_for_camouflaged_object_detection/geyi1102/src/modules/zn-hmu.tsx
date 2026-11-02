import { useState } from 'react';
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

/* ---------------- SIU ---------------- */

export function ZnSiu() {
    const [w05, setW05] = useState(0.25);
    const [w10, setW10] = useState(0.5);
    const [w15, setW15] = useState(0.25);
    const sum = w05 + w10 + w15 || 1;
    const n05 = w05 / sum;
    const n10 = w10 / sum;
    const n15 = w15 / sum;
    const dominant = n10 > 0.6 ? '1.0' : n15 > 0.55 ? '1.5' : n05 > 0.55 ? '0.5' : '';
    const balanced = Math.abs(n05 - 1 / 3) < 0.08 && Math.abs(n15 - 1 / 3) < 0.08;
    const tone = dominant ? C.orange : balanced ? C.blue : C.green;
    const feedback = dominant
        ? `主尺度独大（${(n10 * 100).toFixed(0)}%）：等于几乎不用辅助尺度，又回到单尺度。`
        : balanced
            ? '三档近似等权：和「直接相加」差不多，注意力没有起作用。'
            : '深尺度送细节、主尺度给主体、浅尺度补整体——三者都被用上。';
    return (
        <div style={{ display: 'flex', gap: 24, width: '100%', height: '100%' }}>
            <svg viewBox="0 0 900 560" style={{ width: 900, height: '100%' }}>
                <rect width={900} height={560} fill={C.bg} rx={16} />
                <text x={24} y={34} fontSize={24} fill={C.muted}>三张底片（透明度 = softmax 后的权重）</text>
                {[
                    { x: 30, label: '0.5× 整体', w: n05, kind: 'coarse' },
                    { x: 320, label: '1.0× 主体', w: n10, kind: 'body' },
                    { x: 610, label: '1.5× 细节', w: n15, kind: 'legs' },
                ].map((c) => (
                    <g key={c.label} opacity={0.25 + c.w * 0.75}>
                        <rect x={c.x} y={54} width={230} height={180} rx={10} fill="#eef3e6" stroke={C.line} strokeWidth={2} />
                        {c.kind === 'coarse' && <ellipse cx={c.x + 115} cy={144} rx={82} ry={44} fill="none" stroke={C.ink} strokeWidth={3} />}
                        {c.kind === 'body' && <rect x={c.x + 62} y={124} width={96} height={38} rx={18} fill={C.light} stroke={C.ink} strokeWidth={3} />}
                        {c.kind === 'legs' && (
                            <g stroke={C.ink} strokeWidth={3} fill="none">
                                <line x1={c.x + 60} y1={140} x2={c.x + 30} y2={100} />
                                <line x1={c.x + 75} y1={140} x2={c.x + 45} y2={94} />
                                <line x1={c.x + 60} y1={160} x2={c.x + 30} y2={200} />
                                <line x1={c.x + 75} y1={160} x2={c.x + 45} y2={206} />
                            </g>
                        )}
                        <text x={c.x + 10} y={256} fontSize={22} fill={C.ink}>{c.label}</text>
                        <text x={c.x + 10} y={284} fontSize={22} fill={C.muted}>权重 {(c.w * 100).toFixed(0)}%</text>
                    </g>
                ))}
                <text x={24} y={330} fontSize={24} fill={C.muted}>SIU 融合结果（示意）</text>
                <rect x={30} y={344} width={810} height={190} rx={12} fill="#fff" stroke={C.line} />
                <g transform="translate(430 440)">
                    <ellipse rx={150} ry={82} fill="none" stroke="rgba(33,50,74,0.55)" strokeWidth={3} opacity={n05} />
                    <rect x={-70} y={-20} width={140} height={40} rx={20} fill={C.light} opacity={n10} stroke={C.ink} strokeWidth={2.5} />
                    <g stroke={C.ink} strokeWidth={3} fill="none" opacity={n15}>
                        <line x1={-60} y1={-16} x2={-110} y2={-62} />
                        <line x1={-40} y1={-18} x2={-88} y2={-70} />
                        <line x1={-60} y1={16} x2={-110} y2={62} />
                        <line x1={-40} y1={18} x2={-88} y2={70} />
                    </g>
                </g>
            </svg>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                    { name: '0.5× 权重', v: w05, set: setW05 },
                    { name: '1.0× 权重', v: w10, set: setW10 },
                    { name: '1.5× 权重', v: w15, set: setW15 },
                ].map((s) => (
                    <label key={s.name} style={{ fontSize: 26, color: C.ink }}>
                        {s.name} <b style={{ color: C.orange }}>{s.v.toFixed(2)}</b>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={s.v}
                            aria-label={s.name}
                            onChange={(e) => s.set(Number(e.target.value))}
                            style={{ width: '100%', marginTop: 8, accentColor: '#f07e47' }}
                        />
                    </label>
                ))}
                <div style={{ fontSize: 22, color: C.muted }}>
                    经 softmax 归一：{(n05 * 100).toFixed(0)}% / {(n10 * 100).toFixed(0)}% / {(n15 * 100).toFixed(0)}%
                </div>
                <p style={{ fontSize: 26, lineHeight: 1.45, color: tone, margin: 0 }}>{feedback}</p>
                <p style={{ fontSize: 20, color: C.muted, margin: 0 }}>
                    fi = A0.5·U(f0.5) + A1.0·f1.0 + A1.5·D(f1.5)：真实权重来自注意力生成器的 3 通道输出，这里用滑块代替。
                </p>
            </div>
        </div>
    );
}

/* ---------------- HMU ---------------- */

const G_DATA: Record<number, { v: number[]; flops: number }> = {
    2: { v: [0.835, 0.721, 0.03, 0.758, 0.902], flops: 173.616 },
    4: { v: [0.836, 0.723, 0.029, 0.761, 0.905], flops: 188.556 },
    6: { v: [0.838, 0.729, 0.029, 0.766, 0.911], flops: 203.496 },
    8: { v: [0.836, 0.726, 0.029, 0.763, 0.907], flops: 218.436 },
};
const NAMES = ['Sm', 'Fωβ', 'MAE', 'Fβ', 'Em'];

export function ZnHmu() {
    const [g, setG] = useState(6);
    const [focus, setFocus] = useState(1);
    const row = G_DATA[g];
    const best = g === 6;
    const tone = best ? C.green : C.orange;
    const rowH = Math.min(64, 420 / g);
    return (
        <div style={{ display: 'flex', gap: 24, width: '100%', height: '100%' }}>
            <svg viewBox="0 0 760 560" style={{ width: 760, height: '100%' }}>
                <rect width={760} height={560} fill={C.bg} rx={16} />
                <text x={24} y={34} fontSize={24} fill={C.muted}>按通道分成 {g} 组，自上而下逐组交接</text>
                {Array.from({ length: g }).map((_, i) => {
                    const j = i + 1;
                    const y = 56 + i * rowH;
                    const active = focus === j;
                    return (
                        <g key={j} onClick={() => setFocus(j)} style={{ cursor: 'pointer' }}>
                            <rect
                                x={40}
                                y={y}
                                width={620}
                                height={rowH - 10}
                                rx={8}
                                fill={active ? '#e8eef8' : '#fff'}
                                stroke={active ? C.blue : C.line}
                                strokeWidth={active ? 4 : 2}
                            />
                            <text x={54} y={y + (rowH - 10) / 2 + 8} fontSize={20} fill={C.ink}>第 {j} 组</text>
                            <rect x={150} y={y + 8} width={116} height={rowH - 26} rx={6} fill={C.purple} opacity={j < g ? 0.75 : 0.25} />
                            <text x={162} y={y + (rowH - 10) / 2 + 8} fontSize={18} fill="#fff">交接 g′1</text>
                            <rect x={286} y={y + 8} width={150} height={rowH - 26} rx={6} fill={C.blue} opacity={0.35} />
                            <text x={300} y={y + (rowH - 10) / 2 + 8} fontSize={18} fill={C.ink}>调制 g′2</text>
                            <rect x={456} y={y + 8} width={180} height={rowH - 26} rx={6} fill={C.green} opacity={0.35} />
                            <text x={470} y={y + (rowH - 10) / 2 + 8} fontSize={18} fill={C.ink}>被调制 g′3</text>
                        </g>
                    );
                })}
                <text x={40} y={540} fontSize={20} fill={C.muted}>
                    点任一组可查看它的交接关系（第 {focus} 组：{focus === 1 ? '起点，把 g′1 交给第 2 组' : focus === g ? '最后一组，只输出调制结果' : `接收第 ${focus - 1} 组的 g′1，再交给第 ${focus + 1} 组`}）
                </text>
            </svg>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                    {[2, 4, 6, 8].map((n) => (
                        <button
                            key={n}
                            onClick={() => {
                                setG(n);
                                setFocus(1);
                            }}
                            aria-pressed={g === n}
                            style={{
                                flex: 1,
                                fontSize: 24,
                                padding: '10px 0',
                                borderRadius: 12,
                                border: `2px solid ${g === n ? C.blue : C.line}`,
                                background: g === n ? '#e8eef8' : '#fff',
                                cursor: 'pointer',
                            }}
                        >
                            g={n}
                        </button>
                    ))}
                </div>
                <svg viewBox="0 0 620 220" style={{ width: '100%', height: 220 }}>
                    <rect width={620} height={220} fill="#fff" stroke={C.line} rx={12} />
                    {NAMES.map((n, i) => (
                        <g key={n}>
                            <text x={20} y={44 + i * 34} fontSize={22} fill={C.muted}>{n}{i === 2 ? ' ↓' : ' ↑'}</text>
                            <text x={130} y={44 + i * 34} fontSize={24} fill={C.ink} fontWeight={i === 2 ? 400 : 600}>{row.v[i].toFixed(3)}</text>
                        </g>
                    ))}
                    <text x={330} y={44} fontSize={22} fill={C.muted}>GFLOPs</text>
                    <text x={330} y={78} fontSize={24} fill={C.ink}>{row.flops.toFixed(1)}</text>
                </svg>
                <p style={{ fontSize: 26, lineHeight: 1.45, color: tone, margin: 0 }}>
                    {best
                        ? 'g=6 时五项指标最好，算力居中：这是论文选的折中。'
                        : g === 8
                            ? '再分组收益回落（Fωβ 0.726 < 0.729），算力却从 203.5 涨到 218.4 GFLOPs。'
                            : '分组更少时交接次数少，通道交互不充分，指标偏低。'}
                </p>
                <p style={{ fontSize: 20, color: C.muted, margin: 0 }}>
                    Eq.(2) 先上采样相加，Eq.(3) 用通道调制向量 α 加权；解码器共 5 个 HMU。表内数据为 Tab.2 中含 SIU+UAL 的 g 消融行。
                </p>
            </div>
        </div>
    );
}
