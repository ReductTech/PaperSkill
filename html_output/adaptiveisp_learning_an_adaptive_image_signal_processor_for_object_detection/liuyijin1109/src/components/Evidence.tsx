import { useState } from "react";
import { table1 } from "../content";
import {
  Panel,
  Tabs,
  Callout,
  Figure,
  Explore,
  Flow,
  type Done,
} from "./Shared";

export function Comparison({ onDone }: Done) {
  return (
    <>
      <Explore
        title="先分清：结构可变，还是仅参数可变？"
        onDone={onDone}
        required={3}
        items={[
          {
            name: "手工 / 静态调参",
            text: "传统工程往往先定模块顺序，再调一套参数。论文对照中的 Hyperparameter Optimization 通过梯度优化 ISP 参数，但推理时结构和参数固定。",
            detail:
              "依据：论文 §2。不能把所有传统相机实现都绝对归为完全相同的静态系统。",
          },
          {
            name: "学习图像映射",
            text: "PyNET、CycleISP 等方向用神经网络改善 RAW-to-RGB 或去噪。它们的视觉质量目标不自动等于检测任务目标。",
            detail:
              "这里只概述 AdaptiveISP 的 Related Work；不对每个方法未讨论的成本和适应能力打勾。",
          },
          {
            name: "固定结构 / 动态参数",
            text: "Attention-aware Learning 预测图像相关参数；DynamicISP 根据前一帧识别反馈调节当前帧参数。动态参数本身不代表逐图重选模块顺序。",
            detail: "依据：论文 §2 / §4.1。DynamicISP 并非“完全不自适应”。",
          },
          {
            name: "搜索结构与参数",
            text: "ReconfigISP 用神经架构搜索，Refactoring ISP 用多目标优化，联合寻找结构与参数；论文讨论的这些对照在推理时保持已优化的配置。",
            detail:
              "Refactoring ISP 也讨论计算预算，因此不能声称只有 AdaptiveISP 考虑成本。",
          },
          {
            name: "AdaptiveISP",
            text: "在每个阶段根据当前图像选择一个模块并预测参数，从而逐图形成处理路线；用检测任务误差与时间惩罚学习。",
            detail:
              "结构及参数随输入而变，推理可按阶段预算截短。不是每张图重新运行耗时的离线架构搜索。",
          },
        ]}
      />
      <div
        className="table-scroll"
        tabIndex={0}
        role="region"
        aria-label="方法比较表"
      >
        <table className="paper">
          <caption>论文所讨论的代表性设置 · 未涉及的维度不作推断</caption>
          <thead>
            <tr>
              <th>方法</th>
              <th>推理结构</th>
              <th>推理参数</th>
              <th>优化方式</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>Hyperparameter Optimization</th>
              <td>固定</td>
              <td>固定</td>
              <td>梯度调参</td>
            </tr>
            <tr>
              <th>Attention-aware Learning</th>
              <td>固定</td>
              <td>动态</td>
              <td>参数预测</td>
            </tr>
            <tr>
              <th>ReconfigISP / Refactoring ISP</th>
              <td>搜索后固定</td>
              <td>搜索后固定</td>
              <td>NAS / 多目标优化</td>
            </tr>
            <tr className="highlight">
              <th>AdaptiveISP</th>
              <td>逐图逐步选择</td>
              <td>逐步预测</td>
              <td>Actor–critic</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

export function ExperimentDesign({ onDone }: Done) {
  return (
    <Explore
      title="先选择你想验证的问题"
      onDone={onDone}
      required={3}
      items={[
        {
          name: "Q1 检测有没有提高？",
          text: "LOD：2,230 张 14-bit 低光 RAW，8 类目标；1,830 对训练、400 对验证。比较多种 ISP 后，使用同一预训练 YOLOv3 评测。",
          detail:
            "指标分别看 mAP@0.5、@0.75、@0.5:0.95。IoU 阈值不同，数值不能混用；一个数据集上的 mAP 不是一张图的置信度。",
        },
        {
          name: "Q2 换场景还能用吗？",
          text: "主实验将 LOD 训练的策略直接用于 All OnePlus（141 张、3 类）与 synthetic raw COCO（由 5,000 张 COCO 验证图像经 UPI 转换）。",
          detail:
            "OnePlus 原划分为 50/91；主表使用全部 141 张验证。附录 A.5 另有 50 张训练的小数据实验，不能与主表混为同一协议。",
        },
        {
          name: "Q3 换检测器呢？",
          text: "Table 3 比较 YOLOv3、YOLOX、DDQ。YOLOX 与 DDQ 不参与策略训练。Table 2 另以 YOLOv5 分割模型测试迁移。",
          detail:
            "支持这些已测模型上的迁移，不能推出所有检测器、所有任务都一定改善。",
        },
        {
          name: "Q4 自适应有必要吗？",
          text: "Fig.5 把三条代表路径与各自输入形成三个子集，再交叉测试不同路径。问的是：换一条路线会不会改变检测表现？",
          detail: "这是路径与子集层面的比较，不是按“低光”标签直接选择规则。",
        },
        {
          name: "Q5 成本与组件作用？",
          text: "Table 4 改成本权重，Table 5 改执行阶段数；Table 8 移除重复使用惩罚。分别回答运行成本、阶段收益和使用约束的作用。",
          detail:
            "App.A.1：四个优化方法由作者重实现；Crafting、NeuralAE、DynamicISP 的结果引用各自原论文。不同来源的对照须保留说明。",
        },
      ]}
    />
  );
}

export function StageEvidence({ onDone }: Done) {
  return (
    <Panel title="处理几步？" kind="论文报告">
      <p>论文最多设置五个处理阶段。Table 5 比较推理时执行 1–5 步的结果，第二步已有明显收益，后续增益逐渐变小。</p>
      <div className="stage-chart">
        {[[69.6, 45.7], [70.9, 46.6], [71.3, 46.9], [71.4, 47.1], [71.4, 47.1]].map((x, i) => (
          <div key={i}>
            <span>{i + 1} 个阶段</span><strong>{x[0]}</strong><small>@0.5</small><b>{x[1]}</b><small>@0.5:0.95</small>
          </div>
        ))}
      </div>
      <p>LOD 的 mAP@0.5 在 4–5 步为 71.4；2 步为 70.9。Table 5 的表题与正文对最优阶段数的表述不一致，这里按表值解读；其他指标也不保证逐步单调提高。</p>
      <div className="ablation-pair">
        <div><small>移除重复使用惩罚</small><strong>70.9</strong><p>CCM 出现频率 164%，一些图像重复使用该模块。</p></div>
        <ArrowText />
        <div><small>保留重复使用惩罚</small><strong>71.4</strong><p>LOD mAP@0.5；更好约束模块复用。</p></div>
      </div>
      <p className="subtle">Table 8 只检验所报告的重复使用惩罚，不能推出所有 reward 项都经过消融。</p>
      <button className="tiny ghost" onClick={onDone}>已读阶段与消融结果</button>
    </Panel>
  );
}

export function Results({ onDone }: Done) {
  const [view, setView] = useState(0),
    [dataset, setDataset] = useState(0),
    [metric, setMetric] = useState(0),
    [seen, setSeen] = useState<number[]>([]);
  const metricNames = ["mAP@0.5", "mAP@0.75", "mAP@0.5:0.95"];
  return (
    <Panel title="让每个结果回答一个问题" kind="论文报告">
      <Tabs
        items={[
          "主要结果 · Table 1",
          "迁移 · Table 2 / 3",
        ]}
        active={view}
        set={(i) => {
          setView(i);
          const n = [...new Set([...seen, i])];
          setSeen(n);
          if (n.length === 2) onDone();
        }}
      />
      {view === 0 ? (
        <>
          <p>
            <b>要证明什么：</b>在相同下游任务设置中，自适应处理是否优于已有
            ISP？
          </p>
          <Tabs
            items={["LOD", "All OnePlus", "Synthetic raw COCO"]}
            active={dataset}
            set={setDataset}
          />
          <Tabs items={metricNames} active={metric} set={setMetric} />
          <div className="result-bars">
            {table1.map((row) => {
              const v = row.values[dataset][metric];
              return (
                <div
                  key={row.name}
                  className={row.name === "AdaptiveISP" ? "ours" : ""}
                >
                  <span>{row.name}</span>
                  <div className="bar-track">
                    <i style={{ width: `${v ?? 0}%` }} />
                  </div>
                  <b>{v === null ? "未报告" : v.toFixed(1)}</b>
                </div>
              );
            })}
          </div>
          <p className="subtle">
            比例尺：0–100，长度对应所选 mAP。空缺保留“未报告”，不补零。
          </p>
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="论文 Table 1 数值"
          >
            <table className="paper">
              <caption>
                Table 1 ·{" "}
                {["LOD", "All OnePlus", "Synthetic raw COCO"][dataset]}
              </caption>
              <thead>
                <tr>
                  <th>方法</th>
                  {metricNames.map((x) => (
                    <th key={x}>{x}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table1.map((row) => (
                  <tr
                    key={row.name}
                    className={row.name === "AdaptiveISP" ? "highlight" : ""}
                  >
                    <th>{row.name}</th>
                    {row.values[dataset].map((v, i) => (
                      <td key={i}>{v === null ? "—" : v.toFixed(1)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Callout title="怎么读结论">
            LOD：71.4 对 70.1，mAP@0.5 增加 1.3 个百分点（对 Hyperparameter
            Optimization）。但 OnePlus @0.5 的 70.1 低于 Attention-aware
            Learning 的 70.9。不能把作者的概括扩写为“任何指标全面胜出”。
          </Callout>
        </>
      ) : (
        <>
          <p>
            <b>要证明什么：</b>针对 YOLOv3
            学到的处理，能否帮助其他检测器和分割模型？
          </p>
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="跨检测器结果"
          >
            <table className="paper">
              <caption>Table 3 · LOD · mAP@0.5 / @0.75 / @0.5:0.95</caption>
              <thead>
                <tr>
                  <th>检测器</th>
                  <th>RGB（已有 ISP）</th>
                  <th>AdaptiveISP</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>YOLOv3</th>
                  <td>55.6 / 40.9 / 37.4</td>
                  <td>71.4 / 51.7 / 47.1</td>
                </tr>
                <tr>
                  <th>YOLOX</th>
                  <td>57.0 / 43.5 / 39.2</td>
                  <td>69.7 / 51.4 / 47.2</td>
                </tr>
                <tr>
                  <th>DDQ</th>
                  <td>50.3 / 42.0 / 35.9</td>
                  <td>74.0 / 58.1 / 52.0</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            YOLOX、DDQ 未用于策略训练。Table 2 的 synthetic raw COCO
            分割测试中，AdaptiveISP 为 <b>47.0 / 28.8</b>（@0.5 /
            @0.5:0.95），Hyperparameter Optimization 为 46.4 / 28.4。
          </p>
          <Callout title="不能推出什么" orange>
            这些结果支持所测试模型的迁移；不证明对所有 detector 都稳健。Table 3
            的 RGB 基线与 Table 1 的优化 ISP
            基线不同，不能把二者的提升幅度混为一谈。
          </Callout>
        </>
      )}
      <p className="activity-hint">建议阅读两个证据面板 · {seen.length} / 2。</p>
    </Panel>
  );
}
function ArrowText() {
  return (
    <span className="big-arrow" aria-hidden="true">
      →
    </span>
  );
}

const routeNames = [
  ["去饱和", "锐化/模糊", "CCM", "色调映射", "饱和度"],
  ["CCM", "锐化/模糊", "色调映射", "去饱和", "饱和度"],
  ["CCM", "锐化/模糊", "白平衡", "色调映射", "去饱和"],
];
const cross = [
  [
    [63, 39.8],
    [82.1, 66.8],
    [78.2, 64.5],
  ],
  [
    [62.1, 39.6],
    [82.7, 68.9],
    [79.2, 65.2],
  ],
  [
    [62.4, 39.5],
    [82.4, 67.8],
    [79.1, 65.4],
  ],
];
export function Routes({ onDone }: Done) {
  const [subset, setSubset] = useState(0),
    [route, setRoute] = useState(0);
  return (
    <Panel title="同一输入子集，换一条路径会怎样？" kind="论文报告">
      <Tabs
        items={[
          "Subset 1 · 高 ISO / 噪声",
          "Subset 2 · 动态范围",
          "Subset 3 · 色偏",
        ]}
        active={subset}
        set={(i) => {
          setSubset(i);
          onDone();
        }}
      />
      <Tabs
        items={["Pipeline 1", "Pipeline 2", "Pipeline 3"]}
        active={route}
        set={(i) => {
          setRoute(i);
          onDone();
        }}
      />
      <Flow items={routeNames[route]} />
      <div className="cross-result" aria-live="polite">
        <span>
          Subset {subset + 1} × Pipeline {route + 1}
        </span>
        <strong>
          {cross[route][subset][0].toFixed(1)}
          <small>mAP@0.5</small>
        </strong>
        <strong>
          {cross[route][subset][1].toFixed(1)}
          <small>mAP@0.75</small>
        </strong>
      </div>
      <p>
        {subset === 0
          ? "作者观察到高 ISO、高颜色噪声输入偏好去饱和；减少颜色信息可能帮助检测。"
          : subset === 1
            ? "作者将含电灯或直射光、动态范围较大的场景与 Tone Mapping 偏好联系起来。"
            : "作者观察到较亮图像的明显色偏时，White Balance 会成为更合适的选择。"}
      </p>
      <p className="subtle">
        场景描述是论文 §4.2
        的分析性归纳；每个子集不是由网页标签重新定义。数字直接转录 Fig.5。
      </p>
      <Figure
        n={5}
        caption="三条代表路径在三个输入子集上交叉评测。固定子集看不同行，才能看出路线选择的作用。"
      />
      <Callout title="先读数值，再读作者概括">
        Subset 3 上，Pipeline 2 的 @0.5 = 79.2，略高于 Pipeline 3 的
        79.1；Pipeline 3 的 @0.75 = 65.4
        最高。证据说明路线偏好与指标相关，不能解读为一条路线必然对每个指标都最优。
      </Callout>
    </Panel>
  );
}

export function Limits({ onDone }: Done) {
  return (
    <>
      <Explore
        title="把作者说过的，与我们的分析分开"
        onDone={onDone}
        required={3}
        items={[
          {
            name: "作者明确 · 可微性",
            text: "§5：当前方法依赖可微 ISP 模块，未来探索非可微 ISP。参数分支通过处理模块接收梯度，这决定了方法的直接适用边界。",
          },
          {
            name: "作者展示 · 训练失败",
            text: "App.C.2 / Fig.11 展示过大或过小曝光增益造成过曝、全黑图像。作者对异常亮度进行训练截断，并限制最大阶段。",
          },
          {
            name: "结构分析 · 模块与任务",
            text: "策略只能从已实现模块中选择；任务反馈取决于训练检测器与标注。论文测试了跨检测器迁移，但未穷尽未见传感器、全部任务与极端环境。",
          },
          {
            name: "结构分析 · 真实部署",
            text: "论文给出 GPU 时间与成本设置，不直接等于手机 ISP 固件可部署，也不等于端到端能耗最优。工程上还需验证算子支持、内存与传感器分布。",
          },
        ]}
      />
      <Figure
        n={11}
        caption="训练中曝光增益过大导致过曝，过小导致欠曝；这是异常状态截断的动机。"
      />
    </>
  );
}
