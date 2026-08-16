import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type MemoryStep = 'geometry' | 'semantic' | 'hmsg' | 'temporal';
type SemanticStage = 'extract' | 'lift' | 'associate';
type TemporalView = 'plan' | 'trace' | 'outcome';
type UpdateTrigger = 'observation' | 'skill' | 'correction';

const steps: Array<{ id: MemoryStep; title: string; short: string; question: string; answer: string }> = [
  {
    id: 'geometry',
    title: 'Geometry Memory',
    short: 'Geometry',
    question: '机器人怎么知道我在哪、哪里能走？',
    answer: '先把连续传感器观测放进同一个 3D 坐标系，形成可导航的世界底座。',
  },
  {
    id: 'semantic',
    title: 'Semantic Memory',
    short: 'Semantic',
    question: '机器人怎么从看见东西到知道是什么？',
    answer: '先提取 2D 开放词汇语义，再把这些语义附着到 Geometry Memory 上。',
  },
  {
    id: 'hmsg',
    title: 'HMSG Retrieval',
    short: 'HMSG',
    question: 'AgentOS 怎么快速找到咖啡机？',
    answer: '用 Floor → Room → View → Object 的层级索引，把检索从全局搜索变成粗到细定位。',
  },
  {
    id: 'temporal',
    title: 'Temporal + Update',
    short: 'Temporal',
    question: 'Memory 怎么变成活的 Agent Memory？',
    answer: '记录目标、计划、技能结果和恢复轨迹，并把新观察/执行结果写回 Memory。',
  },
];

const hmsgPath = ['Floor 1', 'Kitchen', 'View 19', 'Coffee Machine'];
const hmsgRooms = ['Bedroom', 'Kitchen', 'Office', 'Lounge'];
const hmsgViews = [
  { id: 'View 17', title: 'Kitchen door', src: 'images/semantic-memory/kitchen-view-17.png', tag: 'Candidate' },
  { id: 'View 19', title: 'Coffee machine corner', src: 'images/semantic-memory/kitchen-view-27.png', tag: 'Best Candidate' },
  { id: 'View 22', title: 'Counter area', src: 'images/semantic-memory/kitchen-view-12.png', tag: 'Candidate' },
];
const hmsgPipeline = ['ROOM', 'VIEW', 'VERIFY', 'OBJECT'];
const temporalLog = ['✓ Query kitchen', '✓ Navigate', '✕ Verify View 12', '→ Explore new area'];
const temporalViews: Array<{ id: TemporalView; label: string; question: string }> = [
  { id: 'plan', label: 'Goal & Plan', question: '我现在要干什么？做到哪一步？' },
  { id: 'trace', label: 'Execution Trace', question: '刚才调用了哪些 skill？为什么失败？' },
  { id: 'outcome', label: 'Outcome Summary', question: '这段经历以后怎么复用？' },
];
const temporalPlan = ['✓ Query Kitchen', '✓ Navigate to View 12', '✕ Verify target', '→ Explore new area'];
const temporalTrace = [
  { time: '10:31', call: 'query_memory("coffee machine")', result: 'Kitchen / View 12' },
  { time: '10:32', call: 'move_to(View 12)', result: 'success' },
  { time: '10:33', call: 'verify_target()', result: 'target missing' },
  { time: '10:33', call: 'recovery', result: 'explore nearby views' },
];
const spatialUpdateSteps = [
  { title: 'Re-localize', desc: '确认机器人当前位姿' },
  { title: 'Refresh Local Geometry', desc: '更新当前视野附近的 metric map' },
  { title: 'Update Semantic Instance', desc: '旧证据失效，新 observation 重新关联' },
  { title: 'Refresh HMSG', desc: '只刷新受影响的 View / Object / Room' },
];
const updateTriggers: Array<{ id: UpdateTrigger; label: string; event: string; memory: string }> = [
  { id: 'observation', label: 'New Observation', event: 'View 12: CoffeeMachine_01 missing', memory: 'View 12 evidence invalid' },
  { id: 'skill', label: 'Skill Outcome', event: 'move_to(Route A) → blocked', memory: 'Route A marked blocked' },
  { id: 'correction', label: 'User Correction', event: '"That is the lounge, not the kitchen."', memory: 'Room_03: Kitchen ✕ / Lounge ✓' },
];

