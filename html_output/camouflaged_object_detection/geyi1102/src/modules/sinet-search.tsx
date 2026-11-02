import { useRef, useState } from 'react';
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

/* ---------------- RF ---------------- */

const KERNEL = ['1×1', '3×3', '5×5', '7×7', '9×9'];
const DILATION = ['无', '无', '5', '7', '9'];

export function SinetRf() {
  const [k, setK] = useState(1);
  const r = 40 + 34 * (k - 1);
  const legsOn = k >= 2;
  const outlineOn = k >= 4;
  const tone = k === 1 ? C.red : k <= 3 ? C.blue : C.green;
  const feedback =
    k === 1
      ? '1×1 卷积只能看单个像素的纹理：细肢在特征图上断开，凑不成结构。'
      : k <= 3
      ? `${KERNEL[k - 1]} 卷积把细肢与躯干连成局部结构，但整体轮廓仍在感受野之外。`
      : `${KERNEL[k - 1]} 卷积 + 膨胀率 ${DILATION[k - 1]}：一次就能覆盖到整体轮廓。`;
  return (
    <div style={{ display: 'flex', gap: 26, width: '100%', height: '100%' }}>
      <svg viewBox="0 0 700 590" style={{ width: 700, height: '100%' }}>
        <rect width={700} height={590} fill={C.bg} rx={16} />
        {[80, 170, 260, 350, 440, 530, 620].map((x, i) => (
          <Leaf key={x} x={x} y={470 + (i % 2) * 22} r={76} rot={i % 2 ? -16 : 12} fill={i % 3 === 0 ? C.dark : C.light} />
        ))}
        <Leaf x={350} y={420} r={72} rot={-4} fill={C.dark} />
        <circle cx={350} cy={420} r={r} fill={C.orange} opacity={0.26} stroke={tone} strokeWidth={4} strokeDasharray="10 6" />
        <g transform="translate(350 420) scale(2.2)" fill="none" stroke={C.ink} strokeWidth={2.2} strokeLinecap="round">
          <rect x={-34} y={-9} width={64} height={18} rx={9} fill={legsOn ? '#cfd9c0' : 'none'} />
          <circle cx={36} cy={0} r={7} fill={legsOn ? '#cfd9c0' : 'none'} />
          <g opacity={legsOn ? 1 : 0.25}>
            <line x1={-34} y1={0} x2={-46} y2={-16} />
            <line x1={-34} y1={0} x2={-44} y2={14} />
            <line x1={-6} y1={-9} x2={-18} y2={-26} />
            <line x1={2} y1={-9} x2={-10} y2={-28} />
            <line x1={-6} y1={9} x2={-18} y2={26} />
            <line x1={2} y1={9} x2={-10} y2={28} />
          </g>
          <g opacity={outlineOn ? 1 : 0.25}>
            <line x1={30} y1={0} x2={42} y2={-14} />
            <line x1={30} y1={0} x2={40} y2={16} />
          </g>
        </g>
        <text x={26} y={44} fontSize={24} fill={C.muted}>橙色光斑 = 当前分支的等效感受野</text>
        <text x={26} y={562} fontSize={24} fill={tone}>{k === 1 ? '只有躯干被看到' : outlineOn ? '细肢与触角都在范围内' : '细肢被连起来，触角还在外面'}</text>
      </svg>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {[1, 2, 3, 4, 5].map((kk) => (
            <button
              key={kk}
              onClick={() => setK(kk)}
              aria-pressed={k === kk}
              aria-label={`分支 ${kk}，核 ${KERNEL[kk - 1]}`}
              style={{
                flex: 1,
                fontSize: 26,
                padding: '14px 8px',
                borderRadius: 12,
                border: `2px solid ${k === kk ? C.blue : C.line}`,
                background: k === kk ? '#e8eef8' : '#fff',
                color: C.ink,
                cursor: 'pointer',
              }}
            >
              k={kk}
              <div style={{ fontSize: 20, color: C.muted, marginTop: 4 }}>{KERNEL[kk - 1]}</div>
            </button>
          ))}
        </div>
        <svg viewBox="0 0 720 220" style={{ width: '100%', height: 220 }}>
          <rect width={720} height={220} fill="#fff" stroke={C.line} rx={14} />
          <text x={22} y={48} fontSize={24} fill={C.muted}>有效核尺寸</text>
          <text x={300} y={52} fontSize={44} fill={C.ink} fontWeight={700}>{KERNEL[k - 1]}</text>
          <text x={22} y={104} fontSize={24} fill={C.muted}>膨胀率（k&gt;2 才有）</text>
          <text x={300} y={108} fontSize={44} fill={k > 2 ? C.purple : C.muted} fontWeight={700}>{DILATION[k - 1]}</text>
          <text x={22} y={160} fontSize={24} fill={C.muted}>分支通道</text>
          <text x={300} y={164} fontSize={32} fill={C.ink}>1×1 降到 32</text>
          <text x={22} y={200} fontSize={20} fill={C.muted}>五支并联：前四支拼接后 1×1 降回 32，再与第五支相加、过 ReLU。</text>
        </svg>
        <p style={{ fontSize: 26, lineHeight: 1.45, color: tone, margin: 0 }}>{feedback}</p>
        <p style={{ fontSize: 20, color: C.muted, margin: 0 }}>光斑只示意「看得多广」，不代表卷积权重学到了什么。</p>
      </div>
    </div>
  );
}

