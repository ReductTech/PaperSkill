export type FrameworkGroup = 'general' | 'multi' | 'visual' | 'code' | 'official';

export interface FrameworkRecord {
  id: string;
  name: string;
  short: string;
  created: string;
  focus: string;
  group: FrameworkGroup;
  logo: string;
  stars: number;
  contributors: number;
  density: number;
}

export const groupLabels: Record<FrameworkGroup, string> = {
  general: '通用应用与企业编排',
  multi: '自主与多智能体协作',
  visual: '可视化与状态图编排',
  code: '类型安全与代码优先',
  official: '厂商官方开发工具',
};

export const frameworks: FrameworkRecord[] = [
  { id: 'langchain', name: 'LangChain', short: 'LangChain', created: '2022.10', focus: '通用 LLM 应用框架', group: 'general', logo: '/images/frameworks/langchain.png', stars: 130000, contributors: 5362, density: 41.2 },
  { id: 'semantic-kernel', name: 'Semantic Kernel', short: 'Semantic', created: '2023.02', focus: '企业级 .NET / Python SDK', group: 'general', logo: '/images/frameworks/microsoft.png', stars: 27437, contributors: 618, density: 22.5 },
  { id: 'agent-framework', name: 'Microsoft Agent Framework', short: 'Agent FW', created: '2025.04', focus: '微软统一 Agent 框架', group: 'general', logo: '/images/frameworks/microsoft.png', stars: 7872, contributors: 204, density: 25.9 },
  { id: 'autogpt', name: 'AutoGPT', short: 'AutoGPT', created: '2023.03', focus: '自主 Agent 循环平台', group: 'multi', logo: '/images/frameworks/autogpt.png', stars: 182405, contributors: 1716, density: 9.4 },
  { id: 'metagpt', name: 'MetaGPT', short: 'MetaGPT', created: '2023.06', focus: 'SOP 驱动的多角色协作', group: 'multi', logo: '/images/frameworks/metagpt.png', stars: 65424, contributors: 257, density: 3.9 },
  { id: 'autogen', name: 'AutoGen', short: 'AutoGen', created: '2023.08', focus: '对话式多智能体框架', group: 'multi', logo: '/images/frameworks/microsoft.png', stars: 55842, contributors: 869, density: 15.6 },
  { id: 'crewai', name: 'CrewAI', short: 'CrewAI', created: '2023.10', focus: '基于角色的任务编排', group: 'multi', logo: '/images/frameworks/crewai.png', stars: 46105, contributors: 645, density: 14.0 },
  { id: 'agentscope', name: 'AgentScope', short: 'AgentScope', created: '2024.01', focus: '强调容错的多智能体平台', group: 'multi', logo: '/images/frameworks/agentscope.png', stars: 18027, contributors: 145, density: 8.0 },
  { id: 'langflow', name: 'LangFlow', short: 'LangFlow', created: '2023.02', focus: '低代码可视化 RAG / Agent 构建', group: 'visual', logo: '/images/frameworks/langflow.png', stars: 146655, contributors: 707, density: 4.8 },
  { id: 'langgraph', name: 'LangGraph', short: 'LangGraph', created: '2023.08', focus: '有状态多参与者图编排', group: 'visual', logo: '/images/frameworks/langchain.png', stars: 26295, contributors: 607, density: 23.1 },
  { id: 'pydantic-ai', name: 'Pydantic-AI', short: 'Pydantic', created: '2024.06', focus: '类型安全与结构化输出', group: 'code', logo: '/images/frameworks/pydantic.png', stars: 15950, contributors: 675, density: 42.3 },
  { id: 'mastra', name: 'Mastra', short: 'Mastra', created: '2024.08', focus: 'TypeScript 原生 Agent / 工作流', group: 'code', logo: '/images/frameworks/mastra.png', stars: 21931, contributors: 484, density: 22.1 },
  { id: 'smolagents', name: 'smolagents', short: 'smolagents', created: '2024.12', focus: '轻量代码优先 Agent 框架', group: 'official', logo: '/images/frameworks/huggingface.png', stars: 25940, contributors: 395, density: 15.2 },
  { id: 'openai-agents', name: 'OpenAI Agents', short: 'OpenAI', created: '2025.03', focus: 'OpenAI 官方 Python SDK', group: 'official', logo: '/images/frameworks/openai.png', stars: 19699, contributors: 438, density: 22.2 },
  { id: 'google-adk', name: 'Google ADK', short: 'Google ADK', created: '2025.04', focus: 'Google Agent 开发工具包', group: 'official', logo: '/images/frameworks/google.png', stars: 18460, contributors: 621, density: 33.6 },
];

