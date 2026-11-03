import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Zone = 'morph' | 'beyond';

interface QuestionDef {
  id: string;
  title: string;
  hint: string;
  answer: Zone;
}

const C = {
  silk: '#f2e7cd',
  silkDeep: '#e0cda6',
  silkEdge: '#c9b184',
  wood: '#8a5a33',
  woodDark: '#6f4526',
  ink: '#21324a',
  inkSoft: '#5b6b84',
  brass: '#b98a4b',
  green: '#228d5c',
  greenSoft: 'rgba(34,141,92,0.13)',
  red: '#c43f52',
  redSoft: 'rgba(196,63,82,0.12)',
  blue: '#27446e',
  blueSoft: '#eef3fb',
  orange: '#f07e47',
  orangeSoft: 'rgba(240,126,71,0.16)',
  purple: '#7c3aed',
  purpleSoft: '#f5f3ff',
  sceneBg: '#f5f8f0',
} as const;

const SL = {
  glass: '#eef4f7',
  glassEdge: '#c7d4dc',
  label: '#f7f3e6',
  labelLine: '#b9c4cf',
  tissue: '#dfbcc7',
  tissueDeep: '#c69aab',
  nucleus: '#8a5f74',
  lumen: '#fbf7f2',
  ink: '#21324a',
  inkSoft: '#5b6b84',
  brass: '#b98a4b',
};

const QUESTIONS: QuestionDef[] = [
  { id: 'grade', title: '组织学分级', hint: 'G1 · G2 · G3', answer: 'morph' },
  { id: 'her2', title: 'HER2 表达状态', hint: '0 / 1+ / 2+ / 3+', answer: 'beyond' },
  { id: 'molecular', title: '分子分型', hint: 'Luminal、HER2 富集、三阴性', answer: 'beyond' },
];

const ZONE_META: Record<Zone, { title: string; sub: string; color: string; soft: string }> = {
  morph: { title: '可直接从形态判断', sub: '细胞与组织结构写在切片上', color: C.green, soft: C.greenSoft },
  beyond: { title: '超出可观察证据', sub: '需要免疫组化或分子检测', color: C.red, soft: C.redSoft },
};

