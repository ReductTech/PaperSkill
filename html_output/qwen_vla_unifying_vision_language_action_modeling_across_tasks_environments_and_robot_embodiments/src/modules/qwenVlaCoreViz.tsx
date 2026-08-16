import React from 'react';

export type TrainStage = 't2a' | 'cpt' | 'sft' | 'rl';
export type InspectRegion = 'vlm' | 'joint' | 'dit' | 'euler' | 'action' | null;

export interface QwenVlaCoreVizProps {
  mode: 'inference' | 'train';
  inferPhase?: number;
  trainStage?: TrainStage;
  tau?: number;
  highlight?: InspectRegion;
  rlSuccess?: boolean;
  onRegionClick?: (r: InspectRegion) => void;
  className?: string;
}

const LANG = ['抓', '起', '杯', '子'];
const EMB = ['WidowX', '单臂', '末端控制'];
const TAU_STEPS = [1, 0.67, 0.33, 0];

function cls(...names: Array<string | false | null | undefined>) {
  return names.filter(Boolean).join(' ');
}

export function QwenVlaCoreViz({
  mode,
  inferPhase = 0,
  tau = 1,
  highlight = null,
  onRegionClick,
  className = '',
}: QwenVlaCoreVizProps) {
  const phase = mode === 'inference' ? inferPhase : 0;
  const live = phase > 0;
  const patching = phase >= 2;
  const vlmLive = phase >= 3;
  const jointLive = phase >= 4;
  const ditLive = phase >= 5;
  const velocityLive = phase >= 6;
  const eulerLive = phase >= 7;
  const actionLive = phase >= 8;

  const isDim = (region: InspectRegion) => Boolean(highlight && highlight !== region);
  const isHot = (region: InspectRegion) => highlight === region;
  const inspect = (region: InspectRegion) => () => onRegionClick?.(region);

  const eulerActive = tau <= 0.01 ? 3 : tau <= 0.34 ? 2 : tau <= 0.68 ? 1 : 0;

  return (
    <div className={cls('q4x-engine', className)} data-phase={phase}>
      <svg className="q4x-plumbing" viewBox="0 0 1200 560" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="q4xPipeGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--viz-green)" />
            <stop offset="48%" stopColor="var(--viz-navy)" />
            <stop offset="100%" stopColor="var(--viz-purple)" />
          </linearGradient>
          <filter id="q4xGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <marker id="q4xArrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--viz-navy)" opacity=".72" />
          </marker>
        </defs>
        <path className={cls('q4x-pipe', live && 'is-live')} d="M238 156 C290 156 294 122 347 122" markerEnd="url(#q4xArrow)" />
        <path className={cls('q4x-pipe', jointLive && 'is-live')} d="M563 170 C563 205 563 215 563 244" markerEnd="url(#q4xArrow)" />
        <path className={cls('q4x-pipe', ditLive && 'is-live')} d="M563 322 C563 346 563 356 563 382" markerEnd="url(#q4xArrow)" />
        <path className={cls('q4x-pipe', velocityLive && 'is-live')} d="M772 411 C838 411 836 126 913 126" markerEnd="url(#q4xArrow)" />
        <path className={cls('q4x-pipe', eulerLive && 'is-live')} d="M1007 177 L1007 242" markerEnd="url(#q4xArrow)" />
        <path className={cls('q4x-pipe', actionLive && 'is-live')} d="M1007 356 L1007 415" markerEnd="url(#q4xArrow)" />
        {live ? (
          <circle r="5" fill="var(--viz-green)" filter="url(#q4xGlow)" className="q4x-packet-orbit">
            <animateMotion dur="3.8s" repeatCount="indefinite" path="M238 156 C290 156 294 122 347 122 C420 122 480 165 563 170 C563 205 563 215 563 244 C563 300 563 350 563 382 C650 411 760 411 772 411 C838 411 836 126 913 126" />
          </circle>
        ) : null}
      </svg>

      <section className={cls('q4x-input', live && 'is-live')}>
        <div className="q4x-kicker">01 · 多模态条件</div>
        <h4>输入舱</h4>
        <p>观察图像、语言指令与本体感知提示进入同一预测流程。</p>

        <div className="q4x-camera-rack" aria-label="观察图像序列">
          {[0, 1, 2].map((frame) => (
            <div key={frame} className={cls('q4x-frame', live && 'is-in', patching && 'is-patching')} style={{ animationDelay: `${frame * 100}ms` }}>
              <span className="q4x-table" />
              <span className="q4x-cup" />
              {patching ? (
                <span className="q4x-patches">
                  {Array.from({ length: 6 }).map((_, i) => <i key={i} style={{ animationDelay: `${frame * 90 + i * 45}ms` }} />)}
                </span>
              ) : null}
            </div>
          ))}
        </div>

        <div className="q4x-input-lane">
          <span className="q4x-lane-name">语言指令</span>
          <div className="q4x-token-row">
            {LANG.map((token, i) => <span key={token} className={cls('q4x-token', 'is-lang', live && 'is-in', patching && 'is-travel')} style={{ animationDelay: `${i * 80}ms` }}>{token}</span>)}
          </div>
        </div>

        <div className="q4x-input-lane">
          <span className="q4x-lane-name">本体感知提示</span>
          <div className="q4x-token-row q4x-token-row--emb">
            {EMB.map((token, i) => <span key={token} className={cls('q4x-token', 'is-emb', live && 'is-in', patching && 'is-travel')} style={{ animationDelay: `${160 + i * 90}ms` }}>{token}</span>)}
          </div>
        </div>

        <div className="q4x-input-note"><span /> 条件就绪后进入 Qwen3.5-4B VLM</div>
      </section>

      <section className="q4x-center-stack">
        <button type="button" className={cls('q4x-chamber', 'q4x-vlm', vlmLive && 'is-live', isDim('vlm') && 'is-dim', isHot('vlm') && 'is-hot')} onClick={inspect('vlm')}>
          <div className="q4x-chamber-head">
            <div><span className="q4x-kicker">02 · 感知与理解</span><h4>Qwen3.5-4B VLM</h4></div>
            <span className={cls('q4x-status', vlmLive && 'is-on')}>{vlmLive ? '编码中' : '待机'}</span>
          </div>
          <div className="q4x-vlm-body">
            <div className="q4x-vlm-stack">
              {Array.from({ length: 7 }).map((_, i) => <span key={i} className={cls('q4x-vlm-slab2', vlmLive && 'is-scan')} style={{ '--i': i, animationDelay: `${i * 75}ms` } as React.CSSProperties} />)}
              <i className={cls('q4x-scan-plane', vlmLive && 'is-running')} />
            </div>
            <div className="q4x-hidden-port">
              <span>VLM 隐状态</span>
              <div className="q4x-bead-row">
                {Array.from({ length: 8 }).map((_, i) => <i key={i} className={cls(vlmLive && 'is-out')} style={{ animationDelay: `${i * 70}ms` }} />)}
              </div>
            </div>
          </div>
        </button>

        <button type="button" className={cls('q4x-chamber', 'q4x-joint', jointLive && 'is-live', isDim('joint') && 'is-dim', isHot('joint') && 'is-hot')} onClick={inspect('joint')}>
          <div className="q4x-chamber-head q4x-chamber-head--compact">
            <div><span className="q4x-kicker">03 · 联合序列</span><h4>隐状态 + 噪声动作块 Yτ</h4></div>
            <span className="q4x-tau-chip">τ = {tau.toFixed(2)}</span>
          </div>
          <div className="q4x-merge-river">
            <div className="q4x-stream q4x-stream--hidden">
              {Array.from({ length: 7 }).map((_, i) => <span key={i} className={cls(jointLive && 'is-flow')} style={{ animationDelay: `${i * 55}ms` }} />)}
            </div>
            <div className="q4x-stream q4x-stream--noise">
              {Array.from({ length: 6 }).map((_, i) => <span key={i} className={cls(jointLive && 'is-flow')} style={{ animationDelay: `${120 + i * 55}ms` }} />)}
            </div>
            <svg viewBox="0 0 400 54" preserveAspectRatio="none" aria-hidden="true">
              <path d="M6 12 C140 12 158 25 202 27 C248 29 300 27 394 27" className="q4x-merge-line q4x-merge-line--a" />
              <path d="M6 42 C140 42 158 29 202 27 C248 25 300 27 394 27" className="q4x-merge-line q4x-merge-line--b" />
            </svg>
            <div className={cls('q4x-joint-ribbon', jointLive && 'is-live')}>
              {Array.from({ length: 13 }).map((_, i) => <i key={i} className={i < 7 ? 'is-hidden' : 'is-noise'} />)}
            </div>
          </div>
        </button>

        <button type="button" className={cls('q4x-chamber', 'q4x-dit', ditLive && 'is-live', isDim('dit') && 'is-dim', isHot('dit') && 'is-hot')} onClick={inspect('dit')}>
          <div className="q4x-chamber-head">
            <div><span className="q4x-kicker">04 · 动作专家</span><h4>DiT ×16 · joint self-attention</h4></div>
            <span className="q4x-adaln">τ → AdaLN</span>
          </div>
          <div className="q4x-dit-reactor">
            <div className="q4x-dit-grid">
              {Array.from({ length: 16 }).map((_, i) => <span key={i} className={cls('q4x-dit-cell', ditLive && 'is-active')} style={{ '--i': i, animationDelay: `${i * 45}ms` } as React.CSSProperties}><i /></span>)}
            </div>
            <svg className="q4x-attention-web" viewBox="0 0 440 120" preserveAspectRatio="none" aria-hidden="true">
              {[18, 54, 90].map((y, i) => <path key={y} d={`M10 ${y} C125 ${y - 18}, 275 ${y + 18}, 430 ${y}`} className={cls(ditLive && 'is-live')} style={{ animationDelay: `${i * 170}ms` }} />)}
            </svg>
            <div className={cls('q4x-reactor-pulse', ditLive && 'is-running')} />
          </div>
          <div className="q4x-dit-foot"><span>共享序列进入 16 个 DiT block</span><span>输出条件速度 vθ</span></div>
        </button>
      </section>

      <section className="q4x-right-stack">
        <div className={cls('q4x-velocity', velocityLive && 'is-live')}>
          <div className="q4x-chamber-head q4x-chamber-head--compact">
            <div><span className="q4x-kicker">05 · Flow Matching</span><h4>条件速度场 vθ</h4></div>
          </div>
          <svg viewBox="0 0 260 120" className="q4x-field" aria-hidden="true">
            <defs>
              <marker id="q4xVelArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--viz-orange)" /></marker>
            </defs>
            {[[25,25,82,28],[28,58,90,52],[25,92,80,80],[105,20,154,34],[105,56,166,55],[105,92,158,76],[175,26,220,44],[175,62,226,61],[175,94,220,78]].map((a, i) => (
              <line key={i} x1={a[0]} y1={a[1]} x2={a[2]} y2={a[3]} className={cls('q4x-field-arrow', velocityLive && 'is-live')} markerEnd="url(#q4xVelArrow)" style={{ animationDelay: `${i * 55}ms` }} />
            ))}
            <circle cx="226" cy="61" r="8" className="q4x-field-target" />
            <circle cx="32" cy="58" r="7" className="q4x-field-source" />
          </svg>
        </div>

        <button type="button" className={cls('q4x-euler', eulerLive && 'is-live', isDim('euler') && 'is-dim', isHot('euler') && 'is-hot')} onClick={inspect('euler')}>
          <div className="q4x-chamber-head q4x-chamber-head--compact"><div><span className="q4x-kicker">06 · 数值积分</span><h4>欧拉积分：τ 1 → 0</h4></div></div>
          <div className="q4x-euler-track">
            <span className="q4x-euler-rail" />
            {TAU_STEPS.map((t, i) => (
              <div key={t} className={cls('q4x-euler-station', eulerLive && i <= eulerActive && 'is-done', eulerLive && i === eulerActive && 'is-current')}>
                <div className="q4x-cloud">
                  {Array.from({ length: 5 }).map((_, j) => <i key={j} style={{ '--j': j } as React.CSSProperties} />)}
                </div>
                <b>{t.toFixed(2)}</b>
              </div>
            ))}
          </div>
          <div className="q4x-euler-caption">沿预测速度场执行少量欧拉积分步</div>
        </button>

        <button type="button" className={cls('q4x-action', actionLive && 'is-live', isDim('action') && 'is-dim', isHot('action') && 'is-hot')} onClick={inspect('action')}>
          <div className="q4x-chamber-head q4x-chamber-head--compact"><div><span className="q4x-kicker">07 · 连续控制</span><h4>H 步动作块</h4></div></div>
          <svg className="q4x-action-svg" viewBox="0 0 280 118" aria-hidden="true">
            <path d="M20 88 C72 52, 110 92, 155 58 S226 56, 256 28" className="q4x-action-path-ghost" />
            <path d="M20 88 C72 52, 110 92, 155 58 S226 56, 256 28" className={cls('q4x-action-path', actionLive && 'is-draw')} />
            {[20,65,110,155,200,238,256].map((x, i) => <circle key={x} cx={x} cy={[88,62,77,58,54,42,28][i]} r="5" className={cls('q4x-action-node2', actionLive && 'is-in')} style={{ animationDelay: `${i * 70}ms` }} />)}
            <g className={cls('q4x-gripper', actionLive && 'is-run')}>
              <path d="M-7 5 L0 -6 L7 5" />
              <rect x="-3" y="4" width="6" height="7" rx="1" />
            </g>
          </svg>
          <div className="q4x-horizon"><span>t+1</span><span>t+2</span><span>t+3</span><span>…</span><span>t+H</span></div>
        </button>
      </section>
    </div>
  );
}

export default QwenVlaCoreViz;