const semanticStages: Array<{ id: SemanticStage; label: string; title: string; intro: string; footer: string }> = [
  {
    id: 'extract',
    label: '① Extract',
    title: '看懂它是什么',
    intro: 'SAM2 先确定 object mask，再从整图、目标区域和局部上下文三个尺度提取并融合特征。',
    footer: '先把 2D 视觉变成稳定的开放词汇语义表示。',
  },
  {
    id: 'lift',
    label: '② Lift to 3D',
    title: '把 2D 语义放进 3D 记忆',
    intro: '论文强调把 2D foundation-model features lift 到 Geometry Memory 上，但没有展开具体的 2D→3D 投影算法。',
    footer: '二维语义不再只属于某一张图片，而是进入可查询的三维世界表示。',
  },
  {
    id: 'associate',
    label: '③ Associate',
    title: '换个角度仍认出它',
    intro: '把旧实例投影回当前视角，再和新的 SAM2 mask 做重叠匹配，保持同一个对象身份。',
    footer: 'From pixels to persistent objects.',
  },
];

const semanticExtractSteps = [
  { label: 'RGB Image', note: '原始场景帧' },
  { label: 'SAM2', note: '分出 object mask' },
  { label: 'Construct 3 views', note: 'Full / Masked / Local' },
];

const semanticExtractViews = [
  { tag: 'SigLIP d₀', title: 'Full Image', desc: 'Global scene context' },
  { tag: 'SigLIP d₁', title: 'Masked Object', desc: 'Target appearance' },
  { tag: 'SigLIP d₂', title: 'Local Box', desc: 'Nearby context' },
];

const semanticLiftSteps = [
  { label: 'SAM2 Mask', note: '2D object region' },
  { label: 'Fused SigLIP Descriptor', note: 'open-vocabulary feature' },
  { label: 'Geometry Memory', note: '3D points / voxels / instances' },
];

const semanticAssociateSteps = [
  { label: 'Existing 3D Object', note: 'CoffeeMachine_01' },
  { label: 'Projected Mask', note: 'old instance → camera' },
  { label: 'Current SAM2 Mask', note: 'new observation' },
  { label: 'High IoU Match', note: 'update old instance' },
];

function GeometryPanel() {
  return (
    <div className="mem-panel geometry">
      <div className="mem-geo-visual">
        <figure className="mem-geo-figure">
          <img
            src="images/semantic-memory/geometry-memory.png"
            alt="3D room mesh with traversable floor, occupied regions, and robot pose"
          />
          <figcaption>Geometry Memory 先把可通行区域、占据区域和空间结构组织成统一的三维底座。</figcaption>
        </figure>
        <div className="mem-geo-caption">
          <span>RGB / depth observations</span>
          <b>→</b>
          <span>Geometry Memory</span>
        </div>
      </div>
      <div className="mem-copy">
        <h5>先建立统一的三维坐标世界</h5>
        <p>Geometry Memory 把多帧传感器观测对齐到同一个坐标系，维护机器人位姿、墙面/地面、障碍物、占据栅格、拓扑关系和可通行区域。第一步不是识别“咖啡机”，而是让机器人知道自己在哪里、下一步有没有路。</p>
        <div className="mem-detail-grid">
          <section>
            <b>存什么</b>
            <span>pose · occupancy · topology · traversability</span>
          </section>
          <section>
            <b>给谁用</b>
            <span>AgentOS 检索位置上下文，HoloNavi 判断目标是否可达。</span>
          </section>
          <section>
            <b>先别误解</b>
            <span>这层还不是“知道物体名称”，它先提供可执行动作需要的空间约束。</span>
          </section>
        </div>
        <div className="mem-tags">
          <span>robot pose</span><span>3D geometry</span><span>occupancy</span><span>traversable area</span>
        </div>
      </div>
    </div>
  );
}

