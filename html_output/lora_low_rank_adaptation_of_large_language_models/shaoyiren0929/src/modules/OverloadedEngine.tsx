import React, { useEffect, useMemo, useState } from 'react';

type Phase = 'briefing' | 'running' | 'review' | 'final';

const tasks = [
  { code: 'TASK–01', name: '法律摘要', telegram: '把长篇判决书压缩成三段结论' },
  { code: 'TASK–02', name: '代码修复', telegram: '定位缺陷并生成安全补丁' },
  { code: 'TASK–03', name: '客服应答', telegram: '学习新的品牌语气与规则' },
  { code: 'TASK–04', name: '医学问答', telegram: '适配专业术语与回答格式' },
];

function Gauge({ label, value, unit, danger = false }: { label: string; value: string; unit?: string; danger?: boolean }) {
  return (
    <div className={`oe-gauge ${danger ? 'is-danger' : ''}`}>
      <span className="oe-gauge-label">{label}</span>
      <strong>{value}</strong>
      {unit ? <small>{unit}</small> : null}
    </div>
  );
}

function Gear({ size, x, y, reverse = false, active = false }: { size: number; x: string; y: string; reverse?: boolean; active?: boolean }) {
  return (
    <span
      className={`oe-gear ${reverse ? 'is-reverse' : ''} ${active ? 'is-active' : ''}`}
      style={{ width: size, height: size, left: x, top: y }}
      aria-hidden="true"
    >
      <span />
    </span>
  );
}

