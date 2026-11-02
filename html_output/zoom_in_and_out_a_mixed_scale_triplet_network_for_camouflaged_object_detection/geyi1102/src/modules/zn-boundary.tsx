import { useState } from 'react';

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

const NAMES = ['Sm', 'Fωβ', 'MAE', 'Fβ', 'Em'];

function MetricList({ v, tone = C.ink }: { v: number[]; tone?: string }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {NAMES.map((n, i) => (
                <div key={n} style={{ fontSize: 24, color: C.muted }}>
                    {n}{i === 2 ? ' ↓' : ' ↑'} <b style={{ color: tone }}>{v[i].toFixed(3)}</b>
                </div>
            ))}
        </div>
    );
}

/* ---------------- UAL ---------------- */

const UAL: Record<string, { v: number[]; label: string }> = {
    none: { v: [0.843, 0.694, 0.032, 0.743, 0.909], label: '不加 UAL（Form 0）' },
    '1': { v: [0.834, 0.716, 0.029, 0.757, 0.903], label: 'α = 1' },
    '2': { v: [0.838, 0.729, 0.029, 0.766, 0.911], label: 'α = 2（默认）' },
    '4': { v: [0.834, 0.727, 0.029, 0.763, 0.903], label: 'α = 4' },
    '8': { v: [0.833, 0.725, 0.029, 0.76, 0.9], label: 'α = 8' },
};

export function ZnUal() {
    const [key, setKey] = useState('2');
    const cur = UAL[key];
    const withUal = key !== 'none';
    const a = key === 'none' ? 2 : Number(key);
    const tone = key === '2' ? C.green : withUal ? C.blue : C.orange;
    const curve = Array.from({ length: 41 }, (_, i) => {
        const x = i / 40;
        return 1 - Math.pow(Math.abs(2 * x - 1), a);
    });
    return (
        <div style={{ display: 'flex', gap: 24, width: '100%', height: '100%' }}>
            <svg viewBox="0 0 640 540" style={{ width: 640, height: '100%' }}>
                <rect width={640} height={540} fill={C.bg} rx={16} />
                <text x={24} y={36} fontSize={24} fill={C.muted}>预测概率直方图（形状示意）</text>
                {[0, 1].map((panel) => {
                    const px = 30 + panel * 300;
                    const polarized = panel === 1;
                    return (
                        <g key={panel}>
                            <rect x={px} y={56} width={280} height={190} rx={10} fill="#fff" stroke={C.line} />
                            <text x={px + 12} y={82} fontSize={20} fill={polarized ? C.green : C.red}>{polarized ? '有 UAL：两极' : '无 UAL：堆中间'}</text>
                            {Array.from({ length: 16 }).map((_, i) => {
                                const v = i / 15;
                                const h = polarized
                                    ? 120 * Math.exp(-((v - 0.06) ** 2) / 0.004) + 104 * Math.exp(-((v - 0.94) ** 2) / 0.004) + 6
                                    : 130 * Math.exp(-((v - 0.5) ** 2) / 0.05) + 8;
                                return <rect key={i} x={px + 16 + i * 15} y={226 - h} width={12} height={h} fill={polarized ? C.green : C.muted} opacity={0.8} />;
                            })}
                            <line x1={px + 16} y1={226} x2={px + 262} y2={226} stroke={C.line} />
                            <text x={px + 12} y={244} fontSize={18} fill={C.muted}>0</text>
                            <text x={px + 240} y={244} fontSize={18} fill={C.muted}>1</text>
                        </g>
                    );
                })}
                <text x={24} y={300} fontSize={24} fill={C.muted}>UAL 惩罚曲线：1 − |2x − 1|^α，峰值在 x = 0.5</text>
                <rect x={30} y={316} width={580} height={190} rx={10} fill="#fff" stroke={C.line} />
                <polyline
                    points={curve.map((v, i) => `${40 + i * 14},${486 - v * 150}`).join(' ')}
                    fill="none"
                    stroke={C.purple}
                    strokeWidth={4}
                />
                <text x={40} y={496} fontSize={18} fill={C.muted}>x = 0（背景）</text>
                <text x={500} y={496} fontSize={18} fill={C.muted}>x = 1（目标）</text>
                <line x1={320} y1={340} x2={320} y2={486} stroke={C.line} strokeWidth={2} strokeDasharray="6 6" />
            </svg>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {Object.keys(UAL).map((k) => (
                        <button
                            key={k}
                            onClick={() => setKey(k)}
                            aria-pressed={key === k}
                            style={{
                                fontSize: 22,
                                padding: '8px 14px',
                                borderRadius: 999,
                                border: `2px solid ${key === k ? C.blue : C.line}`,
                                background: key === k ? '#e8eef8' : '#fff',
                                cursor: 'pointer',
                            }}
                        >
                            {UAL[k].label}
                        </button>
                    ))}
                </div>
                <MetricList v={cur.v} tone={tone} />
                <div style={{ fontSize: 20, color: C.muted }}>COD10K-Test · Tab.4</div>
                <p style={{ fontSize: 26, lineHeight: 1.45, color: tone, margin: 0 }}>
                    {!withUal
                        ? '不加 UAL：Sm 最高（0.843），但 Fωβ 只有 0.694，边界附近大量像素停在中间。'
                        : key === '2'
                            ? '默认 α=2：Fωβ 0.729、Fβ 0.766 最高，代价是 Sm 比不加 UAL 低 0.005。'
                            : '更大的 α 更强调「非黑即白」，但 Fωβ 反而回落——过强约束伤到细节。'}
                </p>
                <p style={{ fontSize: 20, color: C.muted, margin: 0 }}>
                    l = 1 − |2p − 1|²，L = L_BCEL + λ·L_UAL；λ 默认余弦递增。直方图为示意，真实直方图在补充材料。
                </p>
            </div>
        </div>
    );
}

