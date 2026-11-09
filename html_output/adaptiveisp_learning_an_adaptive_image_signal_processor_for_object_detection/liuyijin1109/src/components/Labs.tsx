import { useState, useId } from "react";
import { ArrowRight } from "lucide-react";
import { modules, costs } from "../content";
import { Panel, Tabs, Callout, Flow, type Done } from "./Shared";

export function Scene({
  scene = 0,
  filter = "",
  boxes = false,
  label = "教学街景",
}: {
  scene?: number;
  filter?: string;
  boxes?: boolean;
  label?: string;
}) {
  const id = useId().replaceAll(":", "");
  return (
    <svg viewBox="0 0 560 300" className="scene" role="img" aria-label={label}>
      <defs>
        <pattern
          id={`noise${id}`}
          width="9"
          height="11"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="3" r=".65" fill="#da9ed6" />
          <circle cx="7" cy="8" r=".7" fill="#8ba884" />
        </pattern>
      </defs>
      <g style={{ filter }}>
        <rect
          width="560"
          height="300"
          fill={scene === 0 ? "#637282" : scene === 1 ? "#a8bdc4" : "#8caca9"}
        />
        <circle
          cx="457"
          cy="51"
          r={scene === 1 ? 30 : 14}
          fill={scene === 1 ? "#fff5d1" : "#bccbd2"}
        />
        <path
          d="M0 132V74H73V34H146V86H209V47H286V107H359V26H427V91H501V57H560V201H0Z"
          fill={scene === 0 ? "#374955" : "#738d97"}
        />
        {[28, 93, 123, 167, 240, 270, 385, 410, 531].map((x) => (
          <g key={x} fill={scene === 0 ? "#c5ad83" : "#aec9d0"}>
            <rect x={x} y="96" width="10" height="15" />
            <rect x={x} y="123" width="10" height="15" />
          </g>
        ))}
        <path d="M0 170L560 143V300H0Z" fill="#65727d" />
        <path d="M0 185L560 160" stroke="#a5afb3" strokeWidth="3" />
        <path
          d="M33 290L180 290M279 267L379 267M427 246L500 246"
          stroke="#d9d7bf"
          strokeWidth="4"
        />
        <g transform="translate(74 141)">
          <path
            d="M0 63L14 25L48 0H117L148 25L161 65Z"
            fill={scene === 2 ? "#b7a449" : "#c3a278"}
          />
          <path d="M29 25L54 6H107L132 25Z" fill="#435f6c" />
          <rect x="3" y="48" width="154" height="25" rx="7" fill="#ae8564" />
          <rect x="8" y="51" width="21" height="9" rx="3" fill="#ebdcb6" />
          <rect x="130" y="51" width="21" height="9" rx="3" fill="#ebdcb6" />
          <rect x="61" y="55" width="36" height="11" rx="2" fill="#d4d0c7" />
          <rect x="12" y="69" width="23" height="15" rx="6" fill="#34434b" />
          <rect x="127" y="69" width="23" height="15" rx="6" fill="#34434b" />
        </g>
        <g stroke="#b8c4c8" strokeWidth="4" fill="none">
          <circle cx="350" cy="224" r="28" />
          <circle cx="434" cy="224" r="28" />
          <path d="M350 224L379 180L409 224H350L372 195H422L434 224M410 171H424L419 190M369 177H389" />
        </g>
        <g fill="#2f4553">
          <circle cx="379" cy="136" r="12" />
          <path d="M373 149L391 151L414 179L403 187L383 168L372 197L361 191Z" />
          <path d="M374 188L397 212L389 218L369 204L361 224H350Z" />
        </g>
        <path
          d="M490 177V79H470"
          stroke="#455e6a"
          strokeWidth="5"
          fill="none"
        />
        <path d="M457 82L477 82" stroke="#f5dd9d" strokeWidth="5" />
        {scene === 0 && (
          <>
            <rect width="560" height="300" fill="#132632" opacity=".28" />
            <rect
              width="560"
              height="300"
              fill={`url(#noise${id})`}
              opacity=".6"
            />
          </>
        )}
        {scene === 1 && (
          <path d="M457 83L392 198H532Z" fill="#fff2bc" opacity=".12" />
        )}
        {scene === 2 && (
          <rect width="560" height="300" fill="#719d80" opacity=".15" />
        )}
      </g>
      {boxes && (
        <g fill="none" stroke="#f6ae72" strokeWidth="2">
          <rect x="69" y="134" width="172" height="98" rx="3" />
          <rect x="318" y="118" width="149" height="139" rx="3" />
          <g fill="#fff4e8" stroke="none" fontSize="13" fontFamily="sans-serif">
            <rect x="69" y="116" width="77" height="18" fill="#27446e" />
            <text x="74" y="129">
              car · 示意
            </text>
            <rect x="318" y="100" width="104" height="18" fill="#27446e" />
            <text x="323" y="113">
              bicycle · 示意
            </text>
          </g>
        </g>
      )}
      <rect
        x="12"
        y="12"
        width="112"
        height="24"
        rx="5"
        fill="#fff"
        opacity=".9"
      />
      <text x="23" y="29" fill="#27446e" fontSize="12" fontFamily="sans-serif">
        教学示意 · SVG
      </text>
    </svg>
  );
}