export function OverloadedEngine({ onNext }: { onNext: () => void }) {
  const [taskIndex, setTaskIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('briefing');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (phase !== 'running') return;
    const timer = window.setInterval(() => {
      setProgress((current) => {
        const next = Math.min(100, current + 4);
        if (next === 100) {
          window.clearInterval(timer);
          window.setTimeout(() => setPhase('review'), 320);
        }
        return next;
      });
    }, 70);
    return () => window.clearInterval(timer);
  }, [phase]);

  const active = phase === 'running' || phase === 'review';
  const completed = taskIndex + (phase === 'review' ? 1 : 0);
  const gpu = active ? Math.round(180 + progress * 10.2) : 180;
  const checkpoint = phase === 'running' ? Math.round(progress * 3.5) : phase === 'review' ? 350 : 0;
  const pressure = active ? Math.round(22 + progress * 0.77) : 22;
  const task = tasks[taskIndex];
  const totalStorage = completed * 350;
  const copies = useMemo(() => Array.from({ length: completed }), [completed]);

  const startTraining = () => {
    setProgress(0);
    setPhase('running');
  };

  const nextTask = () => {
    if (taskIndex >= tasks.length - 1) {
      setPhase('final');
      return;
    }
    setTaskIndex((current) => current + 1);
    setProgress(0);
    setPhase('briefing');
  };

  if (phase === 'final') {
    return (
      <section className="act0-stage act0-final" aria-label="ACT 0 结论">
        <div className="oe-smoke oe-smoke-left" />
        <div className="oe-smoke oe-smoke-right" />
        <h1>Do we really need to modify the whole machine?</h1>
        <div className="story-transition story-transition-dark">
          <small>下一步·寻找替代路线</small>
          <p>全量微调的危机已经出现。先不急着提出新方法：去旧机械博物馆，看看现有参数高效方法分别用什么代价换取更少的可训练参数。</p>
          <button onClick={onNext}>进入 Existing Solution Museum →</button>
        </div>
      </section>
    );
  }

  return (
    <section className={`act0-stage ${active ? 'is-overloaded' : ''}`} aria-labelledby="act0-title">
      <div className="oe-factory-grid" aria-hidden="true" />
      <div className="oe-pipe oe-pipe-left" aria-hidden="true" />
      <div className="oe-pipe oe-pipe-right" aria-hidden="true" />
      <header className="oe-header">
        <div>
          <span className="oe-act">ACT 0</span>
          <h1 id="act0-title">OVERLOADED ENGINE</h1>
        </div>
        <div className="oe-shift">MODEL ADAPTATION WORKS · NIGHT SHIFT 03</div>
      </header>

      <div className="oe-workfloor">
        <aside className="oe-order" aria-live="polite">
          <span className="oe-kicker">INCOMING PNEUMATIC ORDER</span>
          <strong>{task.code}</strong>
          <h2>{task.name}</h2>
          <p>{task.telegram}</p>
          <div className="oe-order-stamp">NEW TASK</div>
        </aside>

        <div className="oe-machine-wrap">
          <div className="oe-machine-shadow" />
          <div className="oe-machine" aria-label="GPT-3 175B 黄铜思维机器">
            <div className="oe-chimney"><i /><i /><i /></div>
            <div className="oe-machine-crown">GPT–3</div>
            <div className="oe-machine-plate">175 BILLION PARAMETERS</div>
            <div className="oe-core">
              <Gear size={132} x="8%" y="20%" active={active} />
              <Gear size={104} x="64%" y="15%" reverse active={active} />
              <Gear size={86} x="55%" y="57%" active={active} />
              <Gear size={72} x="20%" y="64%" reverse active={active} />
              <div className={`oe-reactor ${active ? 'is-active' : ''}`}>
                <span>NEURAL</span>
                <b>CORE</b>
              </div>
            </div>
            <div className="oe-rivets" aria-hidden="true" />
            <div className="oe-machine-base"><span>PRE-TRAINED THINKING ENGINE</span></div>
          </div>
          {phase === 'running' ? (
            <div className="oe-training-overlay" aria-live="polite">
              <span>FULL WEIGHT RECALIBRATION</span>
              <div><i style={{ width: `${progress}%` }} /></div>
              <strong>{progress}%</strong>
            </div>
          ) : null}
        </div>

        <aside className="oe-instruments" aria-live="polite">
          <Gauge label="TRAINABLE PARAMETERS" value={active ? '175B' : '—'} />
          <Gauge label="GPU MEMORY" value={active ? gpu.toLocaleString() : '180'} unit="GB" danger={progress > 58} />
          <Gauge label="CHECKPOINT STORAGE" value={checkpoint.toLocaleString()} unit="GB / TASK" danger={progress > 72} />
          <div className={`oe-pressure ${pressure > 78 ? 'is-danger' : ''}`}>
            <div className="oe-pressure-dial" style={{ '--needle': `${-120 + Math.min(100, pressure) * 2.4}deg` } as React.CSSProperties}>
              <i />
              <span>{pressure}%</span>
            </div>
            <div><small>BOILER PRESSURE</small><strong>{pressure > 78 ? 'DANGER' : 'STABLE'}</strong></div>
          </div>
        </aside>
      </div>

      <div className="oe-console">
        {phase === 'briefing' ? (
          <>
            <p>新任务要求整台思维机器学习。选择适配方式：</p>
            <button className="oe-full-tune" onClick={startTraining}>FULL FINE-TUNE</button>
          </>
        ) : phase === 'running' ? (
          <p className="oe-warning">ALL 175 BILLION PARAMETERS UNLOCKED — EVERY GEAR IS NOW TRAINABLE</p>
        ) : (
          <>
            <p className="oe-warning">任务完成，但工厂保存了又一份完整的 175B 模型。</p>
            <button className="oe-next-task" onClick={nextTask}>
              {taskIndex === tasks.length - 1 ? '查看实验结论' : '接收下一个任务'}
            </button>
          </>
        )}
      </div>

      <div className="oe-task-ledger" aria-label="任务模型副本">
        <div className="oe-ledger-heading">
          <span>TASK-SPECIFIC MODEL COPIES</span>
          <strong>{completed} × 175B</strong>
          <em>{totalStorage.toLocaleString()} GB CHECKPOINTS</em>
        </div>
        <div className="oe-copy-rack">
          {copies.map((_, index) => (
            <div className="oe-model-copy" key={index}>
              <span>{tasks[index].code}</span>
              <b>175B</b>
              <small>FULL MODEL</small>
            </div>
          ))}
          {Array.from({ length: tasks.length - copies.length }).map((_, index) => (
            <div className="oe-model-copy is-empty" key={`empty-${index}`}><span>EMPTY BAY</span></div>
          ))}
        </div>
      </div>
    </section>
  );
}
