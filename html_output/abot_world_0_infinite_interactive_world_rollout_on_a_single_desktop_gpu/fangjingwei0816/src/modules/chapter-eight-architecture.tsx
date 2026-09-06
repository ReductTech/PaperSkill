import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';

type PathId = 'action' | 'identity' | 'stream';

const PATHS: Record<PathId, { label: string; length: number }> = {
  action: { label: '动作路径', length: 5 },
  identity: { label: '身份路径', length: 4 },
  stream: { label: '流式路径', length: 5 },
};

function MathActionFormula() {
  return (
    <div className="arch8-action-formula">
      <span>论文中的动作注入公式</span>
      <span className="arch8-equation" role="math" aria-label="z hat equals PatchEmbed z plus F psi of a tilde">
        <i className="arch8-over"><b>z</b><em>^</em></i>
        <b>=</b>
        <span>PatchEmbed(z)</span>
        <b>+</b>
        <span>F<sub>ψ</sub>(<i className="arch8-over"><b>a</b><em>~</em></i>)</span>
      </span>
      <strong>四帧动作合成 32 维动作指令，经动作适配器映射后，与对应的视频块表示直接相加。</strong>
    </div>
  );
}

function FlowNode({ index, step, title, term, text, core = false }: {
  index: number;
  step: number;
  title: string;
  term?: string;
  text?: string;
  core?: boolean;
}) {
  const state = index < step ? 'is-active' : index === step ? 'is-current' : 'is-pending';
  return (
    <div className={`arch8-simple-node ${state} ${core ? 'is-core' : ''}`}>
      <strong>{title}</strong>
      {term ? <small>{term}</small> : null}
      {text ? <span>{text}</span> : null}
    </div>
  );
}

function Arrow() {
  return <b className="arch8-flow-arrow" aria-hidden="true">→</b>;
}

function ActionPath({ step }: { step: number }) {
  return (
    <section className="arch8-active-path action" aria-label="动作路径">
      <div className="arch8-path-lead">
        <strong>动作怎么控制下一段？</strong>
        <span>例如同时按下 <b>W</b> + <b>D</b>，表示希望画面向右前方移动。</span>
      </div>
      <div className="arch8-simple-flow">
        <FlowNode index={0} step={step} title="键盘动作" term="W + D" />
        <Arrow />
        <FlowNode index={1} step={step} title="整理成动作指令" text="向右前方移动" />
        <Arrow />
        <FlowNode index={2} step={step} title="加入当前视频信息" text="动作与这一时刻的画面对应" />
        <Arrow />
        <FlowNode index={3} step={step} title="因果视频生成模型" term="Causal DiT" core />
        <Arrow />
        <FlowNode index={4} step={step} title="下一段视频" text="产生对应方向的运动" />
      </div>
      <div className="arch8-path-answer">这条路解决：下一段视频应该怎么动。</div>
      <details className="arch8-tech-detail action-detail">
        <summary>展开技术细节：动作在模型中如何注入</summary>
        <p>论文将连续四帧的 8 维组合按键表示合成为 32 维动作指令，再由动作适配器映射并注入对应的视频块表示。§3 已完整解释编码过程，这里只强调它最终汇入生成核心。</p>
        <MathActionFormula />
      </details>
    </section>
  );
}

function IdentityPath({ step }: { step: number }) {
  return (
    <section className="arch8-active-path identity" aria-label="身份路径">
      <div className="arch8-path-lead">
        <strong>身份怎么保持？</strong>
        <span>先从参考角色图中保存一块固定身份记忆，后续生成一直读取它。</span>
      </div>
      <div className="arch8-simple-flow identity-flow">
        <FlowNode index={0} step={step} title="参考角色图" term="Reference Image" />
        <Arrow />
        <FlowNode index={1} step={step} title="固定身份记忆" term="Identity Memory" />
        <Arrow />
        <FlowNode index={2} step={step} title="因果视频生成模型" term="Causal DiT" core />
        <Arrow />
        <FlowNode index={3} step={step} title="持续生成的视频" text="仍知道这个角色是谁" />
      </div>
      <div className="arch8-memory-rule" aria-label="身份记忆读写规则">
        <div><b>身份记忆</b><i>→</i><b>生成视频</b><span>视频可以读取身份信息</span></div>
        <div className="blocked"><b>生成视频</b><i>✕→</i><b>身份记忆</b><span>新视频不能反向改写固定记忆</span></div>
      </div>
      <div className="arch8-path-answer">这条路解决：角色跑久以后还是不是同一个人。</div>
      <details className="arch8-tech-detail identity-detail">
        <summary>展开技术细节：身份记忆如何实现</summary>
        <ul>
          <li>参考图像被转换为身份记忆表示（Memory Tokens）。</li>
          <li>身份记忆放在视频时间轴之前的负时间位置（Negative-time Position）。</li>
          <li>非对称注意力允许视频读取记忆，但阻止视频反向写入记忆（Asymmetric Attention）。</li>
        </ul>
      </details>
    </section>
  );
}