function SemanticPanel() {
  const [stage, setStage] = useState<SemanticStage>('extract');
  const activeStage = semanticStages.find((item) => item.id === stage) ?? semanticStages[0];

  return (
    <div className="mem-panel semantic">
      <div className="mem-semantic-stagebar" role="tablist" aria-label="Semantic Memory stages">
        {semanticStages.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={stage === item.id}
            className={stage === item.id ? 'selected' : ''}
            onClick={() => setStage(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mem-semantic-title">
        <b>{activeStage.title}</b>
        <span>{activeStage.intro}</span>
      </div>

      {stage === 'extract' ? (
        <div className="sem-stage-shell">
          <figure className="sem-figure-card">
            <div className="sem-figure-kicker">Visual evidence</div>
            <img src="images/semantic-memory/extract-semantics.png" alt="Kitchen scene with colored object masks and a highlighted coffee machine" />
            <figcaption>彩色 mask 展示 2D 分割后的对象证据，咖啡机作为目标实例被单独突出。</figcaption>
            <div className="sem-evidence-list">
              <div>
                <span>输入</span>
                <b>RGB frame + SAM2 mask</b>
              </div>
              <div>
                <span>作用</span>
                <b>把目标从背景里分出来</b>
              </div>
              <div>
                <span>输出</span>
                <b>给 SigLIP 的三种视图</b>
              </div>
            </div>
          </figure>

          <div className="sem-process-card">
            <div className="sem-process-head">
              <small>Extract</small>
              <b>论文里的技术顺序</b>
              <span>SAM2 先确定 object mask，再从整图、目标区域和局部上下文三个尺度提取并融合特征。</span>
            </div>

            <div className="sem-track">
              {semanticExtractSteps.map((item, index) => (
                <div key={item.label} className="sem-track-step">
                  <span>{index + 1}</span>
                  <b>{item.label}</b>
                  <small>{item.note}</small>
                </div>
              ))}
            </div>

            <div className="sem-descriptor-grid">
              {semanticExtractViews.map((item) => (
                <section key={item.tag}>
                  <small>{item.tag}</small>
                  <b>{item.title}</b>
                  <span>{item.desc}</span>
                </section>
              ))}
            </div>

            <div className="sem-formula">d = Σᵢ₌₀² wᵢ ⊙ dᵢ</div>
            <div className="sem-outcome">融合全图、目标外观和局部上下文，得到稳定的开放词汇语义表示。</div>
          </div>

          <p className="sem-note sem-note-wide">{activeStage.footer}</p>
        </div>
      ) : null}

      {stage === 'lift' ? (
        <div className="sem-stage-shell">
          <figure className="sem-figure-card">
            <div className="sem-figure-kicker">3D grounding</div>
            <img src="images/semantic-memory/lift-3d.png" alt="2D coffee machine mask projected into a 3D voxel scene" />
            <figcaption>论文在这里强调的是把二维开放词汇语义附着到已有 Geometry Memory 上。</figcaption>
            <div className="sem-evidence-list">
              <div>
                <span>2D</span>
                <b>SAM2 mask</b>
              </div>
              <div>
                <span>Feature</span>
                <b>Fused SigLIP descriptor</b>
              </div>
              <div>
                <span>3D</span>
                <b>points / voxels / instances</b>
              </div>
            </div>
          </figure>

          <div className="sem-process-card">
            <div className="sem-process-head">
              <small>Lift to 3D</small>
              <b>Lift 2D Semantics onto Geometry Memory</b>
              <span>Figure 4 画出了 Pose / Depth / RGB 作为实时观测输入，但正文没有进一步说明具体的 lifting 公式或投影实现。</span>
            </div>
            <div className="sem-track">
              {semanticLiftSteps.map((item, index) => (
                <div key={item.label} className="sem-track-step">
                  <span>{index + 1}</span>
                  <b>{item.label}</b>
                  <small>{item.note}</small>
                </div>
              ))}
            </div>
            <div className="sem-formula">2D semantics → Geometry Memory</div>
            <div className="sem-outcome">这里要记住的是“语义进入三维记忆”；persistent identity 的维护放到下一步 Associate。</div>
          </div>

          <p className="sem-note sem-note-wide">{activeStage.footer}</p>
        </div>
      ) : null}

      {stage === 'associate' ? (
        <div className="sem-stage-shell">
          <figure className="sem-figure-card">
            <div className="sem-figure-kicker">Persistent identity</div>
            <img src="images/semantic-memory/associate-identity.png" alt="Multiple views of the same coffee machine and projected masks for instance association" />
            <figcaption>把旧实例投影回当前视角，再和新的 SAM2 mask 比较重叠，决定是否更新同一对象。</figcaption>
            <div className="sem-evidence-list">
              <div>
                <span>旧实例</span>
                <b>CoffeeMachine_01</b>
              </div>
              <div>
                <span>新观察</span>
                <b>Current SAM2 mask</b>
              </div>
              <div>
                <span>目标</span>
                <b>Update, not duplicate</b>
              </div>
            </div>
          </figure>

          <div className="sem-process-card">
            <div className="sem-process-head">
              <small>Associate</small>
              <b>换个角度仍认出它</b>
              <span>已有 3D instance 会投影回当前相机视角，与新的 2D mask 做重叠匹配；匹配成功就更新旧实例。</span>
            </div>
            <div className="sem-track">
              {semanticAssociateSteps.map((item, index) => (
                <div key={item.label} className="sem-track-step">
                  <span>{index + 1}</span>
                  <b>{item.label}</b>
                  <small>{item.note}</small>
                </div>
              ))}
            </div>
            <div className="sem-formula">IoU(mₖ, m̃ⱼ) → MATCH</div>
            <div className="sem-outcome">匹配时更新 CoffeeMachine_01；没有可靠匹配的高置信观察才创建新对象。</div>
          </div>

          <div className="sem-takeaway">
            <b>{activeStage.footer}</b>
            <span>Semantic Memory 维护的是三维世界里的持续对象，不是逐帧重新命名的像素块。</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HmsgPanel() {
  const [phase, setPhase] = useState(0);
  const searchLabel = phase === 0 ? 'Search Memory' : phase === 1 ? 'Find Views' : phase === 2 ? 'VLM Verify' : 'Reset';
  const advanceSearch = () => setPhase((current) => (current >= 3 ? 0 : current + 1));

  return (
    <div className="mem-panel hmsg hmsg-demo">
      <div className="hmsg-searchbar">
        <div>
          <small>Task query</small>
          <b>Find the coffee machine</b>
          <span>HMSG 先缩小空间范围，再用 View 保存视觉证据，最后交给 VLM 精细确认。</span>
        </div>
        <button type="button" onClick={advanceSearch}>{searchLabel}</button>
      </div>

      <div className="hmsg-board">
        <section className="hmsg-spatial">
          <div className="hmsg-panel-head">
            <b>Spatial / HMSG</b>
            <span>Floor → Room → View → Object</span>
          </div>

          <div className="hmsg-floorplan" aria-label="Floor 1 rooms">
            {hmsgRooms.map((room) => (
              <div key={room} className={phase >= 1 && room === 'Kitchen' ? 'active' : ''}>
                <b>{room}</b>
                <span>{room === 'Kitchen' && phase >= 1 ? 'matched room' : 'room node'}</span>
              </div>
            ))}
          </div>

          <div className="hmsg-tree">
            <div className={phase >= 1 ? 'on' : ''}>Floor 1</div>
            <div className={phase >= 1 ? 'on selected' : ''}>Kitchen</div>
            <div className={phase >= 2 ? 'on selected' : ''}>View 19</div>
            <div className={phase >= 3 ? 'on target' : ''}>CoffeeMachine_01 ✓</div>
          </div>
        </section>

        <section className="hmsg-visual">
          <div className="hmsg-panel-head">
            <b>Visual Evidence</b>
            <span>{phase < 2 ? '候选 View 会在定位到 Kitchen 后出现' : '机器人过去看到过的视觉记忆'}</span>
          </div>

          <div className={phase >= 2 ? 'hmsg-views show' : 'hmsg-views'}>
            {hmsgViews.map((view) => (
              <button
                key={view.id}
                type="button"
                className={view.id === 'View 19' && phase >= 2 ? 'selected' : ''}
                onClick={() => (view.id === 'View 19' ? setPhase(3) : setPhase(2))}
                disabled={phase < 2}
              >
                <img src={view.src} alt={`${view.id} visual memory`} />
                <b>{view.id}</b>
                <span>{view.title}</span>
                <em>{view.id === 'View 19' && phase >= 2 ? '★ ' : ''}{view.tag}</em>
              </button>
            ))}
          </div>

          <div className={phase >= 3 ? 'hmsg-verify show' : 'hmsg-verify'}>
            <img src="images/semantic-memory/kitchen-view-27.png" alt="Verified coffee machine view" />
            <div>
              <small>VLM Verification</small>
              <b>Target: coffee machine</b>
              <span>Visual evidence → Confirmed ✓</span>
            </div>
          </div>
        </section>
      </div>

      <div className="hmsg-pipeline">
        {hmsgPipeline.map((item, index) => (
          <section key={item} className={phase > index || (phase === 3 && index === 3) ? 'on' : ''}>
            <small>{index + 1}</small>
            <b>{item}</b>
          </section>
        ))}
      </div>

      <div className="hmsg-why-view">
        <b>Why View?</b>
        <span>Room 告诉 Agent “去哪一片区域”，View 保存“过去从哪里真的看见过目标”的视觉证据。</span>
      </div>

      <div className="hmsg-takeaway">
        <b>HMSG = 3D Memory 的“目录”。</b>
        <span>先找房间，再找视角，最后确认物体。</span>
        <em>Coarse retrieval → Candidate views → VLM verification</em>
        <strong>{phase >= 3 ? hmsgPath.join(' → ') : 'Floor 1 → Kitchen → View 19 → CoffeeMachine_01'}</strong>
      </div>

      <div className="mem-query">Find the coffee machine</div>
      <div className="mem-hmsg-main">
        <div className="mem-hmsg-path">
          {hmsgPath.map((item, index) => (
            <React.Fragment key={item}>
              {index > 0 ? <span className="mem-v-arrow">↓</span> : null}
              <div className={index === hmsgPath.length - 1 ? 'target' : ''}>{item}</div>
            </React.Fragment>
          ))}
        </div>
        <div className="mem-hmsg-compare">
          <section>
            <b>Without HMSG</b>
            <span>search all views / objects</span>
            <em>slow, noisy</em>
          </section>
          <section className="with">
            <b>With HMSG</b>
            <span>Floor → Room → View → Object</span>
            <em>coarse-to-fine retrieval</em>
          </section>
          <section className="verify">
            <b>candidate views</b>
            <span>View 17 · View 19 · View 22</span>
            <em>then VLM verification</em>
          </section>
        </div>
      </div>
      <p><b>HMSG 不是地图本身，</b>而是 3D Memory 的结构化检索索引：先缩小空间范围，再保留 View 视觉证据供 VLM 精细确认。</p>
    </div>
  );
}

function TemporalPanel() {
  const [view, setView] = useState<TemporalView>('plan');
  const [trigger, setTrigger] = useState<UpdateTrigger>('observation');
  const currentTrigger = updateTriggers.find((item) => item.id === trigger) ?? updateTriggers[0];

  return (
    <div className="mem-panel temporal temporal-live">
      <div className="temporal-event">
        <small>EVENT</small>
        <b>Verification Failed</b>
        <span>View 12 没有看到 CoffeeMachine_01。这个真实事件会同时改变任务记忆和世界记忆。</span>
      </div>

      <div className="temporal-live-grid">
        <section className="temporal-card">
          <div className="temporal-card-head">
            <b>Temporal Memory</b>
            <span>Task state + execution trace + recovery experience</span>
          </div>

          <div className="temporal-tabs" role="tablist" aria-label="Temporal Memory views">
            {temporalViews.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={view === item.id}
                className={view === item.id ? 'selected' : ''}
                onClick={() => setView(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {view === 'plan' ? (
            <div className="temporal-plan">
              <code>Goal: Find CoffeeMachine_01</code>
              {temporalPlan.map((item) => <span key={item}>{item}</span>)}
              <em>回答：我现在要干什么？做到哪一步？</em>
            </div>
          ) : null}

          {view === 'trace' ? (
            <div className="temporal-trace">
              {temporalTrace.map((item) => (
                <div key={`${item.time}-${item.call}`}>
                  <time>{item.time}</time>
                  <b>{item.call}</b>
                  <span>→ {item.result}</span>
                </div>
              ))}
              <em>记录 command parameters、status events、failure mode 和 recovery。</em>
            </div>
          ) : null}

          {view === 'outcome' ? (
            <div className="temporal-outcome">
              <section>
                <small>Target</small>
                <b>CoffeeMachine_01</b>
              </section>
              <section>
                <small>Old evidence</small>
                <b>View 12 → invalid</b>
              </section>
              <section>
                <small>New evidence</small>
                <b>View 27 → confirmed</b>
              </section>
              <section className="good">
                <small>Recovery</small>
                <b>active exploration ✓</b>
              </section>
              <em>把长日志压缩成以后可以再次查询的经验。</em>
            </div>
          ) : null}
        </section>

        <section className="temporal-card">
          <div className="temporal-card-head">
            <b>Spatial Update</b>
            <span>Old HMSG → new evidence → local refresh</span>
          </div>

          <div className="spatial-old-memory">
            <b>OLD MEMORY</b>
            <span>Kitchen → View 12 → CoffeeMachine_01</span>
          </div>

          <div className="update-trigger-row">
            {updateTriggers.map((item) => (
              <button
                key={item.id}
                type="button"
                className={trigger === item.id ? 'selected' : ''}
                onClick={() => setTrigger(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="update-trigger-card">
            <small>CURRENT EVIDENCE</small>
            <b>{currentTrigger.event}</b>
            <span>{currentTrigger.memory}</span>
          </div>

          <div className="spatial-update-steps">
            {spatialUpdateSteps.map((item, index) => (
              <section key={item.title}>
                <small>{index + 1}</small>
                <b>{item.title}</b>
                <span>{item.desc}</span>
              </section>
            ))}
          </div>
        </section>
      </div>

      <div className="temporal-merge">
        <section>
          <b>Temporal</b>
          <span>Verify failed → Recovery: Explore</span>
        </section>
        <section>
          <b>Spatial</b>
          <span>View 12 invalid → HMSG candidate updated</span>
        </section>
        <strong>AgentOS Re-plan</strong>
      </div>

      <div className="temporal-takeaway">
        <b>Observe → Update → Re-plan</b>
        <span>Spatial Memory 记“世界现在怎样”，Temporal Memory 记“任务刚才发生了什么”；新证据会同时更新二者，再驱动 AgentOS 下一轮决策。</span>
      </div>
    </div>
  );
}

export const Ch3MemoryMapLab: React.FC<WidgetProps> = () => {
  const [active, setActive] = useState<MemoryStep>('geometry');
  const current = steps.find((step) => step.id === active) ?? steps[0];

  return (
    <div className="memwalk">
      <div className="mem-tabs" role="tablist" aria-label="Memory Layer steps">
        {steps.map((step, index) => (
          <button
            key={step.id}
            type="button"
            role="tab"
            aria-selected={active === step.id}
            className={active === step.id ? 'selected' : ''}
            onClick={() => setActive(step.id)}
          >
            <span>3.{index + 1}</span>
            <b>{step.short}</b>
            <small>{step.question}</small>
          </button>
        ))}
      </div>
      <div className="mem-question">
        <b>{current.title}</b>
        <span>{current.question}</span>
        <em>{current.answer}</em>
      </div>
      {active === 'geometry' ? <GeometryPanel /> : null}
      {active === 'semantic' ? <SemanticPanel /> : null}
      {active === 'hmsg' ? <HmsgPanel /> : null}
      {active === 'temporal' ? <TemporalPanel /> : null}
    </div>
  );
};

export default Ch3MemoryMapLab;
