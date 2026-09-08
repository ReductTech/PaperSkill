import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type GroupId = 'file' | 'code' | 'web' | 'memory' | 'human';
type Tool = {
  id: string;
  group: GroupId;
  role: string;
  boundary: string;
  authority: string;
  optimization: string;
  evidence: 'explicit' | 'role';
};

const GROUPS: { id: GroupId; label: string; purpose: string }[] = [
  { id: 'file', label: 'File Operations', purpose: '读取、精确修改、块写入' },
  { id: 'code', label: 'Code Execution', purpose: '受控执行 Python / Bash' },
  { id: 'web', label: 'Web Interaction', purpose: '低成本观察、精确网页动作' },
  { id: 'memory', label: 'Memory Management', purpose: '短期上下文维护、长期记忆蒸馏' },
  { id: 'human', label: 'Human-in-the-loop', purpose: '需要用户决策时介入' },
];

const TOOLS: Tool[] = [
  {
    id: 'file_read', group: 'file', role: '分段读取文件内容', authority: 'READ-ONLY · 只能观察，不能修改状态',
    boundary: '与 file_patch / file_write 分离：它只负责读取，不隐式写入。',
    optimization: '支持 start/count 分段、关键词锚定和行号输出，只检查相关区域。', evidence: 'explicit',
  },
  {
    id: 'file_patch', group: 'file', role: '对文本做精确局部修改', authority: 'PATCH · 受严格匹配约束的修改权限',
    boundary: 'old_content 必须唯一匹配；零匹配或多匹配立即失败，避免静默修改多个位置。',
    optimization: '精确匹配与快速失败提供更完整的反馈，减少错误修改、重复探测和后续重试。', evidence: 'explicit',
  },
  {
    id: 'file_write', group: 'file', role: '执行块级文件写入', authority: 'WRITE · 可改变文件状态',
    boundary: '承担块写入，与只读 file_read 和精确局部修改 file_patch 保持单一职责。',
    optimization: '论文 §2.3.1 未为 file_write 单列专属优化；其价值来自清晰、无重叠的写入边界。', evidence: 'role',
  },
  {
    id: 'code_run', group: 'code', role: '在受控运行时执行 Python 或 Bash', authority: 'EXECUTE · 可触发真实代码执行',
    boundary: '通用执行原语，不替代文件读取、网页观察或人工决策接口。',
    optimization: '每轮限制一次调用，强制模型先观察执行结果，再规划下一动作。', evidence: 'explicit',
  },
  {
    id: 'web_scan', group: 'web', role: '低成本读取和检查网页', authority: 'WEB READ · 观察页面，不承担精确动作',
    boundary: '负责页面观察；需要点击、输入或脚本动作时交给 web_execute_js。',
    optimization: '克隆实时 DOM，计算元素可见性，用 overlay / partition 分析区分主区与非必要区，并在序列化前删除被遮挡或隐藏元素；论文报告相对 raw DOM 可降低一个数量级的 token。', evidence: 'explicit',
  },
  {
    id: 'web_execute_js', group: 'web', role: '执行精确网页动作', authority: 'WEB CONTROL · 可触发浏览器动作',
    boundary: '只承担精确交互；页面的低成本结构化观察由 web_scan 完成。',
    optimization: '同时返回动作结果与页面变化观察，使许多流程无需再做一次完整扫描。', evidence: 'explicit',
  },
  {
    id: 'update_working_checkpoint', group: 'memory', role: '维护短期任务上下文', authority: 'CONTEXT UPDATE · 更新工作记忆状态',
    boundary: '维护当前任务的工作检查点，不负责启动长期记忆蒸馏。',
    optimization: '§2.3.1 明确其职责是 short-term context maintenance；工作记忆锚的具体注入和替换机制在 §2.3.4 展开。', evidence: 'role',
  },
  {
    id: 'start_long_term_update', group: 'memory', role: '启动长期记忆蒸馏', authority: 'MEMORY CONSOLIDATION · 触发长期更新',
    boundary: '负责长期知识巩固，与当前任务内的工作检查点维护分离。',
    optimization: '§2.3.1 只明确 long-term memory distillation 职责；验证知识如何写入分层记忆在 §2.3.2–§2.3.3 展开。', evidence: 'role',
  },
  {
    id: 'ask_user', group: 'human', role: '在需要用户决策时请求介入', authority: 'HUMAN DECISION · 不替用户作决定',
    boundary: '仅承担 human-in-the-loop 决策请求，不把不确定选择伪装成自动执行结果。',
    optimization: '论文 §2.3.1 未单列 token 优化；它补齐 intervention request，使工具闭环可控。', evidence: 'role',
  },
];