function StreamPath({ step }: { step: number }) {
  return (
    <section className="arch8-active-path stream" aria-label="流式路径">
      <div className="arch8-path-lead">
        <strong>视频怎么持续输出？</strong>
        <span>生成模型一次负责下一块，解码、缓存和写回机制让它不断接着运行。</span>
      </div>
      <div className="arch8-stream-stage">
        <div className="arch8-simple-flow stream-flow">
          <FlowNode index={0} step={step} title="因果视频生成模型" term="Causal DiT" core />
          <Arrow />
          <FlowNode index={1} step={step} title="生成下一块视频内容" text="生成的视频表示" />
          <Arrow />
          <FlowNode index={2} step={step} title="快速解码成画面" term="快速解码器 · LightVAE" />
          <Arrow />
          <FlowNode index={3} step={step} title="实时输出" term="Streaming Output" />
          <Arrow />
          <FlowNode index={4} step={step} title="写回过去的视频内容" text="作为下一轮输入" />
        </div>
        <aside className={`arch8-cache-side ${step >= 1 ? 'is-active' : ''}`}>
          <span>生成模型旁边的辅助状态</span>
          <strong>历史计算缓存</strong>
          <small>KV Cache</small>
          <p>记住前面已经算过的信息，避免每一轮都从头计算。</p>
          <i>↕ 与生成模型交换运行状态</i>
        </aside>
      </div>
      <div className="arch8-stream-loop">↺ 写回历史后，继续生成下一块</div>
      <div className="arch8-path-answer">这条路解决：模型怎样一块接一块持续跑起来。</div>
    </section>
  );
}

export const ChapterEightArchitecture: React.FC<WidgetProps> = () => {
  const [path, setPath] = useState<PathId>('action');
  const [step, setStep] = useState(0);
  const [replay, setReplay] = useState(0);

  useEffect(() => {
    setStep(0);
    const timer = window.setInterval(() => {
      setStep((current) => {
        if (current >= PATHS[path].length - 1) {
          window.clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, 460);
    return () => window.clearInterval(timer);
  }, [path, replay]);

  const choosePath = (next: PathId) => {
    if (next === path) setReplay((value) => value + 1);
    else setPath(next);
  };

  return (
    <div className="chapter-eight-architecture" data-path={path} data-step={step}>
      <div className="arch8-path-switch" role="tablist" aria-label="选择一条路径查看">
        {(Object.entries(PATHS) as Array<[PathId, (typeof PATHS)[PathId]]>).map(([id, item]) => (
          <button type="button" role="tab" aria-selected={path === id} className={path === id ? `active ${id}` : id} key={id} onClick={() => choosePath(id)}>
            {item.label}
          </button>
        ))}
        <span>再次点击当前路径可重播</span>
      </div>

      <div className="arch8-path-viewport" aria-live="polite">
        {path === 'action' ? <ActionPath step={step} /> : null}
        {path === 'identity' ? <IdentityPath step={step} /> : null}
        {path === 'stream' ? <StreamPath step={step} /> : null}
      </div>

      <div className="arch8-core-conclusion">
        <strong>动作和身份负责“生成什么”，缓存和解码负责“怎样持续跑”。</strong>
        <span>三条路径承担不同职责，最后都围绕同一个因果视频生成模型工作。</span>
      </div>
    </div>
  );
};
