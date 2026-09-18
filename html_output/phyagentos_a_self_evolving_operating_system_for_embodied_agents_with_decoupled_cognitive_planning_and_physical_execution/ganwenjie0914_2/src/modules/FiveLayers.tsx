import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Feedback } from './kit';

// Lab 9.2 — Five-Layer Fault Injection。
// 注入六类真实故障，观察它们分别被哪一层拦下。
// 不同错误由不同层处理：预检挡结构、桥接管转换、SafetyGuard 判可发、
// 心跳管失联、目标端保留物理最终权威——不是一个红色「Safety」大框包办一切。

interface LayerDef {
  name: string;
  icon: string;
  color: string;
  duty: string;
}

const LAYERS: LayerDef[] = [
  {
    name: 'Compatibility Preflight',
    icon: '🧾',
    color: '#27446e',
    duty: '组合是否合法？核对观测模态、动作语义、控制频率、适配器与安全配置——在触碰目标端之前拒绝。',
  },
  {
    name: 'ActionBridge',
    icon: '🔧',
    color: '#27446e',
    duty: '转换是否正确？坐标、单位、维度投影、夹爪重映射、动作块重采样——只做表示转换，不判安全。',
  },
  {
    name: 'SafetyGuard',
    icon: '🛡️',
    color: '#f07e47',
    duty: '命令是否允许执行？dtype/维度、NaN 与无穷、关节与工作空间限位、速度/加速度、时长、频率、急停状态。Reject / Safe Halt / Authorized Clamp。',
  },
  {
    name: 'Heartbeat Monitoring',
    icon: '💓',
    color: '#7c3aed',
    duty: '系统是否仍健康？Runner / 策略服务 / 目标端心跳；失联触发超时、取消传播与受控终止。',
  },
  {
    name: 'Target-local Constraints',
    icon: '⚙️',
    color: '#228d5c',
    duty: '设备最终权威：关节限位、碰撞检测、扭矩/速度限制、硬件急停——即使上面四层全部失效仍然生效。',
  },
];

interface FaultDef {
  chip: string;
  layer: number;
  code: string;
  what: string;
}

const FAULTS: FaultDef[] = [
  {
    chip: 'RGB-only Target × RGB-D Policy',
    layer: 0,
    code: 'PREFLIGHT_OBS_MISMATCH',
    what: '观测契约无交集，AdapterPlan 无法构成——会话在获得目标端访问权之前被拒绝，物理世界零成本。',
  },
  {
    chip: '坐标系不匹配（相机系 → 机体系）',
    layer: 1,
    code: 'BRIDGE_COORD_TRANSFORM',
    what: 'ActionBridge 做确定性坐标转换与单位归一：注意这是格式转换、不是放行——转换后的命令仍要继续接受 SafetyGuard 检查。',
  },
  {
    chip: '动作块里出现 NaN / Inf',
    layer: 2,
    code: 'SG_INVALID_VALUE',
    what: 'SafetyGuard 检出非法数值，整块动作被拒绝而不是被静默修复——畸形命令没有「有界投影」的意义。',
  },
  {
    chip: '关节限位 / 工作空间越界',
    layer: 2,
    code: 'SG_WS_LIMIT',
    what: 'SafetyGuard 拒绝或把指令有界投影回合法范围，附结构化违规码写入证据——安全干预因此可与策略错误区分。',
  },
  {
    chip: 'Policy Server 超时失联',
    layer: 3,
    code: 'HEARTBEAT_TIMEOUT',
    what: '心跳缺失触发超时处理与取消传播：执行路径被受控终止，未执行完的动作块同时被切断——失联的系统不能继续跑旧命令。',
  },
  {
    chip: '末端即将发生碰撞',
    layer: 4,
    code: 'LOCAL_COLLISION_ESTOP',
    what: '目标端本地约束在最靠近执行器的位置保留最终安全权威——碰撞检测与硬件急停不依赖上层任何软件仍然生效。',
  },
];

export const FiveLayers: React.FC<WidgetProps> = () => {
  const [fault, setFault] = useState(0);
  const hit = FAULTS[fault].layer;

  return (
    <div className="lab fl-lab">
      <div className="lab-controls lab-controls-top">
        <div className="lab-choice-group lab-choice-wrap">
          <span className="lab-choice-label">注入故障</span>
          {FAULTS.map((f, i) => (
            <button type="button" key={f.chip} className={`lab-chip ${fault === i ? 'is-active' : ''}`} onClick={() => setFault(i)}>
              {f.chip}
            </button>
          ))}
        </div>
      </div>

      <div className="lab-stage lab-layers-stage" key={fault}>
        <div className="lab-layers">
          {LAYERS.map((l, i) => {
            const isHit = i === hit;
            const isPassed = i < hit;
            return (
              <div
                className={`lab-layer ${isHit ? 'is-hit' : ''} ${isPassed ? 'is-passed' : ''}`}
                style={{ ['--layer-color' as string]: l.color, ['--i' as string]: i }}
                key={l.name}
              >
                <span className="lab-layer-icon" aria-hidden>{l.icon}</span>
                <div className="lab-layer-body">
                  <div className="lab-layer-name">
                    第 {i + 1} 层 · {l.name}
                    {isHit ? <span className="lab-layer-badge">拦截点</span> : null}
                    {isPassed ? <span className="lab-layer-badge is-pass">已通过</span> : null}
                  </div>
                  <div className="lab-layer-duty">{l.duty}</div>
                </div>
                <code className={`lab-layer-code ${isHit ? 'is-in' : ''}`}>{isHit ? FAULTS[fault].code : ''}</code>
              </div>
            );
          })}
        </div>
        <div className="lab-layers-why is-in">
          <b>{LAYERS[hit].name}</b>
          {FAULTS[fault].what}
        </div>
      </div>

      <Feedback tone="warn">
        每类故障由不同层处理：第 1、2 层管「合法性」与「表示」，SafetyGuard 管「可发性」，心跳管「健康」，目标端保留物理最终权威——PhyAgentOS 的安全叠加在 robot-native safety 之上，而不是替代它。
      </Feedback>
    </div>
  );
};

export default FiveLayers;