const scenes = ["低光 / 彩色噪声", "较大明暗差", "正常光照 / 色偏"];
export function FixedLab({ onDone }: Done) {
  const [scene, setScene] = useState(0),
    [mode, setMode] = useState(0);
  const [seen, setSeen] = useState<number[]>([]);
  const filters = [
    "brightness(2.2) saturate(1.85) contrast(1.22)",
    "brightness(1.08) saturate(.92) contrast(.97)",
    scene === 0
      ? "brightness(1.75) saturate(.5) contrast(1.08) blur(.35px)"
      : scene === 1
        ? "brightness(1.06) contrast(.82) saturate(.9)"
        : "hue-rotate(-22deg) saturate(.72) contrast(1.06)",
  ];
  return (
    <>
    <Panel title="同一种处理，适合每张图吗？">
      <div className="fixed-lab">
      <Tabs items={scenes} active={scene} set={setScene} label="选择输入场景" />
      <div className="image-pair fixed-lab-pair">
        <div>
          <span className="image-label">INPUT · 当前输入</span>
          <Scene scene={scene} />
        </div>
        <div>
          <span className="image-label">
            OUTPUT · {["A 固定强增强", "B 固定弱增强", "C 自适应处理"][mode]}
          </span>
          <Scene scene={scene} filter={filters[mode]} />
        </div>
      </div>
      <Tabs
        items={["A 固定强增强", "B 固定弱增强", "C 自适应处理"]}
        active={mode}
        label="选择 ISP 处理模式"
        set={(i) => {
          setMode(i);
          const n = [...new Set([...seen, i])];
          setSeen(n);
          if (n.length === 3) onDone();
        }}
      />
      <p className="fixed-lab-feedback" aria-live="polite">
        {mode === 0
          ? scene === 0 ? "暗部被提亮，噪声也更显眼。" : scene === 1 ? "亮部进一步变白，细节容易丢失。" : "原本明亮的画面被过度增强。"
          : mode === 1
            ? scene === 0 ? "固定的弱处理仍难看清暗部。" : scene === 1 ? "亮暗差仍较明显。" : "正常光照下，弱处理更克制。"
            : scene === 0 ? "低光输入采用提亮与轻度平滑。" : scene === 1 ? "明暗差较大时，压低对比。" : "有色偏时，调整色彩而少改亮度。"}
      </p>
      </div>
    </Panel>
    <SmoothingLab />
    </>
  );
}

const roadNoise = Array.from({ length: 340 }, (_, i) => ({
  x: (i * 173 + (i * i * 19) % 71) % 720,
  y: (i * 97 + (i * i * 11) % 53) % 400,
  r: i % 5 === 0 ? 1.1 : .65,
  color: i % 3 === 0 ? "#b59db5" : i % 3 === 1 ? "#9bb5a4" : "#bcc8d3",
}));

