import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';

type Deployment = 'separate' | 'colocate';

type RouteStep = {
  title: string;
  owner: string;
  action: string;
  payload: string;
  output: string;
  tone: 'request' | 'understanding' | 'memory' | 'generation' | 'output';
};

const routeSteps: RouteStep[] = [
  {
    title: '用户请求',
    owner: '统一 API',
    action: '接收文本、图像或交错生成任务，并保持单一服务入口。',
    payload: '文本提示、条件图像、历史上下文',
    output: '交给理解运行时',
    tone: 'request',
  },
  {
    title: '理解与控制',
    owner: 'LightLLM',
    action: '执行多模态 prefill、自回归文本解码、流式输出、批处理与控制流。',
    payload: '用户输入 + 模型思考状态',
    output: '文本流、图像触发信号',
    tone: 'understanding',
  },
  {
    title: '准备生成状态',
    owner: 'LightLLM',
    action: '形成生成所需的 Prompt KV cache 与 Unconditional KV cache。',
    payload: 'Prompt KV cache + Uncond KV cache',
    output: '可供图像引擎读取的生成上下文',
    tone: 'understanding',
  },
  {
    title: '跨进程交换',
    owner: 'Pinned Shared Memory',
    action: '通过固定页共享内存与优化传输内核交换生成状态，不合并两套调度器。',
    payload: '生成阶段 KV cache 与控制状态',
    output: '传给 LightX2V',
    tone: 'memory',
  },
  {
    title: '迭代图像生成',
    owner: 'LightX2V',
    action: '按像素空间去噪节奏执行图像生成，并把图像结果反馈给理解侧。',
    payload: '生成上下文 + 当前去噪状态',
    output: '生成图像 + Image Feedback',
    tone: 'generation',
  },
  {
    title: '继续或结束',
    owner: '统一 API',
    action: '交错任务可继续“文本 → 触发 → 图像 → 反馈 → 文本”，最终组合文本与图像。',
    payload: '文本流 + 生成图像',
    output: '最终文本与图像',
    tone: 'output',
  },
];

const deploymentCopy = {
  separate: {
    title: 'Separate · 分置部署',
    layout: ['GPU A：LightLLM', 'Pinned Shared Memory', 'GPU B：LightX2V'],
    use: '论文更推荐用于生产：便于独立扩缩、定位瓶颈和分配资源。',
    boundary: '8B、2048×2048、TP2+CFG2、分置模式：RTX 5090 为 0.415 s/step，L40S 为 0.443 s/step。',
  },
  colocate: {
    title: 'Colocate · 共置部署',
    layout: ['同一 GPU：LightLLM 进程', 'Pinned Shared Memory', '同一 GPU：LightX2V 进程'],
    use: '适合轻量验证、较小硬件配置，或生成负载明显高于理解负载的场景。',
    boundary: '论文没有报告共置模式的延迟；不能把分置模式的 0.415/0.443 s/step 直接外推到这里。',
  },
} satisfies Record<Deployment, { title: string; layout: string[]; use: string; boundary: string }>;

export const InferenceRoute: React.FC<WidgetProps> = () => {
  const [deployment, setDeployment] = useState<Deployment>('separate');
  const [activeStep, setActiveStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const current = routeSteps[activeStep];
  const deploy = deploymentCopy[deployment];

  useEffect(() => {
    if (!playing) return;
    const timer = globalThis.setTimeout(() => {
      if (activeStep >= routeSteps.length - 1) {
        setPlaying(false);
        return;
      }
      setActiveStep((value) => value + 1);
    }, 850);
    return () => globalThis.clearTimeout(timer);
  }, [activeStep, playing]);

  const play = () => {
    setActiveStep(0);
    setPlaying(true);
  };

  return (
    <div className="inference-route">
      <div className="inference-route-head">
        <div>
          <p className="training-map-kicker">论文 Figure 5 · Disaggregated Inference</p>
          <h4>统一 API 下的双引擎请求闭环</h4>
        </div>
        <div className="ctrl" role="radiogroup" aria-label="选择推理部署方式">
          <button type="button" role="radio" aria-checked={deployment === 'separate'} onClick={() => setDeployment('separate')}>分置 GPU</button>
          <button type="button" role="radio" aria-checked={deployment === 'colocate'} onClick={() => setDeployment('colocate')}>同 GPU 共置</button>
        </div>
      </div>

      <div className="inference-deployment">
        <strong>{deploy.title}</strong>
        <div>
          {deploy.layout.map((item, index) => (
            <React.Fragment key={item}>
              <span className={index === 1 ? 'is-memory' : ''}>{item}</span>
              {index < deploy.layout.length - 1 ? <i aria-hidden="true">↔</i> : null}
            </React.Fragment>
          ))}
        </div>
        <p>{deploy.use}</p>
      </div>

      <div className="inference-route-rail" role="tablist" aria-label="选择推理请求步骤">
        {routeSteps.map((step, index) => (
          <button
            key={step.title}
            type="button"
            role="tab"
            aria-selected={index === activeStep}
            className={`tone-${step.tone} ${index === activeStep ? 'is-active' : ''} ${index < activeStep ? 'is-past' : ''}`}
            onClick={() => {
              setPlaying(false);
              setActiveStep(index);
            }}
          >
            <span>{index + 1}</span>
            <strong>{step.title}</strong>
            <small>{step.owner}</small>
          </button>
        ))}
      </div>

      <article className="inference-route-detail" key={current.title}>
        <header>
          <span>步骤 {activeStep + 1}</span>
          <div>
            <p>{current.owner}</p>
            <h4>{current.title}</h4>
          </div>
        </header>
        <div className="inference-route-body">
          <section>
            <h5>当前动作</h5>
            <p>{current.action}</p>
          </section>
          <section>
            <h5>传递载荷</h5>
            <p>{current.payload}</p>
          </section>
          <section>
            <h5>阶段输出</h5>
            <p>{current.output}</p>
          </section>
        </div>
        <footer>
          <strong>{activeStep === 4 ? '图像完成后会反馈给 LightLLM，交错生成由此继续。' : '两套运行时专门化，但模型接口与任务上下文保持统一。'}</strong>
        </footer>
      </article>

      <div className="inference-systems-benefits">
        <div><span>并行策略</span><p>LightLLM 使用 LLM 型 TP；LightX2V 可使用 CFG Parallelism 或 Sequence Parallelism。</p></div>
        <div><span>资源隔离</span><p>GPU 组、显存预算、批处理与调度策略可以分别配置。</p></div>
        <div><span>运行隔离</span><p>文本密集与图像密集流量可以独立扩缩、分析和调优。</p></div>
      </div>

      <div className="ctrl" role="group" aria-label="播放推理请求流">
        <button type="button" onClick={play} disabled={playing}>{playing ? '正在流动…' : '播放一次请求流'}</button>
        <button type="button" onClick={() => setActiveStep((value) => Math.max(0, value - 1))} disabled={activeStep === 0 || playing}>上一步</button>
        <button type="button" onClick={() => setActiveStep((value) => Math.min(routeSteps.length - 1, value + 1))} disabled={activeStep === routeSteps.length - 1 || playing}>下一步</button>
      </div>

      <div className={`feedback ${deployment === 'separate' ? 'good' : ''}`} aria-live="polite">{deploy.boundary}</div>
      <p className="note">论文说明生成阶段的 KV cache 由理解模块提供，因此 T2I 与图像编辑具有相近的运行特征。这里的 s/step 是单个生成步延迟，不是端到端响应时间。</p>
    </div>
  );
};

export default InferenceRoute;
