import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type ResourceTier = 'evidence' | 'official' | 'warning' | 'thirdparty';

type Resource = {
  id: string;
  label: string;
  tier: ResourceTier;
  source: string;
  title: string;
  description: string;
  facts: string[];
  links: Array<{ label: string; url: string }>;
};

const resources: Resource[] = [
  {
    id: 'paper',
    label: '论文证据',
    tier: 'evidence',
    source: '一手资料 · 定量结论基准',
    title: '先用论文锁定事实边界',
    description: '模型结构、公式、实验协议、指标数字、效率和局限都应回到论文核对。',
    facts: ['定量比较必须使用相同数据集与协议', 'Marble 在论文中只有定性比较', '产品演示不能替代论文表格'],
    links: [{ label: '打开 arXiv 论文', url: 'https://arxiv.org/abs/2604.14268' }],
  },
  {
    id: 'project',
    label: '项目主页',
    tier: 'official',
    source: '腾讯混元官方 · 产品与案例',
    title: '用官方案例理解输入输出',
    description: '项目页展示文本、图像、视频输入，以及 3DGS、Mesh、点云和视频等输出形式。',
    facts: ['四阶段对应 HY-Pano、WorldNav、WorldStereo、WorldMirror', '官方强调 Unity/UE 兼容与碰撞漫游', '这些是产品表述，不是新增论文指标'],
    links: [{ label: '打开项目主页', url: 'https://3d-models.hunyuan.tencent.com/world/' }],
  },
  {
    id: 'github',
    label: '代码文档',
    tier: 'official',
    source: '腾讯混元官方 · 当前开源状态',
    title: '按时间线确认真正开放的模块',
    description: '仓库从 4 月到 5 月分批开放 WorldMirror 2.0、HY-Pano 2.0、World Generation 和 WorldStereo 2.0。',
    facts: ['提供 WorldMirrorPipeline、单卡/多卡命令和 Gradio', '首次运行会从 Hugging Face 下载权重', '多 GPU 输入图像数不得少于 GPU 数'],
    links: [
      { label: '打开 GitHub', url: 'https://github.com/Tencent-Hunyuan/HY-World-2.0' },
      { label: '中文 README', url: 'https://github.com/Tencent-Hunyuan/HY-World-2.0/blob/main/README_zh.md' },
      { label: '中文使用文档', url: 'https://github.com/Tencent-Hunyuan/HY-World-2.0/blob/main/DOCUMENTATION_zh.md' },
    ],
  },
  {
    id: 'models',
    label: '模型权重',
    tier: 'official',
    source: '官方模型平台 · 下载前检查',
    title: '权重入口存在，不等于本机可直接运行',
    description: '先确认子模型、权重体积、GPU/显存、CUDA/PyTorch 版本和本地存储空间。',
    facts: ['Hugging Face 是仓库默认自动下载来源', 'ModelScope 提供国内模型入口', '代码版本与权重版本需要保持匹配'],
    links: [
      { label: 'Hugging Face', url: 'https://huggingface.co/tencent/HY-World-2.0' },
      { label: 'ModelScope', url: 'https://modelscope.cn/models/Tencent-Hunyuan/HY-World-2.0' },
    ],
  },
  {
    id: 'demo',
    label: '在线体验',
    tier: 'warning',
    source: '腾讯混元官方产品 · 需要登录',
    title: '把产品体验与论文实验分开',
    description: '当前未登录访问会进入腾讯混元 3D 登录页，需要登录后才能创建。',
    facts: ['账号权限和排队状态可能变化', '产品参数可能不同于论文实验设置', '体验结果只能说明当前产品行为'],
    links: [{ label: '打开体验页', url: 'https://3d.hunyuan.tencent.com/sceneTo3D' }],
  },
  {
    id: 'license',
    label: '许可证',
    tier: 'warning',
    source: '官方法律文件 · 使用前必读',
    title: '这不是标准宽松开源许可证',
    description: 'Tencent HY-WORLD 2.0 Community License 含地域、规模、分发和模型用途限制。',
    facts: ['适用地域排除欧盟、英国和韩国', '特定月活超过 100 万的主体需另行申请许可', '输出权利与模型再分发是不同问题'],
    links: [{ label: '阅读许可证全文', url: 'https://github.com/Tencent-Hunyuan/HY-World-2.0/blob/main/License.txt' }],
  },
  {
    id: 'zhihu',
    label: '中文解读',
    tier: 'thirdparty',
    source: '第三方文章 · 只补充直觉',
    title: '借用讲解视角，但不借用事实权威',
    description: '两篇知乎文章分别偏技术链路和应用总览；个人体验、宣传性措辞和外部比较都要回到一手资料复核。',
    facts: ['微卷的大白：生成辅助重建的技术拆解', 'Loster：3D 世界系统与应用导览', '第三方文章不作为公式、数字和结论的证据源'],
    links: [
      { label: '生成辅助重建解读', url: 'https://zhuanlan.zhihu.com/p/2028273802144936616' },
      { label: '3D 世界系统解读', url: 'https://zhuanlan.zhihu.com/p/2028634721966367663' },
    ],
  },
];

const tierLabels: Record<ResourceTier, string> = {
  evidence: '论文证据',
  official: '官方现状',
  warning: '使用约束',
  thirdparty: '第三方解读',
};

export const HyResources: React.FC<WidgetProps> = () => {
  const [activeId, setActiveId] = useState('paper');
  const active = resources.find((item) => item.id === activeId) ?? resources[0];

  return (
    <div className="resource-navigator">
      <div className="resource-track" aria-label="资料核验路径">
        {resources.map((item, index) => (
          <button
            key={item.id}
            className={`resource-stop ${item.id === activeId ? 'selected' : ''}`}
            onClick={() => setActiveId(item.id)}
            aria-pressed={item.id === activeId}
          >
            <span className="resource-index">{index + 1}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className={`resource-detail resource-tier-${active.tier}`} aria-live="polite">
        <div className="resource-detail-head">
          <span className="resource-tier-label">{tierLabels[active.tier]}</span>
          <span className="resource-source">{active.source}</span>
        </div>
        <h5>{active.title}</h5>
        <p>{active.description}</p>
        <ul className="resource-facts">
          {active.facts.map((fact) => <li key={fact}>{fact}</li>)}
        </ul>
        <div className="resource-links">
          {active.links.map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
              {link.label} <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </div>

      <div className="resource-release-timeline" aria-label="官方开放时间线">
        <strong>官方开放进度</strong>
        <span><b>04-16</b> 报告、部分代码与 WorldMirror 2.0</span>
        <span><b>05-11</b> HY-Pano 2.0</span>
        <span><b>05-18</b> World Generation 与 WorldStereo 2.0</span>
      </div>

      <div className="feedback good">
        判断口诀：数字看论文，开放状态看 GitHub，产品能力看官网，能否使用先看许可证，中文文章只补充理解。
      </div>
    </div>
  );
};