/* ---------------- Search ---------------- */

const N = 16;
const CELL = 30;
const TARGET = { x: 10, y: 10 };

function buildFeature() {
  const f: number[] = [];
  for (let y = 0; y < N; y += 1) {
    for (let x = 0; x < N; x += 1) {
      const d = Math.hypot(x - TARGET.x, y - TARGET.y);
      const base = d < 3 ? 0.85 - d * 0.12 : 0.18 + 0.05 * Math.sin(x * 1.7 + y * 2.1);
      f.push(Math.max(0.06, Math.min(1, base)));
    }
  }
  return f;
}
const FEATURE = buildFeature();

function buildCoarse() {
  const f: number[] = [];
  for (let y = 0; y < N; y += 1) {
    for (let x = 0; x < N; x += 1) {
      const d = Math.hypot(x - TARGET.x + 1, y - TARGET.y - 1);
      f.push(d < 4.2 ? 0.62 - d * 0.09 : 0.1);
    }
  }
  return f;
}
const COARSE = buildCoarse();

function heat(v: number) {
  const r = Math.round(184 + (240 - 184) * v);
  const g = Math.round(201 + (126 - 201) * v);
  const b = Math.round(167 + (71 - 167) * v);
  return `rgb(${r},${g},${b})`;
}

export function SinetSearch() {
  const [cx, setCx] = useState(10);
  const [cy, setCy] = useState(10);
  const [sigma, setSigma] = useState(32);
  const svgRef = useRef<SVGSVGElement>(null);
  const sigmaCells = sigma / 22;
  const g = FEATURE.map((_, i) => {
    const x = i % N;
    const y = Math.floor(i / N);
    const w = Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * sigmaCells * sigmaCells));
    return Math.max(0, Math.min(1, w * FEATURE[i] * 1.25));
  });
  const ch = g.map((v, i) => Math.max(v, COARSE[i]));
  const dist = Math.hypot(cx - TARGET.x, cy - TARGET.y);
  const tone = dist <= 3 ? C.green : dist <= 6 ? C.blue : C.red;
  const feedback =
    dist <= 3
      ? '注意力落在候选区域上：g(X2) 把中层细节集中到这里，Ch 比 Cs 更锐利。'
      : dist <= 6
      ? '光斑偏了一点：Ch 仍保留 Cs 的粗定位，没有被注意力带跑。'
      : '注意力打偏：因为 Ch 取的是逐像素较大值，Cs 的粗定位仍然留在图里。';

  const move = (clientX: number, clientY: number) => {
    const el = svgRef.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const px = ((clientX - box.left) / box.width) * 540 - 30;
    const py = ((clientY - box.top) / box.height) * 540 - 90;
    setCx(Math.max(0, Math.min(N - 1, Math.round(px / CELL - 0.5))));
    setCy(Math.max(0, Math.min(N - 1, Math.round(py / CELL - 0.5))));
  };

  return (
    <div style={{ display: 'flex', gap: 24, width: '100%', height: '100%' }}>
      <svg
        ref={svgRef}
        viewBox="0 0 540 540"
        style={{ width: 540, height: '100%', touchAction: 'none', cursor: 'grab' }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          move(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) move(e.clientX, e.clientY);
        }}
        role="application"
        aria-label="拖动光斑中心改变搜索注意力位置"
      >
        <rect width={540} height={540} fill={C.bg} rx={16} />
        {ch.map((v, i) => {
          const x = i % N;
          const y = Math.floor(i / N);
          return <rect key={i} x={30 + x * CELL} y={60 + y * CELL} width={CELL - 2} height={CELL - 2} fill={heat(v)} />;
        })}
        <rect x={30 + cx * CELL} y={60 + cy * CELL} width={CELL - 2} height={CELL - 2} fill="none" stroke={C.blue} strokeWidth={4} />
        <text x={24} y={38} fontSize={26} fill={C.muted}>Ch = max(g(X2), Cs)</text>
        <text x={24} y={586 - 8} fontSize={22} fill={C.muted}>拖动改变注意力中心</text>
      </svg>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div>
            <div style={{ fontSize: 22, color: C.muted }}>g(X2)：注意力加权后的中层</div>
            <svg viewBox="0 0 240 240" style={{ width: 240, height: 240 }}>
              {g.map((v, i) => (
                <rect key={i} x={(i % N) * 15} y={Math.floor(i / N) * 15} width={14} height={14} fill={heat(v)} />
              ))}
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 22, color: C.muted }}>Cs：PDC_s 的粗定位</div>
            <svg viewBox="0 0 240 240" style={{ width: 240, height: 240 }}>
              {COARSE.map((v, i) => (
                <rect key={i} x={(i % N) * 15} y={Math.floor(i / N) * 15} width={14} height={14} fill={heat(v)} />
              ))}
            </svg>
          </div>
        </div>
        <label style={{ fontSize: 26, color: C.ink }}>
          σ = <b style={{ color: C.orange }}>{sigma}</b>
          <span style={{ fontSize: 20, color: C.muted }}>（论文固定 32）</span>
          <input
            type="range"
            min={8}
            max={64}
            step={2}
            value={sigma}
            aria-label="搜索注意力标准差"
            onChange={(e) => setSigma(Number(e.target.value))}
            style={{ width: '100%', marginTop: 8, accentColor: '#f07e47' }}
          />
        </label>
        <p style={{ fontSize: 26, lineHeight: 1.45, color: tone, margin: 0 }}>{feedback}</p>
        <p style={{ fontSize: 20, color: C.muted, margin: 0 }}>
          网格为示意：真实 g(·) 是对中层特征 X₂ 做 σ=32、λ=4 的高斯滤波后归一化，再与 Cs 逐像素取最大。
        </p>
      </div>
    </div>
  );
}

