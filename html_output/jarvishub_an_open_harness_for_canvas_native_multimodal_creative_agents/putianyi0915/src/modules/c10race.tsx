import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// §10 模块 10.2「它不能证明什么」（原「三个案例与它们不能证明什么」）
// 按用户要求：删去原先的三个案例条与案例文案（那部分已由模块 10.1 的图文浏览承担）。
// 本模块只保留「证据边界」：能证明什么 / 不能证明什么，并保留「定性案例 · 无量化解」的声明。
// 文案严格对应论文 p.11 §5 Conclusion and Limitations 的四条自述局限。

interface Item {
  t: string;
  d: string;
}

const CAN: Item[] = [
  { t: '过程是可检视的', d: '计划、参考、素材、依赖与智能体进度都留在同一块画布上，随时可以翻回去看。' },
  { t: '素材是可复用的', d: '参考、草稿、被否决的候选与中间结果，之后都能作为另一次生成或编辑的输入。' },
  { t: '改动是可追溯、可恢复的', d: '每次画布变更都经协议桥校验并写入轨迹，可以回看，也可以退回到某个检查点。' },
];

const CANNOT: Item[] = [
  { t: '不能当成量化基准', d: '实验是定性演示，不是完成的基准或排行榜；论文没有给出基准分数。' },
  { t: '不能保证产物质量', d: 'JarvisHub 聚焦编排与项目状态管理，最终成品好不好仍取决于运行时所调用的外部模型与工具。' },
  { t: '不能保证创意决策正确', d: '协议桥让画布操作显式、可恢复，但不保证智能体的创意选择在语义上是对的。' },
  { t: '轨迹不能直接当研究数据', d: '原始轨迹需先经质量过滤、知情同意、匿名化与版权审查。' },
];

type Mode = 'can' | 'cannot' | 'all';

const MODES: { id: Mode; name: string }[] = [
  { id: 'can', name: '能证明什么' },
  { id: 'cannot', name: '不能证明什么' },
  { id: 'all', name: '两边一起看' },
];

const PROMPT = '选一边看看：这三个案例究竟证明了什么，又没有证明什么。';

export const Ch10Race: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [mode, setMode] = useState<Mode | null>(null);
  const [feedback, setFeedback] = useState({ text: PROMPT, cls: '', color: '' });

  const pick = (m: Mode) => {
    setMode(m);
    if (m === 'can') {
      setFeedback({
        text: '能证明的：过程可检视、素材可复用、改动可追溯——这三条在三个案例里都看得到。',
        cls: 'good',
        color: '',
      });
    } else if (m === 'cannot') {
      setFeedback({
        text: '不能证明的：四条约界都出自论文自述——没有量化基准，也不保证产物质量与创意决策的语义正确。',
        cls: 'bad',
        color: '',
      });
    } else {
      setFeedback({
        text: '两边一起看：这套 harness 的价值在过程，不在分数。',
        cls: '',
        color: '#f07e47',
      });
    }
  };

  const showCan = mode === 'can' || mode === 'all';
  const showCannot = mode === 'cannot' || mode === 'all';

  return (
    <div id={`cv-${chapterId}-${moduleId}`}>
      <div className="chip-row">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`chip ${mode === m.id ? 'selected' : ''}`}
            onClick={() => pick(m.id)}
          >
            {m.name}
          </button>
        ))}
        <button
          type="button"
          className="chip"
          onClick={() => {
            setMode(null);
            setFeedback({ text: PROMPT, cls: '', color: '' });
          }}
          style={mode === null ? { opacity: 0.55 } : undefined}
        >
          重置
        </button>
      </div>

      {mode === null ? (
        <div className="pp-case-empty">先选一边，再往下看。</div>
      ) : (
        <div className="pp-claims">
          {showCan ? (
            <div className="pp-claim pp-claim-ok">
              <div className="pp-claim-head">能证明什么</div>
              <ol>
                {CAN.map((it) => (
                  <li key={it.t}>
                    <b>{it.t}</b>：{it.d}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
          {showCannot ? (
            <div className="pp-claim pp-claim-no">
              <div className="pp-claim-head">不能证明什么</div>
              <ol>
                {CANNOT.map((it) => (
                  <li key={it.t}>
                    <b>{it.t}</b>：{it.d}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
      )}

      <div className={`feedback ${feedback.cls}`} style={feedback.color ? { color: feedback.color } : undefined}>
        {feedback.text}
      </div>
    </div>
  );
};

export default Ch10Race;
