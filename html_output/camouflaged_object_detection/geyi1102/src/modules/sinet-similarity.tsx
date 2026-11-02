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

function Leaf({ x, y, r, rot, fill }: { x: number; y: number; r: number; rot: number; fill: string }) {
  return <ellipse cx={x} cy={y} rx={r} ry={r * 0.42} fill={fill} transform={`rotate(${rot} ${x} ${y})`} />;
}

function Insect({ x, y, s, stroke, fill, opacity = 1 }: { x: number; y: number; s: number; stroke: string; fill: string; opacity?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity} fill="none" stroke={stroke} strokeWidth={2.2} strokeLinecap="round">
      <line x1={-34} y1={0} x2={-46} y2={-16} />
      <line x1={-34} y1={0} x2={-44} y2={14} />
      <line x1={30} y1={0} x2={42} y2={-14} />
      <line x1={30} y1={0} x2={40} y2={16} />
      <rect x={-34} y={-9} width={64} height={18} rx={9} fill={fill} />
      <circle cx={36} cy={0} r={7} fill={fill} />
      <line x1={-6} y1={-9} x2={-18} y2={-26} />
      <line x1={2} y1={-9} x2={-10} y2={-28} />
      <line x1={-6} y1={9} x2={-18} y2={26} />
      <line x1={2} y1={9} x2={-10} y2={28} />
    </g>
  );
}

function lerpColor(a: string, b: string, t: number) {
  const p = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const [r1, g1, b1] = p(a);
  const [r2, g2, b2] = p(b);
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
}

/* ---------------- cover ---------------- */

export function SinetCover({ moduleId }: WidgetProps) {
  const { progress } = useCoverPlayback();
  const old = moduleId === 'oldMethod';
  const sweep = Math.min(1, progress / 0.72);
  const lock = progress <= 0.72 ? 0 : (progress - 0.72) / 0.28;
  const spotX = old ? 470 + 62 * Math.sin(progress * Math.PI * 2) : 92 + sweep * 208;
  const spotR = old ? 84 : 142 - sweep * 96;
  const lensR = 26 + lock * 58;
  return (
    <svg viewBox="0 0 664 324" style={{ width: '100%', height: '100%' }} role="img" aria-label={old ? '显著检测光斑只扫亮处' : 'SINet 扫视后放大确认'}>
      <rect width={664} height={324} fill={C.bg} />
      <ellipse cx={508} cy={116} rx={78} ry={54} fill="#f6ecd2" />
      {[80, 150, 225, 300, 370, 445, 520, 590].map((x, i) => (
        <Leaf key={x} x={x} y={262 + (i % 2) * 16} r={54} rot={i % 2 ? -18 : 12} fill={i % 3 === 0 ? C.dark : C.light} />
      ))}
      <Leaf x={300} y={236} r={46} rot={-8} fill={C.dark} />
      <Insect x={300} y={236} s={0.62} stroke={old ? '#4b6635' : '#4b6635'} fill={old ? '#738f57' : '#738f57'} opacity={old ? 1 : lock > 0 ? 1 : 0.85} />
      {old && <circle cx={spotX} cy={116} r={spotR} fill={C.blue} opacity={0.16} stroke={C.blue} strokeWidth={2} strokeDasharray="6 6" />}
      {!old && (
        <>
          <circle cx={spotX} cy={236} r={spotR} fill={C.blue} opacity={0.18} stroke={C.blue} strokeWidth={2.4} />
          {lock > 0 && (
            <>
              <circle cx={300} cy={236} r={lensR} fill="none" stroke={C.green} strokeWidth={4} />
              <line x1={300 + lensR * 0.72} y1={236 + lensR * 0.72} x2={300 + lensR + 26} y2={236 + lensR + 26} stroke={C.route} strokeWidth={7} strokeLinecap="round" />
              <Insect x={300} y={236} s={0.62} stroke={C.green} fill="none" opacity={Math.min(1, lock * 1.6)} />
            </>
          )}
        </>
      )}
      <text x={22} y={36} fontSize={20} fill={C.muted}>{old ? '光斑 = 显著性，只找最亮处' : '光斑 = 感受野，由大到小扫'}</text>
      <text x={22} y={306} fontSize={20} fill={old ? C.red : C.green}>{old ? '虫子始终在暗处，没被看见' : lock > 0.5 ? '锁定后放大，勾出边界' : '先扫视，再凑近'}</text>
    </svg>
  );
}