function SlideArt({ x, y, w, h, zoom = 1, fx = 0.5, fy = 0.5 }:
  { x: number; y: number; w: number; h: number; zoom?: number; fx?: number; fy?: number }): React.ReactElement {
  const uid = React.useId().replace(/:/g, '');
  const pad = 6;
  const labelW = Math.max(18, w * 0.14);
  const inner = { x: x + pad, y: y + pad, w: w - pad * 2 - labelW, h: h - pad * 2 };
  const blob = (cx: number, cy: number, rx: number, ry: number, seed: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const k = 0.82 + 0.22 * Math.sin(seed + i * 1.7) + 0.1 * Math.cos(seed * 2.3 + i);
      pts.push(`${(cx + Math.cos(a) * rx * k) * inner.w} ${(cy + Math.sin(a) * ry * k) * inner.h}`);
    }
    return `M${pts.join(' L')} Z`;
  };
  const nuclei: React.ReactElement[] = [];
  for (let i = 0; i < 46; i++) {
    const a = i * 2.399963;
    const r = Math.sqrt((i + 0.6) / 46) * 0.42;
    const cx = inner.w * (0.5 + Math.cos(a) * r);
    const cy = inner.h * (0.5 + Math.sin(a) * r * 0.86);
    nuclei.push(
      <circle key={i} cx={cx} cy={cy} r={Math.max(1, inner.h * (0.008 + 0.006 * ((i % 3) / 2)))} fill={SL.nucleus} opacity={0.28 + 0.12 * (i % 4)} />,
    );
  }
  const tissue = (
    <g>
      <rect x={0} y={0} width={inner.w} height={inner.h} fill="#fdf9f5" />
      {/* 嗜伊红组织浆：几块不规则粉染区 */}
      <path d={blob(0.28, 0.34, 0.3, 0.34, 1.1)} fill={SL.tissue} opacity={0.92} />
      <path d={blob(0.66, 0.46, 0.28, 0.3, 2.6)} fill={SL.tissue} opacity={0.86} />
      <path d={blob(0.46, 0.72, 0.34, 0.24, 4.2)} fill={SL.tissue} opacity={0.8} />
      {/* 深染色区（核密集） */}
      <path d={blob(0.56, 0.4, 0.16, 0.17, 3.4)} fill={SL.tissueDeep} opacity={0.55} />
      <path d={blob(0.3, 0.62, 0.13, 0.12, 5.1)} fill={SL.tissueDeep} opacity={0.45} />
      {/* 组织纹理：细密走向线 */}
      {Array.from({ length: 16 }).map((_, i) => (
        <path key={`t${i}`} d={`M0 ${(inner.h / 16) * (i + 0.5)} C${inner.w * 0.3} ${(inner.h / 16) * (i + 0.5) - inner.h * 0.03} ${inner.w * 0.7} ${(inner.h / 16) * (i + 0.5) + inner.h * 0.03} ${inner.w} ${(inner.h / 16) * (i + 0.5)}`}
          fill="none" stroke={SL.tissueDeep} strokeWidth={0.7} opacity={0.16} />
      ))}
      {/* 细胞核与腔隙 */}
      {nuclei}
      <ellipse cx={inner.w * 0.38} cy={inner.h * 0.46} rx={inner.w * 0.018} ry={inner.h * 0.03} fill={SL.lumen} opacity={0.5} />
      <ellipse cx={inner.w * 0.7} cy={inner.h * 0.66} rx={inner.w * 0.014} ry={inner.h * 0.022} fill={SL.lumen} opacity={0.45} />
      <ellipse cx={inner.w * 0.52} cy={inner.h * 0.26} rx={inner.w * 0.012} ry={inner.h * 0.018} fill={SL.lumen} opacity={0.4} />
    </g>
  );
  return (
    <g>
      <defs>
        <clipPath id={`sl-clip-${uid}`}>
          <rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} />
        </clipPath>
        <pattern id={`sl-tissue-${uid}`} width={inner.w} height={inner.h} patternUnits="userSpaceOnUse"
          patternTransform={`translate(${inner.x} ${inner.y}) translate(${fx * inner.w} ${fy * inner.h}) scale(${zoom}) translate(${-fx * inner.w} ${-fy * inner.h})`}>
          {tissue}
        </pattern>
      </defs>
      <rect x={x} y={y} width={w} height={h} rx={5} fill={SL.glass} stroke={SL.glassEdge} strokeWidth={1.5} />
      <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} rx={4} fill="none" stroke="#ffffff" strokeWidth={1.2} opacity={0.8} />
      <g clipPath={`url(#sl-clip-${uid})`}>
        <rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} fill={`url(#sl-tissue-${uid})`} />
      </g>
      <rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} fill="none" stroke={SL.glassEdge} strokeWidth={1} />
      <rect x={x + w - labelW} y={y + pad} width={labelW - pad} height={h - pad * 2} rx={3} fill={SL.label} stroke={SL.glassEdge} strokeWidth={0.8} />
      <line x1={x + w - labelW + 4} y1={y + pad + (h - pad * 2) * 0.32} x2={x + w - pad - 3} y2={y + pad + (h - pad * 2) * 0.32} stroke={SL.labelLine} strokeWidth={1.4} />
      <line x1={x + w - labelW + 4} y1={y + pad + (h - pad * 2) * 0.5} x2={x + w - pad - 3} y2={y + pad + (h - pad * 2) * 0.5} stroke={SL.labelLine} strokeWidth={1.1} />
    </g>
  );
}

