import { useEffect, useState, type ReactNode } from "react";
import SideNav from "./components/SideNav";
import Hero from "./components/Hero";
import Act from "./components/Act";
import Math from "./components/Math";
import BabelLab from "./widgets/BabelLab";
import LegoBuilder from "./widgets/LegoBuilder";
import MatrixTable from "./widgets/MatrixTable";
import FormulaSwitch from "./widgets/FormulaSwitch";
import HeadTheater from "./widgets/HeadTheater";
import ForgettingLab from "./widgets/ForgettingLab";
import ServerClient from "./widgets/ServerClient";
import ResultsLab from "./widgets/ResultsLab";
import ContractFlow from "./widgets/ContractFlow";
import YamlMixer from "./widgets/YamlMixer";
import { DECK_ORDER, SECTION_TITLES } from "./data/content";
import { useRevealAll } from "./lib/hooks";

export default function App() {
  const [cur, setCur] = useState(() => {
    const h = window.location.hash.replace("#", "");
    return DECK_ORDER.includes(h) ? h : "top";
  });
  const [navOpen, setNavOpen] = useState(false);
  useRevealAll(cur);

  const idx = DECK_ORDER.indexOf(cur);
  const go = (id: string) => {
    if (!DECK_ORDER.includes(id) || id === cur) return;
    setCur(id);
    window.scrollTo(0, 0);
    history.replaceState(null, "", `#${id}`);
  };
  const next = () => { if (idx < DECK_ORDER.length - 1) go(DECK_ORDER[idx + 1]); };
  const prev = () => { if (idx > 0) go(DECK_ORDER[idx - 1]); };

  /* 键盘翻页：→ / ↓ / 空格 / PageDown 下一节；焦点在滑块等控件上时不劫持 */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        next();
      } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        prev();
      }
    };
    const onHash = () => {
      const h = window.location.hash.replace("#", "");
      if (DECK_ORDER.includes(h)) go(h);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("hashchange", onHash);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  /* ================= 各节内容 ================= */
  const slides: Record<string, ReactNode> = {
    top: <Hero onStart={next} />,

    "act-01-babel": (
      <Act
        id="act-01-babel"
        n="01"
        kicker="巴比塔之痛"
        color="var(--red)"
        question="本节问题：为什么 VLA 论文之间无法直接比较？"
        title={<>VLA 研究的一座<em>巴比塔</em></>}
        thesis="同一个梦想 —— 让机器人看懂世界、听懂指令、动手做事 —— 却被割裂在互不兼容的架构、代码库和评测协议里。"
        remember={[
          "碎片化发生在三层：架构各画各的图、系统各绑各的线、评测各报各的数",
          "根因不是大家不努力，而是缺一份共同的接口约定",
          "StarVLA 的第一步：把「什么必须固定」和「什么可以自由」分开",
        ]}
      >
        <p className="prose reveal">
          每个方法都带着<strong>自己的代码库、自己的数据格式、自己的评测脚本</strong>。
          想法无法直接对比，结果无法复现。下面的小实验会自动演示一遍，也可以亲手试试。
        </p>
        <div className="reveal"><BabelLab /></div>
        <div className="frag-trio reveal">
          <div className="frag-cell" style={{ ["--fc" as string]: "var(--purple)" }}>
            <h4>架构层 · 各画各的图</h4>
            <p>自回归、并行回归、扩散、双系统…… 跨家族比较无从下手。</p>
          </div>
          <div className="frag-cell" style={{ ["--fc" as string]: "var(--blue)" }}>
            <h4>系统层 · 各绑各的线</h4>
            <p>模型、数据、训练深度耦合，换个组件约等于重写半套工程。</p>
          </div>
          <div className="frag-cell" style={{ ["--fc" as string]: "var(--green)" }}>
            <h4>评测层 · 各报各的数</h4>
            <p>基准和协议各不相同，论文之间的数字无法同台竞技。</p>
          </div>
        </div>
      </Act>
    ),

    "act-02a-contract": (
      <Act
        id="act-02a-contract"
        n="03" sub="A" subIndex={1} subCount={2}
        kicker="乐高式解法"
        color="var(--blue)"
        question="本节问题：「乐高式」到底固定了什么、放开了什么？"
        title={<>解法总纲：<em>两份契约</em></>}
        thesis="对外一份契约：原始观测进、动作块出；对内一份契约：骨干交出 hidden states、动作头接过。其余一切，皆自由。"
        remember={[
          "对外契约：forward() 与 predict_action() 都只吃部署现场的原始观测",
          "对内契约：骨干与动作头之间只交接标准化的 hidden states",
          "训练输入 = 部署输入，从根源上消灭训练/部署分布鸿沟",
        ]}
      >
        <p className="prose reveal">
          StarVLA 把系统拆成两块积木：<strong>视觉-语言骨干</strong>（看懂场景与指令）和
          <strong>动作头</strong>（把表示变成电机指令）。装配永远只有两步：先装骨干，再插动作头。
        </p>
        <div className="reveal"><ContractFlow /></div>
        <div className="contract-note reveal">
          两个入口函数：<code style={{ fontFamily: "var(--mono)", fontSize: "0.9em" }}>forward(原始观测) → 损失</code> 用于训练，
          <code style={{ fontFamily: "var(--mono)", fontSize: "0.9em" }}> predict_action(原始观测) → 动作</code> 用于推理 —— 对外契约就这两条。
        </div>
        <p className="prose reveal">
          无论骨干预训练时用什么分词、怎么切图，<strong>部署时每个模型都必须面对同样的传感器原始流</strong>
          —— 任何能吃原始观测的模型即刻兼容，无需逆向工程别人的预处理管线。
        </p>
      </Act>
    ),

    "act-02b-build": (
      <Act
        id="act-02b-build"
        n="03" sub="B" subIndex={2} subCount={2}
        kicker="乐高式解法"
        color="var(--blue)"
        question="本节问题：换一块积木，到底要动多少行代码？"
        title={<>亲手<em>拼一台</em>试试</>}
        thesis="挑一个骨干、挑一个动作头，咔哒拼上 —— 下方就是这个组合在论文里的真实成绩单。"
        remember={[
          "2 类骨干 × 4 种动作头 = 8 种合法组合，即插即用",
          "换积木只改 YAML 配置，基础设施代码 0 行改动",
          "变量被隔离后，「谁更好」才第一次成为可公平回答的问题",
        ]}
      >
        <div className="reveal"><LegoBuilder /></div>
      </Act>
    ),

    "act-02c-matrix": (
      <Act
        id="act-02c-matrix"
        n="02"
        kicker="能力总览"
        color="var(--blue)"
        question="本节问题：和现有框架摆在一起，StarVLA 多出了什么？"
        title={<>第一次把这些能力<em>凑齐</em></>}
        thesis="模块化动作头、可换骨干、世界模型支持、混合数据、共训、多基准 —— 每项能力单看都有人做，但凑齐在同一个框架里，StarVLA 是第一个。"
        remember={[
          "单点能力早有先例，难的是全部共存于同一套接口",
          "凑齐的意义：受控实验第一次成为可能，而不是又多一个代码库",
          "这也是「平台」与「方法」的分水岭",
        ]}
      >
        <div className="reveal"><MatrixTable /></div>
      </Act>
    ),

    "act-03-formula": (
      <Act
        id="act-03-formula"
        n="04"
        kicker="一个公式"
        color="var(--yellow)"
        question="本节问题：VLM 派和世界模型派，区别到底在哪？"
        title={<>所有门派，装进<em>一个公式</em></>}
        thesis={
          <>
            <Math tex="\pi(a_{t:t+k},\, y_{aux} \mid x_t, \ell)" />，<Math tex="L = L_{action} + L_{aux}" />
            —— 两大家族的全部区别，只是辅助信号 <Math tex="L_{aux}" /> 不同。
          </>
        }
        remember={[
          "统一策略式：观测 + 指令 → 动作块 + 可选辅助输出",
          "L_aux = 0 是直接策略；= 语言推理是 VLM 系；= 未来观测预测是世界模型系",
          "广义 VLA 视角：两派不是对立范式，而是同一框架下的不同归纳偏置",
        ]}
      >
        <p className="prose reveal">
          这是论文里最优雅的一笔「<strong>广义 VLA 视角</strong>」。三种范式会自动轮播，
          也可以点符号筹码看每部分的含义：
        </p>
        <div className="reveal"><FormulaSwitch /></div>
      </Act>
    ),

    "act-04-heads": (
      <Act
        id="act-04-heads"
        n="05"
        kicker="动作头剧场"
        color="var(--purple)"
        question="本节问题：四种动作头，生成动作的方式差在哪？"
        title={<>动作头剧场：<em>四种性格</em></>}
        thesis="同一骨干接上四种动作头 —— 自回归、并行回归、流匹配、双系统 —— 就覆盖了当前 VLA 文献的主要动作解码范式。"
        remember={[
          "FAST 逐 token 自回归；OFT 一个 MLP 并行回归；π 迭代去噪；GR00T 双系统分工",
          "四种推理节奏共存于同一接口 —— 连计算模式都是可替换的",
          "新增第五种范式 = 实现并注册一个新动作头，其余一律不动",
        ]}
      >
        <div className="reveal"><HeadTheater /></div>
      </Act>
    ),

    "act-05a-forget": (
      <Act
        id="act-05a-forget"
        n="07" sub="B" subIndex={2} subCount={2}
        kicker="训练配方"
        color="var(--green)"
        question="本节问题：为什么「只练动作」反而会把动作学差？"
        title={<>训练时，让模型<em>不忘本</em></>}
        thesis="只练动作，VLM 两万步内就会「忘掉」预训练的视觉语言能力；多模态共训给感知通路续命，动作反而学得更好。"
        remember={[
          "灾难性遗忘：纯动作微调几千步内冲毁预训练的感知与指令理解",
          "共训 = 每个优化步混做动作 + 视觉问答，感知通路保持梯度流通",
          "结果双赢：感知守住七成以上，操作成功率 54.7% → 73.2%",
        ]}
      >
        <p className="prose reveal">
          预训练 VLM 的看家本领是<strong>看懂图像、理解指令</strong>，但纯粹的动作微调会在几千步内冲毁它。
          滑块会自动走完两种练法的命运分叉，也可以自己动手拖：
        </p>
        <div className="reveal"><ForgettingLab /></div>
      </Act>
    ),

    "act-05b-recipes": (
      <Act
        id="act-05b-recipes"
        n="07" sub="A" subIndex={1} subCount={2}
        kicker="训练配方"
        color="var(--green)"
        question="本节问题：这些配方在工程上长什么样？"
        title={<>配方不是脚本，是<em>一行配置</em></>}
        thesis="在 StarVLA 里，行为克隆、多模态共训、跨本体混合都不是定制训练脚本，而是所有范式共享的 YAML 配置项。"
        remember={[
          "共训开关：trainer.loss_scale.vlm 一个权重控制动作/感知天平",
          "跨本体混合：datasets.vla_data.data_mix 选一份数据配方即可",
          "RL 微调在路线图上（与 RLinf 合作集成中），当前聚焦监督与共训",
        ]}
      >
        <div className="frag-quad reveal">
          <div className="frag-cell" style={{ ["--fc" as string]: "var(--green)" }}>
            <span className="code-tag">train_starvla.py</span>
            <h4>行为克隆 SFT</h4>
            <p>标准监督微调；支持冻结子模块与分组学习率（骨干和动作头可不同 LR）。</p>
          </div>
          <div className="frag-cell" style={{ ["--fc" as string]: "var(--green)" }}>
            <span className="code-tag">train_starvla_cotrain.py</span>
            <h4>多模态共训</h4>
            <p>双加载器：每个优化步各做一次动作前向与 VLM 前向，防止遗忘 —— 下一节亲眼验证。</p>
          </div>
          <div className="frag-cell" style={{ ["--fc" as string]: "var(--green)" }}>
            <span className="code-tag">data_mix 配置</span>
            <h4>跨本体混合</h4>
            <p>按 (数据集, 权重, 机型) 三元组采样异构数据，「跨本体预训练」变成配置选择题。</p>
          </div>
          <div className="frag-cell" style={{ ["--fc" as string]: "var(--yellow)" }}>
            <span className="roadmap">路线图 · 尚未发布</span>
            <h4>RL 微调</h4>
            <p>与 RLinf 项目合作集成中；当前公开代码聚焦监督与共训管线。</p>
          </div>
        </div>
        <div className="reveal"><YamlMixer /></div>
      </Act>
    ),

    "act-06-serve": (
      <Act
        id="act-06-serve"
        n="06"
        kicker="评测部署"
        color="var(--blue)"
        question="本节问题：五个基准 + 真机，怎么用同一套接口测？"
        title={<>一套接口，<em>通吃</em>所有考场</>}
        thesis="模型躲在一个 WebSocket 策略服务器后面；仿真基准和真实机器人都只是客户端 —— 换动作头，评测代码一行不改。"
        remember={[
          "server-client 薄抽象：基准侧保留官方评测代码，模型侧统一 predict_action()",
          "基准差异收敛在轻量 adapter 里（反归一化、sticky gripper 等）",
          "仿真测过的 checkpoint 原样接上真机 —— 部署是评测的延续，不是另一套工程",
        ]}
      >
        <div className="reveal"><ServerClient /></div>
      </Act>
    ),

    "act-07-results": (
      <Act
        id="act-07-results"
        n="08"
        kicker="数据说话"
        color="var(--ink)"
        question="本节问题：束手束脚的「最朴素配方」，能打到什么水平？"
        title={<>让<em>数据</em>说话</>}
        thesis="刻意用「最朴素」的配方：不堆大规模预训练、不加数据工程 —— 仍然追平甚至超越已发表的强基线。"
        remember={[
          "LIBERO：30K 步达到 96.6%，对照 OpenVLA-OFT 用 175K 步达 97.1%",
          "通才反超专才：一个模型跨四基准，最难的 RoboCasa 反而 +3.5",
          "近线性扩展：256 卡吞吐 2200 样本/秒，效率稳定 79–80%",
        ]}
      >
        <p className="prose reveal">
          为什么故意「束手束脚」？因为<strong>最干净的基线最有价值</strong>：后来者加任何技巧，都能精确测出边际收益。
        </p>
        <div className="reveal"><ResultsLab /></div>
      </Act>
    ),

    "act-08-finale": (
      <section className="finale" id="act-08-finale">
        <div className="wrap">
          <h2>StarVLA 给社区的，<br />不是又一个模型，而是<span className="hl">一套公共底座</span>。</h2>
          <p>
            当接口被统一，想法才能被公平比较；当比较被公平，进步才能被累积。
            这就是「乐高式代码库」的真正含义。
          </p>
          <div className="recap-bricks reveal">
            <div className="recap-brick" style={{ ["--bc" as string]: "var(--blue)" }}>
              <b>两份契约</b> —— 对外统一 I/O，对内 hidden states 交接，积木自由组合
            </div>
            <div className="recap-brick" style={{ ["--bc" as string]: "var(--purple)" }}>
              <b>四种动作头 × 两类骨干</b> —— VLM 派与世界模型派首次同台公平竞技
            </div>
            <div className="recap-brick" style={{ ["--bc" as string]: "var(--green)" }}>
              <b>朴素配方 + 统一评测</b> —— 30K 步复现的强基线，五个基准一套接口
            </div>
          </div>
          <div className="footer-links">
            <a className="btn primary" href="https://github.com/starVLA/starVLA" target="_blank" rel="noreferrer">GitHub · starVLA/starVLA ↗</a>
            <a className="btn ghost" href="https://starvla.github.io" target="_blank" rel="noreferrer">项目主页 ↗</a>
          </div>
        </div>
        <div className="colophon">
          交互讲解页 · 依据论文《StarVLA: A Lego-like Codebase for Vision-Language-Action Model Developing》(arXiv:2604.05014) 制作
          <br />实验数字引自论文 Table 1 / 2 / 8 / 9 / 11 与 Figure 4；关键数字旁的 ⓘ 可查看来源与可比性
        </div>
      </section>
    ),
  };

  return (
    <>
      <SideNav cur={cur} onGo={go} open={navOpen} onClose={() => setNavOpen(false)} />

      <button className="nav-burger" onClick={() => setNavOpen(true)} aria-label="打开目录">
        ☰ 目录
      </button>

      <div className="deck">
        <main>
          {/* key = 节 id：切节即重挂载，所有入场动画与自动演示每次都会重播 */}
          <div className="deck-slide" key={cur}>
            {slides[cur]}

            <div className="deck-bar wrap">
              {idx > 0 ? (
                <button className="deck-btn prev" onClick={prev}>
                  <span className="db-k">← 上一节</span>
                  <span className="db-t">{SECTION_TITLES[DECK_ORDER[idx - 1]]}</span>
                </button>
              ) : <span />}
              <span className="deck-count">{idx + 1} / {DECK_ORDER.length}</span>
              {idx < DECK_ORDER.length - 1 ? (
                <button className="deck-btn next" onClick={next}>
                  <span className="db-k">下一节 →</span>
                  <span className="db-t">{SECTION_TITLES[DECK_ORDER[idx + 1]]}</span>
                </button>
              ) : <span />}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