/* ---------------- Results (Tab.1) ---------------- */

const METRICS = ['Sm', 'Fωβ', 'MAE', 'Fβ', 'Em'] as const;
const DATASETS = [
    { id: 'camo', name: 'CAMO' },
    { id: 'cham', name: 'CHAMELEON' },
    { id: 'cod', name: 'COD10K' },
    { id: 'nc4k', name: 'NC4K' },
] as const;

const T1: Record<string, Record<string, number[]>> = {
    Ours: { camo: [0.82, 0.752, 0.066, 0.794, 0.892], cham: [0.902, 0.845, 0.023, 0.864, 0.958], cod: [0.838, 0.729, 0.029, 0.766, 0.911], nc4k: [0.853, 0.784, 0.043, 0.818, 0.912] },
    UJSC: { camo: [0.8, 0.728, 0.073, 0.772, 0.873], cham: [0.891, 0.833, 0.03, 0.847, 0.955], cod: [0.809, 0.684, 0.035, 0.721, 0.891], nc4k: [0.842, 0.771, 0.047, 0.806, 0.907] },
    'C2F-Net': { camo: [0.796, 0.719, 0.08, 0.762, 0.864], cham: [0.888, 0.828, 0.032, 0.844, 0.946], cod: [0.813, 0.686, 0.036, 0.723, 0.9], nc4k: [0.838, 0.762, 0.049, 0.795, 0.904] },
    SINet: { camo: [0.745, 0.644, 0.092, 0.702, 0.829], cham: [0.872, 0.806, 0.034, 0.827, 0.946], cod: [0.776, 0.631, 0.043, 0.679, 0.874], nc4k: [0.808, 0.723, 0.058, 0.769, 0.883] },
};
const MODELS = ['Ours', 'UJSC', 'C2F-Net', 'SINet'];

