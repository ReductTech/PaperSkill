import React from 'react';

export type TrainStage = 't2a' | 'cpt' | 'sft' | 'rl';
export type SftBranch = 'multi' | 'real' | 'both';

export interface TrainingRecipeTheaterProps {
  stage: TrainStage;
  sftBranch?: SftBranch;
  rlSuccess?: boolean;
  spotlight?: boolean;
}

const STAGE_META: Record<TrainStage, { index: string; title: string; subtitle: string; accent: string }> = {
  t2a: {
    index: '01',
    title: 'T2A：先建立语言到动作的先验',
    subtitle: '关闭视觉通道，冻结 VLM；语言指令与本体感知提示驱动 DiT 学习动作块结构。',
    accent: 'teal',
  },
  cpt: {
    index: '02',
    title: 'CPT：加入视觉，完成视觉落地',
    subtitle: '打开图像观察，VLM 与 DiT 联合工作，把“要做什么”落到“场景里在哪里做”。',
    accent: 'green',
  },
  sft: {
    index: '03',
    title: 'SFT：沿两条数据路径做任务专精',
    subtitle: '从 CPT checkpoint 分叉到 Multi-task SFT 与 Real-robot SFT；共享核心架构不变。',
    accent: 'purple',
  },
  rl: {
    index: '04',
    title: 'RL：在 SimplerEnv 中闭环优化任务成功',
    subtitle: '从 Multi-task SFT 继续，通过 rollout → reward → update 的闭环优化最终任务成功。',
    accent: 'amber',
  },
};

function ArrowDefs() {
  return (
    <defs>
      <marker id="trt3-arrow-navy" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 Z" fill="var(--viz-navy)" />
      </marker>
      <marker id="trt3-arrow-green" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 Z" fill="var(--viz-green)" />
      </marker>
      <marker id="trt3-arrow-amber" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 Z" fill="var(--viz-amber)" />
      </marker>
    </defs>
  );
}

