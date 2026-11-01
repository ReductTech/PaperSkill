# Act2See PaperSkill V2 · 第 2 轮 A 结构迁移报告

日期：2026-10-29（Asia/Shanghai）。工程根目录：`E:\PaperSkill_projects\Act2See_web`。根目录没有 `.git`，没有执行 `git init`、commit、push 或部署。

## 1. 工程保护与修改范围

修改前在工程外创建 `E:\PaperSkill_projects\Act2See_web_V1_backup_20261029`。排除 `node_modules`、`dist`、`tsconfig.tsbuildinfo`，其余 30 个文件全部复制并逐文件 SHA256 校验，**0 个缺失或不一致**。备份覆盖本轮所有原有拟修改文件，包括 `src/App.tsx`、`src/content.ts`、`src/ChapterBodies.tsx`、`src/Interactions.tsx`，也保留全部 `public` 原图、配置、README、docs、锁文件与历史压缩包。目标不存在时才创建，没有覆盖既有备份。

修改或新增：

| 文件 | 内容 |
|---|---|
| `src/content.ts` | 九章固定 ID、标题、difficulty、role、sourceRefs 与运行时重复 ID 检查 |
| `src/ChapterBodies.tsx` | 九章按 ID 注册正文，拆成 `N.1` 等小节，重排旧内容 |
| `src/App.tsx` | 按 ID 渲染、九章固定壳数据绑定、§9 内 FinalQuiz、进度与滚动同步 |
| `src/Interactions.tsx` | 仅给 FigureWalk 增加图号参数，供四幅原图在对应章节独立查看；未改学术事实或实验数值 |
| `src/tutorialProgress.ts` | v2 进度协议、v1 迁移、存储容错 |
| `scripts/check-progress.mjs` | 可重复运行的进度边界测试 |
| 本报告 | 迁移说明与验证记录 |

`npm run typecheck`、`npm run build` 可能更新 `tsconfig.tsbuildinfo` 和 `dist`；两者为可再生产物。受保护的 `package.json`、锁文件、`paper.html`、README、四幅 PNG 及全部 CSS 与备份逐文件 SHA256 相同。没有安装依赖或修改固定 UI 样式、Hero 双栏结构、公共宽度/字体/tokens。没有制作 Sidebar 或底部导航。

## 2. 旧 13 章到新 9 章

| 旧章 | 新目的地 | 保留内容 |
|---|---|---|
| 1 `gap` | §1 `evidence-gap` | StaticLab、固定帧盲区与证据缺口 |
| 2 `cot` | §4 `interleaved-cot` | CoTTimeline、token 与插帧说明 |
| 3 `channels` | §2 决策语义；§3 `visual-tools` 为主要交互 | ActiveMap 说明决策；ChannelsLab、检索/生成工具细节在 §3 |
| 4 `pipeline` | §5 `demonstrations` | Pipeline 六阶段、Gemini 与 SFT 基座角色 |
| 5 `trace` | §5 `demonstrations` | TraceLab、Table 6 筛选解释 |
| 6 `sft` | §6 `sft-learning` | SFTLab、Eq. 1 与 loss 边界 |
| 7 `simulator` | §4 `interleaved-cot` | InferenceSimulator 一次连续调用演示；§2 保留其决策概念 |
| 8 `benchmarks` | §7 `evaluation` | BenchmarkExplorer 与指标口径 |
| 9 `results` | §7 主结果；§9 反事实/成本 | ResultsLab、CounterfactualEvidence 与解释边界 |
| 10 `figures` | Fig. 1→§4，Fig. 2→§5，Fig. 3→§6，Fig. 4→§8 | 四幅原始 PNG 和 FigureWalk；不再有独立原图总览章 |
| 11 `active` | §2 定义；§7 方法比较；§9 边界 | ActiveMap、MethodComparison、能力外推界限 |
| 12 `context` | §9 可选背景小节 | ContextMap 和教学性比较声明，不作为 Act2See 主科学论证 |
| 13 `limits` | §9 `reliability` | LimitsPanel、十一问、局限 |
| 旧独立 Final | §9 `reliability` 的 9.3 | 原 FinalQuiz 四题、复习、重置；无第十个 `section.chap` |

Landing 保留现有 Hero 与双栏对照，不计入九章。保留了所有旧核心具名组件、论文数值、原图与原有交互；导语和内容配置文字按新问题链重排或压缩。§2 的“已有证据足够时直接回答”目前是文字说明，三分支可操作决策实验留待内容轮次，不能把两态 ChannelsLab 说成已实现三分支。

## 3. 章节注册方案

`content.ts` 导出 `ChapterId` 字面量联合与九条配置，配置分别保存稳定 `id`、`title`、`nav`、`difficulty`、`role`、`question`、`takeaway`、`bridge`、`sourceRefs`。`chapterBodies: Record<ChapterId, readonly Subsection[]>` 由 TypeScript 检查漏项；配置用 `Set` 检查重复 ID；正文注册再检查配置与键数量一致。App 以 `chapter.id` 读取正文，按索引只生成顺序编号 `N.M`，不再用数组位置猜正文。FigureWalk 的可选 `numbers` 参数让每幅原图在目标章节独立挂载，组件内部状态互不共享。