export interface CrossEdge {
  a: string;
  b: string;
  count: number;
}

export const crossEdges: CrossEdge[] = [
  { a: 'langchain', b: 'pydantic-ai', count: 48 },
  { a: 'langchain', b: 'langflow', count: 48 },
  { a: 'langchain', b: 'autogen', count: 45 },
  { a: 'langchain', b: 'autogpt', count: 41 },
  { a: 'langchain', b: 'crewai', count: 38 },
  { a: 'langchain', b: 'semantic-kernel', count: 18 },
  { a: 'langchain', b: 'google-adk', count: 17 },
  { a: 'langchain', b: 'smolagents', count: 16 },
  { a: 'langchain', b: 'openai-agents', count: 13 },
  { a: 'autogen', b: 'crewai', count: 12 },
  { a: 'autogen', b: 'langgraph', count: 9 },
  { a: 'langchain', b: 'metagpt', count: 9 },
  { a: 'langgraph', b: 'crewai', count: 7 },
  { a: 'langchain', b: 'mastra', count: 7 },
  { a: 'autogpt', b: 'autogen', count: 7 },
  { a: 'autogen', b: 'pydantic-ai', count: 6 },
  { a: 'autogen', b: 'google-adk', count: 6 },
  { a: 'pydantic-ai', b: 'smolagents', count: 6 },
  { a: 'langchain', b: 'agentscope', count: 5 },
  { a: 'google-adk', b: 'openai-agents', count: 5 },
];

export interface RetentionCase {
  id: string;
  label: string;
  color: string;
  cohort: number;
  parentAffiliation: string;
  headline: string;
  interpretation: string;
}

export const retentionCases: RetentionCase[] = [
  {
    id: 'autogpt',
    label: 'AutoGPT',
    color: '#d97706',
    cohort: 431,
    parentAffiliation: '1.0%',
    headline: 'Day 30 约 30%，Day 360 仍低于 35%',
    interpretation: 'AutoGPT 的累计 Star 数位居样本第一，但 Day 30 留存约 30%、Day 360 仍低于 35%，说明病毒式关注没有转化为持续贡献，Star 最高也不能单独证明生态健康。',
  },
  {
    id: 'langchain',
    label: 'LangChain',
    color: '#db2777',
    cohort: 569,
    parentAffiliation: '1.2%',
    headline: '一年后约 45%，但早期队列规模最大',
    interpretation: '在极少母组织关联的情况下维持大队列，更接近依赖驱动的持续参与。',
  },
  {
    id: 'pydantic-ai',
    label: 'Pydantic-AI',
    color: '#7c3aed',
    cohort: 33,
    parentAffiliation: '14.8%',
    headline: '留存 63.6%，早期队列为 33 人',
    interpretation: '高密度与较高留存共同指向规模较小但生产导向明确的贡献群体。',
  },
  {
    id: 'agent-framework',
    label: 'Microsoft Agent Framework',
    color: '#d97706',
    cohort: 80,
    parentAffiliation: '58.4%',
    headline: 'Day 150 达 69%',
    interpretation: '高留存与高度微软关联并存，更像组织化工程投入，不能直接等同于自然社区黏性。',
  },
  {
    id: 'semantic-kernel',
    label: 'Semantic Kernel',
    color: '#c43f52',
    cohort: 210,
    parentAffiliation: '41.6%',
    headline: 'Day 360 达 68%',
    interpretation: '高留存同样受到母组织贡献者集中度影响，需要结合组织背景解释。',
  },
];
