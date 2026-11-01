import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { CupScene } from './EvidenceGapScene';
import './styles/sft-learning.css';

const initialTimes = [0, 1, 2, 3] as const;
const StageContext = createContext<{ stage: number; setStage: Dispatch<SetStateAction<number>> } | null>(null);

export function SFTLearningProvider({ children }: { children: ReactNode }) {
  const [stage, setStage] = useState(0);
  return <StageContext.Provider value={{ stage, setStage }}>{children}</StageContext.Provider>;
}

export function SFTLearningLab() {
  const state = useContext(StageContext);
  if (!state) throw new Error('SFTLearningLab requires SFTLearningProvider');
  const { stage, setStage } = state;
  return <>
    <div className="sft-lab">
      <div className="sft-trace" aria-label="逐步展开的杯子 SFT 示范轨迹">
        <div className="sft-trace-row sft-input-row">
          <div className="sft-trace-index">01</div>
          <div className="sft-trace-content">
            <strong>输入 · 初始采样帧和问题</strong>
            <p>杯子是什么时候被拿起来的？</p>
            <div className="sft-initial-frames" aria-label="1 FPS 初始采样帧：0、1、2、3 秒">
              {initialTimes.map(time => <div className="sft-cup-frame" key={time}><CupScene time={time}/><span>{time.toFixed(1)} s</span></div>)}
            </div>
            <small>1 FPS 的初始帧没有拍到 2.20–2.70 s 的关键动作。</small>
          </div>
        </div>
        {stage >= 1 && <div className="sft-trace-row sft-reason-row">
          <div className="sft-trace-index">02</div><div className="sft-trace-content"><strong>示范推理 · 模型学习输出</strong><p>现有画面无法确定拿起的时刻。</p></div>
        </div>}
        {stage >= 2 && <div className="sft-trace-row sft-tool-row">
          <div className="sft-trace-index">03</div><div className="sft-trace-content"><strong>工具请求 · 模型学习输出</strong><code>&lt;retrieve&gt;找到杯子被拿起的时刻&lt;/retrieve&gt;</code></div>
        </div>}
        {stage >= 3 && <div className="sft-trace-row sft-frame-row">
          <div className="sft-trace-index">04</div><div className="sft-trace-content"><strong>外部检索工具返回新画面</strong><div className="sft-return-frame"><CupScene time={2.3}/><span>2.30 s · 杯子正在被拿起</span></div><small>此帧来自教学视频的检索示意，加入后续推理的视觉上下文。</small></div>
        </div>}
        {stage >= 4 && <div className="sft-trace-row sft-answer-row">
          <div className="sft-trace-index">05</div><div className="sft-trace-content"><strong>继续推理与答案 · 模型学习输出</strong><p>新画面显示杯子在 2.30 s 正被拿起；结合时间顺序，拿起动作约从 2.20 s 开始。</p><p className="sft-final-answer">答案：约 2.20 秒。</p></div>
        </div>}
      </div>
      <div className="sft-controls">
        <span aria-live="polite">阶段 {stage + 1} / 5</span>
        <div>
          {stage > 0 && <button type="button" className="sft-back" onClick={() => setStage(value => value - 1)}>上一步</button>}
          {stage < 4 ? <button type="button" className="sft-forward" onClick={() => setStage(value => value + 1)}>下一步 →</button> : <button type="button" className="sft-forward" onClick={() => setStage(0)}>重新体验 ↺</button>}
        </div>
      </div>
    </div>
  </>;
}
