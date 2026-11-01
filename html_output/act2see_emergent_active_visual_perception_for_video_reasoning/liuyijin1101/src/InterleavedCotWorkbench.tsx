import { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import './styles/interleaved-cot.css';

const phases = [
  '初始观察',
  '第一轮推理',
  '生成检索请求',
  '检索工具返回画面',
  '第二轮继续推理并回答',
] as const;

const question = '傍晚火车停靠的车站里，黑色电话亭正左侧是什么？';
const query = 'train stopped at station platform in the evening with black phone booth';

export function InterleavedCotIntro() {
  return <div className="a2s-cot-intro">
    <figure className="a2s-cot-original-frame">
      <div className="a2s-cot-original-crop" role="img" aria-label="论文 Figure 1 初始视频画面局部：从列车内看向车厢入口"/>
      <figcaption>Figure 1 初始视频帧局部 · 原论文图</figcaption>
    </figure>
    <div className="a2s-cot-intro-copy">
      <span>论文中的问题</span>
      <p>“{question}”</p>
      <small>当前初始画面尚不能定位目标场景，需要在原视频中寻找相关帧。</small>
    </div>
  </div>;
}

export function InterleavedCotWorkbench() {
  const [stage, setStage] = useState(0);
  const hasReturnedFrame = stage >= 3;

  return <>
    <div className="a2s-cot-workbench" aria-label="两轮推理工作台" data-stage={stage + 1}>
      <div className="a2s-cot-workbench-top">
        <strong>{phases[stage]}</strong>
        <span aria-label={`第 ${stage + 1} 步，共 ${phases.length} 步`}>{String(stage + 1).padStart(2, '0')} / 05</span>
      </div>

      <div className="a2s-cot-columns">
        <div className="a2s-cot-evidence">
          <h3>视觉证据</h3>
          <figure className="a2s-cot-frame">
            <img src="./section4/initial-frame.svg" alt="教学重绘：从列车内向外看，尚无法确认傍晚站台的黑色电话亭位置"/>
            <figcaption><b>初始视频帧</b><span>已有上下文</span></figcaption>
          </figure>
          {hasReturnedFrame && <figure className="a2s-cot-frame a2s-cot-frame-returned">
            <img src="./section4/retrieved-frame.svg" alt={stage === 3 ? '教学重绘：傍晚站台上，黑色电话亭左侧出现了可辨认的新物体' : '教学重绘：傍晚站台上，黑色电话亭的正左侧是一处花卉陈列'}/>
            <figcaption><b>检索返回的新画面</b><span>从原视频补入</span></figcaption>
          </figure>}
        </div>

        <div className="a2s-cot-trace">
          <h3>当前推理轨迹</h3>
          <ol aria-live="polite" aria-relevant="additions">
            <li className={stage === 0 ? 'is-current' : ''} aria-current={stage === 0 ? 'step' : undefined}>
              <span className="a2s-cot-trace-label">问题 · 第一轮起点</span>
              <p>“{question}”</p>
              <p className="a2s-cot-trace-thought"><code>&lt;think&gt;</code> 开始回答这个问题……</p>
            </li>
            {stage >= 1 && <li className={stage === 1 ? 'is-current' : ''} aria-current={stage === 1 ? 'step' : undefined}>
              <span className="a2s-cot-trace-label">第一轮 · 找到缺口</span>
              <p>先找到傍晚火车停靠、出现黑色电话亭的车站画面。</p>
            </li>}
            {stage >= 2 && <li className={`a2s-cot-query ${stage === 2 ? 'is-current' : ''}`} aria-current={stage === 2 ? 'step' : undefined}>
              <span className="a2s-cot-trace-label">第一轮 · 模型发出文字查询</span>
              <pre><code>{`<retrieve>\n${query}\n</retrieve>`}</code></pre>
              <small>{stage === 2 ? '第一轮仅保留到调用结束处；文字查询已发出，检索尚未完成。' : '第一轮仅保留到调用结束处；外部检索模型已执行该请求。'}</small>
            </li>}
            {hasReturnedFrame && <li className={`a2s-cot-inserted ${stage === 3 ? 'is-current' : ''}`} aria-current={stage === 3 ? 'step' : undefined}>
              <span className="a2s-cot-trace-label">工具返回 · 插入上下文</span>
              <div className="a2s-cot-frame-node">
                <img src="./section4/retrieved-frame.svg" alt=""/>
                <span><code>&lt;frame&gt;</code> 新的站台画面 <code>&lt;/frame&gt;</code></span>
              </div>
              <small>原有文字与调用保留；新帧接在其后。</small>
            </li>}
            {stage >= 4 && <li className="a2s-cot-conclusion is-current" aria-current="step">
              <span className="a2s-cot-trace-label">第二轮 · 接着前文与新帧推理</span>
              <p>现在看到傍晚的车站与黑色电话亭，可以判断它正左侧的物体。</p>
              <p className="a2s-cot-answer"><code>&lt;answer&gt;</code> 一处花卉陈列。 <code>&lt;/answer&gt;</code></p>
            </li>}
          </ol>
        </div>
      </div>

      <div className="a2s-cot-controls">
        <button className="button-outline" type="button" onClick={() => setStage(current => Math.max(0, current - 1))} disabled={stage === 0}>
          <ChevronLeft size={16}/> 上一步
        </button>
        {stage < phases.length - 1 ? <button className="button-primary" type="button" onClick={() => setStage(current => Math.min(phases.length - 1, current + 1))}>
          下一步 <ChevronRight size={16}/>
        </button> : <button className="button-primary" type="button" onClick={() => setStage(0)}>
          重播 <RotateCcw size={16}/>
        </button>}
      </div>
    </div>
  </>;
}