function SmoothingLab() {
  const [strength, setStrength] = useState(0);
  const id = useId().replaceAll(":", "");
  const blur = strength * .042;
  return (
    <Panel title="好看的图像，更容易检测吗？">
      <div className="smoothing-lab">
        <svg className="smoothing-road" viewBox="0 0 720 400" role="img" aria-label={`夜间道路与小自行车，平滑处理强度 ${strength}%`}>
          <defs>
            <linearGradient id={`${id}-sky`} x2="0" y2="1">
              <stop stopColor="#152738" />
              <stop offset="1" stopColor="#425466" />
            </linearGradient>
            <linearGradient id={`${id}-road`} x2="0" y2="1">
              <stop stopColor="#4a5462" />
              <stop offset="1" stopColor="#263440" />
            </linearGradient>
            <filter id={`${id}-smooth`} x="-5%" y="-5%" width="110%" height="110%">
              <feGaussianBlur stdDeviation={blur} />
            </filter>
          </defs>
          <g filter={`url(#${id}-smooth)`}>
            <rect width="720" height="400" fill={`url(#${id}-sky)`} />
            <path d="M0 187V111h72V70h54v60h64V91h89v75h68V79h67v80h76V95h92v48h65V75h63v132H0Z" fill="#233746" />
            {[40, 88, 150, 226, 304, 375, 439, 535, 611, 667].map((x) => <g key={x} fill="#a6a9a2" opacity=".55"><rect x={x} y="122" width="8" height="12" /><rect x={x} y="149" width="8" height="12" /></g>)}
            <path d="M0 218 720 180v220H0Z" fill={`url(#${id}-road)`} />
            <path d="M0 238 720 199" stroke="#82909b" strokeWidth="2" />
            <path d="M45 342h105m98-19h89m105-19h99m78-19h75" stroke="#b8b5a2" strokeWidth="4" opacity=".8" />
            <path d="M575 215V62h-30" stroke="#4e6573" strokeWidth="6" fill="none" />
            <circle cx="545" cy="63" r="10" fill="#eed9a4" />
            <path d="M545 69 470 243h180Z" fill="#dec998" opacity=".07" />
            <g transform="translate(444 237)" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <g stroke="#c4d1d3" strokeWidth="1.6">
                <circle cx="0" cy="38" r="20" /><circle cx="79" cy="38" r="20" />
                <path d="M0 18v40m-20-20h40m39-20v40m-20-20h40M-14 24l28 28m0-28-28 28m79-28 28 28m0-28-28 28" opacity=".85" />
              </g>
              <path d="M0 38 22 3l35 35H0l27-29h37l15 29M55-1h13L61 15M18-2h17" stroke="#e2d5b9" strokeWidth="2.2" />
              <path d="M42-8 49-28m-7 20-16-7M49-28l17 14" stroke="#aab9c0" strokeWidth="2" />
              <circle cx="49" cy="-35" r="5" fill="#aab9c0" stroke="none" />
            </g>
            {roadNoise.map((dot, i) => <circle key={i} cx={dot.x} cy={dot.y} r={dot.r} fill={dot.color} opacity={dot.y > 210 ? .42 : .33} />)}
          </g>
          <rect x="13" y="12" width="112" height="23" rx="5" fill="#fff" opacity=".9" />
          <text x="23" y="28" fill="#27446e" fontSize="12" fontFamily="sans-serif">教学示意 · SVG</text>
        </svg>
        <label className="smoothing-control" htmlFor={`${id}-range`}>
          <span>平滑处理强度</span>
          <input id={`${id}-range`} type="range" min="0" max="100" value={strength} onChange={(event) => setStrength(Number(event.target.value))} />
          <output htmlFor={`${id}-range`}>{strength}%</output>
        </label>
        <p className="smoothing-feedback" aria-live="polite">
          {strength < 30 ? "车轮与车架较清楚，低光噪声仍可见。" : strength < 70 ? "噪声减弱，自行车的细线也开始模糊。" : "画面更平滑，但车轮、轮辐和车架细节变弱。"}
        </p>
      </div>
    </Panel>
  );
}

