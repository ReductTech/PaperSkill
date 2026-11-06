import { useState } from 'react';
import { LearningModule } from './LearningModule';
import { S3Formula } from './S3Formula';
import './inference-trace.css';

type Stage = {
  name: string; origin: string; tool: string; action: string; reason?: string;
  scope: string; question: string; observation: string; history: string; memory: string;
};

// Figure 2 shows Turn 1, Turn 2, an omitted middle span, Turn N+1 and the answer.
// The five entries below are teaching phases, not a claim of five consecutive calls.
const stages: Stage[] = [
  { name: '广域搜索', origin: 'Turn 1', tool: 'Scan Search', action: '全片分片粗扫 · 找到 131.8–175.7 s 候选', scope: '0–4539 s · 0.2 FPS · 每片 300 s', question: '定位水䶄首次出现并记录衣服颜色。', observation: '0–300 s 分片把 131.8–175.7 s 当作水䶄候选；这一识别后来被纠正。', history: 'Turn 1：找到 131.8–175.7 s 候选。', memory: 'Figure 2 未展示本轮主体表条目。' },
  { name: '局部精查', origin: 'Turn 2', tool: 'Segment Focus', action: '收窄到 130–176 s · 观察浅蓝衣角色', reason: '观察仍称“看起来像水䶄”，不能据此锁定身份。', scope: '130–176 s · 最多 32 帧', question: '描述看起来像水䶄的角色及衣着。', observation: '图中摘录：160–176 s 的角色“看起来像水䶄”。', history: 'Turn 2：细看候选，身份判断仍不确定。', memory: 'Figure 2 未展示 Turn 2 后主体表条目。' },
  { name: '身份冲突', origin: '中间轮次省略 · 主体表快照', tool: '读取已有记忆', action: '两条“水䶄”记录指向不同衣着的角色', reason: '浅蓝衣与白衣同时被关联为水䶄；需要跨时间核验。', scope: '160–176 s；307–320 s', question: '两条记录是同一主体吗？', observation: '图中展示冲突主体表；中间各次工具调用未完整展示。', history: '已知：早期误认；中间行动在 Figure 2 中省略。', memory: 'water_vole_1：浅蓝衣，160–176 s；water_vole_2：白衣，307–320 s。' },
  { name: '联合核验', origin: 'Turn N+1', tool: 'Stitch Verify', action: '两段画面进入同一 Observer 上下文', reason: '联合比较澄清：浅蓝衣是鼹鼠，白衣是水䶄。', scope: '[160,176,2] 与 [310,330,2] · 各 2 FPS', question: '两个片段是同一角色吗？比较外形、毛色与服装。', observation: '联合观察区分鼹鼠与水䶄；白衣角色出现在 313–325 s。', history: 'Turn N+1：Stitch Verify 纠正先前的身份关联。', memory: '浅蓝衣→鼹鼠；白衣→水䶄。' },
  { name: 'Finish', origin: '论文答案 · 算法停止条件', tool: 'Finish', action: 'B · 白色', reason: '证据已经足够：题目中的水䶄对应白衣角色。', scope: '不取新帧', question: '输出最终答案。', observation: '沿用联合核验的视觉证据；没有新的 Observer 调用。', history: '使用已获得的证据作答。', memory: '水䶄：白衣；鼹鼠：浅蓝衣。' },
];

function Character({ type, subtle = false, phase = 0 }: { type: 'mole' | 'vole'; subtle?: boolean; phase?: number }) {
  const vole = type === 'vole';
  return <svg className={`s8-character${subtle ? ' s8-character-subtle' : ''}`} viewBox="0 0 240 150" role="img" aria-label={vole ? '白衣、圆耳的水䶄教学重绘画面' : '浅蓝衣、尖鼻的鼹鼠教学重绘画面'}>
    <rect width="240" height="150" fill={vole ? '#eef6ee' : '#edf2f8'}/>
    <path d="M0 122 Q120 112 240 122 V150 H0Z" fill={vole ? '#dcebdc' : '#dbe6f2'}/>
    <g transform={`translate(${phase * 3 - 4} ${phase % 2 ? 1 : -1})`}>
    <ellipse cx="120" cy="132" rx="46" ry="6" fill="#62738a" opacity=".16"/>
    {vole && <path d="M151 109 Q203 88 216 117" fill="none" stroke="#a18a77" strokeWidth="6" strokeLinecap="round"/>}
    <path d="M94 90 Q86 112 99 130 H147 Q157 110 147 90Z" fill={vole ? '#a18a77' : '#77736d'}/>
    <path d="M100 93 Q94 111 103 128 H142 Q150 110 141 93Z" fill={vole ? '#fffefa' : '#76a6d1'} stroke={vole ? '#b2c8b1' : '#4d79a7'} strokeWidth="2"/>
    {vole ? <><circle cx="99" cy="53" r="10" fill="#a18a77"/><circle cx="141" cy="53" r="10" fill="#a18a77"/><ellipse cx="120" cy="71" rx="35" ry="32" fill="#a18a77"/><circle cx="108" cy="68" r="3" fill="#443b37"/><circle cx="132" cy="68" r="3" fill="#443b37"/><ellipse cx="120" cy="81" rx="5" ry="3" fill="#443b37"/></> : <><path d="M86 75 Q90 41 125 39 Q156 39 163 70 L182 80 Q170 92 153 89 Q136 100 110 93 Q87 89 86 75Z" fill="#77736d"/><circle cx="143" cy="67" r="3" fill="#fff"/><circle cx="182" cy="80" r="4" fill="#bf8990"/></>}
    </g>
  </svg>;
}