## 4. v1 → v2 进度协议

旧键 `act2see-tutorial-v1` **只读保留**；新键 `act2see-tutorial-v2` 写入 `{version:2, unlocked, completed, activeId, review}`。`unlocked` 是可浏览的连续前缀章数，`completed` 是通过“继续学习”完成的连续前缀章数；`activeId` 是当前滚动位置对应的稳定章节 ID 或 `null`；`review` 表示回顾状态，不代表测验通过。FinalQuiz 答案继续保持原组件的本地状态，绝不从旧数据伪造新测验成绩。

v1 解锁门槛按新顺序检查旧章是否已到达：§1 需旧 1；§2 需旧 3；§3 需旧 3；§4 需旧 2、7；§5 需旧 4、5；§6 需旧 6；§7 需旧 8、9、11；§8 需旧 10；§9 需旧 12、13。取满足条件的**连续新章前缀**。旧 `unlocked=0…13` 对应新值为 `0,1,1,3,3,3,3,6,6,6,6,8,8,9`。新 `completed` 以旧 `completed` 用同一门槛计算，再限制为不超过 `unlocked-1` 且不超过 8。旧全完成映射为 `unlocked=9, completed=8, activeId=null, review=false`：可浏览九章，仍须经 §9 学习入口完成本轮；不记录测验通过。

优先恢复结构合法、版本为 2 的 v2 数据；否则尝试结构合法的 v1；再否则从零开始。拒绝损坏 JSON、版本不符、越界/负数/小数/字符串计数、`completed>unlocked`、无效 `activeId` 等值。存储读写抛异常时继续使用内存状态。Reset 写入零进度的 v2 状态，防止刷新后重新导入保留的 v1；不会清空整个 localStorage 或删除旧键。Review 只回到 §1 并设置回顾状态，继续入口仍由 `completed` 决定；滚动监听更新 `activeId`，避免把最近点击的章误当成当前阅读章。

## 5. 已通过验证

- `npm run typecheck`：通过。
- `npm run build`：通过；构建有来自 `lucide-react` 的 `use client` directive 提示，无错误。
- `node scripts/check-progress.mjs`：覆盖 v1 unlocked 0–13、旧全完成、异常 JSON/非法数值/版本、v2 保存恢复与 Reset 墓碑、v1 原键保留、存储访问失败。
- 工程外备份逐文件 SHA256 校验通过；受保护文件与备份再比对无变化。
- 实际 in-app 浏览器打开本地开发页：九个标题和 ID 正确；四幅本地图 `complete && naturalWidth>0`；FinalQuiz 在 `#reliability #final`，没有 `section#final`；逐章继续可到九章；§9 完成本轮后刷新仍有九章；测验选择后正确数变化；复习滚动回 §1；重置后刷新为零章，首页开始后为 §1，刷新仍恢复 §1。浏览器曾从既有本地进度显示六章；其来源键无法由只读 DOM 检查确认，故不把该观察当作 v1 浏览器迁移测试。

## 6. 尚未验证与风险

- 浏览器内无法模拟 localStorage 抛异常或直接注入 v1 的 0–13 个状态；这些由脚本隔离验证。建议手工在独立浏览器配置文件中分别写入旧状态，刷新核对新解锁数、保留的 v1 原值，再点 Reset 并刷新确认不会重导。
- 本轮未逐一操作所有论文实验台的所有控件，也未做移动端或跨浏览器视觉验收；旧组件本身未改，除 FigureWalk 图号筛选。建议手工依 §1→§9 逐章点击每个实验台，并在窄屏核查长标题、小节头和四幅图片。
- `activeId` 随滚动同步，尚无 Sidebar/底栏消费者；长章节快速滚动和浏览器原生滚动恢复的极端时序需要下一轮联调。
- §2 的直接回答分支目前仅有文字解释，现有工具实验维持原有两态；§8 的原图案例未新增切换式分面实验。这符合本轮只做结构迁移的范围，后续内容轮次若要求完整交互，应另行实现。
- `sourceRefs` 当前显示为整章来源串，小节可在下一内容轮次进一步精细对应；不能将其视为每句话均已重新核验原论文。

## 7. 下一轮导航接口

Sidebar 与底部导航读取 `chapters` 的稳定 ID/标题及 `TutorialProgress`：`unlocked` 判可访问范围，`completed` 判继续学习前沿，`activeId` 判滚动当前章，`review` 判回顾状态。导航点击应滚动到 `chapter.id`，由滚动监听同步 `activeId`，不能把导航点击直接写成当前章。FinalQuiz 只在 §9 内 `#final`，不加入章节列表。下一轮需共用 `loadProgress`/`saveProgress` 与 App 的状态操作，保持 Reset 只覆盖 v2，不触碰 v1。