/* ---------------- PDC ---------------- */

const LEVELS = [
  { k: 4, dim: '88×88×64', name: 'rf₁（浅）' },
  { k: 3, dim: '44×44×256', name: 'rf₂' },
  { k: 2, dim: '22×22×1024', name: 'rf₃' },
  { k: 1, dim: '11×11×2048', name: 'rf₄（深）' },
];

export function SinetPdc() {
  const [level, setLevel] = useState(4);
  const [mode, setMode] = useState<'gate' | 'add'>('gate');
  const confirmed = 4 - level + 1;
  const tone = mode === 'add' ? C.red : confirmed === 4 ? C.green : C.blue;
  const feedback =
    mode === 'add'
      ? '直接相加：四层等权叠加，浅层的背景纹理一起被放大，边界出现毛刺。'
      : confirmed === 4
      ? '四层都已确认：深层给出位置，浅层补上边界，合成一张伪装图 Ci。'
      : `已确认 ${confirmed}/4 层：深层先定位，尚浅的层被门控压住，等确认后再放行。`;
  return (
    <div style={{ display: 'flex', gap: 24, width: '100%', height: '100%' }}>
      <div style={{ width: 460, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {LEVELS.map((lv, i) => {
          const done = i >= 4 - confirmed || mode === 'add';
          return (
            <div
              key={lv.k}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 16px',
                borderRadius: 12,
                border: `2px solid ${done ? C.blue : C.line}`,
                background: done ? '#e8eef8' : '#fff',
                opacity: done ? 1 : 0.55,
                fontSize: 24,
                color: C.ink,
              }}
            >
              <b style={{ width: 110 }}>{lv.name}</b>
              <span style={{ color: C.muted, width: 170 }}>{lv.dim}</span>
              <span style={{ color: done ? C.green : C.muted }}>{done ? '已融合' : '门控压住'}</span>
            </div>
          );
        })}
        <button
          onClick={() => setLevel((v) => (v <= 1 ? 4 : v - 1))}
          style={{ marginTop: 6, fontSize: 26, padding: '14px', borderRadius: 12, border: `2px solid ${C.blue}`, background: '#fff', cursor: 'pointer' }}
        >
          由深向浅再确认一层（已确认 {mode === 'add' ? 4 : confirmed}/4）
        </button>
        <button
          onClick={() => setMode(mode === 'gate' ? 'add' : 'gate')}
          aria-pressed={mode === 'add'}
          style={{ fontSize: 24, padding: '12px', borderRadius: 12, border: `2px solid ${C.orange}`, background: mode === 'add' ? '#fdeee5' : '#fff', cursor: 'pointer' }}
        >
          融合方式：{mode === 'gate' ? '门控乘法 ⊗' : '直接相加 ⊕'}（点击切换）
        </button>
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 24, color: C.muted }}>最终伪装图 Ci（示意）</div>
        <svg viewBox="0 0 900 300" style={{ width: '100%', height: 300 }}>
          <rect width={900} height={300} fill="#fff" stroke={C.line} rx={14} />
          {Array.from({ length: 60 }).map((_, i) => {
            const x = (i % 10) * 80 + 30;
            const y = Math.floor(i / 10) * 44 + 16;
            const inside = Math.hypot((i % 10) - 4.5, Math.floor(i / 10) - 2.5) < 3.2;
            const noisy = mode === 'add' && (i * 37) % 11 === 0 && !inside;
            const on = inside && (mode === 'add' || i % 10 < 3 + confirmed);
            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={64}
                height={30}
                rx={6}
                fill={inside && on ? (mode === 'add' ? C.route : C.green) : noisy ? C.red : '#eef2f7'}
                opacity={inside && on ? 0.85 : noisy ? 0.35 : 1}
              />
            );
          })}
        </svg>
        <div style={{ fontSize: 28, color: C.ink }}>
          边界毛刺：<b style={{ color: C.red }}>{mode === 'add' ? '明显增多' : '已被抑制'}</b>
          <span style={{ fontSize: 20, color: C.muted }}>（教学示意，非论文数值）</span>
        </div>
        <p style={{ fontSize: 26, lineHeight: 1.45, color: tone, margin: 0 }}>{feedback}</p>
        <p style={{ fontSize: 20, color: C.muted, margin: 0 }}>
          rf_c2_k = rf_c1_k ⊗ Π Bconv(UP(rf_c1_j))：深层先上采样，再逐元素乘到浅层上。
        </p>
      </div>
    </div>
  );
}

