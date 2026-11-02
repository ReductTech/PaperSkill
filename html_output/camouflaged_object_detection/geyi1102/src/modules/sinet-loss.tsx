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

/* ---------------- Loss ---------------- */

type Sup = 's' | 'i' | 'both';
const GRID = 8;

function MaskCard({ label, tone, supervised, coarse }: { label: string; tone: string; supervised: boolean; coarse: boolean }) {
  return (
    <div style={{ flex: 1, minWidth: 0, border: `2px solid ${supervised ? tone : C.line}`, borderRadius: 14, padding: 12, background: '#fff' }}>
      <div style={{ fontSize: 24, color: supervised ? tone : C.muted }}>{label}</div>
      <svg viewBox="0 0 240 200" style={{ width: '100%', height: 200 }}>
        {Array.from({ length: GRID * GRID }).map((_, i) => {
          const x = i % GRID;
          const y = Math.floor(i / GRID);
          const d = Math.hypot(x - 3.5, y - 4);
          const isTarget = d < (coarse ? 3.1 : 2.3);
          const isErr = supervised && (coarse ? d > 2.2 && d < 3.4 : d > 1.8 && d < 2.6);
          return (
            <rect
              key={i}
              x={x * 30}
              y={y * 25}
              width={28}
              height={23}
              rx={4}
              fill={isTarget ? (isErr ? C.red : tone) : '#eef2f7'}
              opacity={supervised ? (isErr ? 0.85 : isTarget ? 0.8 : 1) : 0.45}
            />
          );
        })}
      </svg>
      <div style={{ fontSize: 22, color: supervised ? C.ink : C.muted }}>
        {supervised ? (coarse ? '粗掩码：定位对了，边缘多算了一圈' : '细掩码：边缘贴合 GT') : '这一路没有梯度'}
      </div>
    </div>
  );
}

