import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "ExpeL: LLM Agents Are Experiential Learners",
    "titleZh": "ExpeL：大语言模型智能体如何从经验中学习",
    "venue": "AAAI 2024 · arXiv v3",
    "authors": "Andrew Zhao, Daniel Huang, Quentin Xu, Matthieu Lin, Yong-Jin Liu, Gao Huang",
    "affiliation": "清华大学",
    "domain": "智能体经验学习",
    "coreProblem": "没有模型权重访问权限时，智能体能把练习所得用到新任务吗？",
    "coreInsight": "在训练任务里积累轨迹，在新任务里同时读规则和相似的成功示范。",
    "keywords": [
      "ReAct",
      "Reflexion",
      "经验检索"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "ReAct · 固定示范",
      "desc": "做新任务时，从固定示范和当前观测出发。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "title": "ExpeL · 复用练习",
      "desc": "把练习中提炼的规则和相似成功轨迹带入新任务。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "从失败中收集经验",
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "同一道题重试，换一道题怎么办？",
          "desc": "浏览厨房练习的三种设定，对比回看、重试与跨任务复用。",
          "componentId": "baseline"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "收集成功与失败的轨迹",
          "desc": "推进练习。失败会追加轨迹，重试可读取刚生成的反思。",
          "componentId": "gather"
        }
      ],
      "scenes": [
        {
          "id": "baseline",
          "title": "同一道题重试，换一道题怎么办？",
          "goal": "当前任务的反思怎样进入下一次尝试？",
          "summary": "浏览厨房练习的三种设定，对比回看、重试与跨任务复用。",
          "interaction": "选择下一次尝试的类型，切换操作台反馈",
          "next": "收集成功与失败的轨迹",
          "notes": "§3–4，PDF 第 3–4 页。Reflexion 在同任务的重试中使用反思；ExpeL 复用训练中积累的跨任务经验。厨房轨迹为教学示例。",
          "componentId": "baseline",
          "thumbnail": "./thumbnails/baseline.jpg",
          "moduleId": "1.1"
        },
        {
          "id": "gather",
          "title": "收集成功与失败的轨迹",
          "goal": "为什么成功之后还要保留失败记录？",
          "summary": "推进练习。失败会追加轨迹，重试可读取刚生成的反思。",
          "interaction": "推进柜门寻找，改变结果标签和记忆条目",
          "next": "",
          "notes": "§4.1、算法 1，PDF 第 4、6 页。轨迹进入经验池；失败时生成反思供本题重试。成功或达到尝试上限后进入下一题。",
          "componentId": "gather",
          "thumbnail": "./thumbnails/gather.jpg",
          "moduleId": "1.2"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "写规则，找示范",
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "两种样本，提炼两类经验",
          "desc": "切换输入样本，观察失败差异和成功共性。",
          "componentId": "compare"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "用四种操作维护经验规则",
          "desc": "用 ADD、EDIT、UPVOTE、DOWNVOTE 操作一张规则卡。",
          "componentId": "vote"
        },
        {
          "kind": "module",
          "id": "2.3",
          "title": "按任务相似度召回成功轨迹",
          "desc": "改变新任务与 k，观察成功轨迹重新排名。",
          "componentId": "retrieve"
        },
        {
          "kind": "module",
          "id": "2.4",
          "title": "一次评估，把两种记忆放进提示词",
          "desc": "装入或移除两类记忆，观察一次执行前的上下文。",
          "componentId": "prompt"
        }
      ],
      "scenes": [
        {
          "id": "compare",
          "title": "两种样本，提炼两类经验",
          "goal": "什么时候该比较失败，什么时候该归纳成功？",
          "summary": "切换输入样本，观察失败差异和成功共性。",
          "interaction": "切换备菜记录组合，替换同桌样本与候选规则",
          "next": "用四种操作维护经验规则",
          "notes": "§4.2、算法 2，PDF 第 4、6 页。同题成功/失败配对用于定位偏差；跨任务成功组用于找共同做法。具体输出是示例。",
          "componentId": "compare",
          "thumbnail": "./thumbnails/compare.jpg",
          "moduleId": "2.1"
        },
        {
          "id": "vote",
          "title": "用四种操作维护经验规则",
          "goal": "一条规则如何被强化、改写或淘汰？",
          "summary": "用 ADD、EDIT、UPVOTE、DOWNVOTE 操作一张规则卡。",
          "interaction": "改写及贴移便签，改变计数和是否保留",
          "next": "按任务相似度召回成功轨迹",
          "notes": "§4.2、图 2，PDF 第 4–5 页。ADD 初始计数 2；UPVOTE 和 EDIT 各 +1，DOWNVOTE −1；计数归零移除。交互中操作由观众选择，实际由 LLM 提议。",
          "componentId": "vote",
          "thumbnail": "./thumbnails/vote.jpg",
          "moduleId": "2.2"
        },
        {
          "id": "retrieve",
          "title": "按任务相似度召回成功轨迹",
          "goal": "新任务换了，参考的示范为什么也换了？",
          "summary": "改变新任务与 k，观察成功轨迹重新排名。",
          "interaction": "选择菜单，重排食谱卡并保留前 k 条",
          "next": "一次评估，把两种记忆放进提示词",
          "notes": "§4.2–4.3、算法 3、表 4，PDF 第 4–6 页及附录 E。原文用 all-mpnet-base-v2、Faiss kNN 与任务向量内积。演示向量为手设。",
          "componentId": "retrieve",
          "thumbnail": "./thumbnails/retrieve.jpg",
          "moduleId": "2.3"
        },
        {
          "id": "prompt",
          "title": "一次评估，把两种记忆放进提示词",
          "goal": "规则和相似示范分别提供什么信息？",
          "summary": "装入或移除两类记忆，观察一次执行前的上下文。",
          "interaction": "打开或合上规则本与示范卡，改变提示内容",
          "next": "",
          "notes": "§4.3、图 3、算法 3，PDF 第 4–6 页。规则是完整列表；成功轨迹按任务相似度取 top-k 并取代固定示范。单次尝试有多步交互。",
          "componentId": "prompt",
          "thumbnail": "./thumbnails/prompt.jpg",
          "moduleId": "2.4"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "论文实验",
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "单次尝试，在三个任务上都超过 ReAct",
          "desc": "按环境对照平均成功率，理解两类记忆的互补性。",
          "componentId": "results"
        },
        {
          "kind": "module",
          "id": "3.3",
          "title": "把问答经验改写成事实核验规则",
          "desc": "切换目标示范，观察共用检索技巧如何改写。",
          "componentId": "transfer"
        }
      ],
      "scenes": [
        {
          "id": "results",
          "title": "单次尝试，在三个任务上都超过 ReAct",
          "goal": "完整 ExpeL 在哪些环境上受益？",
          "summary": "按环境对照平均成功率，理解两类记忆的互补性。",
          "interaction": "切换环境重绘原图中选定配置的均值",
          "next": "反思是重试线索，是否也适合写进规则？",
          "notes": "§5.1–5.2、图 5，PDF 第 7–8 页。四折验证，图上整数为近似读数；行动模型 gpt-3.5-turbo-0613。此页显示四个单次尝试配置。",
          "componentId": "results",
          "thumbnail": "./thumbnails/results.jpg",
          "moduleId": "3.1"
        },
        {
          "id": "ablation",
          "title": "反思是重试线索，是否也适合写进规则？",
          "goal": "为什么同一种材料在不同阶段可能有不同作用？",
          "summary": "对比 HotpotQA 的规则来源消融，观察均值及标准误。",
          "interaction": "静态比较同一评测协议的规则来源",
          "next": "把问答经验改写成事实核验规则",
          "notes": "§5.6、表 3，PDF 第 9–10 页。Insights with reflections 得分 29.0 ± 0.4，ExpeL 39.0 ± 1.7。论文提出反思幻觉的解释，未做因果隔离。",
          "componentId": "ablation",
          "thumbnail": "./thumbnails/ablation.jpg"
        },
        {
          "id": "transfer",
          "title": "把问答经验改写成事实核验规则",
          "goal": "换任务时可迁移的是规则还是旧动作？",
          "summary": "切换目标示范，观察共用检索技巧如何改写。",
          "interaction": "用新菜谱覆盖旧口令并改变改写示例",
          "next": "",
          "notes": "§4.4、§5.4、表 1，PDF 第 5、8–9 页。HotpotQA 和 FEVER 共用 Wikipedia Docstore API；迁移仅改写规则，目标任务执行用固定 few-shot。",
          "componentId": "transfer",
          "thumbnail": "./thumbnails/transfer.jpg",
          "moduleId": "3.3"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "迁移边界与持续学习",
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "工具约束变了，旧成功轨迹还能直接用吗？",
          "desc": "切换厨房约束，检查动作是否还能执行。",
          "componentId": "repair"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "记忆不断变长，提示词装得下吗？",
          "desc": "调整示例中的规则数量，观察整表注入的预算变化。",
          "componentId": "limits"
        }
      ],
      "scenes": [
        {
          "id": "repair",
          "title": "工具约束变了，旧成功轨迹还能直接用吗？",
          "goal": "怎样识别可迁移的规则与不可复用的动作？",
          "summary": "切换厨房约束，检查动作是否还能执行。",
          "interaction": "切换可用灶具，看同一示范在约束前后通过或被标记",
          "next": "记忆不断变长，提示词装得下吗？",
          "notes": "§4.4、§6，PDF 第 5、10 页。动作接口变化与反馈检测是教学延伸；原文没有测试这个厨房情形或实现动作拦截器。",
          "componentId": "repair",
          "thumbnail": "./thumbnails/repair.jpg",
          "moduleId": "4.1"
        },
        {
          "id": "limits",
          "title": "记忆不断变长，提示词装得下吗？",
          "goal": "ExpeL 离真正的持续学习还有哪些距离？",
          "summary": "调整示例中的规则数量，观察整表注入的预算变化。",
          "interaction": "推动笔记本页数并改变 token 占用条",
          "next": "",
          "notes": "§4.3、§6，PDF 第 4–5、10 页。规则表最终可能需要检索。文本观测、闭源 API 和缺少理论保证是论文局限；预算和条目长度为示例。",
          "componentId": "limits",
          "thumbnail": "./thumbnails/limits.jpg",
          "moduleId": "4.2"
        }
      ]
    }
  ],
  "thumbnails": {
    "cover": "./thumbnails/cover.jpg"
  }
};