function EvidenceFrame({ type, time, label, muted = false }: { type: 'mole' | 'vole'; time: string; label: string; muted?: boolean }) {
  return <figure className={`s8-evidence-frame${muted ? ' muted' : ''}`}><Character type={type} subtle={muted}/><figcaption><span>{time}</span><strong>{label}</strong></figcaption></figure>;
}

function ScanCanvas() {
  return <div className="s8-visual s8-scan-visual">
    <div className="s8-canvas-head"><strong>长视频 · 0–4539 s</strong><span>各分片独立观察</span></div>
    <div className="s8-slices" role="img" aria-label="视频按 300 秒分为 15 个完整分片和最后 39 秒；第一片找到候选">{Array.from({length:16},(_,i)=><span key={i} className={i===0?'found':''} title={i===15?'4500–4539 s':`${i*300}–${(i+1)*300} s`}>{i===0?'候选':i===15?'39s':''}</span>)}</div>
    <div className="s8-scale"><span>0 s</span><span>300 s</span><span>4539 s</span></div>
    <div className="s8-zoom-strip"><div className="s8-zoom-ruler"><span className="s8-candidate"/></div><span>0–300 s 分片</span><strong>131.8–175.7 s · 候选</strong></div>
  </div>;
}

function FocusCanvas() {
  return <div className="s8-visual s8-focus-visual"><div className="s8-canvas-head"><strong>聚焦 130–176 s</strong><span>从候选范围取得更密集视觉线索</span></div><div className="s8-focus-range"><span>130 s</span><div><i/></div><span>176 s</span></div><div className="s8-focus-frames">{[0,1,2,3].map((i)=><div className="s8-sample" key={i}><Character type="mole" phase={i}/><span>{i===0?'候选前段':i===3?'160–176 s':'连续采样'}</span></div>)}</div><div className="s8-visual-callout">看起来像水䶄？ <span>身份仍待核实</span></div></div>;
}

function ConflictCanvas() {
  return <div className="s8-visual s8-conflict-visual"><div className="s8-canvas-head"><strong>Subject Memory · 两条身份记录</strong><span>中间轮次省略后的快照</span></div><div className="s8-pair"><EvidenceFrame type="mole" time="160–176 s" label="water_vole_1 ?"/><div className="s8-conflict-link"><span>同一身份？</span><b>≠ ?</b></div><EvidenceFrame type="vole" time="307–320 s" label="water_vole_2 ?"/></div><div className="s8-visual-callout">浅蓝衣 ↔ 白衣 <span>身份关联冲突</span></div></div>;
}

function VerifyCanvas({ finished = false }: { finished?: boolean }) {
  return <div className={`s8-visual s8-verify-visual${finished?' finished':''}`}><div className="s8-canvas-head"><strong>{finished?'已核验的关键证据':'Observer · 同一视觉上下文'}</strong><span>{finished?'无新观察':'两个不连续片段 · 各 2 FPS'}</span></div><div className="s8-joined"><EvidenceFrame type="mole" time="160–176 s" label={finished?'鼹鼠 · 浅蓝衣':'鼹鼠 · 浅蓝衣'} muted={finished}/><span className="s8-join-mark">{finished?'→':'≠'}</span><EvidenceFrame type="vole" time="313–325 s" label="水䶄 · 白衣"/></div>{finished?<div className="s8-answer"><span>FINISH</span><strong>B · 白色</strong></div>:<div className="s8-visual-callout">两段同看 <span>不同角色，修正身份关联</span></div>}</div>;
}

function TraceCanvas({ index }: { index: number }) {
  if (index===0) return <ScanCanvas/>;
  if (index===1) return <FocusCanvas/>;
  if (index===2) return <ConflictCanvas/>;
  return <VerifyCanvas finished={index===4}/>;
}

const algorithm = [
  { title: 'Reasoner 生成行动', related: '轨迹：粗扫、精查与核验由现有证据推动', operation: 'L₀={Q,Vinfo}，Sub₀=∅；aₜ=Mᵣ(Q,Vinfo,Lₜ₋₁,Subₜ₋₁)' },
  { title: '先判断 Finish', related: '轨迹：核验充分后才停止', operation: 'oₜ=Finish → 返回 qₜ；否则继续观察' },
  { title: '构造并观察上下文', related: '轨迹：Scan 分片、Focus 单段、Stitch 合段', operation: 'Gₜ=BuildContextGroups；逐组取帧 → Observer' },
  { title: '汇总并更新记忆', related: '轨迹：错误关联进入主体表，联合核验后修正', operation: 'eₜ=Aggregate(yₜ⁽ᵏ⁾)；更新 Lₜ 与 Subₜ' },
];
const noop = () => {};

