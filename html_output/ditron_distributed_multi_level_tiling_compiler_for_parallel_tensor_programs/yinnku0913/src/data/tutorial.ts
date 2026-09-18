import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "DITRON: Distributed Multi-level Tiling Compiler for Parallel Tensor Programs",
    "titleZh": "DITRON：面向并行张量程序的分布式多级分块编译器",
    "venue": "arXiv:2605.02953v1 · 2026",
    "authors": "Size Zheng, Xuegui Zheng, Hanshi Sun, Qi Hou, Wenlei Bao, Shiyu Li, Haojie Duanmu, Jin Fang, Chenli Xue, Chenhui Huang, Yuanqiang Liu, Renze Chen, Ningxin Zheng, Dongyang Wang, Li-Wen Chang, Liqiang Lu, Yun Liang, Jidong Zhai, Xin Liu",
    "affiliation": "ByteDance Seed · 北京大学 · 清华大学 · 浙江大学 · 上海交通大学",
    "domain": "分布式系统 · 机器学习编译器 · GPU 张量程序",
    "coreProblem": "分布式大模型训练与推理中，通信已占运行时的 20%–80%，但现有栈要么不可编程（专家手工优化的库），要么只覆盖单设备或算子级 DSL，无法表达跨集群内存层次的计算通信重叠。",
    "coreInsight": "在 Triton 的 tile 模型上扩展出<b>核级 / 设备级 / 任务级</b>三级 tiling，让分块粒度对齐硬件带宽层级，再用<b>rank 相关的 tile 重排（swizzle）</b>在不改变数学的前提下让计算与通信重叠。",
    "keywords": [
      "分布式张量程序",
      "多级 tiling",
      "计算通信重叠",
      "swizzle",
      "分布式编译器"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "先算完再通信：所有 rank 从同一块 tile 起算，只有 rank 0 有数据可用，其余算力空等。",
      "componentId": "hero-old-tiles"
    },
    "newMethod": {
      "desc": "rank 相关偏移重排：每个 rank 从自己负责的 tile 起铺，计算与通信重叠，算力不再空等。",
      "componentId": "hero-new-tiles"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "通信成了新瓶颈",
      "badge": "inf",
      "badgeLabel": "问题定位",
      "bridge": "先看清问题：当通信占掉两成到八成的运行时间，再快的矩阵乘也只能干等。",
      "analogy": {
        "title": "料没到，手就只能停",
        "text": "砖就那么多，可<b>灰浆</b>一次只能送到一小块地方。手停在半空的那段时间，就是算力在等通信。",
        "componentId": "ana-ch1-tiles"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "通信占比与空等时间",
          "desc": "学习者应形成这样一个判断——只要通信占比足够高而计算与通信又串行执行，算力就必然空等，端到端时间近似等于两者相加。",
          "componentId": "m1-1-comm-share"
        }
      ],
      "insight": "既然通信占了这么大一块时间，与其把 GEMM 换得更快，不如让通信被计算盖住——这就是本文要解决的事。",
      "formula": {
        "lead": "把一次迭代的时间写出来，就能看清\"空等\"到底从哪里来。",
        "unicode": "T_total = T_compute + T_comm（串行）；T_total ≈ T_compute + (1 − hide) · T_comm（重叠），其中 hide 为被计算掩盖的通信比例。",
        "symbols": [
          {
            "sym": "T_compute",
            "desc": "单个 tile 的计算时间"
          },
          {
            "sym": "T_comm",
            "desc": "单个 tile 的通信时间"
          },
          {
            "sym": "hide",
            "desc": "被计算掩盖的通信占比，论文报告大 shape 下约 87.5%"
          },
          {
            "sym": "T_total",
            "desc": "一次迭代的端到端时间，越小越好"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "通信是新的瓶颈",
          "desc": "论文引用既有工作指出，通信可占分布式训练/推理运行时间的 20%–80%（非本文实测）。"
        },
        {
          "icon": "🔧",
          "title": "串行执行会空等",
          "desc": "计算与通信分成两个独立核串行执行时，端到端时间接近两者相加，算力被迫干等。"
        },
        {
          "icon": "✨",
          "title": "出路是重叠",
          "desc": "真正的收益来自让通信被计算盖住；论文报告大 shape 下约 87.5% 的通信延迟被掩盖。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "三级 tiling：把活按硬件分层切开",
      "badge": "inf",
      "badgeLabel": "抽象层次",
      "bridge": "要让通信藏进计算里，先得决定把活切成多大的块、对齐哪一级硬件。",
      "analogy": {
        "title": "砖要按地方大小分三档",
        "text": "远处的场地上砖最大，近处的手边砖最小。<b>细砖走高速链路，粗砖走慢速链路</b>，谁也别堵谁。",
        "componentId": "ana-ch2-tiles"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "三级硬件与三级 tile",
          "desc": "学习者应形成这样一个判断——tiling 的粒度不是随意选的，它必须与所处的硬件域匹配：核级用静态细砖驱动张量核心，设备级用 chunk 走 DMA，任务级用整算子组成 DAG。",
          "componentId": "m2-1-level-spot",
          "figure": "/images/fig-background.png"
        }
      ],
      "formula": {
        "lead": "一级 tiling 就是把一个维度切成若干块，块数由维度长度与砖的边长决定。",
        "unicode": "tiles = ⌈N / B⌉，余数 r = N mod B；当 r ≠ 0 时最后一块是裁边砖。",
        "symbols": [
          {
            "sym": "N",
            "desc": "被划分的维度长度（如序列长度或 M 维）"
          },
          {
            "sym": "B",
            "desc": "该级 tile 沿该维度的边长"
          },
          {
            "sym": "⌈N / B⌉",
            "desc": "该维度所需的 tile 数"
          },
          {
            "sym": "r",
            "desc": "余数，r ≠ 0 表示非整除分块"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "硬件分三层",
          "desc": "设备内（HBM/L2/寄存器）、机内 scale-up（NVLink、NVLink Sharp）、机间 scale-out（以太网/IB），带宽相差一个数量级。"
        },
        {
          "icon": "🔧",
          "title": "三级 tiling 对齐三级硬件",
          "desc": "核级用静态细砖驱动张量核心，设备级用 chunk 走 DMA 语义，任务级把整个负载当任务 DAG。"
        },
        {
          "icon": "✨",
          "title": "粒度不是随便选的",
          "desc": "细砖对准高速链路、粗砖对准慢速链路，选错粒度就等于把快通道浪费掉。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "关键洞察：换个起铺点，人人立刻有活干",
      "badge": "inf",
      "badgeLabel": "关键洞察",
      "bridge": "活已经分好了，可如果所有人都从第一块砖开始，除了第一个人，其他人都得等。",
      "analogy": {
        "title": "从自己跟前起铺",
        "text": "所有人从第一块砖开始，就只有一个人有活干。换个<b>起铺点</b>，每个人手边立刻都有砖可铺。",
        "componentId": "ana-ch3-tiles"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "有 / 无 swizzle 同步对比",
          "desc": "没有 swizzle 时，除进程 0 之外的所有进程都会在开头一起阻塞；<b>rank 相关偏移</b>能让每个进程的第一次计算都落在本地已经就绪的数据上。",
          "componentId": "m3-1-swizzle-compare",
          "figure": "/images/fig-swizzle-flow.png"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "gather / scatter 时间线",
          "desc": "<b>重排的方向由算子的数据流向决定</b>：计算依赖远端数据的算子要尽早发起取数（收集模式），结果要发出去的算子要优先算最远的那些砖（分发模式），选错方向等于把长途通信放在最后。",
          "componentId": "m3-2-gather-scatter"
        }
      ],
      "insight": "砖没有变、人手没有变，只要让每个进程从本地已就绪的那块开始，等待就消失了——这就是本文最关键的优化。",
      "formula": {
        "lead": "swizzle 就是给每块砖换一个执行编号，编号由一个无状态的纯函数决定。",
        "unicode": "new_pid = swizzle_func(old_pid, shape_to_swizzle, rank, world_size, block_size)；start = rank mod local_world_size",
        "symbols": [
          {
            "sym": "new_pid",
            "desc": "重排之后的 tile 编号"
          },
          {
            "sym": "old_pid",
            "desc": "重排之前的 tile 编号"
          },
          {
            "sym": "shape_to_swizzle",
            "desc": "参与重排的形状（tile 网格维度）"
          },
          {
            "sym": "rank",
            "desc": "当前进程编号"
          },
          {
            "sym": "world_size",
            "desc": "参与的进程总数"
          },
          {
            "sym": "local_world_size",
            "desc": "单一节点内的进程数"
          },
          {
            "sym": "block_size",
            "desc": "单个 tile 的尺寸"
          },
          {
            "sym": "start",
            "desc": "该进程的起铺 tile 编号，等于 rank mod local_world_size"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "同一批砖，换个顺序",
          "desc": "swizzle 不改变 tile 的数量与形状，只改变它们的执行编号。"
        },
        {
          "icon": "🔧",
          "title": "起铺点是关键",
          "desc": "从 tile 编号 rank mod local_world_size 开始，每个进程先算本地已就绪的数据。"
        },
        {
          "icon": "✨",
          "title": "方向由数据流决定",
          "desc": "计算依赖远端数据用收集模式，结果要发出去用分发模式。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "形状不整除：裁边砖与跨 rank 砖",
      "badge": "both",
      "badgeLabel": "形状与分块",
      "bridge": "整齐的形状只是特例；真实负载的长度几乎总要多出一点，多出来的那一块要单独处理。",
      "analogy": {
        "title": "末端那块要裁一下",
        "text": "房间的宽度不是砖的整数倍。末端那块得<b>裁窄</b>，还得让它<b>提前算</b>，不然接缝处会一直等人。",
        "componentId": "ana-ch4-tiles"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "序列长度滑块看 tile 切分",
          "desc": "只要维度长度不能整除砖边长，就会出现<b>裁边砖</b>；当同一块砖跨越进程边界时，它必须先被算完并尽早传出去，而把这类砖拖到最左侧正是论文的做法。",
          "componentId": "m4-1-tile-split"
        }
      ],
      "insight": "边砖和跨 rank 砖本来只是多出来的零头，把它们提到最左边就能从拖后腿变成最先完成。",
      "formula": {
        "lead": "非整除分块的全部后果，都能从 tile 数与余数这两个量推出来。",
        "unicode": "⌈N / B⌉ = (N + B − 1) // B，r = N mod B；r ≠ 0 ⇒ 末砖宽 r，且进程边界可能落在砖内部",
        "symbols": [
          {
            "sym": "N",
            "desc": "被划分的维度长度（如序列长度或 M 维长度）"
          },
          {
            "sym": "B",
            "desc": "单个 tile 沿该维度的边长"
          },
          {
            "sym": "⌈N / B⌉",
            "desc": "该维度所需的 tile 数"
          },
          {
            "sym": "r",
            "desc": "余数，r ≠ 0 表示非整除分块，决定裁边砖与跨 rank 砖"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "非整除是常态",
          "desc": "论文称非整除分块是 LLM 训练与推理中最常见的情况，M_per_rank = 997 就是它的示例配置。"
        },
        {
          "icon": "🔧",
          "title": "边砖要裁，跨 rank 砖要提前",
          "desc": "末砖只剩余数那么宽；被多个进程需要的砖应排到最左侧，先算先传。"
        },
        {
          "icon": "✨",
          "title": "示意计数不等于论文数值",
          "desc": "论文用 8/16/32 GPU 的图展示排法趋势，未给出具体数值，界面上的计数是由切分规则推导的示意值。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "选 AllReduce 还是 AllGather+ReduceScatter",
      "badge": "both",
      "badgeLabel": "通信选择",
      "bridge": "重排能让通信藏进计算，但能不能藏住，取决于形状给不给机会。",
      "analogy": {
        "title": "一次搬完，还是分两趟",
        "text": "砖小的时候一趟搬完最省事；砖大的时候先分两趟、让路上一直有活干反而更快。<b>选哪种取决于砖有多大</b>。",
        "componentId": "ana-ch5-tiles"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "通信方式 chips + 加速比条",
          "desc": "学习者应形成这样一个判断——同一模块里选哪种通信方式由形状决定：注意力因为 head dim 只有 128 而偏好 AllReduce，FFN 因为中间维大而可以靠 AG+RS 重叠，AllToAll 只属于 MoE 的 dispatch/combine。",
          "componentId": "m5-1-comm-choice",
          "figure": "/images/fig-covers.png"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "token 长度与翻转阈值",
          "desc": "学习者应形成这样一个判断——FFN 的通信方式选择存在一个由序列长度决定的翻转点：2k token 以下 GEMM 太短，超过 2k 之后 AG+RS 的重叠才开始占优。",
          "componentId": "m5-2-flip-curve"
        }
      ],
      "insight": "重叠不是万能的——只有计算足够长、能把通信藏住的时候，AG+RS 才划算；注意力恰好不满足这个条件。",
      "formula": {
        "lead": "把选择写成判据，就能看出翻转点是从哪里来的。",
        "unicode": "S = T_baseline / T_ditron（越大越好）；论文在 Qwen3-32B FFN 上测得：序列长度 > 2k 时 S_AG+RS 优于 S_AR（128k token 时为 1.27× vs 1.17×）",
        "symbols": [
          {
            "sym": "S",
            "desc": "相对基线的加速比，S > 1 表示更好"
          },
          {
            "sym": "tokens",
            "desc": "序列长度或 token 数"
          },
          {
            "sym": "2k",
            "desc": "论文陈述的 FFN 翻转阈值（约 2048 个 token）"
          },
          {
            "sym": "S_AG+RS / S_AR",
            "desc": "分别使用 AG+RS 与 AllReduce 时的加速比；基线为 CuBLAS+NCCL"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "没有全局最优的通信方式",
          "desc": "注意力的收效来自 AllReduce，FFN 的收效来自 AG+RS，两者由形状决定。"
        },
        {
          "icon": "🔧",
          "title": "head dim 决定注意力的选择",
          "desc": "归约维只有 128，GEMM 太短，掩盖不了 AG/RS 的延迟，所以论文在注意力上用 AllReduce。"
        },
        {
          "icon": "✨",
          "title": "FFN 有明确阈值",
          "desc": "序列长度超过 2k 之后 AG+RS 才占优；128k token 时为 1.27×，高于 AllReduce 的 1.17×。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "从 DSL 到原语：一次进场铺到底",
      "badge": "trn",
      "badgeLabel": "编译流水线",
      "bridge": "重排与融合不是运行时临时决定的，它们发生在编译流水线的固定阶段里。",
      "analogy": {
        "title": "一次进场，铺到底",
        "text": "每铺一块就出一次门、再回来，时间都花在路上了。把整条流程融成<b>一次进场</b>，手就不再空跑。",
        "componentId": "ana-ch6-tiles"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "编译流水线单步",
          "desc": "学习者应形成这样一个判断——从用户程序到 MegaKernel 是一条固定的六阶段流水线，分布式语义与单设备语义在第二阶段分道，在第五、六阶段重新合成一个常驻内核。",
          "componentId": "m6-1-pipeline-steps",
          "figure": "/images/fig-mega.png"
        }
      ],
      "formula": {
        "lead": "整条流水线可以写成一个从用户程序到 MegaKernel 的映射，每一层都只是套上一个确定的变换。",
        "unicode": "MegaKernel = CodeGen( Lower( FrontEnd(P) ) )，中端把 Swizzle 重排与重叠下降插在这条链路上；FrontEnd(P) 同时产出 TTIR/TTGIR（单设备语义）与 Distributed IR（分布式语义）",
        "symbols": [
          {
            "sym": "P",
            "desc": "用户用三级接口写的分布式张量程序"
          },
          {
            "sym": "FrontEnd",
            "desc": "前端，下沉单设备语义与分布式语义"
          },
          {
            "sym": "Swizzle",
            "desc": "中端的重排变换"
          },
          {
            "sym": "Lower",
            "desc": "后端降级到 LLVM IR 并通过 CallExtern 链接厂商 SHMEM 库"
          },
          {
            "sym": "CodeGen",
            "desc": "代码生成与任务融合，产出 MegaKernel"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "六个阶段一条线",
          "desc": "三级接口 → 前端分流 → 中端重排 → 后端降级 → 任务注册 → MegaKernel 融合。"
        },
        {
          "icon": "🔧",
          "title": "两条语义在第二步分道",
          "desc": "单设备语义走 TTIR/TTGIR，分布式语义走遵循 OpenSHMEM 的分布式中间表示。"
        },
        {
          "icon": "✨",
          "title": "融合消除启动开销",
          "desc": "通信核与计算核融合成一个常驻内核；单 batch 推理相对 Torch Eager 几何加速 6.28×（8×H800）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "让 overlap 真正生效的低层细节",
      "badge": "trn",
      "badgeLabel": "低层细节",
      "bridge": "机制再漂亮，也会被一次额外的拷贝、一次不确定的调度抹掉。",
      "analogy": {
        "title": "先把浆抹匀",
        "text": "砖放得再快，浆没抹匀就会歪。<b>低层准备动作</b>决定了整个节奏能不能连起来。",
        "componentId": "ana-ch7-tiles"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "优化开关与 straggler",
          "desc": "学习者应形成这样一个判断——即使重排已经把通信排进计算里，只要还存在离散拷贝带来的启动抖动或个别进程的迟到，重叠的收益就会被吃掉。",
          "componentId": "m7-1-lowlevel-opts"
        }
      ],
      "insight": "算法层面的重叠只是机会，真正把这机会变成时间收益的，是低层的拷贝融合、协议选择和内存序处理。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "离散拷贝会毁掉重叠",
          "desc": "论文观察到经驱动或框架 API 的 D2D 拷贝带来启动抖动与非确定的 SM 占用，制造 straggler。"
        },
        {
          "icon": "🔧",
          "title": "解决办法是融合",
          "desc": "把 D2D 拷贝融合进生成的通信或计算核，消除驱动开销，让资源调度确定下来。"
        },
        {
          "icon": "✨",
          "title": "平台差异要单独处理",
          "desc": "PCIe 不保证原子内存序，因此论文用 volatile load/store 实现软件屏障；LL 协议则面向小 batch 的低延迟场景。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "编译器架构：前端 / 中端 / 后端",
      "badge": "trn",
      "badgeLabel": "编译器架构",
      "bridge": "前面看到的每个机制，最后都要在编译器的某一层找到它的位置。",
      "analogy": {
        "title": "先立一条基准线",
        "text": "没有基准线，每块砖都得自己找平。<b>三段结构</b>就像立靠尺：前端定规矩，中端校正，后端落地。",
        "componentId": "ana-ch8-tiles"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "可交互架构图",
          "desc": "学习者应形成这样一个判断——三级接口是输入，分布式中间表示是中端的落脚点，原语与代码生成是后端出口，而 TTIR/TTGIR 只承接单设备语义，不会承接分布式语义。",
          "componentId": "m8-1-arch-map"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "数据流单步",
          "desc": "学习者应形成这样一个判断——一次 AG-GEMM 的执行被拆成 host launcher、producer 核、consumer 核三部分，重叠的兑现方式就是 producer 写对称内存后置位信号、consumer 等待并消费该信号。",
          "componentId": "m8-2-arch-flow"
        }
      ],
      "insight": "把三段结构摆出来，就能看清 swizzle 为什么住在中端，而原语与代码生成为什么必须留在后端。",
      "formula": {
        "lead": "把三段结构写成复合映射，就能看出分布式中间表示在整条链上的位置。",
        "unicode": "FrontEnd(P) → { Distributed IR（分布式原语，OpenSHMEM 语义）, TTIR/TTGIR（单设备语义） } → LLVM IR → NVSHMEM / rocSHMEM；Swizzle 属于中端，只重排 tile 的执行顺序，不产生 Distributed IR",
        "symbols": [
          {
            "sym": "P",
            "desc": "用户用三级接口写的分布式张量程序。"
          },
          {
            "sym": "FrontEnd",
            "desc": "前端，同时产出 TTIR/TTGIR（单设备语义）与 Distributed IR（分布式语义）。"
          },
          {
            "sym": "Swizzle",
            "desc": "中端重排：把 old_pid 换成 new_pid，只改变 tile 的执行顺序，不产生 Distributed IR。"
          },
          {
            "sym": "Lower",
            "desc": "后端降级到 LLVM IR，并通过 CallExtern 链接厂商 SHMEM 库。"
          },
          {
            "sym": "Distributed IR",
            "desc": "遵循 OpenSHMEM 语义的分布式中间表示，是分布式原语的落脚点。"
          },
          {
            "sym": "TTIR/TTGIR",
            "desc": "承接单设备语义的 Triton IR 两层，不承接分布式语义。"
          },
          {
            "sym": "⊕",
            "desc": "两类语义在同一后端汇合，但不是同一条通道。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "三段结构，各有归属",
          "desc": "前端管接口与语义分流，中端管 swizzle 重排，后端管原语与代码生成。"
        },
        {
          "icon": "🔧",
          "title": "分布式语义不走 TTIR/TTGIR",
          "desc": "TTIR/TTGIR 只承接 dot、load/store 这类单设备语义。"
        },
        {
          "icon": "✨",
          "title": "重叠是一条具体的执行链",
          "desc": "producer 写对称内存、置位信号，consumer 等信号并计算，这就是 AG-GEMM/GEMM-RS/GEMM-AR 的重叠落地方式。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "一套原语，多种互联与平台",
      "badge": "trn",
      "badgeLabel": "可移植性",
      "bridge": "同一套原语能不能在别人的地面上照样铺满，是这套编译器真正的检验。",
      "analogy": {
        "title": "换一种地面，接着铺",
        "text": "地面从土变成水泥，手上的活没变。<b>一套原语</b>就是那只手和那把刀：换地面只需换料，不用换手艺。",
        "componentId": "ana-ch9-tiles"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "平台切换 chips",
          "desc": "学习者应形成这样一个判断——同一套原语在不同互联与平台上都能拿到收益，但收益的量级差别很大，而且跨节点 TP 在节点数变多时可能跌破 1×。",
          "componentId": "m9-1-platform-chips"
        }
      ],
      "formula": {
        "lead": "平台之间的差别最终体现在同一个加速比公式与一次性的移植成本上。",
        "unicode": "S(platform) = T_baseline(platform) / T_ditron(platform)；移植成本 new_backend = instantiate(primitives) + codegen_rules",
        "symbols": [
          {
            "sym": "S(platform)",
            "desc": "该平台上相对基线的加速比，S > 1 表示更好。"
          },
          {
            "sym": "T_baseline",
            "desc": "基线实现在该平台上的时间（AMD 为 RocmBLAS+RCCL，其余为 CuBLAS+NCCL）。"
          },
          {
            "sym": "T_ditron",
            "desc": "DITRON 实现在该平台上的时间。"
          },
          {
            "sym": "primitives",
            "desc": "三类硬件无关原语：分布式 / SIMT / SHMEM 设备，遵循 OpenSHMEM 标准。"
          },
          {
            "sym": "codegen_rules",
            "desc": "该后端的代码生成规则，移植新后端时补充。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "一套原语覆盖多种互联",
          "desc": "分布式、SIMT、SHMEM 设备三类原语遵循 OpenSHMEM 标准，已支持 5 种以上 GPU 与 NVLink/xGMI/PCIe/IB。"
        },
        {
          "icon": "🔧",
          "title": "移植只需实例化原语",
          "desc": "新后端只要实例化原语并补充代码生成规则，上层程序不用重写。"
        },
        {
          "icon": "✨",
          "title": "收益随平台差一个量级",
          "desc": "AMD 8 卡为 2%–38%；PCIe 几何平均 8.33×；跨节点 TP 强扩展到 4 节点降到 0.61×–1.03×。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果、边界与局限",
      "badge": "both",
      "badgeLabel": "结果与边界",
      "bridge": "机制讲完了，最后用同一把靠尺验收：哪些数字成立，哪些条件下不成立。",
      "analogy": {
        "title": "同一块地面，两种铺法",
        "text": "不是一个更快的手，而是<b>同样的手换了顺序</b>。最后用靠尺验收：谁先铺满、谁更平。",
        "componentId": "ana-ch10-tiles"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "结果赛跑 + 证据表",
          "desc": "学习者应形成这样一个判断——论文的加速比来自通信被掩盖而非更快的矩阵乘，因此收益只在单卡工作量足够、batch 足够大、形状合适的条件下出现。",
          "componentId": "m10-1-result-race"
        }
      ],
      "formula": {
        "lead": "全部结果都归结为同一个比值，方向统一为越大越好。",
        "unicode": "S = T_baseline / T_ditron，论文汇总口径为 1.27 ≤ S ≤ 19.18（各负载几何平均的最小/最大值）",
        "symbols": [
          {
            "sym": "S",
            "desc": "相对基线的加速比，S > 1 表示更好。"
          },
          {
            "sym": "T_baseline",
            "desc": "基线实现的延迟（CuBLAS+NCCL，或专家手工调优的重叠库）。"
          },
          {
            "sym": "T_ditron",
            "desc": "DITRON 实现的延迟。"
          },
          {
            "sym": "1.27",
            "desc": "报告的各负载几何平均的最小值，等于 8× H800 上 GEMM-RS 相对 CuBLAS+NCCL 的几何加速。"
          },
          {
            "sym": "19.18",
            "desc": "报告的各负载几何平均的最大值，等于 8× H800 上 AllGather+MoE 的几何加速；1.27×–19.18× 是各负载几何平均的最小/最大值，不是全体负载的平均。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "结果与协议必须一起看",
          "desc": "8×H800 节点内、形状取自 LLaMA/Mixtral/GPT/Qwen/DeepSeek，相对 CuBLAS+NCCL 的几何加速区间为 1.27×–19.18×。"
        },
        {
          "icon": "🔧",
          "title": "快的是通信被掩盖，不是 GEMM",
          "desc": "论文明确其 Triton GEMM 略慢于 CuBLAS/FLUX，大 shape 下约 87.5% 的通信延迟被计算掩盖。"
        },
        {
          "icon": "✨",
          "title": "边界同样要带走",
          "desc": "batch < 128 时 vLLM 略优；跨节点 TP 到 4 节点降到 0.61×–1.03×；AG+MoE 有一个形状略慢于 COMET。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV16oZiYXEx8",
      "title": "Lecture 46 Distributed GEMM",
      "reason": "直接讲分布式 GEMM 与通信重叠的工程实践，和本文关注的 AG-GEMM / GEMM-RS 场景完全对应。",
      "cover": "https://i0.hdslb.com/bfs/archive/7c489e90b8374558e1a10339f1da3d7e835bb331.jpg",
      "views": "538播放"
    },
    {
      "bvid": "BV1zWLG6uEJf",
      "title": "【CS336 2026】Lec08-Parallelism：并行训练优化、MoE 扩展与系统瓶颈",
      "reason": "系统讲解并行策略与系统瓶颈，正好是本文要解决的“通信压过计算”这一动机。"
    },
    {
      "bvid": "BV1ZqQTYHEsi",
      "title": "大模型分布式训练 — ZeRO 零冗余优化器通信量计算",
      "reason": "把集合通信的通信量算清楚，是理解本文“通信必须被隐藏”这一前提的基础。"
    },
    {
      "bvid": "BV1JH4XzAE7s",
      "title": "面向 RISC-V 同构融合 CPU 处理器的 Triton 算子编译器设计与实践",
      "reason": "本文正是基于 Triton 的 tile 编程模型做分布式扩展，可对照理解 tile 级编译器的落地方式。"
    }
  ]
};
