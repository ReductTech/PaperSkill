import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Path = 'backprop' | 'rl' | 'dpo';

type Step = {
  name: string;
  detail: string;
  blocked?: string;
};

const PATHS: Record<
  Path,
  { title: string; steps: Step[]; done: string; stop: string }
> = {
  backprop: {
    title: '经 Target 反传',
    steps: [
      { name: 'Attacker', detail: '攻击器发出提示 p' },
      { name: 'Target', detail: '目标采样得到回答 y' },
      { name: 'Judge', detail: '评判模型给出有害分' },
      {
        name: '回传梯度',
        detail: '试图把梯度经 Target 传回 Attacker',
        blocked: '停在这里：离散采样阻断梯度；复杂不可微流水线也过不去；还常要白盒（K）。',
      },
    ],
    done: '',
    stop: '这条更新路径走不通。',
  },
  rl: {
    title: 'On-policy RL',
    steps: [
      { name: 'Attacker', detail: '当前策略发出提示 p' },
      {
        name: 'Target',
        detail: '每一步都要从 Target 重新采样',
        blocked: '可以走，但停在成本上：每步都查目标，查询 / 算力太贵（E）。',
      },
      { name: 'Judge', detail: '给本次回答打分' },
      { name: '更新策略', detail: '用奖励更新 Attacker' },
    ],
    done: '能避开反传，但采样太密，效率差。',
    stop: 'On-policy 在这一步就要不断问 Target，现实里很难承受。',
  },
  dpo: {
    title: 'DPO',
    steps: [
      { name: 'Attacker', detail: '采样一批提示' },
      { name: 'Target', detail: '只需黑盒输出 y，不必反传' },
      { name: 'Judge', detail: '打分后构成偏好对 p+ / p−' },
      { name: 'DPO 更新', detail: '在已评分对上直接训练，周期内可复用' },
    ],
    done: '走完全程：不经 Target 反传，还能复用偏好数据（E、A.3）。',
    stop: '',
  },
};

const NODE_COLORS = ['#27446e', '#d97706', '#7c3aed', '#228d5c'];

export const Ch5Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [path, setPath] = useState<Path>('backprop');
  const [step, setStep] = useState(0);

  const cfg = PATHS[path];
  const cur = cfg.steps[step];
  const blocked = Boolean(cur.blocked);
  const finished = path === 'dpo' && step === cfg.steps.length - 1;

  const switchPath = (next: Path) => {
    setPath(next);
    setStep(0);
  };

  const goNext = () => {
    if (blocked) return;
    setStep((s) => Math.min(cfg.steps.length - 1, s + 1));
  };

  return (
    <div id={`cv-${chapterId}-${moduleId}`}>
      <div className="chip-row">
        <button type="button" className={`chip${path === 'backprop' ? ' selected' : ''}`} onClick={() => switchPath('backprop')}>
          经 Target 反传
        </button>
        <button type="button" className={`chip${path === 'rl' ? ' selected' : ''}`} onClick={() => switchPath('rl')}>
          On-policy RL
        </button>
        <button type="button" className={`chip${path === 'dpo' ? ' selected' : ''}`} onClick={() => switchPath('dpo')}>
          DPO
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          flexWrap: 'wrap',
          marginBottom: 12,
        }}
      >
        {cfg.steps.map((item, i) => {
          const active = i === step;
          const passed = i < step;
          const isBlock = Boolean(item.blocked) && active;
          return (
            <React.Fragment key={item.name}>
              <button
                type="button"
                onClick={() => {
                  if (i > 0 && cfg.steps[i - 1].blocked) return;
                  const prevBlocked = cfg.steps.findIndex((s) => s.blocked);
                  if (prevBlocked >= 0 && i > prevBlocked) return;
                  setStep(i);
                }}
                style={{
                  flex: '1 1 90px',
                  minWidth: 90,
                  padding: '10px 8px',
                  borderRadius: 10,
                  border: `1.5px solid ${isBlock ? '#c43f52' : active ? NODE_COLORS[i] : '#d7deea'}`,
                  background: isBlock ? '#fdecee' : active ? '#fff' : passed ? '#f3f7f1' : '#f7f7f4',
                  color: isBlock ? '#c43f52' : '#21324a',
                  fontWeight: active ? 800 : 600,
                  fontSize: 13,
                }}
              >
                {i + 1}. {item.name}
                {item.blocked ? ' ✕' : ''}
              </button>
              {i < cfg.steps.length - 1 ? (
                <span style={{ color: '#b8c0b0', fontWeight: 700 }}>{blocked && i === step ? '|' : '→'}</span>
              ) : null}
            </React.Fragment>
          );
        })}
      </div>

      <div className={`opt-card ${blocked ? 'bad' : finished ? 'good' : 'mid'}`}>
        <div className="opt-kicker">{cfg.title} · 第 {step + 1} 步</div>
        <pre className="opt-pre">{cur.detail}</pre>
      </div>

      <div className="ctrl" style={{ marginTop: 10 }}>
        <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          上一步
        </button>
        <button type="button" onClick={goNext} disabled={blocked || step === cfg.steps.length - 1}>
          {blocked ? '无法继续' : '下一步'}
        </button>
      </div>

      <div className={`feedback ${blocked ? 'bad' : finished ? 'good' : ''}`}>
        {blocked ? cur.blocked : finished ? cfg.done : '顺着这条更新路径点下一步；走不通的地方会停住。'}
      </div>
    </div>
  );
};

export default Ch5Mod1;