const loop = [
  {
    name: "State · 看见什么",
    text: "sᵢ 是当前图像。实现还给策略使用记录与阶段信息，让它知道已经做过哪些处理。",
    label: "当前图像 + usage + stage",
  },
  {
    name: "Policy · 如何判断",
    text: "CNN 提取状态特征，模块分支生成概率分布，参数分支给出连续值。",
    label: "πᴹ(s) + πΘ(s)",
  },
  {
    name: "Action · 改变图像",
    text: "选择一个模块并应用其参数，得到新的图像 sᵢ₊₁。这幅图又成为下一步的观察。",
    label: "sᵢ₊₁ = F(Mᵢ, Θᵢ)(sᵢ)",
  },
  {
    name: "Feedback · 如何学习",
    text: "训练时用冻结检测器比较处理前后的误差，得到 reward，再通过 actor–critic 更新策略和值网络。",
    label: "r = D(sᵢ) − D(sᵢ₊₁) − Pᵢ",
  },
];
export function DecisionLoop({ onDone }: Done) {
  const [active, setActive] = useState(0),
    [seen, setSeen] = useState<number[]>([]);
  return (
    <Panel title="不是一次滤镜，而是一连串决策">
      <div className="decision-loop">
        {loop.map((x, i) => (
          <button
            key={x.name}
            className={active === i ? "selected" : ""}
            aria-pressed={active === i}
            onClick={() => {
              setActive(i);
              const n = [...new Set([...seen, i])];
              setSeen(n);
              if (n.length === 4) onDone();
            }}
          >
            <span>0{i + 1}</span>
            <b>{x.name}</b>
            <small>{x.label}</small>
          </button>
        ))}
      </div>
      <div className="loop-feedback">
        <span>训练反馈回到 Policy</span>
        <span>↶</span>
      </div>
      <div className="reading-detail" aria-live="polite">
        <h3>{loop[active].name}</h3>
        <p>{loop[active].text}</p>
      </div>
      <p className="activity-hint">
        逐一点击四个环节 · {seen.length} /
        4。推理阶段保留图像—策略—处理链，不用真实标签计算每步 reward。
      </p>
    </Panel>
  );
}

export { ModuleLab } from "./ModuleLab";

const routes = [
  [8, 3, 2, 5, 7],
  [2, 3, 5, 8, 7],
  [2, 3, 9, 5, 8],
];
export { PipelineLab } from "./PipelineLab";
export function AdaptationLab({ onDone }: Done) {
  const [scene, setScene] = useState(0),
    [budget, setBudget] = useState(3),
    [seen, setSeen] = useState<number[]>([]);
  return (
    <Panel title="同一个模块池，两种配置逻辑">
      <Tabs
        items={scenes}
        active={scene}
        set={(i) => {
          setScene(i);
          const s = [...new Set([...seen, i])];
          setSeen(s);
          if (s.length >= 2) onDone();
        }}
      />
      <div className="compare-row">
        <span className="eyebrow">FIXED · 固定结构示意</span>
        <Flow items={["白平衡", "Gamma", "对比度", "锐化"]} />
        <p>
          换一个场景，仍沿用同一顺序。固定结构的方法也可能动态调参数，需要区分。
        </p>
      </div>
      <div className="compare-row adaptive">
        <span className="eyebrow">ADAPTIVE · 场景路径示意</span>
        <Flow
          items={routes[scene].slice(0, budget).map((i) => modules[i].cn)}
        />
        <label>
          阶段预算 T = {budget}
          <input
            type="range"
            min="1"
            max="5"
            value={budget}
            onChange={(e) => setBudget(+e.target.value)}
          />
        </label>
      </div>
      <Callout title="阶段结束，不等于学到了 Stop 动作" orange>
        论文附录 C.2 将最大阶段设为 5；测试可取更少阶段。当前动作空间是十种 ISP
        模块，没有额外 skip / execute 二元头或 Stop
        类。未被选中的模块自然不进入这条执行路径。
      </Callout>
      <p className="activity-hint">
        建议比较至少两个场景。路线借鉴 Fig.5
        的模块组合，图像与参数为教学预设，不是策略预测。
      </p>
    </Panel>
  );
}