export function ZnResults() {
    const [ds, setDs] = useState<string>('cod');
    const [mi, setMi] = useState(0);
    const lower = METRICS[mi] === 'MAE';
    const maxAxis = lower ? 0.1 : 1;
    const bestBase = Math.min(...['UJSC', 'C2F-Net', 'SINet'].map((m) => T1[m][ds][mi]));
    const gap = T1.Ours[ds][mi] - bestBase;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', height: '100%' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 24, color: C.muted }}>数据集</span>
                {DATASETS.map((d) => (
                    <button
                        key={d.id}
                        onClick={() => setDs(d.id)}
                        aria-pressed={ds === d.id}
                        style={{
                            fontSize: 24,
                            padding: '8px 16px',
                            borderRadius: 999,
                            border: `2px solid ${ds === d.id ? C.blue : C.line}`,
                            background: ds === d.id ? '#e8eef8' : '#fff',
                            cursor: 'pointer',
                        }}
                    >
                        {d.name}
                    </button>
                ))}
                <span style={{ fontSize: 24, color: C.muted, marginLeft: 10 }}>指标</span>
                {METRICS.map((m, i) => (
                    <button
                        key={m}
                        onClick={() => setMi(i)}
                        aria-pressed={mi === i}
                        style={{
                            fontSize: 24,
                            padding: '8px 16px',
                            borderRadius: 999,
                            border: `2px solid ${mi === i ? C.orange : C.line}`,
                            background: mi === i ? '#fdeee5' : '#fff',
                            cursor: 'pointer',
                        }}
                    >
                        {m}
                        {m === 'MAE' ? ' ↓' : ' ↑'}
                    </button>
                ))}
            </div>
            <svg viewBox="0 0 1400 340" style={{ width: '100%', height: 340 }}>
                <rect width={1400} height={340} fill="#fff" stroke={C.line} rx={14} />
                <line x1={210} y1={20} x2={210} y2={300} stroke={C.line} />
                {MODELS.map((m, i) => {
                    const v = T1[m][ds][mi];
                    const w = (v / maxAxis) * 1050;
                    const y = 30 + i * 68;
                    const main = m === 'Ours';
                    return (
                        <g key={m}>
                            <text x={24} y={y + 32} fontSize={24} fill={C.ink} fontWeight={main ? 700 : 400}>{m}</text>
                            <rect x={218} y={y} width={Math.max(w, 3)} height={40} rx={8} fill={main ? C.green : C.light} opacity={main ? 0.95 : 0.7} />
                            <text x={226 + w} y={y + 30} fontSize={24} fill={C.ink}>{v.toFixed(3)}</text>
                        </g>
                    );
                })}
                <text x={24} y={330} fontSize={20} fill={C.muted}>
                    {DATASETS.find((d) => d.id === ds)?.name} · {METRICS[mi]} · {lower ? '越低越好（0–0.1）' : '越高越好（0–1）'} · Tab.1
                </text>
            </svg>
            <p style={{ fontSize: 24, lineHeight: 1.4, color: C.ink, margin: 0 }}>
                对比对象含 SINet（CVPR'20）、C2F-Net、UJSC 等代表方法。对最强基线 {(gap >= 0 ? '+' : '') + gap.toFixed(3)}
                {lower ? '（MAE 越低越好）' : ''}；论文称四数据集平均 MAE 相对提升 19.3%、Fωβ/Fβ 约 4%。
            </p>
            <p style={{ fontSize: 20, color: C.muted, margin: 0 }}>UJSC 的训练额外用了 SOD 数据（表中以 ⋆ 标注）；Tab.1 与 Tab.2/3/4 协议不同，不能跨表比。</p>
        </div>
    );
}

/* ---------------- Ablation (Tab.2) ---------------- */

type AbRow = { key: string; label: string; hmu: boolean; siu: boolean; ual: boolean; v: number[]; flops: number; params: number };

const ABLATION: AbRow[] = [
    { key: 'base', label: '基线', hmu: false, siu: false, ual: false, v: [0.812, 0.637, 0.039, 0.692, 0.898], flops: 41.885, params: 30.453 },
    { key: 'hmu', label: '+ HMU (g=6)', hmu: true, siu: false, ual: false, v: [0.82, 0.654, 0.037, 0.706, 0.897], flops: 78.56, params: 30.696 },
    { key: 'siu', label: '+ SIU', hmu: false, siu: true, ual: false, v: [0.837, 0.682, 0.034, 0.731, 0.912], flops: 166.821, params: 30.453 },
    { key: 'both', label: '+ SIU + HMU', hmu: true, siu: true, ual: false, v: [0.843, 0.694, 0.032, 0.743, 0.909], flops: 203.496, params: 28.794 },
    { key: 'full', label: '+ SIU + HMU + UAL', hmu: true, siu: true, ual: true, v: [0.838, 0.729, 0.029, 0.766, 0.911], flops: 203.496, params: 32.382 },
];