function BoundaryScene(): React.ReactElement {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 880 400"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="一张玻片、一个显微镜视野框，旁边一块写着只能看 H&E 形态的说明牌"
      style={{ display: 'block' }}
    >
      <defs>
        <clipPath id="p3e-frame-clip">
          <rect x={160} y={100} width={168} height={136} />
        </clipPath>
      </defs>

      <SlideArt x={24} y={34} w={560} h={272} />
      <g clipPath="url(#p3e-frame-clip)">
        <SlideArt x={24} y={34} w={560} h={272} zoom={2.4} fx={0.32} fy={0.4} />
      </g>

      <rect x={160} y={100} width={168} height={136} fill="none" stroke={C.brass} strokeWidth={3.5} />
      <rect x={166} y={106} width={156} height={124} fill="none" stroke={C.orange} strokeWidth={1.4} strokeDasharray="8 6" opacity={0.85} />
      <line x1={244} y1={100} x2={244} y2={236} stroke={C.ink} strokeWidth={0.9} opacity={0.3} />
      <line x1={160} y1={168} x2={328} y2={168} stroke={C.ink} strokeWidth={0.9} opacity={0.3} />
      {[[160, 100, 1, 1], [328, 100, -1, 1], [160, 236, 1, -1], [328, 236, -1, -1]].map(([cx, cy, dx, dy], i) => (
        <g key={i}>
          <line x1={cx} y1={cy} x2={cx + dx * 18} y2={cy} stroke={C.ink} strokeWidth={4} />
          <line x1={cx} y1={cy} x2={cx} y2={cy + dy * 18} stroke={C.ink} strokeWidth={4} />
        </g>
      ))}
      <rect x={162} y={66} width={164} height={26} rx={6} fill={C.blueSoft} stroke={C.blue} strokeWidth={1.4} />
      <text x={244} y={84} textAnchor="middle" fontSize={15} fontWeight={700} fill={C.blue} fontFamily='"Segoe UI", "PingFang SC", Arial, sans-serif'>
        显微镜视野框 10×
      </text>

      <g>
        <rect x={600} y={38} width={256} height={158} rx={8} fill="#ffffff" stroke={C.ink} strokeWidth={2} />
        <rect x={602} y={40} width={252} height={34} rx={6} fill={C.blueSoft} />
        <rect x={602} y={60} width={252} height={14} fill={C.blueSoft} />
        <text x={728} y={64} textAnchor="middle" fontSize={19} fontWeight={800} fill={C.ink} fontFamily='"Segoe UI", "PingFang SC", Arial, sans-serif'>
          只能看 H&E 形态
        </text>
        <text x={728} y={104} textAnchor="middle" fontSize={14} fill={C.inkSoft} fontFamily='"Segoe UI", "PingFang SC", Arial, sans-serif'>
          看不到免疫组化与分子检测结果
        </text>
        <text x={728} y={132} textAnchor="middle" fontSize={14} fill={C.inkSoft} fontFamily='"Segoe UI", "PingFang SC", Arial, sans-serif'>
          对应：论文的输入只有 H&E 切片
        </text>
        <text x={728} y={166} textAnchor="middle" fontSize={13} fill={C.inkSoft} fontFamily='"Segoe UI", "PingFang SC", Arial, sans-serif'>
          这是类比的边界，不是额外主张
        </text>
      </g>
    </svg>
  );
}

