# Verification and Handoff

当前七章教程于 2026-08-16 从项目根目录完成验证。

## 环境

```text
Conda environment: paperskill
Node/npm: provided by that environment
```

PowerShell 命令：

```powershell
conda activate paperskill
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 4174
```

## 自动化结果

- Vitest：18 个测试文件，`135/135` 通过；其中 `orchestration-bypass-lab.test.ts` 为 `15/15`，`layered-architecture-lab.test.ts` 为 `17/17`，`pushdown-scale-lab.test.ts` 为 `20/20`，`shared-inference-lab.test.ts` 为 `8/8`，`library-scenes.test.ts` 为 `15/15`。
- Production build：`tsc && vite build` 成功；70 个模块完成转换。
- PaperSkill validator：PASS，确认 7 章、10 个活动模块、3 个双模块章节、11 个 componentId 全部注册且无占位符。

## 浏览器结果

使用 Playwright CLI 在生产预览上验证：

- Desktop `1440x1000`：`scrollWidth === clientWidth`，无文本、按钮或同级控件重叠。
- Mobile smoke `390x844`：页面 `scrollWidth === clientWidth`；该检查只覆盖提交所需的基础溢出门槛，主要讲解目标仍为桌面投屏。
- 七章结构：全部展开后标题依次为问题、安全集合、门控与规模、共享推理、Agent 风险、OGX 架构、结果边界；流程条只包含 `§1..§7`，最终章不存在 `§8` 继续按钮。
- 七个类比 Canvas 的可访问标签依次为目录排名、集合交集、两层验卡、共享端点、工具与状态、完整地图、证据矩阵，不再引用旧十章编号。
- 连续滑条端点：2.1 与 3.2 的 thumb 完整落在轨道内，10 个 `.paper-lab` 均满足 `scrollWidth === clientWidth`；5.2 与 7.1 的 chip 行保留可横向滚动的有意行为。
- 1.1 排名列表：101 个查询位置下，标题与首行保持间距、末行不越出列表框；最长租户名 `Engineering` 与三位小数分数列保持独立间隔。
- 2.1 安全集合：Legal 文档显式显示为 `Legal · 并购合同 95`；`deny / permit` 说明位于开关与 Canvas 之间，完整标签与说明均无裁切或重叠。
- 3.1 两级门控：默认拒绝锁住搜索后区域；所有者匹配形成 `4/4` 授权上下文；团队匹配把 chunk `1/3` 送入上下文、`2/4` 送入拒绝区。`0.57` 中间帧可见四个 chunk 依次到达独立筛选槽。
- 3.2 规模效应：后过滤在 `N=100 / 1,003 / 9,999 / 50,000` 四个可操作帧中保持 25 个候选位置和 5 个结果位置，50K 落到论文实测 `Recall@5=0.002`；放大后的 Canvas 约为 `820x462.7`。
- 4.1 共享推理：两种拓扑各采样 101 个进度点，所有可见信封均不与策略门或模型端点相交，共享模式下三份信封全程互不相交。
- 默认倍率：4.1 首次渲染为 `1.5×`，6.1 首次渲染为 `0.5×`；其余完整动画保持 `1×`。
- 5.1 状态回流：六个租户状态停留帧、共享状态写入帧、历史回流中间帧、污染终态和反向撤回帧均无文字或几何重叠。共享模式把 Legal 旧结果带入 Finance 下一轮；租户模式将其留在 Legal 分区。
- 5.1 桌面布局：Canvas 显示为 `820x427.6`、后备分辨率约 `818x427`，具有 `is-ready`，像素抽样获得 229 个有色样本；最小 7.5px 逻辑标签显示约 11px。
- 5.2 编排绕过：Canvas 显示为 `820x445.1`、后备分辨率约 `818x444`，三种选择分别使用检索绕行、工具调用分支和状态卡片迁移。客户端检索点在 101 个采样位置均不与 ABAC 门控相交；服务端检索点停在门控输入端。工具调用点和上下文包均停在节点端口，不覆盖节点标签；Finance / Legal 卡片在 101 个采样位置互不重叠。
- Canvas：`19/19` 具有 `is-ready`；页面共有 7 章、10 个 `.paper-lab` 和 10 个模块。
- 论文原图：`figure-1.png` 为 `370x360`，`figure-4.png` 为 `850x925`，均成功加载。
- Console：全新无读回采样会话中 0 errors、0 warnings。
- 拓展材料：默认关闭；关闭时不挂载 B 站封面，不产生外部图片请求。

