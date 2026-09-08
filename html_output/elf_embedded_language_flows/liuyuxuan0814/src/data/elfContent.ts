// ELF 教程内容数据：从单 HTML 成品提取的 HTML 片段，React 组件按原样渲染，
// 引擎脚本通过 id/class 驱动这些 DOM（逻辑与视觉 100% 保真）。

// Vite 的 ?raw 导入让 HTML 片段以字符串形式进入 bundle，避免手写 JSX 导致结构漂移。
import heroHtml from './_hero.html?raw';
import sec2Html from './_sec2.html?raw';
import sec3Html from './_sec3.html?raw';
import sec4Html from './_sec4.html?raw';
import sec6Html from './_sec6.html?raw';
import sec7Html from './_sec7.html?raw';
import sec8Html from './_sec8.html?raw';
import sec9Html from './_sec9.html?raw';
import sec11Html from './_sec11.html?raw';
import sec12Html from './_sec12.html?raw';
import sec13Html from './_sec13.html?raw';
import videosHtml from './_videos.html?raw';

export const ELF_HERO_HTML = heroHtml;

/** 按论文章节顺序排列的 10 章 HTML（§1–§10）。id 与原始文件一致。 */
export const ELF_CHAPTERS: { id: string; title: string; html: string }[] = [
  { id: 'sec2', title: '§1 噪声：扩散的起点', html: sec2Html },
  { id: 'sec3', title: '§2 嵌入：把词变成坐标', html: sec3Html },
  { id: 'sec4', title: '§3 线性路径：为什么加噪是可逆的', html: sec4Html },
  { id: 'sec6', title: '§4 Flow Matching：沿速度场积分', html: sec6Html },
  { id: 'sec7', title: '§5 CFG：调节生成的"规矩度"', html: sec7Html },
  { id: 'sec8', title: '§6 采样：ODE vs SDE', html: sec8Html },
  { id: 'sec9', title: '§7 训练目标：x₀-prediction', html: sec9Html },
  { id: 'sec11', title: '§8 共享权重 + 双 loss 训练', html: sec11Html },
  { id: 'sec12', title: '§9 训练技巧：Self-cond / 采样t / 条件任务', html: sec12Html },
  { id: 'sec13', title: '§10 结果：ELF 真实成绩', html: sec13Html },
];

export const ELF_VIDEOS_HTML = videosHtml;
