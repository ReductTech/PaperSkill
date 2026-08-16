import React from 'react';
import type { WidgetProps } from './registry';

const frameworkTypes = [
  { name: '通用与企业编排', examples: 'LangChain · Semantic Kernel' },
  { name: '自主与多智能体', examples: 'AutoGPT · AutoGen · CrewAI' },
  { name: '可视化与状态图', examples: 'LangFlow · LangGraph' },
  { name: '类型安全与代码优先', examples: 'Pydantic-AI · Mastra' },
  { name: '厂商官方工具', examples: 'OpenAI · Google ADK · smolagents' },
];

const capabilityRows = [
  {
    ability: '编排控制',
    values: ['组件与链式组合，覆盖面广', '自主循环、角色或对话驱动', '显式状态图或画布流程', '用代码与类型定义工作流', '围绕厂商模型与服务编排'],
  },
  {
    ability: '协作方式',
    values: ['提供扩展接口，协作不是唯一核心', '多角色分工与动态交互是核心', '通过节点、边和状态组织协作', '以函数、对象和类型组合协作', '提供标准化 Agent 与工具接口'],
  },
  {
    ability: '工程可靠性',
    values: ['依赖组件配置与应用层约束', '灵活性高，可预测性因框架而异', '流程可观察，状态与路径更明确', '强调验证、测试与结构化输出', '强调部署、监控和企业集成'],
  },
  {
    ability: '开发体验',
    values: ['能力丰富，抽象与学习面较宽', '围绕任务、角色或对话建模', '图式或低代码，流程更直观', '代码优先，便于重构与维护', '与官方 SDK 和云服务衔接顺畅'],
  },
  {
    ability: '生态关系',
    values: ['常作为基础层被下游项目复用', '运行时与协作协议差异较大', '通常复用通用框架的组件', '贴近 Python 或 TypeScript 工程栈', '厂商资源集中，生态耦合更强'],
  },
];

export const FrameworkComparison: React.FC<WidgetProps> = () => (
  <div className="framework-comparison">
    <div className="framework-comparison-baseline">
      <span>共同基础</span>
      <strong>均以开源代码组织模型、工具、状态与多步骤任务</strong>
    </div>

    <div className="framework-matrix-scroll">
      <table className="framework-capability-matrix">
        <thead>
          <tr>
            <th scope="col">能力维度</th>
            {frameworkTypes.map((type) => (
              <th scope="col" key={type.name}>
                <b>{type.name}</b>
                <span>{type.examples}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {capabilityRows.map((row, rowIndex) => (
            <tr key={row.ability}>
              <th scope="row"><i>{String(rowIndex + 1).padStart(2, '0')}</i>{row.ability}</th>
              {row.values.map((value, index) => <td key={frameworkTypes[index].name}>{value}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="framework-comparison-conclusion">
      <b>深层差异</b>
      <span>通用框架追求覆盖与复用；自主、多智能体框架把更多决策交给运行时，灵活但更难预测；状态图与可视化框架用显式流程增强控制；类型安全与代码优先框架把可靠性前移到开发阶段；官方工具强化部署与集成，同时增加厂商生态耦合。选型本质是在自治性、可控性、工程约束和生态绑定之间取舍。</span>
    </div>
  </div>
);

export default FrameworkComparison;
