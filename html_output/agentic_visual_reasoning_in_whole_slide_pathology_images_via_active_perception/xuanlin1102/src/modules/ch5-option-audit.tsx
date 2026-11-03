import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';

type CandKey = 'cis' | 'inv' | 'benign';
type Slot = CandKey | 'neutral';
type Verdict = 'support' | 'conflict' | 'neutral';

interface CandDef {
  key: CandKey;
  name: string;
  detail: string;
}

interface NoteDef {
  id: number;
  text: string;
  mag: string;
  verdicts: Record<CandKey, Verdict>;
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
  paper: '#fffdf6',
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

function SlideIcon(): React.ReactElement {
  return (
    <svg width={104} height={46} viewBox="0 0 104 46" role="img" aria-label="玻片">
      <rect x={1} y={1} width={102} height={44} rx={4} fill={SL.glass} stroke={SL.glassEdge} strokeWidth={1.5} />
      <rect x={5} y={5} width={72} height={36} rx={2} fill={SL.tissue} opacity={0.95} />
      <rect x={9} y={9} width={62} height={28} rx={2} fill={SL.tissueDeep} opacity={0.45} />
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={18 + i * 13} cy={16 + (i % 2) * 12} r={2.4} fill={SL.nucleus} opacity={0.6} />
      ))}
      <rect x={82} y={6} width={16} height={34} rx={2} fill={SL.label} stroke={SL.glassEdge} strokeWidth={0.8} />
      <line x1={85} y1={16} x2={95} y2={16} stroke={SL.labelLine} strokeWidth={1.2} />
      <line x1={85} y1={23} x2={95} y2={23} stroke={SL.labelLine} strokeWidth={1} />
      <line x1={85} y1={30} x2={95} y2={30} stroke={SL.labelLine} strokeWidth={1} />
    </svg>
  );
}

const CANDIDATES: CandDef[] = [
  { key: 'cis', name: '原位癌', detail: '异型细胞局限于上皮层内' },
  { key: 'inv', name: '浸润性癌', detail: '异型细胞巢突破基底膜进入间质' },
  { key: 'benign', name: '良性增生', detail: '结构规则、细胞形态温和' },
];

const NOTES: NoteDef[] = [
  { id: 0, text: '异型细胞仍局限在上皮层内', mag: '10× 观察', verdicts: { cis: 'support', inv: 'conflict', benign: 'neutral' } },
  { id: 1, text: '局部间质出现新生细胞巢', mag: '10× 观察', verdicts: { cis: 'conflict', inv: 'support', benign: 'neutral' } },
  { id: 2, text: '组织结构整体规则、细胞形态温和', mag: '2.5× 观察', verdicts: { cis: 'neutral', inv: 'conflict', benign: 'support' } },
  { id: 3, text: '边缘染色偏淡、难以判读', mag: '5× 观察', verdicts: { cis: 'neutral', inv: 'neutral', benign: 'neutral' } },
];

const VERDICT_LABEL: Record<Verdict, string> = { support: '支持', conflict: '冲突', neutral: '中性' };