## 动画结果

完整动画在 `0 / 0.25 / 0.5 / 0.75 / 1` 采样并反向拖动：

```text
1.1 relevance leakage
2.1 secure set
3.1 two-tier gating
3.2 scale / pushdown
4.1 Shared Inference
5.2 orchestration bypass
6.1 architecture request loop
```

- 七个模块均出现阶段对应的像素变化；`3.1` 默认拒绝后按设计保持终止帧，所有者与团队策略分别形成 `4/4` 与 `2/4` 的不同终止画面。
- `6.1` 的可信边界从首帧可见，查询不会进入离线摄取区域，客户端旁路在边界终止；Legal chunk 不进入授权上下文，工具只在授权后执行，状态只写入 Finance 分区。
- `6.1` 在 `0 / 0.25 / 0.5 / 0.75 / 1` 的正向与反向拖动都由当前进度纯计算，不残留后续阶段状态。
- 所有完整动画暂停 500 ms 后 Canvas hash 保持不变。
- 修复后复采样：七个完整动画在 `0 / 0.25 / 0.5 / 0.75 / 1` 均有阶段对应画面，反向拖动恢复早期状态；3.1 的资源级 DENY 终止帧按设计保持不变。
- 5.2 三种攻击分别进行五帧正向截图和 `1 / 0.75 / 0.5 / 0.25 / 0` 反向拖动；15 个反向帧的实际滑条值与请求值完全一致，每种攻击的五个 Canvas hash 均不同且有色像素样本非零，模块与整页均无横向溢出。
- 6.1 在 `1440×1000` 桌面视口完成 `0 / 0.25 / 0.5 / 0.75 / 1` 正向关键帧和完整反向拖动；实际滑条值与请求值一致，Canvas 非空，模块与整页均无横向溢出。逐帧检查确认 Legal 拒绝 token、工具授权结果和 Finance 状态写入均与文字分槽显示。
- 全新 `architecture-final` 浏览器会话记录为 `0 errors / 0 warnings`。
- `7.1` 在桌面视口分别检查安全矩阵、质量哑铃/Recall 曲线和代价量纲块；三种模式均保持 `820px` Canvas 宽度、无横向溢出，A/B/C/D 吞吐映射可直接读出。
- `no-preference` 模式下，三个短过渡都具有不同的起点、中间帧和终点。
- `prefers-reduced-motion: reduce` 模式下，过渡跳过连续插值但抵达同一结论。
- Chapter 4 固定在 `0.4` 后操作 `5.1` 与 `5.2`，Chapter 4 仍为 `0.4`；拖动 `5.2` 不改变 `5.1` 的步进状态。

## 性能结果

- Chapter 6 可见播放期间收集 1,636 个 requestAnimationFrame 间隔样本。
- P95 frame interval：`6.2 ms`，低于 `25 ms` 门槛。
- 10 秒 PerformanceObserver：0 个 long task，未出现超过 `50 ms` 的动画任务。
- Chapter 4 可见播放到 `0.059` 后滚出视口，冻结在 `0.060`；650 ms 后进度增量为 `0`。

## 证据检查

论文值集中在 `src/modules/evidence/paperEvidence.ts`：

- CTLR：`100%, 0%, 98%, 0%`。
- AVR：`50%, 0%, 50%, 0%`。
- Prompt-injection leaks：`72/90, 0/90, 56/90, 0/90`。
- Precision@5：`0.200 -> 0.433`；MRR：`0.700 -> 1.000`。
- QPS at concurrency 25：`5.4, 4.2, 2.2, 2.6`。
- Post-filter Recall@5：`1.000, 0.100, 0.010, 0.002`，对应 `100, 1K, 10K, 50K`。
- Post-filter overhead：`0.74, 0.79, 1.00, 2.95 ms`。
- Gated-search overhead：约 `19 ms`，仅对应评估测试床。
- Server-side orchestration overhead：约 `3 s`，仅对应非流式 Responses API 工具执行往返。
- Predicate-pushdown latency 未给出统一数字。

## 提交交接

保留完整 React 项目、`package.json`、lockfile、`public/` 与 `src/`。不要提交 `node_modules/`、`dist/`、临时浏览器产物或运行代码中的本机绝对路径。公开元数据、干净导出和上游 PR 步骤统一见 [`docs/submission.md`](submission.md)。