/* ---------------- similarity ---------------- */

function gauss(center: number, sigma = 0.13) {
  return Array.from({ length: 33 }, (_, i) => {
    const x = i / 32;
    return Math.exp(-((x - center) ** 2) / (2 * sigma * sigma));
  });
}

function curve(vals: number[], x0: number, y0: number, w: number, h: number) {
  return vals
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${(x0 + (i / (vals.length - 1)) * w).toFixed(1)},${(y0 - v * h).toFixed(1)}`)
    .join(' ');
}

export function SinetSimilarity() {
  const [match, setMatch] = useState(0.42);
  const t = (match - 0.2) / 0.78;
  const chi2 = 0.05 + 1.9 * (1 - match);
  const ib = chi2 < 0.9;
  const tone = match > 0.553 ? C.red : match > 0.45 ? C.blue : C.green;
  const bgHist = gauss(0.46);
  const fgHist = gauss(0.46 + 0.34 * (1 - match));
  const feedback =
    match > 0.553
      ? `χ² = ${chi2.toFixed(2)} < 0.9：论文把这张图记为 IB（边界不可辨）。对比度线索几乎消失。`
      : match > 0.45
      ? `χ² = ${chi2.toFixed(2)}，正在逼近 0.9 的临界：叶脉与虫体边缘开始混在一起。`
      : `χ² = ${chi2.toFixed(2)} ≥ 0.9：灰度与颜色还差得开，显著/通用检测仍能把它挑出来。`;
  return (
    <div style={{ display: 'flex', gap: 28, width: '100%', height: '100%' }}>
      <svg viewBox="0 0 600 622" style={{ width: 600, height: '100%' }}>
        <rect width={600} height={622} fill={C.bg} rx={16} />
        {[70, 145, 220, 300, 380, 460, 530].map((x, i) => (
          <Leaf key={x} x={x} y={480 + (i % 2) * 26} r={78} rot={i % 2 ? -16 : 10} fill={i % 3 === 0 ? C.dark : C.light} />
        ))}
        <Leaf x={300} y={430} r={70} rot={-6} fill={C.dark} />
        <Insect x={300} y={430} s={1.5} stroke={lerpColor('#3f5c2c', '#6f8f52', t)} fill={lerpColor('#8fb36a', '#6f8f52', t)} />
        <text x={30} y={54} fontSize={24} fill={C.muted}>同一片灌木：虫体颜色随匹配度靠近叶片</text>
        <text x={30} y={590} fontSize={24} fill={tone}>{ib ? '边界已不可辨' : '仍看得出轮廓'}</text>
      </svg>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <label style={{ fontSize: 28, color: C.ink }}>
          背景匹配度 <b style={{ color: C.orange }}>{match.toFixed(2)}</b>
          <input
            type="range"
            min={0.2}
            max={0.98}
            step={0.02}
            value={match}
            aria-label="背景匹配度"
            onChange={(e) => setMatch(Number(e.target.value))}
            style={{ width: '100%', marginTop: 10, accentColor: '#f07e47' }}
          />
        </label>
        <svg viewBox="0 0 760 300" style={{ width: '100%', height: 300 }}>
          <rect width={760} height={300} fill="#ffffff" stroke={C.line} rx={14} />
          <line x1={60} y1={250} x2={720} y2={250} stroke={C.line} />
          <path d={curve(bgHist, 60, 250, 640, 200)} fill="none" stroke={C.muted} strokeWidth={3} />
          <path d={curve(fgHist, 60, 250, 640, 200)} fill="none" stroke={tone} strokeWidth={3.5} />
          <text x={60} y={282} fontSize={22} fill={C.muted}>RGB 分布：灰=背景，彩=前景</text>
          <text x={500} y={40} fontSize={22} fill={C.muted}>直方图重叠越多 → χ² 越小</text>
        </svg>
        <svg viewBox="0 0 760 120" style={{ width: '100%', height: 120 }}>
          <rect width={760} height={120} fill="#ffffff" stroke={C.line} rx={14} />
          <text x={24} y={72} fontSize={44} fill={tone} fontWeight={700}>χ² = {chi2.toFixed(2)}</text>
          <line x1={360} y1={44} x2={730} y2={44} stroke={C.muted} strokeWidth={3} />
          <line x1={648} y1={30} x2={648} y2={58} stroke={C.orange} strokeWidth={4} />
          <text x={596} y={92} fontSize={22} fill={C.orange}>阈值 0.9</text>
        </svg>
        <p style={{ fontSize: 26, lineHeight: 1.45, color: tone, margin: 0 }}>{feedback}</p>
        <p style={{ fontSize: 20, color: C.muted, margin: 0 }}>匹配度 → χ² 为演示用线性映射；0.9 是论文给 IB 属性打标签的阈值。</p>
      </div>
    </div>
  );
}

/* ---------------- COD10K ---------------- */

type SetKey = 'chameleon' | 'camo' | 'cod10k';

const SETS: Record<SetKey, { name: string; n: number; cls: string; levels: string[]; note: string }> = {
  chameleon: {
    name: 'CHAMELEON',
    n: 76,
    cls: '未标注类别',
    levels: ['—', '—', 'object ✓', '—', '—', '—'],
    note: '76 张，只有 object 级掩码，没有属性、框与实例标注。',
  },
  camo: {
    name: 'CAMO',
    n: 2500,
    cls: '8 类',
    levels: ['✓', '—', 'object ✓', '—', '—', '✓'],
    note: '2,500 张（2K 训练 / 0.5K 测试），8 类，有属性与显式划分。',
  },
  cod10k: {
    name: 'COD10K',
    n: 10000,
    cls: '78 子类',
    levels: ['✓', '✓', 'object ✓', 'instance ✓', 'matting ✓', '✓'],
    note: '10,000 张 = 5,066 伪装 + 3,000 背景 + 1,934 非伪装；6,000 训练 / 4,000 测试；5,069 object 掩码、5,930 instance GT。',
  },
};

const LEVEL_NAMES = ['属性', '边界框', 'object 掩码', 'instance 掩码', 'matting 边界', '显式划分'];

export function SinetCod10k() {
  const [key, setKey] = useState<SetKey>('cod10k');
  const cur = SETS[key];
  const max = 10000;
  return (
    <div style={{ display: 'flex', gap: 26, width: '100%', height: '100%' }}>
      <div style={{ width: 380, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {(Object.keys(SETS) as SetKey[]).map((k) => (
          <button
            key={k}
            onClick={() => setKey(k)}
            aria-pressed={key === k}
            style={{
              textAlign: 'left',
              fontSize: 28,
              padding: '18px 22px',
              borderRadius: 14,
              border: `2px solid ${key === k ? C.blue : C.line}`,
              background: key === k ? '#e8eef8' : '#fff',
              color: C.ink,
              cursor: 'pointer',
            }}
          >
            <b>{SETS[k].name}</b>
            <span style={{ color: C.muted, marginLeft: 12 }}>{SETS[k].cls}</span>
          </button>
        ))}
        <p style={{ fontSize: 22, color: C.muted, margin: 0 }}>灰色破折号 = 该数据集没有这项标注。</p>
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <svg viewBox="0 0 720 300" style={{ width: '100%', height: 300 }}>
          <rect width={720} height={300} fill="#fff" stroke={C.line} rx={14} />
          {(Object.keys(SETS) as SetKey[]).map((k, i) => {
            const w = (SETS[k].n / max) * 560;
            const y = 40 + i * 74;
            return (
              <g key={k}>
                <text x={18} y={y + 26} fontSize={24} fill={k === key ? C.ink : C.muted}>{SETS[k].name}</text>
                <rect x={170} y={y} width={Math.max(w, 4)} height={34} rx={8} fill={k === key ? C.blue : C.light} />
                <text x={180 + Math.max(w, 4)} y={y + 26} fontSize={24} fill={C.ink}>{SETS[k].n.toLocaleString()}</text>
              </g>
            );
          })}
          <line x1={170} y1={272} x2={730} y2={272} stroke={C.line} />
          <text x={18} y={292} fontSize={20} fill={C.muted}>图像数量（张）</text>
        </svg>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {LEVEL_NAMES.map((name, i) => {
            const on = cur.levels[i] !== '—';
            return (
              <div
                key={name}
                style={{
                  fontSize: 24,
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: `2px solid ${on ? C.green : C.line}`,
                  background: on ? 'rgba(34,141,92,0.10)' : '#fff',
                  color: on ? C.green : C.muted,
                }}
              >
                {name}
                <span style={{ marginLeft: 8, color: C.ink }}>{cur.levels[i]}</span>
              </div>
            );
          })}
        </div>
        <p style={{ fontSize: 26, lineHeight: 1.45, color: C.ink, margin: 0 }}>{cur.note}</p>
      </div>
    </div>
  );
}