export function PolicyLab({ onDone }: Done) {
  const [branch, setBranch] = useState(0),
    [scene, setScene] = useState(0),
    [seen, setSeen] = useState<number[]>([]);
  const probs =
    scene === 0
      ? [0.05, 0.09, 0.16, 0.12, 0.04, 0.12, 0.04, 0.04, 0.29, 0.05]
      : [0.04, 0.1, 0.35, 0.14, 0.03, 0.08, 0.05, 0.06, 0.06, 0.09];
  return (
    <Panel title="一个状态，两个不同类型的输出">
      <div className="network-input">
        <span>64 × 64 RGB</span>
        <b>+</b>
        <span>N 个 use 通道</span>
        <b>+</b>
        <span>stage 通道</span>
        <ArrowRight />
        <strong>CNN 特征</strong>
      </div>
      <p className="subtle">
        四层 Conv–BN–LReLU，通道 32 → 64 → 128 → 256，接 128 维全连接；policy 含
        dropout。结构来自 App.C.1，下面概率为教学示意。
      </p>
      <Tabs
        items={["模块分支 πᴹ", "参数分支 πΘ"]}
        active={branch}
        set={(i) => {
          setBranch(i);
          const n = [...new Set([...seen, i])];
          setSeen(n);
          if (n.length === 2) onDone();
        }}
      />
      {branch === 0 ? (
        <>
          <Tabs
            items={["低光示意", "色偏示意"]}
            active={scene}
            set={setScene}
          />
          <div className="prob-grid">
            {modules.map((m, i) => (
              <div key={m.name}>
                <span>{m.cn}</span>
                <div className="bar-track">
                  <i style={{ width: `${probs[i] * 200}%` }} />
                </div>
                <b>{(probs[i] * 100).toFixed(0)}%</b>
              </div>
            ))}
          </div>
          <p>
            Softmax 给出模块分布。官方代码在训练时采样，在推理时取最大概率项。
          </p>
        </>
      ) : (
        <div className="parameter-branch">
          <span>共享特征</span>
          <ArrowRight />
          <span>模块专属参数头</span>
          <ArrowRight />
          <span>tanh / sigmoid 与范围映射</span>
          <div className="formula">例如 Desaturation：p ∈ [0, 1]</div>
          <p>
            模块不同，参数数量与范围不同：CCM 需要矩阵，Tone Mapping
            需要曲线参数。不能把所有动作都理解成一个“增强强度”。
          </p>
        </div>
      )}
      <Callout title="Actor 与 Critic 分工">
        Policy 是 actor，负责行动；value 网络是
        critic，估计状态的未来回报。value
        输入额外包含亮度、对比度、饱和度统计，不把这些统计强行当成全部 policy
        state。
      </Callout>
      <p className="activity-hint">
        建议检查两个输出分支。不是 PPO，也不是用 Q-learning 名称替代论文的
        actor–critic。
      </p>
    </Panel>
  );
}