export function EvidenceBoundary(_props: WidgetProps): React.ReactElement {
  const [picked, setPicked] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, Zone | null>>({ grade: null, her2: null, molecular: null });
  const [feedback, setFeedback] = useState<string>('先点一张问题卡，再点右侧两个落位区之一；已经落过的卡可以再点一次换个位置。');
  const [tone, setTone] = useState<'none' | 'ok' | 'bad'>('none');

  const placedCount = QUESTIONS.filter((q) => placed[q.id] !== null).length;
  const done = placedCount === QUESTIONS.length;
  const allCorrect = done && QUESTIONS.every((q) => placed[q.id] === q.answer);

  const put = (q: QuestionDef, zone: Zone): void => {
    setPlaced({ ...placed, [q.id]: zone });
    setPicked(null);
    const correct = q.answer === zone;
    if (correct) {
      setTone('ok');
      setFeedback(
        q.answer === 'beyond'
          ? '确实要靠形态之外的检测：论文的输入只有 H&E，这类结论超出可直接观察的证据'
          : '分级看的是细胞形态与排列：这是 H&E 切片上能直接观察到的证据',
      );
    } else {
      setTone('bad');
      setFeedback(
        q.answer === 'beyond'
          ? '仅凭形态无法确认这项，论文在局限里写明需要 IHC 与分子数据'
          : '分级靠的就是形态本身：把它推到可观察范围之外，会低估 H&E 已经给出的证据',
      );
    }
  };

  const onZone = (zone: Zone): void => {
    const q = QUESTIONS.filter((item) => item.id === picked)[0];
    if (!q) {
      setFeedback('先在左侧点一张问题卡，再点这个落位区');
      setTone('none');
      return;
    }
    put(q, zone);
  };

  const verdict: 'none' | 'clear' | 'crossed' = !done ? 'none' : allCorrect ? 'clear' : 'crossed';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        gap: 16,
        boxSizing: 'border-box',
        background: C.sceneBg,
        color: C.ink,
        fontFamily: '"Segoe UI", "PingFang SC", "Hiragino Sans GB", Arial, sans-serif',
        overflow: 'hidden',
      }}
    >
      <style>{`
        .p3e-btn { font: inherit; color: inherit; background: none; border: none; padding: 0; margin: 0; text-align: left; cursor: pointer; }
        .p3e-btn:focus-visible { outline: 3px solid ${C.blue}; outline-offset: 3px; }
        .p3e-card:hover { outline: 2px dashed ${C.orange}; outline-offset: 3px; }
        .p3e-zone:hover { outline: 2px dashed ${C.orange}; outline-offset: 3px; }
      `}</style>

      <section
        style={{
          flex: '0 0 900px',
          minWidth: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: '2px 2px',
          boxSizing: 'border-box',
        }}
      >
        <header style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 12, minHeight: 46 }}>
          <h3 style={{ margin: 0, fontSize: 34, lineHeight: 1.3, fontWeight: 700 }}>玻片、视野框与说明牌</h3>
          <span style={{ fontSize: 21, lineHeight: 1.4, color: C.inkSoft }}>显微镜只能放大形态，做不了免疫组化</span>
        </header>

        <div
          style={{
            flex: '1 1 0',
            minHeight: 0,
            position: 'relative',
            background: '#ffffff',
            border: `1.5px solid ${C.silkEdge}`,
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <BoundaryScene />
          {verdict !== 'none' ? (
            <div
              style={{
                position: 'absolute',
                left: 74,
                top: 214,
                width: 92,
                height: 92,
                boxSizing: 'border-box',
                border: `6px solid ${verdict === 'clear' ? C.green : C.red}`,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.86)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'rotate(-4deg)',
              }}
            >
              <span
                style={{
                  fontSize: 30,
                  lineHeight: 1.4,
                  fontWeight: 800,
                  color: verdict === 'clear' ? C.green : C.red,
                }}
              >
                {verdict === 'clear' ? '清楚' : '越界'}
              </span>
            </div>
          ) : null}
        </div>

        <div style={{ flex: '0 0 84px', display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 22, lineHeight: 1.4 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: C.green, flex: '0 0 12px' }} />
            <span>
              <strong>能看到</strong>：细胞形态、排列与组织结构（H&E 染色）
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 22, lineHeight: 1.4 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: C.red, flex: '0 0 12px' }} />
            <span>
              <strong>看不到</strong>：免疫组化（IHC）结果、分子检测结果
            </span>
          </div>
        </div>

        <div
          style={{
            flex: '0 0 auto',
            minHeight: 64,
            boxSizing: 'border-box',
            padding: '4px 12px',
            background: C.blueSoft,
            border: `1.5px solid ${C.blue}`,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            fontSize: 19,
            lineHeight: 1.4,
            color: C.blue,
          }}
        >
          说明牌对应论文的输入条件：只提供 H&E 切片，免疫组化与分子检测结果都不在输入里；这是类比的边界，不是额外主张。
        </div>
      </section>

      <section
        style={{
          flex: '1 1 auto',
          minWidth: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: '2px 2px',
          boxSizing: 'border-box',
        }}
      >
        <header style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 8, minHeight: 44 }}>
          <h3 style={{ margin: 0, fontSize: 32, lineHeight: 1.3, fontWeight: 700 }}>三类临床问题放哪里？</h3>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 19, lineHeight: 1.4, color: C.inkSoft, whiteSpace: 'nowrap' }}>
            已落位 {placedCount} / 3
          </span>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: '0 0 auto' }}>
          {QUESTIONS.map((q) => {
            const zone = placed[q.id];
            const selected = picked === q.id;
            const toneColor = zone === null ? C.inkSoft : zone === q.answer ? C.green : C.red;
            return (
              <button
                key={q.id}
                type="button"
                className="p3e-btn p3e-card"
                aria-pressed={selected}
                onClick={() => {
                  setPicked(selected ? null : q.id);
                  setFeedback(selected ? '已取消选中，再点一张问题卡继续。' : `已选中「${q.title}」：现在点下面两个落位区之一。`);
                  setTone('none');
                }}
                style={{
                  flex: '0 0 auto',
                  minHeight: 66,
                  boxSizing: 'border-box',
                  padding: '0 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: selected ? C.orangeSoft : '#ffffff',
                  border: `2px solid ${selected ? C.orange : C.silkEdge}`,
                  borderRadius: 10,
                  boxShadow: selected ? `0 0 0 4px rgba(240,126,71,0.14)` : '0 2px 6px rgba(33,50,74,0.06)',
                }}
              >
                <span
                  style={{
                    flex: '0 0 38px',
                    height: 38,
                    borderRadius: 8,
                    background: C.purpleSoft,
                    border: `1.5px solid ${C.purple}`,
                    color: C.purple,
                    fontSize: 21,
                    lineHeight: 1.4,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {q.title.slice(0, 1)}
                </span>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 26, lineHeight: 1.4, fontWeight: 700 }}>{q.title}</span>
                  <span style={{ fontSize: 18, lineHeight: 1.4, color: C.inkSoft }}>{q.hint}</span>
                </span>
                <span
                  style={{
                    fontSize: 19,
                    lineHeight: 1.4,
                    color: toneColor,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {zone === null ? '未落位' : zone === 'morph' ? '已放：可直接判断' : '已放：超出证据'}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, flex: '1 1 0', minHeight: 150 }}>
          {(Object.keys(ZONE_META) as Zone[]).map((zone) => {
            const meta = ZONE_META[zone];
            const cards = QUESTIONS.filter((q) => placed[q.id] === zone);
            const active = picked !== null;
            return (
              <button
                key={zone}
                type="button"
                className="p3e-btn p3e-zone"
                onClick={() => onZone(zone)}
                style={{
                  flex: '1 1 0',
                  minWidth: 0,
                  boxSizing: 'border-box',
                  padding: '8px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  background: meta.soft,
                  border: `2px ${active ? 'solid' : 'dashed'} ${meta.color}`,
                  borderRadius: 12,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 24, lineHeight: 1.4, fontWeight: 800, color: meta.color }}>{meta.title}</span>
                </span>
                <span style={{ fontSize: 17, lineHeight: 1.4, color: C.inkSoft }}>{meta.sub}</span>
                <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
                  {cards.length === 0 ? (
                    <span style={{ fontSize: 18, lineHeight: 1.4, color: C.inkSoft }}>还没有卡片落在这里</span>
                  ) : (
                    cards.map((q) => (
                      <span
                        key={q.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '2px 8px',
                          background: '#ffffff',
                          border: `1.5px solid ${meta.color}`,
                          borderRadius: 8,
                          fontSize: 19,
                          lineHeight: 1.4,
                          fontWeight: 700,
                          color: C.ink,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: meta.color, flex: '0 0 8px' }} />
                        {q.title}
                      </span>
                    ))
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div
          aria-live="polite"
          style={{
            flex: '0 0 auto',
            minHeight: 140,
            boxSizing: 'border-box',
            padding: '8px 14px',
            background: tone === 'ok' ? C.greenSoft : tone === 'bad' ? C.redSoft : '#ffffff',
            border: `1.5px solid ${tone === 'ok' ? C.green : tone === 'bad' ? C.red : C.silkEdge}`,
            borderRadius: 10,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 19,
                lineHeight: 1.4,
                fontWeight: 800,
                color: tone === 'ok' ? C.green : tone === 'bad' ? C.red : C.inkSoft,
                border: `1.5px solid ${tone === 'ok' ? C.green : tone === 'bad' ? C.red : C.inkSoft}`,
                borderRadius: 6,
                padding: '0 6px',
                whiteSpace: 'nowrap',
              }}
            >
              {tone === 'ok' ? '正确' : tone === 'bad' ? '再想想' : '待判断'}
            </span>
            <span
              style={{
                fontSize: 23,
                lineHeight: 1.4,
                fontWeight: 600,
                color: tone === 'ok' ? C.green : tone === 'bad' ? C.red : C.ink,
              }}
            >
              {feedback}
            </span>
          </div>
          <div style={{ fontSize: 19, lineHeight: 1.4, color: C.inkSoft }}>
            {done
              ? allCorrect
                ? '三张卡都落对了：H&E 能确认形态学分级，确认不了 HER2 表达状态与分子分型。'
                : '还有卡片落错了区：把需要免疫组化或分子检测的问题放回“超出可观察证据”。'
              : '落位依据是论文的输入条件（仅 H&E），不是本页新结论。'}
          </div>
        </div>
      </section>
    </div>
  );
}
