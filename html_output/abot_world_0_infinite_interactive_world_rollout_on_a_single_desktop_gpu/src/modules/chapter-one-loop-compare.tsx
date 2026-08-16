import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';

type Mode = 'clip' | 'loop';

const CONSTRAINTS = [
  { title: '控制', text: '动作必须真正改变下一段画面。', tone: 'action' },
  { title: '长期稳定', text: '生成结果会被重新读取，因此早期误差可能继续传播。', tone: 'risk' },
  { title: '实时响应', text: '用户动作需要快速得到视觉反馈。', tone: 'speed' },
  { title: '资源约束', text: '模型需要持续运行，并满足显存与吞吐要求。', tone: 'resource' },
] as const;

function VideoFrames() {
  return <div className="c1-video-frames" aria-label="生成的视频帧">
    {['1', '2', '3', '4'].map((frame) => <span key={frame}>Frame {frame}</span>)}
  </div>;
}

function HistoryToken({ label, generated = false }: { label: string; generated?: boolean }) {
  return <span className={`c1-history-token ${generated ? 'generated' : 'real'}`}>{label}</span>;
}

export const ChapterOneLoopCompare: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<Mode>('clip');
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    setPhase(0);
    if (mode !== 'loop' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setPhase((value) => (value + 1) % 6), 850);
    return () => window.clearInterval(timer);
  }, [mode]);

  const hasA = phase >= 2;
  const hasB = phase >= 4;
  const output = phase >= 3 ? 'B' : phase >= 1 ? 'A' : '等待动作';
  const activeKey = phase >= 3 ? 'D' : 'W';

  return <div className="chapter-one-loop-compare" data-testid="chapter-one-loop-compare" data-mode={mode} data-phase={phase}>
    <div className="c1-mode-switch" role="group" aria-label="生成方式">
      <button type="button" className={mode === 'clip' ? 'active' : ''} aria-pressed={mode === 'clip'} onClick={() => setMode('clip')}>只生成短片</button>
      <button type="button" className={mode === 'loop' ? 'active loop' : ''} aria-pressed={mode === 'loop'} onClick={() => setMode('loop')}>进入交互闭环</button>
    </div>

    <p className="c1-core-thesis"><strong>区别不是视频更长，</strong>而是模型进入了持续闭环。</p>

    <div className="c1-generation-compare">
      <section className={`c1-compare-side one-shot ${mode === 'clip' ? 'is-active' : ''}`}>
        <header><span>普通视频生成</span><small>一次性任务</small></header>
        <div className="c1-one-shot-flow">
          <div className="c1-condition"><small>Prompt / 初始条件</small><strong>“向前行走”</strong></div>
          <b aria-hidden="true">→</b>
          <div className="c1-model">Video Model</div>
          <b aria-hidden="true">→</b>
          <VideoFrames />
          <b aria-hidden="true">→</b>
          <div className="c1-finish">生成结束</div>
        </div>
        <p>一次生成完成后，任务结束；输出不会自动回到模型。</p>
      </section>

      <section className={`c1-compare-side interactive ${mode === 'loop' ? 'is-active' : ''}`}>
        <header><span>交互世界</span><small>持续闭环</small></header>
        <div className="c1-loop-diagram">
          <div className="c1-loop-flow">
            <div className="c1-loop-input">
              <div className="c1-history-line">
                <small>History</small>
                <div><HistoryToken label="R₀" /><HistoryToken label="R₁" />{hasA ? <HistoryToken label="A" generated /> : null}{hasB ? <HistoryToken label="B" generated /> : null}</div>
              </div>
              <div className="c1-action-line">
                <small>Action · 持续输入</small>
                <div>{['W', 'A', 'S', 'D'].map((key) => <span key={key} className={key === activeKey && mode === 'loop' ? 'is-active' : ''}>{key}</span>)}</div>
              </div>
            </div>
            <b aria-hidden="true">→</b>
            <div className={`c1-model ${mode === 'loop' && (phase === 1 || phase === 3) ? 'is-running' : ''}`}>Model</div>
            <b aria-hidden="true">→</b>
            <div className={`c1-next-chunk ${output !== '等待动作' ? 'has-output' : ''}`}><small>下一视频块</small><strong>{output}</strong></div>
          </div>
          <svg className={`c1-return-path ${mode === 'loop' && phase >= 2 ? 'is-active' : ''}`} viewBox="0 0 640 118" preserveAspectRatio="none" aria-hidden="true">
            <defs><marker id="c1ReturnArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" /></marker></defs>
            <path d="M592 50 C592 103 112 107 112 52" markerEnd="url(#c1ReturnArrow)" />
          </svg>
          <div className={`c1-writeback-label ${mode === 'loop' && phase >= 2 ? 'is-active' : ''}`}>写回 History · 再次作为下一轮输入 ↺</div>
        </div>
        <p>{mode === 'loop' ? (phase >= 4 ? 'B 再次写回：闭环继续运行。' : phase >= 2 ? 'A 已写回 History，下一次 Action 将基于它生成 B。' : '用户动作进入模型，准备生成 A。') : '切换到“进入交互闭环”，观察输出怎样重新成为输入。'}</p>
      </section>
    </div>

    <div className={`c1-loop-constraints ${mode === 'loop' ? 'is-active' : ''}`} aria-label="闭环带来的四项约束">
      {CONSTRAINTS.map((item, index) => <div key={item.title} className={`${item.tone} ${mode === 'loop' && phase >= index + 1 ? 'is-visible' : ''}`}>
        <strong>{item.title}</strong><span>{item.text}</span>
      </div>)}
    </div>

    <div className="c1-causal-summary">
      <strong>从 Video Generation 到 Interactive World Model，最大的变化不是视频长度，而是输出成为了下一轮输入。</strong>
      <div><span>输出成为输入</span><b>↓</b><span>长期分布问题 + 控制 + 实时 + 资源约束</span><b>↓</b><span>需要数据、训练和系统层面的完整方案</span></div>
    </div>
  </div>;
};
