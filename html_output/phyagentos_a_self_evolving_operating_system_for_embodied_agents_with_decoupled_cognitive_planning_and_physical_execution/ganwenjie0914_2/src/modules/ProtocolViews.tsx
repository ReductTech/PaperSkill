import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Feedback } from './kit';

// Lab 4.1 — Protocol Views。
// Step A：点击场景中的物体，看原始观测如何被结构化为 entity/attribute/relation；
// Step B：打开五份协议文档，看同一份状态如何被不同视图引用——
// 五份文件不是五个孤立文档，而是统一认知状态空间的五个视图。

type FileId = 'sessions' | 'skillruntime' | 'targets' | 'environment' | 'lessons';

const FILES: { id: FileId; name: string; icon: string; node: string; role: string }[] = [
  { id: 'sessions', name: 'SESSIONS.md', icon: '📋', node: 'Goal', role: '事务中心：目标、契约、生命周期' },
  { id: 'skillruntime', name: 'SKILLRUNTIME.md', icon: '🛠️', node: 'Runtime', role: '这类技能需要什么、产出什么' },
  { id: 'targets', name: 'TARGETS.md', icon: '🤖', node: 'Target', role: '目标端能力与约束' },
  { id: 'environment', name: 'ENVIRONMENT.md', icon: '🌍', node: 'Environment', role: '结构化环境快照' },
  { id: 'lessons', name: 'LESSONS.md', icon: '📒', node: 'Memory', role: '失败原因与已验证的纠正' },
];