function TokenStrip({ tone = 'navy', count = 8, live = true }: { tone?: 'navy' | 'green' | 'purple' | 'amber'; count?: number; live?: boolean }) {
  return (
    <div className={`trt3-token-strip trt3-token-strip--${tone}${live ? ' is-live' : ''}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} style={{ animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  );
}

function CoreStack({ frozen = false, pulse = false }: { frozen?: boolean; pulse?: boolean }) {
  return (
    <div className={`trt3-core${pulse ? ' is-pulse' : ''}`}>
      <div className={`trt3-core-vlm${frozen ? ' is-frozen' : ' is-live'}`}>
        <div className="trt3-core-head">
          <strong>Qwen3.5 VLM</strong>
          <span>{frozen ? '冻结' : '参与训练'}</span>
        </div>
        <div className="trt3-layer-stack" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => <span key={i} style={{ animationDelay: `${i * 90}ms` }} />)}
        </div>
      </div>
      <div className="trt3-core-joint">
        <span>共享隐藏状态</span>
        <span className="trt3-plus">+</span>
        <span>噪声动作块</span>
      </div>
      <div className="trt3-core-dit is-live">
        <div className="trt3-core-head">
          <strong>DiT Action Expert</strong>
          <span>×16</span>
        </div>
        <div className="trt3-dit-depth" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => <span key={i} style={{ animationDelay: `${i * 70}ms` }} />)}
        </div>
      </div>
    </div>
  );
}

function StageT2A() {
  return (
    <div className="trt3-scene trt3-scene--t2a">
      <svg className="trt3-flow-svg" viewBox="0 0 1000 360" preserveAspectRatio="none" aria-hidden="true">
        <ArrowDefs />
        <path className="trt3-flow-line is-live" d="M160 110 C260 110 300 165 390 175" markerEnd="url(#trt3-arrow-green)" />
        <path className="trt3-flow-line is-live" d="M160 245 C260 245 300 195 390 185" markerEnd="url(#trt3-arrow-green)" />
        <path className="trt3-flow-line is-muted" d="M160 48 C260 48 310 88 390 120" />
        <path className="trt3-flow-line is-live" d="M660 180 C760 180 800 180 895 180" markerEnd="url(#trt3-arrow-green)" />
        {[0, 1, 2].map((i) => (
          <circle key={`a-${i}`} r="5" className="trt3-packet trt3-packet--green">
            <animateMotion dur="2.2s" begin={`${i * 0.55}s`} repeatCount="indefinite" path="M160 110 C260 110 300 165 390 175" />
          </circle>
        ))}
        {[0, 1].map((i) => (
          <circle key={`b-${i}`} r="5" className="trt3-packet trt3-packet--amber">
            <animateMotion dur="2.2s" begin={`${i * 0.7}s`} repeatCount="indefinite" path="M160 245 C260 245 300 195 390 185" />
          </circle>
        ))}
      </svg>

      <div className="trt3-input-column">
        <div className="trt3-input trt3-input--off">
          <span className="trt3-input-icon">◫</span>
          <div><strong>视觉观察</strong><small>本阶段关闭</small></div>
          <span className="trt3-state-pill">OFF</span>
        </div>
        <div className="trt3-input trt3-input--live">
          <span className="trt3-input-icon">“ ”</span>
          <div><strong>语言指令</strong><small>instruction</small></div>
          <TokenStrip tone="green" count={5} />
        </div>
        <div className="trt3-input trt3-input--live">
          <span className="trt3-input-icon">◎</span>
          <div><strong>本体感知提示</strong><small>embodiment prompt</small></div>
          <TokenStrip tone="amber" count={4} />
        </div>
      </div>

      <div className="trt3-core-zone">
        <CoreStack frozen />
        <div className="trt3-frozen-note"><span>❄</span> VLM 参数保持冻结</div>
      </div>

      <div className="trt3-output-zone">
        <span className="trt3-zone-kicker">动作先验逐步成形</span>
        <div className="trt3-action-chunk">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="trt3-action-step" style={{ animationDelay: `${i * 140}ms` }}>
              <i />
            </span>
          ))}
        </div>
        <svg className="trt3-mini-traj" viewBox="0 0 260 86" aria-hidden="true">
          <path d="M14 68 C52 62 74 35 111 43 C151 52 176 23 242 18" fill="none" stroke="var(--viz-green)" strokeWidth="4" strokeLinecap="round" className="trt3-traj-draw" />
          <circle cx="242" cy="18" r="6" fill="var(--viz-amber)" />
        </svg>
        <strong className="trt3-output-caption">语言 + 本体条件 → H-step 动作块</strong>
      </div>
    </div>
  );
}

function StageCPT() {
  return (
    <div className="trt3-scene trt3-scene--cpt">
      <svg className="trt3-flow-svg" viewBox="0 0 1000 360" preserveAspectRatio="none" aria-hidden="true">
        <ArrowDefs />
        <path className="trt3-flow-line is-live" d="M170 80 C260 80 305 135 390 155" markerEnd="url(#trt3-arrow-green)" />
        <path className="trt3-flow-line is-live" d="M170 185 C260 185 305 175 390 170" markerEnd="url(#trt3-arrow-green)" />
        <path className="trt3-flow-line is-live" d="M650 170 C740 170 800 155 885 145" markerEnd="url(#trt3-arrow-green)" />
        {[0, 1, 2].map((i) => (
          <circle key={i} r="5" className="trt3-packet trt3-packet--green">
            <animateMotion dur="2s" begin={`${i * 0.45}s`} repeatCount="indefinite" path="M170 80 C260 80 305 135 390 155" />
          </circle>
        ))}
      </svg>

      <div className="trt3-cpt-observation">
        <span className="trt3-zone-kicker">观察窗口打开</span>
        <div className="trt3-frame-strip">
          {[0, 1, 2].map((i) => (
            <div className="trt3-frame" key={i} style={{ animationDelay: `${i * 160}ms` }}>
              <span className="trt3-table-line" />
              <span className="trt3-cup-dot" style={{ left: `${40 + i * 8}%` }} />
              <span className="trt3-gripper-mark">⌃</span>
            </div>
          ))}
        </div>
        <div className="trt3-prompt-band"><strong>抓起杯子</strong><span>+</span><em>单臂 · 末端控制</em></div>
      </div>

      <div className="trt3-core-zone">
        <CoreStack pulse />
        <div className="trt3-grounding-wave"><span />视觉特征正在对齐动作条件<span /></div>
      </div>

      <div className="trt3-ground-stage">
        <span className="trt3-zone-kicker">视觉落地</span>
        <svg viewBox="0 0 300 220" className="trt3-ground-svg" aria-hidden="true">
          <rect x="24" y="156" width="252" height="14" rx="7" fill="var(--viz-slate)" opacity=".55" />
          <rect x="180" y="122" width="34" height="34" rx="6" fill="var(--viz-amber)" opacity=".8" />
          <circle cx="197" cy="139" r="30" fill="none" stroke="var(--viz-green)" strokeWidth="4" strokeDasharray="5 5" className="trt3-target-ring" />
          <path d="M74 82 L112 110 L151 92" fill="none" stroke="var(--viz-navy)" strokeWidth="6" strokeLinecap="round" />
          <circle cx="74" cy="82" r="9" fill="var(--viz-green)" />
          <circle cx="112" cy="110" r="8" fill="var(--viz-navy)" />
          <path d="M151 92 C168 98 178 112 190 128" fill="none" stroke="var(--viz-green)" strokeWidth="3" strokeDasharray="7 5" className="trt3-traj-draw" />
          <path d="M95 32 Q166 16 229 46" fill="none" stroke="var(--viz-green)" strokeWidth="4" opacity=".18" />
          <circle cx="128" cy="24" r="5" fill="var(--viz-green)"><animate attributeName="cx" values="110;220;110" dur="2.8s" repeatCount="indefinite" /></circle>
        </svg>
        <strong className="trt3-output-caption">从“理解指令”到“对准场景目标”</strong>
      </div>
    </div>
  );
}

function StageSFT({ branch }: { branch: SftBranch }) {
  const showMulti = branch !== 'real';
  const showReal = branch !== 'multi';
  return (
    <div className="trt3-scene trt3-scene--sft">
      <svg className="trt3-flow-svg" viewBox="0 0 1000 360" preserveAspectRatio="none" aria-hidden="true">
        <ArrowDefs />
        {showMulti ? <path className="trt3-flow-line is-live trt3-flow-line--purple" d="M160 90 C300 90 360 145 445 165" markerEnd="url(#trt3-arrow-navy)" /> : null}
        {showReal ? <path className="trt3-flow-line is-live trt3-flow-line--amber" d="M160 270 C300 270 360 205 445 185" markerEnd="url(#trt3-arrow-amber)" /> : null}
        <path className="trt3-flow-line is-live" d="M650 176 C740 176 795 176 890 176" markerEnd="url(#trt3-arrow-green)" />
        {showMulti ? [0, 1, 2].map((i) => (
          <circle key={`m-${i}`} r="5" className="trt3-packet trt3-packet--purple"><animateMotion dur="2.1s" begin={`${i * .48}s`} repeatCount="indefinite" path="M160 90 C300 90 360 145 445 165" /></circle>
        )) : null}
        {showReal ? [0, 1].map((i) => (
          <circle key={`r-${i}`} r="5" className="trt3-packet trt3-packet--amber"><animateMotion dur="2.1s" begin={`${i * .65}s`} repeatCount="indefinite" path="M160 270 C300 270 360 205 445 185" /></circle>
        )) : null}
      </svg>

      <div className="trt3-sft-sources">
        <div className={`trt3-sft-source${showMulti ? ' is-active' : ' is-dim'}`}>
          <span className="trt3-source-tag">Multi-task SFT</span>
          <div className="trt3-source-orbit">
            <span>视觉问答</span><span>空间落地</span><span>机器人操纵</span><span>视觉-语言导航</span>
          </div>
        </div>
        <div className={`trt3-sft-source trt3-sft-source--real${showReal ? ' is-active' : ' is-dim'}`}>
          <span className="trt3-source-tag">Real-robot SFT</span>
          <div className="trt3-real-flow"><span>遥操作</span><i>→</i><span className="trt3-mini-robot">⌁</span><i>→</i><span>真实机器人数据</span></div>
        </div>
      </div>

      <div className="trt3-core-zone">
        <div className="trt3-checkpoint-badge">CPT checkpoint</div>
        <CoreStack pulse />
        <div className="trt3-update-rings" aria-hidden="true"><span /><span /><span /></div>
      </div>

      <div className="trt3-sft-targets">
        <span className="trt3-zone-kicker">任务专精后的输出</span>
        <div className="trt3-target-grid">
          <div><b>抓取</b><span className="trt3-target-spark" /></div>
          <div><b>双臂协作</b><span className="trt3-target-spark" /></div>
          <div><b>导航</b><span className="trt3-target-spark" /></div>
          <div><b>真实机器人</b><span className="trt3-target-spark" /></div>
        </div>
        <strong className="trt3-output-caption">同一共享核心，接受不同监督路径</strong>
      </div>
    </div>
  );
}

function StageRL({ success }: { success: boolean }) {
  const rewardColor = success ? 'var(--viz-green)' : 'var(--viz-red, #b45353)';
  return (
    <div className={`trt3-scene trt3-scene--rl${success ? ' is-success' : ' is-fail'}`}>
      <svg className="trt3-rl-loop-svg" viewBox="0 0 1000 360" preserveAspectRatio="none" aria-hidden="true">
        <ArrowDefs />
        <path d="M250 160 C330 70 560 64 690 137" className="trt3-loop-path" markerEnd="url(#trt3-arrow-green)" />
        <path d="M715 213 C635 310 390 318 250 235" className="trt3-loop-path trt3-loop-path--feedback" style={{ stroke: rewardColor }} markerEnd={success ? 'url(#trt3-arrow-green)' : 'url(#trt3-arrow-navy)'} />
        <circle r="6" className="trt3-packet trt3-packet--green"><animateMotion dur="2.2s" repeatCount="indefinite" path="M250 160 C330 70 560 64 690 137" /></circle>
        <circle r="6" fill={rewardColor}><animateMotion dur="2.5s" repeatCount="indefinite" path="M715 213 C635 310 390 318 250 235" /></circle>
      </svg>

      <div className="trt3-rl-policy">
        <span className="trt3-zone-kicker">Policy</span>
        <div className="trt3-mini-core-ring"><span>Qwen-VLA</span></div>
        <TokenStrip tone="navy" count={7} />
        <small>输出 H-step action chunk</small>
      </div>

      <div className="trt3-rl-env">
        <div className="trt3-env-head"><strong>SimplerEnv</strong><span>rollout</span></div>
        <svg viewBox="0 0 360 190" className="trt3-env-svg" aria-hidden="true">
          <rect x="20" y="132" width="320" height="16" rx="8" fill="var(--viz-slate)" opacity=".55" />
          <rect x="210" y="102" width="32" height="30" rx="5" fill="var(--viz-amber)" className={success ? 'trt3-env-object is-success' : 'trt3-env-object'} />
          <rect x="280" y="98" width="42" height="34" rx="7" fill="none" stroke={rewardColor} strokeWidth="3" strokeDasharray="6 5" />
          <path d="M58 70 L93 98 L133 79" fill="none" stroke="var(--viz-navy)" strokeWidth="8" strokeLinecap="round" />
          <circle cx="58" cy="70" r="9" fill="var(--viz-green)" />
          <circle cx="93" cy="98" r="8" fill="var(--viz-navy)" />
          <path d="M133 79 C162 86 184 103 212 111" fill="none" stroke="var(--viz-green)" strokeWidth="4" strokeDasharray="7 5" className="trt3-traj-draw" />
        </svg>
      </div>

      <div className="trt3-rl-reward">
        <span className="trt3-zone-kicker">GT reward</span>
        <div className="trt3-reward-orb" style={{ borderColor: rewardColor, color: rewardColor }}>
          <strong>{success ? 'R = 1' : 'R = 0'}</strong>
          <span>{success ? '任务成功' : '任务失败'}</span>
        </div>
        <div className={`trt3-update-beam${success ? ' is-success' : ' is-fail'}`}><i />模型更新<i /></div>
      </div>

      <div className="trt3-loop-label trt3-loop-label--top">动作块 → 环境</div>
      <div className="trt3-loop-label trt3-loop-label--bottom">reward → 参数更新</div>
    </div>
  );
}

export function TrainingRecipeTheater({ stage, sftBranch = 'both', rlSuccess = true, spotlight = false }: TrainingRecipeTheaterProps) {
  const meta = STAGE_META[stage];
  return (
    <div className={`trt3-wrap trt3-wrap--${stage}${spotlight ? ' is-spotlight' : ''}`} data-stage={stage}>
      <div className="trt3-head">
        <div className={`trt3-index trt3-index--${meta.accent}`}>{meta.index}</div>
        <div className="trt3-head-copy">
          <strong>{meta.title}</strong>
          <span>{meta.subtitle}</span>
        </div>
        <div className="trt3-live-badge"><i />当前阶段</div>
      </div>

      {stage === 't2a' ? <StageT2A /> : null}
      {stage === 'cpt' ? <StageCPT /> : null}
      {stage === 'sft' ? <StageSFT branch={sftBranch} /> : null}
      {stage === 'rl' ? <StageRL success={rlSuccess} /> : null}
    </div>
  );
}

export default TrainingRecipeTheater;