export function RewardLab({ onDone }: Done) {
  const [lambda, setLambda] = useState(0),
    [choice, setChoice] = useState(0);
  const candidates = [
    { name: "较重处理", gain: 0.24, cost: 8 },
    { name: "适中处理", gain: 0.2, cost: 4 },
    { name: "轻量处理", gain: 0.12, cost: 1 },
  ];
  const rewards = candidates.map((x) => x.gain - lambda * x.cost);
  const best = rewards.indexOf(Math.max(...rewards));
  return (
    <Panel title="Accuracy–Cost Decision Simulator">
      <p className="module-description">
        假设三种处理让检测损失分别下降不同幅度。拖动成本权重，看“收益最大”何时不再等于“净回报最大”。数值全部为教学构造。
      </p>
      <div className="reward-formula">
        <span>
          检测误差下降<strong>D(sᵢ) − D(sᵢ₊₁)</strong>
        </span>
        <b>−</b>
        <span>
          惩罚<strong>Pᵢ</strong>
        </span>
        <b>=</b>
        <span className="reward-total">
          Reward<strong>rᵢ</strong>
        </span>
      </div>
      <label className="range-label">
        教学成本权重 λ = {lambda.toFixed(3)}
        <input
          type="range"
          min="0"
          max=".06"
          step=".001"
          value={lambda}
          onChange={(e) => {
            setLambda(+e.target.value);
            onDone();
          }}
        />
        <span className="range-ends">
          <small>优先检测收益</small>
          <small>更重视节约成本</small>
        </span>
      </label>
      <div className="reward-options">
        {candidates.map((x, i) => (
          <button
            key={x.name}
            className={`${choice === i ? "selected" : ""} ${best === i ? "winner" : ""}`}
            aria-pressed={choice === i}
            onClick={() => setChoice(i)}
          >
            <span>{best === i ? "当前最高回报" : "候选处理"}</span>
            <h3>{x.name}</h3>
            <dl>
              <dt>损失下降（虚构）</dt>
              <dd>{x.gain.toFixed(2)}</dd>
              <dt>成本（示意单位）</dt>
              <dd>{x.cost}</dd>
              <dt>净回报</dt>
              <dd>{rewards[i].toFixed(3)}</dd>
            </dl>
          </button>
        ))}
      </div>
      <p role="status" className="reward-readout">
        选中「{candidates[choice].name}」：{candidates[choice].gain.toFixed(2)}{" "}
        − {lambda.toFixed(3)} × {candidates[choice].cost} ={" "}
        <b>{rewards[choice].toFixed(3)}</b>。
        {choice === best
          ? "这次选择有最高的示意净回报。"
          : "当前权重下，另一方案的净回报更高。"}
      </p>
      <Callout title="从这个简化实验回到论文">
        Eq.9 的惩罚还包含重复使用与探索相关项；Eq.10
        的熵项鼓励早期探索，系数随训练减小；Eq.11
        以模块运行时间计成本。这里固定其他项，只隔离成本效应。论文没有使用 PSNR
        / SSIM 或人眼美观评分作为这个任务的奖励。
      </Callout>
      <details className="objective-details">
        <summary>为什么还要估计未来回报？</summary>
        <p>
          当前处理会改变后续可用的图像，所以论文最大化的是期望累积回报
          J(π)，而非只挑本步误差下降最多的动作。Eq.5 用 gₜ = Σ γᵏ rₜ₊ₖ
          汇总后续奖励；γ ∈ [0,1] 控制对更远期收益的折扣。value
          网络估计状态的未来回报，辅助 actor 学习。
        </p>
        <p>
          离散模块分支通过 actor–critic 学习选择，连续参数分支利用可微 ISP
          的梯度。不能把两条分支都说成对离散选择直接做普通反向传播。
        </p>
      </details>
      <p className="activity-hint">
        拖动权重观察变化；滑块不会重训模型，也不表示论文真实 reward 曲线。
      </p>
    </Panel>
  );
}

export function CostLab({ onDone }: Done) {
  const [active, setActive] = useState(0);
  const c = costs[active];
  return (
    <Panel title="更快的处理，要付出多少准确率代价？" kind="论文报告">
      <Tabs
        items={costs.map((x) => `λc = ${x.lambda}`)}
        active={active}
        set={(i) => {
          setActive(i);
          onDone();
        }}
      />
      <div className="cost-layout">
        <svg
          viewBox="0 0 520 290"
          role="img"
          aria-label="Table 4 运行时间与 mAP@0.5 的五个实测点"
        >
          <path d="M64 30V238H485" fill="none" stroke="#8999af" />
          {[69, 70, 71, 72].map((y) => (
            <g key={y}>
              <path d={`M64 ${238 - (y - 69) * 60}H485`} stroke="#e2e7ef" />
              <text x="25" y={243 - (y - 69) * 60}>
                {y}
              </text>
            </g>
          ))}
          {[9, 11, 13, 15].map((x) => (
            <text key={x} x={70 + (x - 9) * 65} y="263">
              {x}
            </text>
          ))}
          <text x="64" y="20">
            mAP@0.5 ↑
          </text>
          <text x="350" y="287">
            平均时间 (ms) →
          </text>
          {costs.map((x, i) => (
            <g key={i}>
              <circle
                cx={80 + (x.time - 9) * 65}
                cy={238 - (x.map - 69) * 60}
                r={i === active ? 9 : 5}
                fill={i === active ? "#f07e47" : "#27446e"}
              />
              {i === active && (
                <text
                  x={Math.min(360, 80 + (x.time - 9) * 65)}
                  y={218 - (x.map - 69) * 60}
                >
                  {x.time.toFixed(2)} ms / {x.map.toFixed(1)}
                </text>
              )}
            </g>
          ))}
        </svg>
        <div className="metric-stack">
          <div>
            <small>LOD · mAP@0.5</small>
            <strong>{c.map.toFixed(1)}</strong>
          </div>
          <div>
            <small>平均时间 / 样本</small>
            <strong>
              {c.time.toFixed(2)} <em>ms</em>
            </strong>
          </div>
          <p>
            相对 λc=0：时间减少{" "}
            <b>{(((14.73 - c.time) / 14.73) * 100).toFixed(1)}%</b>，@0.5 下降{" "}
            <b>{(71.4 - c.map).toFixed(1)}</b> 个百分点。
          </p>
        </div>
      </div>
      <h4>看模块使用频率如何变化</h4>
      <div className="usage-bars">
        {modules.map((m, i) => (
          <div key={m.name}>
            <span>{m.cn}</span>
            <div className="bar-track">
              <i style={{ width: `${c.usage[i]}%` }} />
            </div>
            <b>{c.usage[i]}%</b>
          </div>
        ))}
      </div>
      <p className="small-prose">
        Table 4 的 λc
        是优化时的成本权重；切换这里展示的是论文不同设置的结果。Table 5
        则在推理时限制阶段数，无需重训。两者不要混为“拖动 λ
        立即改变一个已训练网络”。
      </p>
      <Callout title="时间指标的范围">
        Table 4 报告平均 ISP 处理时间。正文另报 GTX1660Ti 上策略推理约 1.2 ms /
        阶段；它不是整个检测系统的端到端延迟。论文没有由此给出手机功耗或所有硬件上的能耗结果。
      </Callout>
    </Panel>
  );
}