export function ZnAblation() {
    const [hmu, setHmu] = useState(true);
    const [siu, setSiu] = useState(true);
    const [ual, setUal] = useState(true);
    const [plain, setPlain] = useState(false);
    const key = hmu && siu && ual ? 'full' : hmu && siu ? 'both' : hmu && !siu && !ual ? 'hmu' : siu && !hmu && !ual ? 'siu' : !hmu && !siu ? 'base' : '';
    const row = ABLATION.find((r) => r.key === key);
    const disabledNote = !key ? 'Tab.2 没有报告「SIU/HMU 之一与 UAL 搭配」的组合。' : '';
    const plainRow = { v: [0.815, 0.632, 0.04, 0.689, 0.896], flops: 207.647, params: 41.975 };
    const shown = plain ? plainRow : row;
    const tone = plain ? C.orange : key === 'full' ? C.green : C.blue;
    return (
        <div style={{ display: 'flex', gap: 24, width: '100%', height: '100%' }}>
            <div style={{ width: 460, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                    { name: 'HMU（g=6）', on: hmu, set: setHmu },
                    { name: 'SIU', on: siu, set: setSiu },
                    { name: 'UAL', on: ual, set: setUal },
                ].map((t) => (
                    <button
                        key={t.name}
                        onClick={() => {
                            t.set(!t.on);
                            setPlain(false);
                        }}
                        aria-pressed={t.on}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: 26,
                            padding: '14px 18px',
                            borderRadius: 12,
                            border: `2px solid ${t.on ? C.blue : C.line}`,
                            background: t.on ? '#e8eef8' : '#fff',
                            cursor: 'pointer',
                        }}
                    >
                        {t.name}
                        <span style={{ color: t.on ? C.green : C.muted }}>{t.on ? '已启用' : '未启用'}</span>
                    </button>
                ))}
                <button
                    onClick={() => setPlain(!plain)}
                    aria-pressed={plain}
                    style={{
                        fontSize: 24,
                        padding: '12px 18px',
                        borderRadius: 12,
                        border: `2px solid ${plain ? C.orange : C.line}`,
                        background: plain ? '#fdeee5' : '#fff',
                        cursor: 'pointer',
                    }}
                >
                    对照：同参数量/同算力的普通卷积扩展
                </button>
                {disabledNote && <p style={{ fontSize: 20, color: C.orange, margin: 0 }}>{disabledNote}</p>}
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 26, color: C.ink }}>{plain ? '普通卷积扩展（207.6 GFLOPs / 41.98M）' : row ? row.label : '—'}</div>
                {shown ? <MetricList v={shown.v} tone={tone} /> : null}
                <svg viewBox="0 0 700 180" style={{ width: '100%', height: 180 }}>
                    <rect width={700} height={180} fill="#fff" stroke={C.line} rx={12} />
                    <text x={20} y={40} fontSize={22} fill={C.muted}>GFLOPs</text>
                    <rect x={140} y={18} width={(shown ? shown.flops / 220 : 0) * 500} height={28} rx={6} fill={tone} opacity={0.7} />
                    <text x={150 + (shown ? (shown.flops / 220) * 500 : 0)} y={40} fontSize={22} fill={C.ink}>{shown ? shown.flops.toFixed(1) : ''}</text>
                    <text x={20} y={90} fontSize={22} fill={C.muted}>参数量 (M)</text>
                    <rect x={140} y={68} width={(shown ? (shown.params / 50) * 500 : 0)} height={28} rx={6} fill={C.blue} opacity={0.45} />
                    <text x={150 + (shown ? (shown.params / 50) * 500 : 0)} y={90} fontSize={22} fill={C.ink}>{shown ? shown.params.toFixed(2) : ''}</text>
                    <text x={20} y={150} fontSize={20} fill={C.muted}>基线：41.9 GFLOPs / 30.45M</text>
                </svg>
                <p style={{ fontSize: 26, lineHeight: 1.45, color: tone, margin: 0 }}>
                    {plain
                        ? '把同样的算力和参数交给普通卷积，Sm 只有 0.815——收益来自 SIU/HMU 的结构设计，不是堆预算。'
                        : key === 'full'
                            ? '完整模型：Fωβ 0.766、MAE 0.029 最好，但 Sm 0.838 低于只加两个模块的 0.843。'
                            : 'SIU 与 HMU 互补：单加一个都不如两个一起（0.843 vs 0.837/0.820）。'}
                </p>
            </div>
        </div>
    );
}

