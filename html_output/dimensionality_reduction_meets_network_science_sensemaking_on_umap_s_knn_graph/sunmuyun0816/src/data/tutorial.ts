import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: "Dimensionality Reduction Meets Network Science: Sensemaking on UMAP's kNN Graph",
    titleZh: "降维遇见网络科学：基于 UMAP kNN 图的数据理解",
    venue: "arXiv:2607.08746 · 2026",
    authors: "Duen Horng (Polo) Chau · Donghao Ren · Fred Hohman · Dominik Moritz",
    affiliation: "Apple",
    domain: "降维可视化 · 图分析 · 网络科学",
    coreProblem: "常见工作流只保留 UMAP 的二维散点图，却忽略了投影前已经构建、仍保存高维邻接结构的 kNN 图。",
    coreInsight: `UMAP 先在高维空间构建<b>有向 kNN graph</b>，再优化出二维布局。<br /><span class="hero-insight-shift">本文的创新是：不只解释最终散点位置，也读取 kNN 图中的 <span class="hero-term" tabindex="0" data-tip="概念：递归衡量节点在整张有向图中的重要性。&#10;例子：Fashion-MNIST 中，高 PageRank 样本通常呈现更典型的服饰外观。" aria-label="PageRank。递归衡量节点在整张有向图中的重要性；例如 Fashion-MNIST 中，高 PageRank 样本通常呈现更典型的服饰外观。">PageRank</span>、<span class="hero-term" tabindex="0" data-tip="概念：按剩余入度逐层剥离节点，得到由外围到核心的层级。&#10;例子：论文筛出 bag 类中 coreness=6 的样本，用来观察大簇内部的稳定核心结构。" aria-label="in-degree k-core。按剩余入度逐层剥离节点；例如论文筛出 bag 类中 coreness 等于 6 的样本，用来观察大簇内部的稳定核心结构。">in-degree k-core</span> 与 <span class="hero-term" tabindex="0" data-tip="概念：衡量一个节点的近邻彼此连接得有多紧密。&#10;例子：digit 6 中的高值点形成笔迹一致的局部微邻域。" aria-label="clustering coefficient。衡量一个节点的近邻彼此连接得有多紧密；例如 digit 6 中的高值点形成笔迹一致的局部微邻域。">clustering coefficient</span>。</span>`,
    keywords: [
      "UMAP",
      "kNN graph",
      "PageRank",
      "in-degree k-core",
      "clustering coefficient"
    ]
  },
  hero: {
    oldMethod: {
      desc: "UMAP 生成<b>二维图</b>后，直接分析点的位置、簇形状与二维距离。",
      componentId: "trail-widget"
    },
    newMethod: {
      desc: "回到投影前的<span class=\"term-keep\">有向 <b>kNN graph</b></span>，用 PageRank、in-degree k-core 与 clustering coefficient 分析图结构。",
      componentId: "trail-widget"
    }
  },
  chapters: [
    {
      kind: "chapter",
      id: "chap-1",
      title: "二维散点图不是数据本身",
      badge: "inf",
      badgeLabel: "核心直觉",
      bridge: "UMAP 把高维数据画成二维散点图，但图上的距离和密度可能与原始数据不同。下面先看一个例子，再看看投影前的 kNN graph 保留了什么。",
      analogy: {
        title: "地图上很近，跑图却可能很远",
        text: "游戏跑图时，目标可能就在山洞另一侧。地图上看只隔一小段，但角色在洞外，必须先找到远处入口再绕进去。<b>二维位置很近，不代表原始空间中的路线也近。</b><span class=\"analogy-paper-link\"><b>对应论文：</b>地图上的直线距离相当于 UMAP 二维图中的点间距离，实际绕行路线相当于原始高维数据中的邻接结构。投影后看似靠近的点，在原始数据中未必真正相近，因此论文回到投影前的 kNN graph 检查结构。</span>",
        componentId: "trail-widget"
      },
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "论文中的 Figure 2：UMAP 二维布局丢掉了什么",
          desc: "同样数量的稀疏簇与密集簇经过 UMAP 后看起来大小相近；保持二维点位不变，再读取原始 kNN 距离，密度差异就会重新显现。",
          componentId: "figure2-guide",
          figure: "/images/what-graph.png"
        },
        {
          kind: "module",
          id: "1.2",
          title: "同一起点，两种地图",
          desc: "延续山洞跑图：只看二维位置，玩家明明离目标很近，却不知道入口在哪里；读取 kNN graph 的节点连接后，就能找到绕至洞口的路线。",
          componentId: "trail-widget"
        }
      ],
      insight: "既然失真发生在布局优化时，最稳妥的补充证据就藏在布局之前：UMAP 已经计算好的 kNN 图。",
      takeaways: [
        {
          icon: "🎯",
          title: "视图不等于结构",
          desc: "二维位置经过优化，不能直接等同于高维关系。"
        },
        {
          icon: "🗺️",
          title: "保留中间产物",
          desc: "UMAP 的 kNN 图在投影前已经存在。"
        },
        {
          icon: "🔍",
          title: "互补而非替代",
          desc: "图分数补充散点图，但不承诺消除全部失真。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-2",
      title: "UMAP 的有向 kNN graph",
      badge: "inf",
      badgeLabel: "图结构基础",
      bridge: "在生成二维布局之前，UMAP 会先把原始高维样本组织成一张有向 kNN graph。先读懂图中的节点、方向、近邻数量和边权，才能理解论文为什么在同一张图上使用三种不同方法。",
      analogy: {
        title: "把高维样本整理成近邻关系网",
        text: "每个样本都是一个节点，并指向原始高维空间中最接近自己的 k 个样本。箭头表示“我选择谁做近邻”，箭头粗细表示关系强弱。",
        componentId: "trail-widget"
      },
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "先读懂 kNN graph 的四个组成部分",
          desc: "依次查看节点、方向、k 个出邻居和边权。图中的连边来自原始高维空间；示意图上的节点位置只是为了方便阅读，不是最终的二维 UMAP 坐标。",
          componentId: "trail-widget"
        },
      ],
      insight: "每个节点的出度固定为 k，但入度会随被提名次数变化；下一章先从入度线索出发，再看 PageRank 如何把来源节点的重要性递归计算进来。",
      takeaways: [
        {
          icon: "📍",
          title: "高维选邻",
          desc: "边在投影前确定，不从二维图反推。"
        },
        {
          icon: "➡️",
          title: "出度固定",
          desc: "每个点都指向 k 个近邻。"
        },
        {
          icon: "⬅️",
          title: "入度可变",
          desc: "被其他点选中的次数因节点而异。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-3",
      title: "三种图算法，回答三类问题",
      badge: "both",
      badgeLabel: "论文核心方法",
      bridge: "论文第 2 节在同一张 kNN graph 上使用三种算法：PageRank 从入度线索出发找代表点，in-degree k-core 看核心层级，clustering coefficient 找紧密局部邻域。",

      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "PageRank 的入口：先看入度，再看来源节点",
          desc: "入度越高，说明一个节点越常被其他样本选作近邻，是 PageRank 判断代表性的初步线索。但只看数量仍不够：两个节点即使入度相同，指向它们的来源节点也可能具有不同的重要性；下面的 PageRank 会把这种来源关系递归算进去。",
          componentId: "trail-widget"
        },
        {
          kind: "module",
          id: "3.2",
          title: "PageRank：寻找代表点",
          desc: "PageRank 不只统计一个节点被指向多少次，还会沿加权有向边反复传递来源节点的重要性，直到分数稳定，从而得到全局代表性排名。",
          componentId: "trail-widget"
        },
        {
          kind: "module",
          id: "3.3",
          title: "in-degree k-core：观察核心层级",
          desc: "反复移除当前入度不足的节点，得到从外围到核心的连续层级。下方先用论文风格的层级动图说明剥离过程，再用有向 kNN graph 动画观察低 coreness 节点如何淡出。",
          componentId: "trail-widget"
        },
        {
          kind: "module",
          id: "3.4",
          title: "clustering coefficient：寻找紧密邻域",
          desc: "clustering coefficient 固定一个焦点节点和它的三个近邻，逐条亮出近邻之间已有的有向连接；连接越密，局部邻域越凝聚。",
          componentId: "trail-widget"
        }
      ],
      insight: "PageRank 看全局代表性，in-degree k-core 看宏观核心层级，clustering coefficient 看微观局部凝聚；三者不能交叉替代。",
      takeaways: [
        {
          icon: "👤",
          title: "代表性",
          desc: "PageRank 给出连续的全局排名。"
        },
        {
          icon: "🪨",
          title: "核心层级",
          desc: "in-degree k-core 区分外围与核心。"
        },
        {
          icon: "🔗",
          title: "局部凝聚",
          desc: "clustering coefficient 检查近邻互连。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-4",
      title: "同一张图，读出三种结构",
      badge: "both",
      badgeLabel: "3D 结构实验台",
      bridge: "把实现部分压缩成一个关键事实：UMAP 的近邻索引与原始距离只需计算一次。下面让同一组节点依次接受 PageRank、in-degree k-core 与 clustering coefficient 分析。",
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "真实嵌入空间：连续嵌入的 3D 投影",
          desc: "本教程用 27 个服饰节点的 6 维连续特征构建有向 kNN graph，再将其中三维投影到可旋转空间。节点、近邻边和三种图分数始终来自同一份数据。",
          componentId: "graph-lab-3d"
        }
      ],
      insight: "这就是实现部分真正值得保留的内容：不重做近邻搜索，也不为三种方法各造一张图；只让 PageRank 读取边权，让 k-core 与 CC 读取同一份无权连接。",
      takeaways: [
        {
          icon: "🧭",
          title: "同一批节点",
          desc: "三种分数建立在同一张图上。"
        },
        {
          icon: "🔗",
          title: "点击近邻",
          desc: "箭头始终表示 source 到 target。"
        },
        {
          icon: "🧪",
          title: "切换读法",
          desc: "全局、层级与局部不能混用。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-5",
      title: "实验结果",
      badge: "trn",
      badgeLabel: "论文评估",
      bridge: "论文在 MNIST 与 Fashion MNIST 上将三种图指标和专门方法进行比较。结果表明：UMAP 已有的 kNN graph 本身就包含代表性、核心层级与局部凝聚信息；即使不额外运行针对每个任务设计的复杂流程，也能接近专门优化的强基线，并在部分指标上更好。",
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "PageRank：接近专门优化的代表点选择",
          desc: "PageRank 没有针对代表点距离进行专门优化，只读取 UMAP 已有的 kNN graph。下面比较它与 k-medoids 在代表性、类别平衡和下游分类上的结果。",
          componentId: "trail-widget"
        },
        {
          kind: "module",
          id: "5.2",
          title: "in-degree k-core 与 CC：揭示二维布局未直接呈现的图结构",
          desc: "in-degree k-core 与 clustering coefficient 不重复回答“属于哪个簇”，而是分别检验整体核心层级与固定节点周围的近邻互连比例。",
          componentId: "trail-widget"
        },
        {
          kind: "module",
          id: "5.3",
          title: "两个指标如何区分：宏观核心与微观邻域",
          desc: "同一个节点，两种观察尺度：左看整体核心层级，右看局部近邻互连。",
          componentId: "trail-widget"
        }
      ],
      insight: "PageRank 只复用 UMAP 已构建的 kNN graph，却能快速接近 k-medoids 的代表性与分类效果，并获得更好的类别平衡；k-core 与 CC 还读出了聚类标签没有表达的层级和微邻域信息。",
      takeaways: [
        {
          icon: "📊",
          title: "接近强基线",
          desc: "PageRank 没有优化代表点距离，仍能接近 k-medoids。"
        },
        {
          icon: "🧭",
          title: "读出额外结构",
          desc: "k-core 与 CC 回答聚类标签之外的问题。"
        },
        {
          icon: "⚠️",
          title: "结论范围",
          desc: "论文实验覆盖 MNIST 与 Fashion MNIST。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-6",
      title: "结论：二维图与 kNN graph 一起看",
      badge: "both",
      badgeLabel: "论文第 4 节",
      bridge: "论文的结论不是放弃二维散点图，而是保留生成它的 kNN graph，让位置视图与结构证据互相补充。",
      analogy: {
        title: "二维布局与 kNN graph 回答不同问题",
        text: "二维图适合观察整体形状、相对位置与簇的分布；kNN graph 保留投影前的近邻方向与连接强度，可继续分析代表点、核心层级和局部凝聚。<b>二者不是替代关系：先从二维图形成整体认识，再用 kNN graph 检查结构证据。</b>",
        componentId: "trail-widget"
      },
      modules: [],
      insight: "这套思路还可以扩展到 TriMap、PaCMAP 等同样构建 kNN graph 的降维方法；更多领域和更多图算法仍需要后续验证。",
      takeaways: [
        {
          icon: "🗺️",
          title: "二维图保留",
          desc: "继续承担直观的位置概览。"
        },
        {
          icon: "🕸️",
          title: "图结构补充",
          desc: "提供代表性、核心层级与局部凝聚。"
        },
        {
          icon: "🌐",
          title: "未来扩展",
          desc: "其他数据领域、降维图与图算法仍待研究。"
        }
      ]
    }
  ],
  bilibili: [
    {
      bvid: "BV1UCmEBQEa8",
      title: "可视化降维三巨头：快（PCA）、准（t-SNE）、狠（UMAP）",
      reason: "先建立 PCA、t-SNE 与 UMAP 的整体位置，再进入论文的投影前图视角。",
      cover: "https://i2.hdslb.com/bfs/archive/afd0d1cc8bd8739e6c0baa4bc960278a751d17cc.jpg",
      views: "1.4万播放"
    },
    {
      bvid: "BV1qB4y1p7CF",
      title: "十分钟理解Umap是什么——适合反复观看学习",
      reason: "补充 UMAP 的直觉基础，便于理解为什么投影前会先构建近邻结构。",
      cover: "https://i1.hdslb.com/bfs/archive/fe4bab9450c292650ef72033a6bbcd46c1624f71.jpg",
      views: "2.8万播放"
    },
    {
      bvid: "BV1Fv4y1G7rB",
      title: "【小萌五分钟】机器学习 | K近邻算法 KNN",
      reason: "复习近邻概念；注意视频中的 KNN 分类器与本文分析的 kNN 图不是同一对象。",
      cover: "https://i0.hdslb.com/bfs/archive/ed247782612a52c0d6d3850548b0d8e18f1b4ad5.jpg",
      views: "9.9万播放"
    },
    {
      bvid: "BV1uP411K7yN",
      title: "改变世界的谷歌PageRank算法",
      reason: "补充 PageRank 的递归中心性直觉，对应本教程第 4 章。",
      cover: "https://i1.hdslb.com/bfs/archive/ef80452a5c5ab899c5041ff69e777aa58beb5bb7.jpg",
      views: "3.9万播放"
    }
  ]
};