/* ---------------- Architecture ---------------- */

const NODES = [
  { id: 'input', x: 20, y: 150, w: 130, h: 90, label: '输入', sub: '352×352×3' },
  { id: 'backbone', x: 190, y: 120, w: 190, h: 150, label: 'ResNet-50', sub: '五级特征' },
  { id: 'rf', x: 420, y: 120, w: 170, h: 150, label: 'RF × 4', sub: '多尺度感受野' },
  { id: 'pdcs', x: 630, y: 40, w: 170, h: 90, label: 'PDC_s', sub: '→ Cs（4 输入）' },
  { id: 'sa', x: 630, y: 250, w: 170, h: 90, label: 'SA', sub: 'σ=32, λ=4' },
  { id: 'pdci', x: 840, y: 120, w: 170, h: 150, label: 'PDC_i', sub: '→ Ci（3 输入）' },
  { id: 'up', x: 1050, y: 120, w: 150, h: 150, label: '上采样', sub: '→ 352×352' },
  { id: 'loss', x: 1240, y: 120, w: 210, h: 150, label: '两个交叉熵', sub: 'Ls + Li' },
];

const EDGES: [string, string][] = [
  ['input', 'backbone'],
  ['backbone', 'rf'],
  ['rf', 'pdcs'],
  ['rf', 'sa'],
  ['rf', 'pdci'],
  ['backbone', 'sa'],
  ['pdcs', 'pdci'],
  ['pdci', 'up'],
  ['up', 'loss'],
];

