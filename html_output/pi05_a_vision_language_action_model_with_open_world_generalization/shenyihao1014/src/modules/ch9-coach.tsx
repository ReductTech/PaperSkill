import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// §9.1 「七位领班候选，同台打分」: P4 chips + candidate cards. Selecting a
// candidate highlights its bar in the ranking display. Bar heights are
// QUALITATIVE (示意) and encode only the verified ordering of paper Fig 13:
// π0.5 (best, beats human oracle) > implicit HL > 无 VI ≈ 无 WD > 无 HL > GPT-4
// (zero-shot worst). No numeric scores are shown.
type CoachKey = 'full' | 'nowd' | 'novi' | 'implicit' | 'nohl' | 'gpt4' | 'human';

const CHIPS: CoachKey[] = ['full', 'nowd', 'novi', 'implicit', 'nohl', 'gpt4', 'human'];

const META: Record<CoachKey, { name: string; icon: string; dot: string; role: string }> = {
  full: { name: 'π0.5 完整', icon: '📣', dot: '#228d5c', role: '自家练的全科领班' },
  nowd: { name: '无 WD', icon: '📣', dot: '#f07e07', role: '没读网页万物图鉴' },
  novi: { name: '无 VI', icon: '📣', dot: '#f07e07', role: '没做口令演练（VI）' },
  implicit: { name: 'implicit HL', icon: '📖', dot: '#27446e', role: '不喊单，但训练读过拆单数据' },
  nohl: { name: '无 HL', icon: '🤷', dot: '#c43f52', role: '训练里没有拆单数据' },
  gpt4: { name: 'GPT-4', icon: '💼', dot: '#c43f52', role: '外请顾问 · 零样本（只给任务描述+常用标签列表）' },
  human: { name: '人类专家', icon: '📣', dot: '#8a6d3b', role: '人类老领班（对照）' },
};

// Verified ordering (Fig 13); heights are illustrative only.
const RANKING: { key: CoachKey; h: number; color: string; tag?: string; approx?: string }[] = [
  { key: 'full', h: 0.96, color: '#228d5c', tag: '超人类专家' },
  { key: 'human', h: 0.88, color: '#8a6d3b' },
  { key: 'implicit', h: 0.78, color: '#27446e', tag: '数据本身带来大半收益' },
  { key: 'novi', h: 0.56, color: '#f07e07' },
  { key: 'nowd', h: 0.54, color: '#f07e07', approx: '≈ 无 VI' },
  { key: 'nohl', h: 0.32, color: '#c43f52' },
  { key: 'gpt4', h: 0.12, color: '#c43f52', tag: '零样本最差：VLM 必须用机器人数据适配' },
];

const FEEDBACK: Record<CoachKey, { text: string; cls: string }> = {
  full: {
    text: '最优——<b>甚至超过人类专家</b>：显式喊单 + 全套共训数据，拆任务的能力是从数据里学出来的。',
    cls: 'good',
  },
  nowd: {
    text: '撤掉网页万物图鉴，成绩<b>显著下滑</b>——WD 撑着高层推理与语言理解。',
    cls: '',
  },
  novi: {
    text: '删掉语言示范（只占高层 MM 例的 <b>~11%</b>）成绩也显著下滑——VI 关键到不能删。',
    cls: '',
  },
  implicit: {
    text: '不喊单但训练读过拆单笔记——<b>大半收益来自数据本身</b>（数据 &gt; 显式推理）。',
    cls: 'good',
  },
  nohl: {
    text: '完全没读过拆单数据，<b>显著更差</b>——对照之下，收益的大头在 HL 数据。',
    cls: 'bad',
  },
  gpt4: {
    text: '零样本当领班<b>最差</b>：VLM 必须用机器人数据适配。',
    cls: 'bad',
  },
  human: {
    text: '人类专家紧随其后——但被完整版 <b>π0.5 反超</b>。',
    cls: '',
  },
};

export const Ch9Coach: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [sel, setSel] = useState<CoachKey | null>(null);

  const cardGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(136px, 1fr))',
    gap: 8,
    margin: '4px 0 14px',
  };
  const cardStyle = (key: CoachKey): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '10px 10px',
    background: sel === key ? '#eef4ec' : '#fff',
    border: `1.5px solid ${sel === key ? META[key].dot : '#d7deea'}`,
    borderRadius: 8,
    cursor: 'pointer',
    textAlign: 'left',
    boxShadow: sel === key ? `0 0 0 2px ${META[key].dot}33` : 'none',
  });
  const rankRowStyle = (key: CoachKey): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 8px',
    borderRadius: 6,
    background: sel === key ? '#fff' : 'transparent',
    outline: sel === key ? '2px solid #27446e' : 'none',
  });

  return (
    <div id={`w-${chapterId}-${moduleId}`}>
      <div className="chip-row">
        {CHIPS.map((key) => (
          <button
            key={key}
            className={`chip ${sel === key ? 'selected' : ''}`}
            onClick={() => setSel(key)}
          >
            <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: META[key].dot, display: 'inline-block' }} />
            {META[key].name}
          </button>
        ))}
      </div>

      <div style={cardGridStyle}>
        {CHIPS.map((key) => (
          <div
            key={key}
            role="button"
            tabIndex={0}
            style={cardStyle(key)}
            onClick={() => setSel(key)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setSel(key);
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#21324a', fontSize: 13 }}>
              <span aria-hidden="true">{META[key].icon}</span>
              {META[key].name}
            </div>
            <div style={{ color: '#68778f', fontSize: 12, lineHeight: 1.45 }}>{META[key].role}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #d7deea', borderRadius: 8, padding: '10px 12px', background: '#fbfcfa' }}>
        <div style={{ fontSize: 12, color: '#68778f', marginBottom: 6 }}>七方案排名（同一低层，只换高层）</div>
        {RANKING.map((r) => (
          <div key={r.key} style={rankRowStyle(r.key)}>
            <div
              style={{ width: 92, flexShrink: 0, fontSize: 12, fontWeight: sel === r.key ? 700 : 400, color: '#21324a', textAlign: 'right' }}
            >
              {META[r.key].name}
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <div style={{ flex: 1, height: 14, background: '#f5f8f0', border: '1px solid #d7deea', borderRadius: 7, overflow: 'hidden' }}>
                <div style={{ width: `${r.h * 100}%`, height: '100%', background: r.color, borderRadius: 6, transition: 'width .4s ease' }} />
              </div>
              {r.approx ? (
                <span style={{ flexShrink: 0, fontSize: 11, color: '#68778f' }}>{r.approx}</span>
              ) : null}
              {r.tag ? (
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: 11,
                    color: '#fff',
                    background: r.color,
                    borderRadius: 999,
                    padding: '2px 8px',
                  }}
                >
                  {r.tag}
                </span>
              ) : null}
            </div>
          </div>
        ))}
        <div style={{ fontSize: 11, color: '#68778f', marginTop: 6 }}>柱高为示意 · 结论以论文图 13 为准</div>
      </div>

      <div
        className={`feedback ${sel ? FEEDBACK[sel].cls : ''}`}
        dangerouslySetInnerHTML={{
          __html: sel
            ? FEEDBACK[sel].text
            : '点一位领班候选（或上方 chips），看七方案排名与评语——柱高为示意。',
        }}
      />
    </div>
  );
};

export default Ch9Coach;