const training = [
  [
    "输入与动作",
    "训练图像及检测标签进入训练系统。Policy 读取低分辨率状态，预测模块与参数；ISP 在检测器需要的分辨率处理。",
  ],
  [
    "检测损失",
    "冻结的 YOLOv3 分别计算处理前后图像的检测误差 D(s) 与 D(s′)。冻结参数不等于阻断输入梯度。",
  ],
  [
    "奖励与价值",
    "误差下降减惩罚得到 reward；value 网络估计未来回报，形成 actor–critic 的学习信号。",
  ],
  [
    "更新网络",
    "更新模块选择策略、参数预测网络和 value 网络；可微 ISP 将检测损失对图像的梯度传回参数分支。",
  ],
  [
    "部署推理",
    "保留学习后的策略和 ISP 执行链，按阶段预算处理新图像，最后交给下游检测器。无需检测标签或 critic 来更新策略。",
  ],
];
export function TrainingLab({ onDone }: Done) {
  const [step, setStep] = useState(0);
  return (
    <Panel title="训练与推理的分界线">
      <div className="train-flow">
        <Flow
          items={[
            "Policy 可训练",
            "可微 ISP",
            "YOLOv3 冻结",
            "Reward",
            "Actor–Critic 更新",
          ]}
          current={step < 4 ? step : -1}
        />
        <div className="gradient-arrow">
          ← 检测损失的梯度经过 ISP 回传；YOLOv3 权重保持不变
        </div>
      </div>
      <div className="reading-detail" aria-live="polite">
        <span className="eyebrow">{step + 1} / 5</span>
        <h3>{training[step][0]}</h3>
        <p>{training[step][1]}</p>
      </div>
      <div className="training-spec">
        <span>
          <b>512 × 512</b>ISP / 检测输入
        </span>
        <span>
          <b>64 × 64</b>策略 / value 输入
        </span>
        <span>
          <b>100,000</b>训练迭代
        </span>
        <span>
          <b>约 24 h</b>单张 RTX 3090
        </span>
      </div>
      <p className="small-prose">
        App.A.1：Adam，初始学习率 3×10⁻⁵，batch size
        8。本文使用有参数的可微处理模块；逐图预测处理参数不等于把每个模块都改造成一个独立训练的大型图像网络。
      </p>
      <div className="controls">
        <button
          className="button-outline"
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
        >
          上一步
        </button>
        <button
          className="button-primary"
          disabled={step === 4}
          onClick={() => {
            setStep(step + 1);
            if (step + 1 === 4) onDone();
          }}
        >
          {step === 4 ? "已到推理阶段" : "沿训练信号向前"}
          <ArrowRight size={16} />
        </button>
      </div>
    </Panel>
  );
}