const DESC: Record<string, string> = {
  input: '统一缩放到 352×352，送进骨干网络。',
  backbone: 'ResNet-50 提五级特征；第二层 stride 改为 1，使各层分辨率为 {H/k,W/k}, k=4,4,8,16,32。',
  rf: 'RF 组件：五分支并联 (2k−1)×(2k−1) 卷积，k>2 加膨胀率 2k−1，通道统一降到 32。',
  pdcs: 'PDC_s 融合四个尺度，得到搜索阶段的粗图 Cs。',
  sa: 'SA 对中层特征 X₂ 做 σ=32、λ=4 的高斯滤波后归一化，再与 Cs 逐像素取最大，得到 Ch。',
  pdci: 'PDC_i 融合三个高层特征，得到最终伪装图 Ci。',
  up: '两张图都上采样到 352×352，才能与 GT 对齐算损失。',
  loss: 'L = Ls_CE(Ccsm,G) + Li_CE(Ccim,G)，搜索与识别各有一处监督。',
};

export function SinetArch() {
  const [focus, setFocus] = useState('rf');
  const near = new Set<string>([focus]);
  EDGES.forEach(([a, b]) => {
    if (a === focus) near.add(b);
    if (b === focus) near.add(a);
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', height: '100%' }}>
      <svg viewBox="0 0 1472 390" style={{ width: '100%', height: 390 }}>
        <rect width={1472} height={390} fill={C.bg} rx={16} />
        {EDGES.map(([a, b]) => {
          const na = NODES.find((n) => n.id === a)!;
          const nb = NODES.find((n) => n.id === b)!;
          const on = (a === focus || b === focus) && near.has(a) && near.has(b);
          if (a === 'backbone' && b === 'sa') {
            return (
              <polyline
                key={`${a}-${b}`}
                points={`${na.x + na.w - 30},${na.y + na.h} ${na.x + na.w - 30},378 ${nb.x + 60},378 ${nb.x + 60},${nb.y + nb.h}`}
                fill="none"
                stroke={on ? C.blue : C.line}
                strokeWidth={on ? 5 : 2.5}
                opacity={on ? 1 : 0.6}
              />
            );
          }
          return (
            <line
              key={`${a}-${b}`}
              x1={na.x + na.w}
              y1={na.y + na.h / 2}
              x2={nb.x}
              y2={nb.y + nb.h / 2}
              stroke={on ? C.blue : C.line}
              strokeWidth={on ? 5 : 2.5}
              opacity={on ? 1 : 0.6}
            />
          );
        })}
        {NODES.map((n) => {
          const active = n.id === focus;
          const related = near.has(n.id);
          return (
            <g key={n.id} opacity={related ? 1 : 0.45}>
              <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={12} fill="#fff" stroke={active ? C.blue : C.line} strokeWidth={active ? 5 : 2.5} />
              <text x={n.x + 14} y={n.y + 38} fontSize={26} fill={C.ink} fontWeight={active ? 700 : 500}>{n.label}</text>
              <text x={n.x + 14} y={n.y + 72} fontSize={20} fill={C.muted}>{n.sub}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {NODES.map((n) => (
          <button
            key={n.id}
            onClick={() => setFocus(n.id)}
            aria-pressed={focus === n.id}
            style={{
              fontSize: 22,
              padding: '10px 16px',
              borderRadius: 999,
              border: `2px solid ${focus === n.id ? C.blue : C.line}`,
              background: focus === n.id ? '#e8eef8' : '#fff',
              cursor: 'pointer',
            }}
          >
            {n.label}
          </button>
        ))}
      </div>
      <p style={{ fontSize: 26, lineHeight: 1.45, color: C.ink, margin: 0 }}>{DESC[focus]}</p>
      <p style={{ fontSize: 20, color: C.muted, margin: 0 }}>尺寸标注取自论文 Fig.8；层级数按 ResNet-50 五级输出，细节以官方代码为准。</p>
    </div>
  );
}