export function SinetLoss() {
  const [mode, setMode] = useState<Sup>('both');
  const sOn = mode === 's' || mode === 'both';
  const iOn = mode === 'i' || mode === 'both';
  const tone = mode === 'both' ? C.green : mode === 's' ? C.red : C.orange;
  const feedback =
    mode === 's'
      ? '只有搜索阶段的粗图被纠正：定位越来越准，但没人负责把边界修细。'
      : mode === 'i'
      ? '只有识别阶段的细图被监督：它缺少一个可信的起点，边界贴着错误的区域。'
      : '两处监督各管一段：粗图负责「在哪里」，细图负责「到哪里结束」。';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', height: '100%' }}>
      <div style={{ display: 'flex', gap: 12 }}>
        {([
          ['s', '仅 Ls（搜索阶段）'],
          ['i', '仅 Li（识别阶段）'],
          ['both', '双 CE（论文）'],
        ] as [Sup, string][]).map(([k, name]) => (
          <button
            key={k}
            onClick={() => setMode(k)}
            aria-pressed={mode === k}
            style={{
              fontSize: 24,
              padding: '12px 18px',
              borderRadius: 12,
              border: `2px solid ${mode === k ? C.blue : C.line}`,
              background: mode === k ? '#e8eef8' : '#fff',
              cursor: 'pointer',
            }}
          >
            {name}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <MaskCard label="Cs → Ccsm（粗图）" tone={C.blue} supervised={sOn} coarse />
        <MaskCard label="Ci → Ccim（细图）" tone={C.green} supervised={iOn} coarse={false} />
        <div style={{ width: 380, display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
          <div style={{ fontSize: 26, color: C.ink }}>L = </div>
          <div style={{ fontSize: 30, color: sOn ? C.blue : C.muted }}>Ls_CE(Ccsm, G)</div>
          <div style={{ fontSize: 30, color: iOn ? C.green : C.muted }}>+ Li_CE(Ccim, G)</div>
          <div style={{ fontSize: 20, color: C.muted, marginTop: 8 }}>红格 = 被算进损失的错误区域（示意）</div>
        </div>
      </div>
      <p style={{ fontSize: 26, lineHeight: 1.45, color: tone, margin: 0 }}>{feedback}</p>
      <p style={{ fontSize: 20, color: C.muted, margin: 0 }}>
        训练设置：Adam、batch 36、lr 1e-4、30 epoch 约 70 分钟（early-stop），352×352 推理约 0.2 秒；界面像素差异为教学示意。
      </p>
    </div>
  );
}

/* ---------------- Results (Tab.3) ---------------- */

const METRICS = ['Sα', 'Eφ', 'Fwβ', 'M'] as const;
type Metric = (typeof METRICS)[number];

const SETTINGS = [
  { id: 'i', name: '(i) CAMO' },
  { id: 'ii', name: '(ii) COD10K' },
  { id: 'iii', name: '(iii) CAMO+COD10K+EXTRA' },
] as const;
type SetId = (typeof SETTINGS)[number]['id'];

const DATASETS = [
  { id: 'chameleon', name: 'CHAMELEON' },
  { id: 'camo', name: 'CAMO-Test' },
  { id: 'cod', name: 'COD10K-Test' },
] as const;

const DATA: Record<SetId, Record<string, number[]>> = {
  i: { chameleon: [0.737, 0.737, 0.478, 0.103], camo: [0.708, 0.706, 0.476, 0.131], cod: [0.685, 0.718, 0.352, 0.092] },
  ii: { chameleon: [0.846, 0.871, 0.691, 0.05], camo: [0.665, 0.662, 0.47, 0.128], cod: [0.758, 0.796, 0.517, 0.054] },
  iii: { chameleon: [0.869, 0.891, 0.74, 0.044], camo: [0.751, 0.771, 0.606, 0.1], cod: [0.771, 0.806, 0.551, 0.051] },
};

const SET_LABEL: Record<string, string> = { i: '(i)', ii: '(ii)', iii: '(iii)' };

const BASELINE: Record<string, Record<string, number[]>> = {
  chameleon: { CPD: [0.853, 0.866, 0.706, 0.052], EGNet: [0.848, 0.87, 0.702, 0.05], FPN: [0.794, 0.783, 0.59, 0.075] },
  camo: { CPD: [0.726, 0.729, 0.55, 0.115], EGNet: [0.732, 0.768, 0.583, 0.104], FPN: [0.684, 0.677, 0.483, 0.131] },
  cod: { CPD: [0.747, 0.77, 0.508, 0.059], EGNet: [0.737, 0.779, 0.509, 0.056], FPN: [0.697, 0.691, 0.411, 0.075] },
};

export function SinetResults() {
  const [metric, setMetric] = useState<Metric>('Sα');
  const [set, setSet] = useState<string>('cod');
  const mi = METRICS.indexOf(metric);
  const lower = metric === 'M';
  const maxAxis = lower ? 0.15 : 1;
  const color = lower ? C.red : C.green;
  const rows = [
    { label: 'SINet (iii)', v: DATA.iii[set][mi], main: true },
    { label: 'SINet (ii)', v: DATA.ii[set][mi], main: false },
    { label: 'SINet (i)', v: DATA.i[set][mi], main: false },
    { label: 'CPD', v: BASELINE[set].CPD[mi], main: false },
    { label: 'EGNet', v: BASELINE[set].EGNet[mi], main: false },
    { label: 'FPN', v: BASELINE[set].FPN[mi], main: false },
  ];
  const bestBase = Math.max(...[BASELINE[set].CPD[mi], BASELINE[set].EGNet[mi], BASELINE[set].FPN[mi]]);
  const bestBaseLow = Math.min(...[BASELINE[set].CPD[mi], BASELINE[set].EGNet[mi], BASELINE[set].FPN[mi]]);
  const gap = DATA.iii[set][mi] - (lower ? bestBaseLow : bestBase);
  const setName = DATASETS.find((d) => d.id === set)?.name;
  const note =
    set === 'camo'
      ? '(ii) 只用 COD10K 训练时在 CAMO 上反而最低（0.665）——只看一个测试集会得出错误结论。'
      : set === 'cod'
      ? 'SINet (iii) 在四个指标上全面领先，但领先幅度随指标变化。'
      : 'CHAMELEON 只有 76 张，噪声大：SINet (iii) 与 CPD 的差距很小。';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', height: '100%' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 24, color: C.muted }}>测试集</span>
        {DATASETS.map((d) => (
          <button
            key={d.id}
            onClick={() => setSet(d.id)}
            aria-pressed={set === d.id}
            style={{
              fontSize: 24,
              padding: '8px 16px',
              borderRadius: 999,
              border: `2px solid ${set === d.id ? C.blue : C.line}`,
              background: set === d.id ? '#e8eef8' : '#fff',
              cursor: 'pointer',
            }}
          >
            {d.name}
          </button>
        ))}
        <span style={{ fontSize: 24, color: C.muted, marginLeft: 12 }}>指标</span>
        {METRICS.map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            aria-pressed={metric === m}
            style={{
              fontSize: 24,
              padding: '8px 16px',
              borderRadius: 999,
              border: `2px solid ${metric === m ? C.orange : C.line}`,
              background: metric === m ? '#fdeee5' : '#fff',
              cursor: 'pointer',
            }}
          >
            {m}
            {m === 'M' ? ' ↓' : ' ↑'}
          </button>
        ))}
      </div>
      <svg viewBox="0 0 1400 370" style={{ width: '100%', height: 370 }}>
        <rect width={1400} height={370} fill="#fff" stroke={C.line} rx={14} />
        <line x1={250} y1={20} x2={250} y2={330} stroke={C.line} />
        {rows.map((row, i) => {
          const w = (row.v / maxAxis) * 1000;
          const y = 28 + i * 51;
          return (
            <g key={row.label}>
              <text x={20} y={y + 30} fontSize={24} fill={C.ink} fontWeight={row.main ? 700 : 400}>{row.label}</text>
              <rect x={258} y={y} width={Math.max(w, 3)} height={38} rx={8} fill={row.main ? color : C.light} opacity={row.main ? 0.95 : 0.75} />
              <text x={266 + w} y={y + 28} fontSize={24} fill={C.ink}>{row.v.toFixed(3)}</text>
            </g>
          );
        })}
        <text x={20} y={356} fontSize={20} fill={C.muted}>
          {setName} · {metric} · {lower ? '越低越好（纵轴 0–0.15）' : '越高越好（纵轴 0–1）'} · Tab.3 实测值
        </text>
      </svg>
      <p style={{ fontSize: 26, lineHeight: 1.4, color: C.ink, margin: 0 }}>
        {setName} 上 SINet (iii) 对最强基线：{gap >= 0 ? '+' : ''}{gap.toFixed(3)}。{note}
      </p>
      <p style={{ fontSize: 20, color: C.muted, margin: 0 }}>
        (i)(ii)(iii) 是训练数据不同的三档设置，不是模块消融；基线用设置 (iv)；论文未给出模块级消融表。
      </p>
    </div>
  );
}

/* ---------------- Generalization (Tab.4) ---------------- */

const GEN = [
  { id: 'camo', name: '在 CAMO 上训练', self: 0.803, others: 0.678, drop: '15.6%', bad: true },
  { id: 'cod', name: '在 COD10K 上训练', self: 0.7, others: 0.683, drop: '2.40%', bad: false },
] as const;

export function SinetGeneral() {
  const [pick, setPick] = useState<'camo' | 'cod'>('camo');
  const cur = GEN.find((g) => g.id === pick)!;
  return (
    <div style={{ display: 'flex', gap: 22, width: '100%', height: '100%' }}>
      <svg viewBox="0 0 820 560" style={{ width: 820, height: '100%' }}>
        <rect width={820} height={560} fill={C.bg} rx={16} />
        {[70, 160, 250, 340, 430, 520, 610, 700].map((x, i) => (
          <ellipse key={x} cx={x} cy={470 + (i % 2) * 18} rx={64} ry={26} fill={i % 3 === 0 ? C.dark : C.light} />
        ))}
        <text x={26} y={44} fontSize={24} fill={C.muted}>同一套参数，换一片林子（换测试集）还能不能找到虫子</text>
        <line x1={110} y1={420} x2={760} y2={420} stroke={C.line} />
        {[
          { label: '自测（同分布）', v: cur.self, fill: C.green },
          { label: '其他数据集均值', v: cur.others, fill: cur.bad ? C.red : C.blue },
        ].map((b, i) => {
          const h = b.v * 400;
          const x = 200 + i * 220;
          return (
            <g key={b.label}>
              <rect x={x} y={420 - h} width={130} height={h} rx={8} fill={b.fill} opacity={0.9} />
              <text x={x + 8} y={420 - h - 12} fontSize={26} fill={C.ink}>{b.v.toFixed(3)}</text>
              <text x={x - 12} y={452} fontSize={22} fill={C.muted}>{b.label}</text>
            </g>
          );
        })}
        <rect x={575} y={168} width={228} height={112} rx={12} fill="#fff" stroke={C.line} />
        <text x={592} y={222} fontSize={42} fontWeight={700} fill={cur.bad ? C.red : C.green}>↓ {cur.drop}</text>
        <text x={592} y={256} fontSize={20} fill={C.muted}>跨域下降 · Tab.4</text>
        <text x={26} y={548} fontSize={20} fill={C.muted}>协议：每数据集随机 800 训练 / 200 测试，训练至损失稳定</text>
      </svg>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {GEN.map((g) => (
          <button
            key={g.id}
            onClick={() => setPick(g.id)}
            aria-pressed={pick === g.id}
            style={{
              fontSize: 26,
              padding: '16px 18px',
              textAlign: 'left',
              borderRadius: 12,
              border: `2px solid ${pick === g.id ? C.blue : C.line}`,
              background: pick === g.id ? '#e8eef8' : '#fff',
              cursor: 'pointer',
            }}
          >
            {g.name}
            <span style={{ fontSize: 20, color: C.muted, marginLeft: 10 }}>drop {g.drop}</span>
          </button>
        ))}
        <div style={{ border: `2px solid ${C.line}`, borderRadius: 12, padding: 14, background: '#fff' }}>
          <div style={{ fontSize: 24, color: C.ink, marginBottom: 8 }}>论文自己划的边界</div>
          <ul style={{ fontSize: 22, lineHeight: 1.5, color: C.muted, margin: 0, paddingLeft: 24 }}>
            <li>只做 object-level，instance 级留给未来工作</li>
            <li>输入固定 352×352，推理 0.2 秒量级</li>
            <li>跨域会掉点：CAMO 训练换域掉 15.6%</li>
            <li>未来方向：RGB-D、弱监督、零样本</li>
          </ul>
        </div>
        <p style={{ fontSize: 24, lineHeight: 1.4, color: cur.bad ? C.red : C.green, margin: 0 }}>
          {cur.bad
            ? '训练集只覆盖一种场景时，换林子掉得最狠——这页和第 9 页协议不同，数字不能直接比。'
            : '训练集覆盖更广时，换林子掉得少：drop 只有 2.40%。'}
        </p>
      </div>
    </div>
  );
}