export const ProtocolViews: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState<'A' | 'B'>('A');
  const [cupClicked, setCupClicked] = useState(false);
  const [cabinetClicked, setCabinetClicked] = useState(false);
  const [file, setFile] = useState<FileId>('environment');

  const anyClicked = cupClicked || cabinetClicked;
  const activeFile = FILES.find((f) => f.id === file)!;

  // Step A 结构化输出的行（随点击累积）
  const envLines: [string, string][] = [];
  if (cupClicked) {
    envLines.push(['cup.position', 'table']);
    envLines.push(['cup.held', 'false']);
    envLines.push(['cup.relations', '[on(table)]']);
  }
  if (cabinetClicked) {
    envLines.push(['cabinet.door', 'open']);
    envLines.push(['cabinet.relations', '[near(table)]']);
  }
  if (anyClicked) envLines.push(['evidence_ptr', 'frame_0042.png · depth_0042.png']);

  const fileLines: Record<FileId, [string, string][]> = {
    sessions: [
      ['session_id', 'sess-0142'],
      ['goal', 'put(cup, inside(cabinet))'],
      ['skillruntime', 'policy-skill-runtime'],
      ['target', 'franka-tabletop'],
      ['preconditions', '[cabinet.door == open]'],
      ['acceptance', 'cup.position == inside(cabinet)'],
      ['lifecycle.state', 'running'],
    ],
    skillruntime: [
      ['type', 'PolicySkillRuntime'],
      ['requires_obs', '[rgb, depth, proprio]'],
      ['produces_action', 'ee_pose_delta @ 10Hz'],
      ['orchestration', 'policy-driven loop'],
      ['adapter_req', 'PolicyAdapter + ActionBridge'],
    ],
    targets: [
      ['type', 'robot-arm (franka)'],
      ['capabilities', '[rgb, depth, joint_pos, ee_pose]'],
      ['constraints', 'workspace_box · e-stop ready'],
      ['control', 'joint_pos / ee_pose @ 10Hz'],
    ],
    environment: envLines.length > 0 ? envLines : [['(尚未点击场景物体)', '']],
    lessons: [
      ['lesson-003.failure', 'grasp closed empty'],
      ['lesson-003.cause', 'perception offset'],
      ['lesson-003.correction', 're-align before close'],
      ['lesson-003.verified_by_replan', 'true'],
    ],
  };

  let tone: '' | 'good' | 'bad' | 'info' = 'info';
  let msg =
    'Step A：点击场景里的杯子和柜门。协议里不会出现像素——只有结构化的实体、属性、关系和指向原始观测的证据指针。';
  if (step === 'A' && anyClicked) {
    tone = 'good';
    msg =
      '结构化完成：Agent 可以直接推理「cup 在桌上、柜门开着」，而原始像素仍留在感知层——协议只保存任务相关语义。切到 Step B 看这些字段如何进入五份文档。';
  }
  if (step === 'B') {
    tone = 'info';
    msg = `当前视图：${activeFile.name} —— ${activeFile.role}。切换文件时注意：goal 引用 cup 与 cabinet，ENVIRONMENT 提供它们的状态，LESSONS 保存上次的教训——五份文件读的是同一个世界。`;
  }

  return (
    <div className="lab pv-lab">
      <div className="lab-controls lab-controls-top">
        <div className="lab-choice-group">
          <button
            type="button"
            className={`lab-chip ${step === 'A' ? 'is-active' : ''}`}
            onClick={() => setStep('A')}
          >
            Step A · 原始观测 → 结构化状态
          </button>
          <button
            type="button"
            className={`lab-chip ${step === 'B' ? 'is-active' : ''}`}
            onClick={() => setStep('B')}
          >
            Step B · 同一状态 → 五份协议
          </button>
        </div>
      </div>

      {step === 'A' ? (
        <div className="pv-stepA">
          <div className="lab-stage">
            <svg viewBox="0 0 720 240" role="img" aria-label="点击场景中的杯子和柜门生成结构化状态">
              {/* 感知输入提示 */}
              <g>
                {['RGB', 'Depth', 'Proprio'].map((m, i) => (
                  <g key={m}>
                    <rect x={26 + i * 92} y={18} width={80} height={26} rx={13} fill="#eef3fb" stroke="#d7deea" />
                    <text x={66 + i * 92} y={35} textAnchor="middle" fontSize={11.5} fill="#27446e" fontWeight={600}>
                      {m}
                    </text>
                  </g>
                ))}
                <text x={340} y={35} fontSize={11.5} fill="#68778f">
                  → Perception Pipeline → 结构化语义
                </text>
              </g>

              {/* 桌面 */}
              <rect x={30} y={180} width={300} height={12} rx={6} fill="#b8c9a7" />
              <rect x={390} y={92} width={290} height={100} rx={6} fill="none" stroke="#9fb0c8" strokeWidth={2.4} />
              {/* 柜门（开） */}
              <g
                className="pv-clickable"
                onClick={() => setCabinetClicked(true)}
                tabIndex={0}
                role="button"
                aria-label="点击柜门"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setCabinetClicked(true);
                  }
                }}
              >
                <rect x={396} y={98} width={110} height={88} rx={4} fill="#e7ddc8" stroke="#92400e" strokeWidth={2} className={cabinetClicked ? 'is-hit' : ''} />
                <text x={451} y={148} textAnchor="middle" fontSize={13} fill="#92400e" fontWeight={600}>
                  柜门 open
                </text>
                <text x={451} y={166} textAnchor="middle" fontSize={10.5} fill="#92400e" opacity={0.75}>
                  {cabinetClicked ? '✓ 已写入' : '点击我'}
                </text>
              </g>
              {/* 杯子（桌上） */}
              <g
                className="pv-clickable"
                onClick={() => setCupClicked(true)}
                tabIndex={0}
                role="button"
                aria-label="点击杯子"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setCupClicked(true);
                  }
                }}
              >
                <rect x={150} y={138} width={34} height={42} rx={5} fill="#fdf6ea" stroke="#92400e" strokeWidth={2.4} className={cupClicked ? 'is-hit' : ''} />
                <path d="M 184 148 q 14 2 0 20" fill="none" stroke="#92400e" strokeWidth={2.4} />
                <text x={167} y={132} textAnchor="middle" fontSize={11} fill="#68778f">
                  {cupClicked ? '✓ 已写入' : '点击杯子'}
                </text>
              </g>
              <text x={30} y={224} fontSize={11.5} fill="#68778f">
                原始像素留在感知层——协议只接收 entity / attribute / relation / state_change。
              </text>
            </svg>
          </div>

          <div className="pv-env-output">
            <div className="lab-protocol-window">
              <div className="lab-protocol-head">
                <span className="lab-protocol-dot" aria-hidden />
                <span className="lab-protocol-title">ENVIRONMENT.md · 实时生成</span>
              </div>
              <div className="lab-protocol-body">
                {envLines.length === 0 ? (
                  <div className="lab-protocol-line">
                    <span className="lab-protocol-key"># 等待点击场景中的物体…</span>
                  </div>
                ) : (
                  envLines.map(([k, v]) => (
                    <div className="lab-protocol-line" key={k}>
                      <span className="lab-protocol-key">{k}:</span>
                      <span className="lab-protocol-val">{v}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="pv-stepB">
          {/* 统一状态空间高亮条 */}
          <div className="pv-state-space" role="group" aria-label="统一认知状态空间">
            <span className="pv-ss-label">统一认知状态空间：</span>
            {['Goal', 'Runtime', 'Target', 'Environment', 'Memory'].map((n) => (
              <span key={n} className={`pv-ss-node ${activeFile.node === n ? 'is-hot' : ''}`}>
                {n}
              </span>
            ))}
          </div>

          <div className="lab-protocol-tabs" role="tablist" aria-label="协议文档">
            {FILES.map((f) => (
              <button
                type="button"
                key={f.id}
                role="tab"
                aria-selected={file === f.id}
                className={`lab-file-tab ${file === f.id ? 'is-active' : ''}`}
                onClick={() => setFile(f.id)}
              >
                <span className="lab-file-icon" aria-hidden>
                  {f.icon}
                </span>
                <span className="lab-file-name">{f.name}</span>
              </button>
            ))}
          </div>

          <div className="lab-protocol-window" key={file}>
            <div className="lab-protocol-head">
              <span className="lab-protocol-dot" aria-hidden />
              <span className="lab-protocol-title">{activeFile.name}</span>
              <span className="pv-file-role">{activeFile.role}</span>
            </div>
            <div className="lab-protocol-body">
              {fileLines[file].map(([k, v], i) => (
                <div className="lab-protocol-line" key={`${k}-${i}`}>
                  <span className="lab-protocol-key">{k ? `${k}:` : ''}</span>
                  <span className="lab-protocol-val">{v}</span>
                </div>
              ))}
            </div>
            <div className="lab-protocol-foot">
              <span className="lab-protocol-foot-label">shared state</span>
              同一份场景状态（cup · cabinet · franka）被五个视图分别引用——不是五份孤立文档。
            </div>
          </div>
        </div>
      )}

      <Feedback tone={tone}>{msg}</Feedback>
    </div>
  );
};

export default ProtocolViews;