export function OptionAudit(_props: WidgetProps): React.ReactElement {
  const [assign, setAssign] = useState<Slot[]>(['neutral', 'neutral', 'neutral', 'neutral']);
  const [touched, setTouched] = useState<boolean[]>([false, false, false, false]);
  const [picked, setPicked] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>('先点一条形态笔记选中它，再点右侧的候选诊断卡或中性区落位');

  const place = (noteIdx: number, slot: Slot): void => {
    setAssign(assign.map((s, i) => (i === noteIdx ? slot : s)));
    setTouched(touched.map((t, i) => (i === noteIdx ? true : t)));
    setPicked(null);
    if (slot === 'neutral') {
      setFeedback('没看到就是中性，不能当作反证');
      return;
    }
    const verdict = NOTES[noteIdx].verdicts[slot];
    if (verdict === 'support') setFeedback('这条形态与诊断一致，记一条支持证据');
    else if (verdict === 'conflict') setFeedback('这条形态与诊断相抵，记一条冲突证据');
    else setFeedback('没看到就是中性，不能当作反证');
  };

  const onCandidate = (key: CandKey): void => {
    if (picked === null) {
      setFeedback('先在左侧点一条形态笔记，再点这里把它归到该诊断');
      return;
    }
    place(picked, key);
  };

  const onNeutral = (): void => {
    if (picked === null) {
      setFeedback('先在左侧点一条形态笔记，再点这里记为中性');
      return;
    }
    place(picked, 'neutral');
  };

  const filled = touched.reduce((n, t) => (t ? n + 1 : n), 0);
  const done = filled === NOTES.length;

  const stats = CANDIDATES.map((cand) => {
    let support = 0;
    let conflict = 0;
    NOTES.forEach((note, i) => {
      if (assign[i] !== cand.key) return;
      const verdict = note.verdicts[cand.key];
      if (verdict === 'support') support += 1;
      else if (verdict === 'conflict') conflict += 1;
    });
    const base = support + conflict;
    const sufficiency = base === 0 ? 0 : Math.round((support / base) * 100);
    return { cand, support, conflict, sufficiency, base };
  });

  const neutralAssigns = NOTES.filter((_n, i) => assign[i] === 'neutral');

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
        .p3a-btn { font: inherit; color: inherit; background: none; border: none; padding: 0; margin: 0; text-align: left; cursor: pointer; }
        .p3a-btn:focus-visible { outline: 3px solid ${C.blue}; outline-offset: 3px; }
        .p3a-note { transition: box-shadow .2s ease, border-color .2s ease; }
        .p3a-note:hover { outline: 2px dashed ${C.orange}; outline-offset: 2px; }
        .p3a-cand:hover { outline: 2px dashed ${C.purple}; outline-offset: 2px; }
        .p3a-bar { transition: width .5s cubic-bezier(.16,1,.3,1); }
      `}</style>

      <section
        style={{
          flex: '0 0 816px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minWidth: 0,
          height: '100%',
          padding: '2px 2px',
          boxSizing: 'border-box',
        }}
      >
        <header style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 10, minHeight: 46 }}>
          <h3 style={{ margin: 0, fontSize: 34, lineHeight: 1.3, fontWeight: 700, color: C.ink }}>
            这一处的四条形态笔记
          </h3>
          <span style={{ fontSize: 21, lineHeight: 1.4, color: C.inkSoft, whiteSpace: 'nowrap' }}>
            2.5×／5×／10× 的观察记录
          </span>
          <span style={{ flex: 1 }} />
          <SlideIcon />
        </header>

        {NOTES.map((note, i) => {
          const selected = picked === i;
          const slot = assign[i];
          const placed = touched[i];
          const verdict: Verdict = slot === 'neutral' ? 'neutral' : note.verdicts[slot];
          const badgeText = !placed
            ? '还没归位'
            : slot === 'neutral'
              ? '已记为中性'
              : `已归入「${CANDIDATES.filter((c) => c.key === slot)[0].name}」· ${VERDICT_LABEL[verdict]}`;
          const badgeColor = !placed ? C.inkSoft : verdict === 'support' ? C.green : verdict === 'conflict' ? C.red : C.inkSoft;
          return (
            <button
              key={note.id}
              type="button"
              className="p3a-btn p3a-note"
              aria-pressed={selected}
              onClick={() => {
                setPicked(selected ? null : i);
                setFeedback(
                  selected ? '已取消选中，再点一条形态笔记继续归位' : '形态笔记已选中：现在点右侧的候选诊断卡或中性区',
                );
              }}
              style={{
                flex: '0 0 auto',
                minHeight: 100,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                boxSizing: 'border-box',
                padding: '6px 16px 6px 12px',
                background: C.paper,
                border: `2px solid ${selected ? C.orange : C.silkEdge}`,
                borderRadius: 10,
                boxShadow: selected ? `0 0 0 5px ${C.orangeSoft}` : '0 2px 6px rgba(33,50,74,0.07)',
              }}
            >
              <span
                style={{
                  flex: '0 0 40px',
                  height: 40,
                  borderRadius: '50%',
                  background: C.blueSoft,
                  border: `2px solid ${C.blue}`,
                  color: C.blue,
                  fontSize: 22,
                  lineHeight: 1.4,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {i + 1}
              </span>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 28, lineHeight: 1.4, fontWeight: 600, color: C.ink }}>{note.text}</span>
                <span style={{ fontSize: 21, lineHeight: 1.4, color: badgeColor, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {note.mag} · {badgeText}
                </span>
              </span>
              <span style={{ fontSize: 21, lineHeight: 1.4, color: C.inkSoft, whiteSpace: 'nowrap' }}>
                {selected ? '已选中' : placed ? '点此重选' : '点此选中'}
              </span>
            </button>
          );
        })}

        <div
          style={{
            flex: '1 1 auto',
            minHeight: 76,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 2,
            padding: '6px 12px',
            boxSizing: 'border-box',
            background: '#ffffff',
            border: `1px solid ${C.silkEdge}`,
            borderRadius: 10,
          }}
        >
          <div style={{ fontSize: 23, lineHeight: 1.4, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap' }}>
            (<SymbolHint meaning="选项级支持与冲突记录">A<sub>m</sub></SymbolHint>,{' '}
            <SymbolHint meaning="证据充分性">U<sub>m</sub></SymbolHint>) = F<sub>D</sub><sup>review</sup>(q, G<sub>m</sub>, O<sub>m</sub>, m)
          </div>
          <div style={{ fontSize: 21, lineHeight: 1.4, color: C.inkSoft }}>
            只依据直接观察到的形态；未观察到的特征按中性处理（式 9、10、12）
          </div>
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
        <header style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 10, minHeight: 46 }}>
          <h3 style={{ margin: 0, fontSize: 34, lineHeight: 1.3, fontWeight: 700, color: C.ink }}>三张候选诊断卡<span style={{ fontSize: 20, fontWeight: 400, color: C.purple, border: `1px solid ${C.purple}`, borderRadius: 4, padding: "0 6px", marginLeft: 10 }}>演示</span></h3>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 21, lineHeight: 1.4, color: C.inkSoft, whiteSpace: 'nowrap' }}>
            绿=支持　红=冲突
          </span>
        </header>

        {stats.map((s) => (
          <button
            key={s.cand.key}
            type="button"
            className="p3a-btn p3a-cand"
            aria-label={`把选中的形态笔记归入${s.cand.name}`}
            onClick={() => onCandidate(s.cand.key)}
            style={{
              flex: '0 0 auto',
              minHeight: 102,
              boxSizing: 'border-box',
              padding: '4px 12px',
              background: '#ffffff',
              border: `2px solid ${picked === null ? C.silkEdge : C.purple}`,
              borderRadius: 10,
              boxShadow: '0 2px 6px rgba(33,50,74,0.06)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  width: 44,
                  height: 46,
                  borderRadius: 6,
                  background: C.purpleSoft,
                  border: `1.5px solid ${C.purple}`,
                  color: C.purple,
                  fontSize: 26,
                  lineHeight: 1.4,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: '0 0 44px',
                }}
              >
                {s.cand.name.slice(0, 1)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 26, lineHeight: 1.4, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap' }}>
                  {s.cand.name}
                </div>
                <div style={{ fontSize: 19, lineHeight: 1.4, color: C.inkSoft, whiteSpace: 'nowrap' }}>
                  {s.cand.detail}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flex: '0 0 auto' }}>
                <span
                  style={{
                    fontSize: 20,
                    lineHeight: 1.4,
                    fontWeight: 700,
                    color: C.green,
                    background: C.greenSoft,
                    borderRadius: 999,
                    padding: '0 10px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  支持 {s.support}
                </span>
                <span
                  style={{
                    fontSize: 20,
                    lineHeight: 1.4,
                    fontWeight: 700,
                    color: C.red,
                    background: C.redSoft,
                    borderRadius: 999,
                    padding: '0 10px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  冲突 {s.conflict}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20, lineHeight: 1.4, color: C.inkSoft, whiteSpace: 'nowrap' }}>证据充分性</span>
              <div style={{ flex: 1, height: 12, background: C.silkDeep, borderRadius: 999, overflow: 'hidden' }}>
                <div
                  className="p3a-bar"
                  style={{
                    width: `${s.sufficiency}%`,
                    height: '100%',
                    background: s.sufficiency >= 60 ? C.green : s.sufficiency > 0 ? C.orange : C.silkEdge,
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 20,
                  lineHeight: 1.4,
                  fontWeight: 700,
                  color: s.base === 0 ? C.inkSoft : C.ink,
                  whiteSpace: 'nowrap',
                  width: 92,
                  textAlign: 'right',
                }}
              >
                {s.base === 0 ? '尚无证据' : `${s.sufficiency}%`}
              </span>
            </div>
          </button>
        ))}

        <button
          type="button"
          className="p3a-btn p3a-cand"
          onClick={onNeutral}
          style={{
            flex: '1 1 auto',
            minHeight: 88,
            boxSizing: 'border-box',
            padding: '6px 12px',
            background: '#fbfaf4',
            border: `2px dashed ${picked === null ? C.silkEdge : C.blue}`,
            borderRadius: 10,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 26, lineHeight: 1.4, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap' }}>
              中性（未观察到）
            </span>
            <span style={{ fontSize: 21, lineHeight: 1.4, color: C.inkSoft, whiteSpace: 'nowrap' }}>
              已记 {neutralAssigns.length} 条
            </span>
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 21, lineHeight: 1.4, color: C.blue, fontWeight: 600, whiteSpace: 'nowrap' }}>
              点此记为中性
            </span>
          </div>
          <div style={{ fontSize: 21, lineHeight: 1.4, color: C.inkSoft }}>
            笔记编号：{neutralAssigns.length === 0 ? '（无）' : neutralAssigns.map((n) => n.id + 1).join('、')}
            　没看到的部分既不算支持也不算冲突
          </div>
        </button>

        <div
          aria-live="polite"
          style={{
            flex: '0 0 auto',
            minHeight: 122,
            boxSizing: 'border-box',
            padding: '6px 14px',
            background: done ? C.greenSoft : '#ffffff',
            border: `1.5px solid ${done ? C.green : C.silkEdge}`,
            borderRadius: 10,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <div style={{ fontSize: 26, lineHeight: 1.4, fontWeight: 600, color: done ? C.green : C.ink }}>{feedback}</div>
          <div style={{ fontSize: 21, lineHeight: 1.4, color: done ? C.green : C.inkSoft }}>
            {done
              ? '证据只来自看过的形态：没看过的部分既不算支持也不算冲突'
              : `已完成 ${filled} / ${NOTES.length} 条；重选会改掉原来的位置`}
          </div>
        </div>
      </section>
    </div>
  );
}