const PIPELINE = [
  ['Schema Contract', 'name · description · parameters / JSON Schema'],
  ['tool_use', '显式工具名与参数'],
  ['Unified Dispatcher', '映射本地 executor · 前后处理'],
  ['Bounded Execution', '在权限边界内执行'],
  ['Structured Output', '结果写回 Agent Loop'],
];

export const ModTools: React.FC<WidgetProps> = () => {
  const [groupId, setGroupId] = useState<GroupId>('file');
  const [toolId, setToolId] = useState('file_read');
  const selected = TOOLS.find((tool) => tool.id === toolId)!;
  const group = GROUPS.find((item) => item.id === groupId)!;

  const chooseGroup = (id: GroupId) => {
    setGroupId(id);
    setToolId(TOOLS.find((tool) => tool.group === id)!.id);
  };

  return (
    <div className="atomic-tools-explorer">
      <div className="tools-summary">
        <span><b>9</b> atomic tools</span><span><b>5</b> capability classes</span><span><b>1</b> unified dispatcher</span>
      </div>

      <div className="tool-call-pipeline" aria-label="工具声明、调用和执行路径">
        {PIPELINE.map(([title, sub], index) => (
          <React.Fragment key={title}>
            <div><b>{title}</b><small>{sub}</small></div>
            {index < PIPELINE.length - 1 ? <i>→</i> : null}
          </React.Fragment>
        ))}
      </div>
      <p className="pipeline-note">声明、调用与执行明确分离；所有交互通过 dispatcher 返回结构化输出，以提高可控性、降低风险并保留完整追踪链。</p>

      <div className="tools-workbench">
        <nav className="tool-groups" aria-label="五类工具能力">
          {GROUPS.map((item) => (
            <button key={item.id} className={groupId === item.id ? 'active' : ''} onClick={() => chooseGroup(item.id)}>
              <span>{item.label}</span><small>{item.purpose}</small><b>{TOOLS.filter((tool) => tool.group === item.id).length}</b>
            </button>
          ))}
        </nav>

        <section className="tool-inspector">
          <div className="tool-class-head"><div><small>CAPABILITY CLASS</small><h4>{group.label}</h4></div><span>{group.purpose}</span></div>
          <div className="tool-tabs">
            {TOOLS.filter((tool) => tool.group === groupId).map((tool) => (
              <button key={tool.id} className={tool.id === toolId ? 'active' : ''} onClick={() => setToolId(tool.id)}>{tool.id}</button>
            ))}
          </div>

          <div className="tool-contract-card">
            <div className="tool-contract-title"><code>{selected.id}</code><span>{selected.role}</span></div>
            <div className="tool-authority">{selected.authority}</div>
            <div className="tool-detail-grid">
              <article><small>RESPONSIBILITY BOUNDARY</small><h5>职责边界</h5><p>{selected.boundary}</p></article>
              <article className="density"><small>CONTEXT-DENSITY EFFECT</small><h5>密度优化</h5><p>{selected.optimization}</p><span className={selected.evidence}>{selected.evidence === 'explicit' ? '论文明确的工具级优化' : '职责级说明 · 论文未单列专属优化'}</span></article>
            </div>
          </div>
        </section>
      </div>

      <div className="tools-bottom-line">
        <b>为什么是九个？</b>
        <span>每个工具保持单一、不可再分且无功能重叠；复杂任务通过原语序列完成，而不是继续增加任务专用接口。</span>
      </div>
    </div>
  );
};