function AlgorithmVisual({ index }: { index: number }) {
  if (index===0) return <div className="s8-algo-visual"><div className="s8-algo-inputs"><span>Q + Vinfo</span><span>历史 Lₜ₋₁</span><span>主体记忆 Subₜ₋₁</span></div><div className="s8-algo-arrow">↓</div><div className="s8-algo-output">Reasoner → 行动 aₜ</div><div className="foundation-planner-action s8-formula"><small>回看 §3 的行动结构示例</small><S3Formula onActiveChange={noop}/></div></div>;
  if (index===1) return <div className="s8-algo-visual s8-algo-branch"><div className="s8-algo-output">aₜ 的工具是 Finish？</div><div><span>是 → 返回 qₜ</span><span>否 → BuildContextGroups</span></div><small>Finish 不取帧，不调用 Observer。</small></div>;
  if (index===2) return <div className="s8-algo-visual s8-algo-groups"><div><strong>Scan</strong><span>组 1</span><span>组 2</span><span>组 3</span></div><div><strong>Focus</strong><span>单个连续区间</span></div><div><strong>Stitch</strong><span>片段 A + 片段 B · 同一组</span></div><small>各组先取帧，再交给 Observer；结果进入 Aggregate。</small></div>;
  return <div className="s8-algo-visual s8-algo-memory"><div><span>各组观察 yₜ⁽ᵏ⁾</span><b>↓ Aggregate</b><span>本轮证据 eₜ</span></div><div className="s8-algo-state"><span>历史 Lₜ<br/>追加行动与观察</span><span>主体记忆 Subₜ<br/>修订身份与时间</span></div><small>两者分开更新，再供下一轮 Reasoner 读取。达到最大轮次仍未 Finish：返回 unknown。</small></div>;
}

export function InferenceTraceLesson({ onComplete }: { onComplete: () => void }) {
  const [stageIndex, setStageIndex] = useState(0);
  const [algorithmIndex, setAlgorithmIndex] = useState(0);
  const stage = stages[stageIndex];
  const select = (index: number) => { setStageIndex(index); if (index===4) onComplete(); };
  return <>
    <LearningModule number="8.1" title="一条完整的 LensWalk 推理轨迹" description="观察计划怎样随证据变化？沿 Figure 2 已展示的轮次探索五个教学阶段；中间真实轮次未逐一给出。">
      <div className="s8-lesson"><p className="s8-question"><span>研究问题</span><strong>水䶄第一次出现时，穿什么颜色的衣服？</strong></p>
        <div className="s8-stage-nav" role="group" aria-label="推理轨迹教学阶段">{stages.map((item,i)=><button type="button" key={item.name} className={stageIndex===i?'active':''} aria-current={stageIndex===i?'step':undefined} onClick={()=>select(i)}><small>{String(i+1).padStart(2,'0')}</small><span>{item.name}</span></button>)}</div>
        <div className="s8-canvas" aria-live="polite"><TraceCanvas index={stageIndex}/></div>
        <div className="s8-action"><div><span>{stage.origin}</span><strong>{stage.tool} · {stage.action}</strong></div>{stage.reason && <p>{stage.reason}</p>}</div>
        <details className="s8-details"><summary>查看本阶段行动与证据</summary><dl><dt>范围与预算</dt><dd>{stage.scope}</dd><dt>子问题</dt><dd>{stage.question}</dd><dt>观察</dt><dd>{stage.observation}</dd><dt>历史 L</dt><dd>{stage.history}</dd><dt>主体记忆 Sub</dt><dd>{stage.memory}</dd></dl></details>
        <div className="s8-controls"><button type="button" className="button-outline" disabled={stageIndex===0} onClick={()=>select(stageIndex-1)}>← 上一步</button><span>{stageIndex+1} / 5</span><button type="button" className="button-primary" disabled={stageIndex===4} onClick={()=>select(stageIndex+1)}>下一步 →</button><button type="button" className="button-outline" onClick={()=>select(0)}>重新演示</button></div>
      </div>
    </LearningModule>
    <LearningModule number="8.2" title="Algorithm 1：这条轨迹如何执行？" description="选择算法步骤，把画面中的行动对回真正的执行顺序。">
      <div className="s8-lesson s8-algorithm"><div className="s8-algo-nav" role="group" aria-label="Algorithm 1 执行步骤">{algorithm.map((item,i)=><button type="button" className={algorithmIndex===i?'active':''} aria-pressed={algorithmIndex===i} key={item.title} onClick={()=>setAlgorithmIndex(i)}><span>{i+1}</span>{item.title}</button>)}</div><div className="s8-algo-stage" aria-live="polite"><code>{algorithm[algorithmIndex].operation}</code><AlgorithmVisual index={algorithmIndex}/><p>{algorithm[algorithmIndex].related}</p></div></div>
    </LearningModule>
  </>;
}
