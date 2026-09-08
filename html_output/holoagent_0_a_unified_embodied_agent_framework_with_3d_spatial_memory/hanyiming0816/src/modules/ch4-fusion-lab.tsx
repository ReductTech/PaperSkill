import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';

type MissionStep = {
  id: string;
  label: string;
  title: string;
  agent: string;
  skill: string;
  decision: string;
  world: string;
  memory: string;
};

const missionSteps: MissionStep[] = [
  {
    id: 'intent',
    label: 'Intent',
    title: 'User Intent',
    agent: 'Goal: Find CoffeeMachine_01',
    skill: 'Build Skill Graph',
    decision: 'Retrieve Memory -> Navigate -> Verify Target',
    world: 'The robot has not moved yet.',
    memory: 'No runtime evidence has been checked.',
  },
  {
    id: 'retrieve',
    label: 'Retrieve',
    title: 'Retrieve Memory',
    agent: 'Query HMSG: coffee machine',
    skill: 'Candidate: Kitchen / View 12',
    decision: 'Memory says the target was seen here before.',
    world: 'Plan route toward View 12.',
    memory: 'Floor 1 -> Kitchen -> View 12',
  },
  {
    id: 'navigate',
    label: 'Navigate',
    title: 'Execute Skill',
    agent: 'Dispatch move_to(View 12)',
    skill: 'HoloNavi progress: 100%',
    decision: 'Status: arrived',
    world: 'Robot reaches the remembered viewpoint.',
    memory: 'Temporal trace appends a successful navigation skill.',
  },
  {
    id: 'failure',
    label: 'Verify x',
    title: 'Verification Failure',
    agent: 'verify_target()',
    skill: 'Runtime evidence disagrees with memory.',
    decision: 'Do not finish. Trigger recovery.',
    world: 'Coffee machine not found at View 12.',
    memory: 'Temporal: verify failed. Spatial: View 12 evidence stale.',
  },
  {
    id: 'update',
    label: 'Update',
    title: 'Memory Update',
    agent: 'Write failure evidence back.',
    skill: 'Update Spatial + Temporal Memory',
    decision: 'Old HMSG candidate is no longer reliable.',
    world: 'Current camera view invalidates old evidence.',
    memory: 'View 12 -> invalid / HMSG candidate updated',
  },
  {
    id: 'recover',
    label: 'Recover',
    title: 'Active Exploration',
    agent: 'Recovery Decision: explore nearby views',
    skill: 'View 17 -> View 22 -> New View 27',
    decision: 'New evidence detected.',
    world: 'Coffee machine appears in a new observation.',
    memory: 'CoffeeMachine_01 -> View 27',
  },
  {
    id: 'success',
    label: 'Success',
    title: 'Re-plan -> Success',
    agent: 'Re-plan with updated HMSG',
    skill: 'move_to(View 27) -> verify_target()',
    decision: 'Mission Complete',
    world: 'Coffee machine confirmed.',
    memory: 'Floor 1 -> Kitchen -> View 27 -> CoffeeMachine_01',
  },
];

export const Ch4FusionLab: React.FC<WidgetProps> = () => {
  const [active, setActive] = useState(0);
  const [running, setRunning] = useState(false);
  const step = missionSteps[active];

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => {
      setActive((current) => {
        if (current >= missionSteps.length - 1) {
          setRunning(false);
          return current;
        }
        return current + 1;
      });
    }, active === 0 ? 1200 : 1800);
    return () => window.clearTimeout(timer);
  }, [active, running]);

  const runMission = () => {
    if (active >= missionSteps.length - 1) {
      setActive(0);
      setRunning(true);
      return;
    }
    setRunning((value) => !value);
  };

  const isFailure = active >= 3;
  const isRecovered = active >= 5;
  const isSuccess = active >= 6;
  const cameraImage = isRecovered
    ? 'images/semantic-memory/kitchen-view-27.png'
    : 'images/semantic-memory/kitchen-view-12.png';

  return (
    <div className="closed-loop-lab">
      <div className="closed-loop-hero">
        <div>
          <small>MISSION</small>
          <b>Find the coffee machine</b>
          <span>当计划与现实不一致时，HoloAgent-0 会怎么做？</span>
        </div>
        <button type="button" onClick={runMission}>
          {running ? 'Pause' : active >= missionSteps.length - 1 ? 'Run Again' : 'Run Closed Loop'}
        </button>
      </div>

      <div className="closed-loop-grid">
        <section className="closed-loop-panel agentos">
          <div className="cl-panel-head">
            <b>AgentOS</b>
            <span>它在想什么？</span>
          </div>
          <div className="cl-state-card">
            <small>{step.title}</small>
            <b>{step.agent}</b>
            <span>{step.skill}</span>
          </div>
          <div className={isFailure ? 'cl-decision warn' : isSuccess ? 'cl-decision good' : 'cl-decision'}>
            {step.decision}
          </div>
        </section>

        <section className="closed-loop-panel world">
          <div className="cl-panel-head">
            <b>Physical World</b>
            <span>现实发生了什么？</span>
          </div>
          <div className="cl-floor-map">
            <div className="room bedroom">Bedroom</div>
            <div className="room hallway">Hallway</div>
            <div className="room kitchen">Kitchen <span>View 12</span></div>
            <div className={`robot-pos step-${Math.min(active, 6)}`}>R</div>
            <div className={isRecovered ? 'new-view show' : 'new-view'}>View 27</div>
          </div>
          <div className={isFailure ? 'cl-camera show' : 'cl-camera'}>
            <img src={cameraImage} alt={isRecovered ? 'Coffee machine visible from View 27' : 'Kitchen counter at View 12 without coffee machine'} />
            <b>{isSuccess ? 'Coffee Machine Confirmed' : isRecovered ? 'New evidence detected' : 'Coffee machine not found'}</b>
          </div>
          <p>{step.world}</p>
        </section>

        <section className="closed-loop-panel memory">
          <div className="cl-panel-head">
            <b>Memory</b>
            <span>它记住了什么？</span>
          </div>
          <div className="cl-memory-stack">
            <section className={active >= 1 ? 'on' : ''}>
              <small>HMSG</small>
              <b>{active >= 5 ? 'View 27 selected' : 'Kitchen / View 12'}</b>
            </section>
            <section className={active >= 3 ? 'on warn' : ''}>
              <small>Temporal Memory</small>
              <b>{active >= 3 ? 'Verify target failed' : 'Waiting for skill result'}</b>
            </section>
            <section className={active >= 4 ? 'on good' : ''}>
              <small>Spatial Memory</small>
              <b>{active >= 4 ? 'View 12 evidence invalid' : 'Old evidence still trusted'}</b>
            </section>
          </div>
          <div className="cl-memory-note">{step.memory}</div>
        </section>
      </div>

      <div className="closed-loop-timeline" role="tablist" aria-label="Closed-loop mission timeline">
        {missionSteps.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active === index}
            className={active === index ? 'selected' : active > index ? 'done' : ''}
            onClick={() => {
              setRunning(false);
              setActive(index);
            }}
          >
            <small>{index + 1}</small>
            <b>{item.label}</b>
          </button>
        ))}
      </div>

      <div className="closed-loop-takeaway">
        <b>{'HoloAgent-0 的闭环不是 "Plan -> Act"，而是：'}</b>
        <strong>{'Retrieve -> Plan -> Execute -> Verify -> Update -> Recover -> Re-plan'}</strong>
        <span>现实不是计划的终点，而是下一轮决策的新证据。</span>
      </div>
    </div>
  );
};

export default Ch4FusionLab;
