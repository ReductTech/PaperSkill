import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Feedback } from './kit';

// Lab 3.1 — System Layer Builder。
// 从「裸堆叠」开始逐项开启运行时能力，观察系统形态变化；
// 再用 ROS 对照弄清哪些能力属于 ROS、哪些属于 PhyAgentOS、哪些两者都有。

interface CapabilityDef {
  id: string;
  name: string;
  desc: string;
}

const CAPABILITIES: CapabilityDef[] = [
  { id: 'scheduling', name: 'Session 调度', desc: 'WatchdogSupervisor 认领、监督会话，处理超时与取消。' },
  { id: 'state', name: '共享状态', desc: 'State-as-a-File：跨层状态物化为可审计的协议文件。' },
  { id: 'verification', name: '语义验证', desc: 'SessionVerifier 用证据包区分「执行结束」与「任务完成」。' },
  { id: 'memory', name: '持久记忆', desc: '验证过的经验跨会话沉淀，未来规划不必从零开始。' },
  { id: 'benchmark', name: '基准评测', desc: 'Benchmark 编译成 Session，走与部署相同的执行路径。' },
  { id: 'safety', name: '分层安全', desc: '预检 → 桥接 → SafetyGuard → 心跳 → 目标端本地约束。' },
];

interface RosRowDef {
  capability: string;
  owners: ('ros' | 'paos')[];
  note: string;
}

const ROS_ROWS: RosRowDef[] = [
  { capability: '节点通信 / 发布订阅', owners: ['ros'], note: 'ROS 的核心职责：消息在节点之间可靠流转。' },
  { capability: '硬件抽象', owners: ['ros'], note: '统一驱动与消息格式，屏蔽具体设备差异。' },
  { capability: '任务级语义验证', owners: ['paos'], note: 'ROS 不回答「任务是否完成」——这是 SessionVerifier 的职责。' },
  { capability: '跨会话长期记忆', owners: ['paos'], note: 'ROS 没有持久经验层；KNOWLEDGE/LESSONS 属于 PhyAgentOS。' },
  { capability: '会话生命周期治理', owners: ['paos'], note: '认领、预检、心跳、取证与写回，ROS 均不提供。' },
  { capability: '执行器高频控制', owners: ['ros'], note: '实时控制仍在本地控制环里——两层都不越界。' },
];

export const OSLayerBuilder: React.FC<WidgetProps> = () => {
  const [on, setOn] = useState<Record<string, boolean>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const count = CAPABILITIES.filter((c) => on[c.id]).length;
  const complete = count === CAPABILITIES.length;

  const toggle = (id: string) => setOn((prev) => ({ ...prev, [id]: !prev[id] }));
  const revealAll = () => {
    const next: Record<number, boolean> = {};
    ROS_ROWS.forEach((_, i) => (next[i] = true));
    setRevealed(next);
  };

  let tone: '' | 'good' | 'bad' | 'info' = 'info';
  let msg = '逐项开启运行时能力，观察中间层如何长出来——然后再做 ROS 对照。';
  if (count === 0) {
    tone = 'bad';
    msg = '裸堆叠：Agent 直接调用机器人 SDK。返回码被当成任务完成、失败经验被丢弃、没有监督与安全边界——这正是第 1、2 章的缺口。';
  } else if (!complete) {
    tone = '';
    msg = `已开启 ${count}/6 项能力。每开启一项，Agent 与硬件之间就多一类系统保证——试着把它们全部打开。`;
  } else {
    tone = 'good';
    msg = '完整形态：Agent Plane → PhyAgentOS → Policy / Target。这就是论文标题里「OS」的含义：一层运行时平台，不是新的神经网络。';
  }

  return (
    <div className="lab osb-lab">
      <div className="osb-stack" aria-live="polite">
        {/* 顶层：Agent Plane */}
        <div className="osb-plane osb-plane-agent">
          <b>Agent Plane</b>
          <span>理解任务 · 规划目标 · 选择 SkillRuntime 与 Target · 依据验证结果重规划</span>
        </div>

        {/* 中层：PhyAgentOS（随开关生长） */}
        {count === 0 ? (
          <div className="osb-missing">
            <span className="osb-missing-arrow" aria-hidden>
              ⚠ 直接调用
            </span>
            <div className="osb-missing-box">
              <b>无运行时层</b>
              <span>Agent → 直接 import 机器人 SDK → 电机命令</span>
              <div className="osb-missing-risks">
                <i>返回码 = 任务完成</i>
                <i>经验随会话丢弃</i>
                <i>无监督 · 无安全边界</i>
              </div>
            </div>
          </div>
        ) : (
          <div className={`osb-os ${complete ? 'is-complete' : ''}`}>
            <div className="osb-os-head">
              <b>PhyAgentOS</b>
              <span className="osb-os-count">
                {count}/6 · {complete ? '完整运行时' : '能力逐步装配中'}
              </span>
            </div>
            <div className="osb-os-services">
              {CAPABILITIES.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  className={`osb-service ${on[c.id] ? 'is-on' : ''}`}
                  onClick={() => toggle(c.id)}
                  title={c.desc}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <div className="osb-os-desc">{CAPABILITIES.filter((c) => on[c.id]).map((c) => c.desc)[count - 1]}</div>
          </div>
        )}

        {/* 底层：Policy / Target */}
        <div className="osb-plane osb-plane-target">
          <b>Policy / Target</b>
          <span>VLA · 世界模型 · ROS / SDK / 仿真器 / 真实机器人</span>
        </div>
      </div>

      <div className="lab-controls">
        <button
          type="button"
          className="lab-btn lab-btn-primary"
          onClick={() => {
            const all: Record<string, boolean> = {};
            CAPABILITIES.forEach((c) => (all[c.id] = true));
            setOn(all);
          }}
        >
          一键开启全部能力
        </button>
        <button type="button" className="lab-btn lab-btn-ghost" onClick={() => setOn({})}>
          重置为裸堆叠
        </button>
      </div>

      {/* ROS 对照 */}
      <div className="osb-ros">
        <div className="osb-ros-head">
          <b>ROS 对照：这项能力属于谁？</b>
          <button type="button" className="lab-btn lab-btn-ghost" onClick={revealAll}>
            一次性揭示全部
          </button>
        </div>
        <div className="osb-ros-rows">
          {ROS_ROWS.map((r, i) => (
            <button
              type="button"
              key={r.capability}
              className={`osb-ros-row ${revealed[i] ? 'is-revealed' : ''}`}
              onClick={() => setRevealed((prev) => ({ ...prev, [i]: !prev[i] }))}
              aria-expanded={!!revealed[i]}
            >
              <span className="osb-ros-cap">{r.capability}</span>
              {revealed[i] ? (
                <span className="osb-ros-answer">
                  {r.owners.map((o) => (
                    <span key={o} className={`lab-pill ${o === 'ros' ? 'tone-info' : 'tone-good'}`}>
                      {o === 'ros' ? 'ROS' : 'PhyAgentOS'}
                    </span>
                  ))}
                  <em>{r.note}</em>
                </span>
              ) : (
                <span className="osb-ros-q">点击归属 →</span>
              )}
            </button>
          ))}
        </div>
        <div className="osb-ros-foot">
          结论：<b>PhyAgentOS 不替代 ROS</b>——ROS 负责通信与硬件抽象，PhyAgentOS 在其上补充任务级治理。
        </div>
      </div>

      <Feedback tone={tone}>{msg}</Feedback>
    </div>
  );
};

export default OSLayerBuilder;
