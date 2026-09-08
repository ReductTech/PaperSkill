import { useState } from 'react';
import type { WidgetProps } from './registry';

const DRIFT_FRAMES = [
  { time: 't0', state: '真实起点', level: 0 },
  { time: 't1', state: '正常前进', level: 1 },
  { time: 't2', state: '轻微偏移', level: 2 },
  { time: 't3', state: '人物变形', level: 3 },
  { time: 't4', state: '背景重复', level: 4 },
  { time: 't5', state: '明显跑偏', level: 5 },
] as const;

function DriftFrame({ time, state, level }: (typeof DRIFT_FRAMES)[number]) {
  return (
    <div className={`chap4-drift-frame drift-${level}`} style={{ '--drift-order': level } as React.CSSProperties}>
      <div className="chap4-scene-window" aria-label={`${time}：${state}`}>
        <div className="chap4-scene-sky" />
        <div className="chap4-scene-background"><i /><i /><i /></div>
        <div className="chap4-scene-road"><i /></div>
        <div className="chap4-scene-character" aria-hidden="true"><i /><b /></div>
        {level >= 4 ? <div className="chap4-repeat-ghost" aria-hidden="true" /> : null}
      </div>
      <strong>{time}</strong>
      <span>{state}</span>
    </div>
  );
}

export function CausalDistributionGap() {
  const [replay, setReplay] = useState(0);

  return (
    <section className="chapter-four-gap chap4-drift-page" data-testid="causal-distribution-gap">
      <header className="chap4-drift-heading">
        <div>
          <small>先看一个直观例子</small>
          <strong>同一个角色一直向右走，画面为什么会越来越奇怪？</strong>
        </div>
        <button type="button" onClick={() => setReplay((value) => value + 1)}>重播“越滚越偏”</button>
      </header>

      <section className="chap4-drift-visual" aria-labelledby="chap4-visual-title">
        <h5 id="chap4-visual-title">连续生成的画面</h5>
        <div className="chap4-drift-strip" key={replay}>
          {DRIFT_FRAMES.map((frame) => <DriftFrame key={frame.time} {...frame} />)}
        </div>
        <div className="chap4-rollout-progress" aria-hidden="true">
          <span>真实历史起点</span><i /><strong>自生成内容逐渐占据 History</strong>
        </div>
        <p>前两帧保持正常；一旦某次生成带来小偏差，它又会跟着画面一起进入下一轮，于是人物、位置和背景可能越来越不稳定。</p>
        <small className="chap4-visual-boundary">机制示意，非论文逐帧实验结果；不表示存在固定的漂移时间阈值。</small>
      </section>

      <section className="chap4-causal-story" aria-labelledby="chap4-chain-title">
        <div className="chap4-section-title">
          <span>为什么小误差没有停在这一帧？</span>
          <strong id="chap4-chain-title">因为输出会被写回历史，再次成为输入。</strong>
        </div>
        <div className="chap4-causal-line" aria-label="生成误差写回历史并继续累积的因果链">
          <div><strong>真实历史</strong><small>干净的起点</small></div>
          <b>→</b>
          <div><strong>模型生成新块 A</strong><small>带有轻微误差</small></div>
          <b>→</b>
          <div><strong>A 写回 History</strong><small>输出进入历史</small></div>
          <b>→</b>
          <div><strong>下一轮输入被带入偏差</strong><small>模型继续读取 A</small></div>
          <b>→</b>
          <div><strong>误差继续累积</strong><small>画面越来越偏</small></div>
        </div>
        <p><b>self-rollout（自滚动）</b>就是模型不断读取自己生成的内容，再继续往后生成。</p>
      </section>

      <section className="chap4-train-deploy" aria-labelledby="chap4-compare-title">
        <div className="chap4-section-title">
          <span>根本差别在哪里？</span>
          <strong id="chap4-compare-title">训练和部署时，模型看到的历史不一样。</strong>
        </div>
        <div className="chap4-compare-cards">
          <article className="training">
            <header><span>训练时</span><strong>输入是真实历史</strong></header>
            <div className="chap4-history-ribbon clean" aria-label="训练时的真实历史">
              <i>真实</i><i>真实</i><i>真实</i><i>真实</i><i>真实</i>
            </div>
            <p>每一轮都从干净、真实的历史条件出发，因此输入分布更稳定。</p>
          </article>
          <article className="deployment">
            <header><span>部署时</span><strong>输入逐渐变成自生成历史</strong></header>
            <div className="chap4-history-ribbon generated" aria-label="部署时逐渐增加的自生成历史">
              <i>真实</i><i>真实</i><i>A</i><i>B</i><i>C</i>
            </div>
            <p>模型生成的 A、B、C 被持续写回，已有误差也会跟着进入下一轮。</p>
          </article>
        </div>
        <div className="chap4-gap-summary">
          <strong>训练看真历史，部署吃自生成历史，</strong>
          <span>这就是分布错位（distribution gap）。</span>
        </div>
      </section>
    </section>
  );
}

export const CausalLongForcingCore = (_props: WidgetProps) => <CausalDistributionGap />;