/* ---------------- Boundary ---------------- */

const TABS = [
    {
        id: 'cost',
        name: '算力',
        lines: [
            'GFLOPs 从 41.9 涨到 203.5（约 4.9 倍），参数反而从 30.45M 降到 28.79M（+UAL 后 32.38M）。',
            '训练只用单张 2080Ti、40 epoch、batch 8、主尺度 384×384——属于「一张卡能跑完」的量级。',
            '推理要多跑三档尺度，因此部署开销高于单尺度模型。',
        ],
        tone: 'orange' as const,
    },
    {
        id: 'data',
        name: '数据',
        lines: [
            '训练：COD10K 3,040 张 + CAMO 1,000 张，共 4,040 张伪装图。',
            'NC4K（4,121 张）只用于测试，不参与训练——它在 Tab.1 上是零样本意义上的测试集。',
            'CHAMELEON 只有 76 张，指标波动更大。',
        ],
        tone: 'blue' as const,
    },
    {
        id: 'metric',
        name: '指标权衡',
        lines: [
            '加 UAL 后 Sm 从 0.843 降到 0.838，但 Fωβ 0.694→0.729、MAE 0.032→0.029、Fβ 0.743→0.766。',
            '论文把这个取舍明确写成权衡：UAL 换的是「边界更准、更不犹豫」，不是所有指标都涨。',
            'Tab.1 与 Tab.2/3/4 的训练与评测协议不同，数字不能混着比。',
        ],
        tone: 'green' as const,
    },
];

export function ZnBoundary() {
    const [tab, setTab] = useState('cost');
    const cur = TABS.find((t) => t.id === tab)!;
    const tone = cur.tone === 'orange' ? C.orange : cur.tone === 'blue' ? C.blue : C.green;
    return (
        <div style={{ display: 'flex', gap: 24, width: '100%', height: '100%' }}>
            <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        aria-pressed={tab === t.id}
                        style={{
                            fontSize: 28,
                            padding: '18px 20px',
                            textAlign: 'left',
                            borderRadius: 12,
                            border: `2px solid ${tab === t.id ? C.blue : C.line}`,
                            background: tab === t.id ? '#e8eef8' : '#fff',
                            cursor: 'pointer',
                        }}
                    >
                        {t.name}
                    </button>
                ))}
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <svg viewBox="0 0 900 200" style={{ width: '100%', height: 200 }}>
                    <rect width={900} height={200} fill="#fff" stroke={C.line} rx={12} />
                    <text x={20} y={34} fontSize={22} fill={C.muted}>GFLOPs：基线 → 完整模型</text>
                    <rect x={40} y={54} width={(41.885 / 210) * 760} height={34} rx={6} fill={C.light} />
                    <text x={50} y={78} fontSize={20} fill={C.ink}>41.9（基线）</text>
                    <rect x={40} y={112} width={(203.496 / 210) * 760} height={34} rx={6} fill={C.orange} opacity={0.85} />
                    <text x={50 + (203.496 / 210) * 760} y={136} fontSize={20} fill={C.ink}>203.5</text>
                    <text x={20} y={186} fontSize={20} fill={C.muted}>参数量：30.45M → 28.79M（+UAL 32.38M）</text>
                </svg>
                {cur.lines.map((l) => (
                    <p key={l} style={{ fontSize: 26, lineHeight: 1.45, color: C.ink, margin: 0 }}>· {l}</p>
                ))}
                <p style={{ fontSize: 24, color: tone, margin: 0 }}>
                    {tab === 'cost'
                        ? '结论：精度提升是拿算力换的，且推理要跑三档尺度。'
                        : tab === 'data'
                            ? '结论：增益在「只训 4 千张」的前提下取得，跨数据集仍要单独验证。'
                            : '结论：UAL 是权衡项——换更准的边界，让步一点结构相似度。'}
                </p>
            </div>
        </div>
    );
}
