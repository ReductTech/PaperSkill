# PR 合并后的 PaperSkill 数据库同步

PR 合并进 `main` 后，新增的 `Sync PaperSkill database` 工作流读取各版本的 `paper.json`，以 `multipart/form-data` 调用对方的 `create_version`。同步不执行教程代码，不需要安装教程依赖，也不涉及另一个仓库的 AI 评分。

## 当前自动跳过策略（2026-10-30）

只有能从 `paperUrl` 或明确的覆盖配置取得有效 `arxiv_id` 的版本，才进入自动评分和新建版本入库队列。只有 DOI、博客链接等无明确 arXiv ID 的版本记录为 `skipped`，保留网页发布，不打分、不发送创建请求，不因此使工作流失败。以后补齐 arXiv 链接即可重新进入队列。不会根据标题猜测标识，也不会删除已经存在的数据库记录。

对方业务 `code=404` 确认未创建的论文也作为 `skipped/paper_not_found` 单独记录，继续处理其他版本。缺少被跳过的祖先时暂缓提交该后续版本。格式错误、待核对请求、鉴权、网络或 GitHub 状态保存错误仍作为真实错误报告，不能把此类故障标成成功。

网页部署使用本仓库 `scripts/create-score-manifest.py`，按已提交的 `html_output/<paper>/<version>/paper.json` 识别项目，忽略目录说明文件。完整站点照常发布；`score-manifest.json` 只列出评分队列，并用 `published_versions`、`skipped_versions` 区分全部发布数量与自动跳过清单。若全站均无可评分版本，则不发送空评分任务。

评分仓库必须同时应用 `eligible_paths` 配套改动：在导入历史分数前读取部署清单，排除清单外的历史回写任务。原有历史评分、冻结清单和成功回执仍保留，不把排除项伪造成入库成功；补齐标识、重新部署后可以重新加入。只修改 PaperSkill 的过滤不能修复评分仓库旧的全量等待逻辑。

## 维护者首次启用

1. 将本次脚本、工作流和配置文件通过 PR 合并到 `main`。
2. 在仓库 **Actions → Sync PaperSkill database → Run workflow** 选择 `main`，保持 `apply=false`。默认预览全部历史版本；`only` 可填写 `attention_is_all_you_need/wangjiahao1025`，预览该版本及其祖先。预览不会请求接口或写入同步状态。
3. 下载本次运行的 `paperskill-sync-report` artifact，检查其中的 `blocked`。缺 GitHub 用户名或无 arXiv/DOI 的项目不会伪造数据，会列出原因。可以先同步其他正常版本，再逐步补齐。
4. **先登记已经存在的数据库记录**：在 `catalog/paperskill-overrides.json` 中填写已知版本的真实 `remote_id`。对方截图里数据库已经有部分版本，本接口没有提供查重/查询能力；不登记时无法辨认这些历史记录，可能再次创建。`remote_id` 必须来自对应环境的真实入库结果，并且表示该记录已与当前元数据一致。
5. 在仓库 **Settings → Secrets and variables → Actions → Variables** 新建：

   | 名称 | 值 |
   | --- | --- |
   | `PAPERSKILL_SYNC_ENABLED` | `true`：开启主分支更新后的自动同步 |
   | `PAPERSKILL_API_BASE_URL` | `https://app.reduct.cn`，正式服务器 |

6. 在 Actions 手动运行一次，勾选 `apply=true`。第一次可填写一个尚未入库的 `only` 版本做联调；留空则补录全部符合条件的历史版本。真正发送失败时在报告中查看结果。
7. 此后每次 PR 合并更新 `main`，自动化会重新扫描：已同步且数据相同的跳过；新版本创建并保存返回的 `data.id`；此前因缺字段未能提交的版本，在补齐后自动处理。直接推送到 `main` 也会触发。

无需在 Apifox 手工填写全部版本，也无需配置其测试环境。脚本使用完整 URL。工作流独立于 Pages 发布，不会被 Pages 工作流的取消机制中断；这里的入库成功不代表网页文件已上传到对方服务器。

## PR、发布、评分和入库的接线

当前流程是：PR 结构/身份/构建检查 → `Auto_Merge` 根据检查结果合并 → `main` 同时触发网页发布与创建数据库版本 → 网页发布成功后通知 `PS_auto_score` → 评分仓库保存评分并调用 `update_ai_score`。创建记录与评分有时间差时，评分仓库保留评分、重试回写，不重复创建版本。质量评分发生在发布后，不是 PR 合并前的内容审核。

需要核对的仓库配置：

| 仓库 | Actions Variables | Actions Secrets / 前置条件 |
| --- | --- | --- |
| `ReductTech/PaperSkill` | `PAPERSKILL_SYNC_ENABLED=true`；评分端准备好后设置 `PAPERSKILL_SCORE_ENABLED=true` | 已有通知需要 `AUTO_MERGE_DISPATCH_TOKEN`；评分清单生成和通知需要 `AUTO_MERGE_APP_ID`、`AUTO_MERGE_PRIVATE_KEY` |
| `1223BETTYYANG/Auto_Merge` | `DRY_RUN=false` 才会真实合并 | `AUTO_MERGE_APP_ID`、`AUTO_MERGE_PRIVATE_KEY`；App 安装到 PaperSkill，并有合并和读取检查权限 |
| `1223BETTYYANG/PS_auto_score` | `AUTO_SCORE_ENABLED=true`、`SCORE_MODE=model`；数据库目标与 PaperSkill 保持一致 | `NEW_API_KEY`、App ID/私钥；App 可读写评分仓库及私有状态仓库 `PS_auto_score_state`；私有评分记忆已初始化 |

配置位置均为对应仓库的 **Settings → Secrets and variables → Actions**。不要把密钥放到 Variables 或代码里，也不必再次创建已经正确配置的 Secret。代码文件存在不代表这些云端配置已启用；首次应以一条真实新版本 PR 验证整个链路。

评分接线在 `.github/workflows/deploy-pages.yml` 中由 `PAPERSKILL_SCORE_ENABLED` 控制。未开启时沿用普通网页发布；开启后使用本仓库的清单生成器，生成带部署 SHA 与资源校验和的 `score-manifest.json`，并仅在 Pages 部署成功后通知评分仓库。清单生成不再依赖旧的私有评分工具提交；通知仍要求 App 可访问个人账户对应的 `PS_auto_score`。

`Auto_Merge` 对修改工作流的 PR 会跳过自动合并，因此这次接线改动需要维护者合并；日常教程 PR 仍按其已有规则处理。已有论文优化的 fork workflow 若等待人工授权，当前合并工具不会代为批准。调度与模型/API 耗时也不保证在固定分钟数内完成。

评分仓库应用 arXiv-only 配套改动后，历史回写只验收当前评分清单中的版本，排除项仍保留历史记录。对方暂未创建版本行时，合格评分保留并继续重试回写；真实服务或模型故障仍可能使验收未完成。需以一次实际云端发布、通知、评分和回写验证全链路。

## 字段转换

| 接口字段 | 来源 |
| --- | --- |
| `version_name` | 版本目录名 / `version` |
| `version_date` | `versionDate`，必须为完整有效日期 |
| `user_display_name` | `participants[0].name` |
| `user_github_name` | `participants[0].github`，去掉开头的 `@` |
| `page_path` | `papers/<paperName>/<version>/`，相对路径 |
| `arxiv_id` | 从 arXiv `paperUrl` 或明确覆盖配置解析；仅有 DOI 则跳过 |
| `ancestors` | 将 `github/version` 转换为 `user_github_name/version_name`，`JSON.stringify` 后作为单个表单值 |
| `tags` | `topics` 用英文逗号连接 |
| `uuid` | 默认不发送；只有明确的覆盖配置或确认后的可选映射才发送 |

当前接口每版只有一组作者字段；多作者版本将报告问题，不能静默丢掉其他作者。来源是会议网站、GitHub、公众号等链接时，不猜测 arXiv/DOI。

覆盖文件示例（以下值仅示范格式，请用真实数据替换）：

```json
{
  "example_paper/alice1027": {
    "arxiv_id": "1706.03762",
    "user_github_name": "alice"
  },
  "another_paper/bob1027": {
    "doi": "10.1000/example",
    "remote_id": 123
  }
}
```

可覆盖字段是 `arxiv_id`、`doi`、`user_display_name`、`user_github_name`、`uuid`、`remote_id`。覆盖 arXiv/DOI 时只提供其中一种。未知字段会报错。原始 `paper.json` 不必增加不符合现有 schema 的字段。

恢复历史待核对请求时，还支持维护字段 `confirmed_missing_fingerprint`：只有对方明确确认旧请求未创建记录后，才填写该旧请求的 SHA-256，并修正论文标识。它仅允许匹配该旧摘要的 `pending/uncertain` 项以不同的新请求再次提交；新请求再超时不会被这个旧确认重复放行。此字段不上传给对方。已成功的 `synced` 项不受这个字段影响。

`participants[].jianlunId` 是否等于接口的 `uuid` 尚未经确认，因此默认不发送。确认两者相同后，才将 Actions variable `PAPERSKILL_INCLUDE_JIANLUN_UUID` 设为 `true`；个别版本也可以显式覆盖 `uuid`。预览和报告不输出 UUID 值。

## 认证

Apifox 的截图显示父级认证组件已删除，不能据此判断服务器是否需要认证。默认请求不附带认证头，先以实际结果联调。如果对方提供所需请求头，将 JSON 对象存入 Actions **Secret** `PAPERSKILL_API_HEADERS`，例如：

```json
{"Authorization":"Bearer 实际令牌"}
```

不要把令牌放入代码、普通 variable、覆盖文件或报告。不要设置 `Content-Type`，Node 的 `FormData` 会生成带 boundary 的 multipart 请求头。

## 状态、失败与重复创建

自动化使用同一仓库的独立分支 `paperskill-sync-state` 保存 `paperskill-sync-state.json`，包含每个版本的数据库 ID、提交数据摘要及状态。该分支首次从默认分支创建，不更改 `main`。可通过 variable `PAPERSKILL_STATE_BRANCH` 更换独立状态分支名。工作流需要对此分支具有 `contents: write` 权限；若组织规则禁止创建/更新分支，需要管理员为该状态分支配置相应权限。

状态不依赖短期 cache 或 artifact。报告 artifact 只是供查看，数据库 ID 的持久保存依赖状态分支。首次运行时间与符合条件的历史版本数成正比；为控制 GitHub 写入速率，状态检查点至少间隔 1.5 秒。不要删除状态分支或状态文件，否则会失去已入库记录的凭据。

GitHub 状态存储遇到网络错误、HTTP 429 或 5xx 时，会有限重试并逐步延长等待。保存请求的结果不确定时，先读回状态：内容已经保存则直接继续；仍为旧 SHA 才重试保存；其他写入改变了 SHA 则停止，避免覆盖。此重试仅针对 GitHub 状态存储，不会重发数据库的创建 POST。权限错误不会按临时服务错误重试。

如果日志显示 `created` 后出现 GitHub 保存失败，数据库记录已经创建，不能删除状态后重新导入。下载该次运行的报告，找到对应版本的 `created` 项及 `id`，把这个真实 ID 填入覆盖文件的 `remote_id` 后再运行。即使流程中断，报告仍保留已处理记录及其 ID；新版日志也直接显示 ID，Summary 会显示已处理数量及中断提示。

每个 POST 前先保存 `pending`，得到 HTTP 成功、JSON `code=200` 和有效数字 `data.id` 后记为 `synced`。下一次检查点或本轮结束时保存成功结果。如果发生超时、非 JSON、未明确含义的业务失败或流程被中断，该版本保持 `pending/uncertain`，后续运行不会盲目重发。

- 已实际创建：向覆盖文件添加真实 `remote_id`，运行后登记该 ID。
- 已确认没有创建：从状态分支文件移除对应待核对的版本项，再运行。
- 缺必填数据：修正元数据或覆盖文件；未发送的版本下次可以正常处理。
- 祖先未同步：先解决祖先版本；脚本按祖先在前的顺序提交。
- 部分失败：成功记录仍会保存，工作流显示失败并上传问题报告；修复后再次运行或等待下一次合并。

接口负责人已确认：HTTP 200 且业务 `code=404` 表示在对方论文库中找不到传入标识，没有创建版本。状态文件保留 `not_found`，报告记为 `skipped/paper_not_found`，继续处理其他论文。同一请求下次不会重发；修正标识、改变请求后可再次尝试。HTTP 404、含矛盾版本 ID 的业务 404、认证/服务器故障或结果不明确时仍停止本轮其他新请求（`deferred`）。已经成功的记录仍会保存。预期跳过不使任务失败；`blocked` 或 `uncertain` 仍使工作流失败，因此须结合分类计数判断实际入库进度。

2026-10-29 对接确认 `boosting_continual_learning_of_vision_language_models_via_mixture_of_experts_adapters/songchenyi1011` 的 DOI 请求未入库，对方库仅收录 arXiv 标识。覆盖配置改为 `2403.11549`（https://arxiv.org/abs/2403.11549），并以 `confirmed_missing_fingerprint` 登记该次旧 DOI 请求的核对结果。

对方的接口没有提供幂等键、已存在版本查询或通用更新接口，因此无法声称跨系统实现严格的“恰好一次”。状态检查点用于防止自动重复发送，结果不确定时仍需要核对。

**已入库版本的作者、论文标识、标签或溯源被修改时，脚本会报告需要更新接口，不会把 create 当成 update 再插入一条。** 按现有仓库流程，修改教程应创建新版本，新版本合并后会自动创建记录；仅修改同一路径下的教程源码且元数据不变时，无需改变数据库记录。删除/改名也不会自动删除旧数据库行。若要求同步这些行为，需对方补充 upsert/update/delete 的接口合同。

2026-11-19 正式接口切换为 `https://app.reduct.cn/Web/V1/Paperskill/create_version`。接口负责人确认测试环境的内容、版本 ID 和评分记录已复制到正式环境。本次沿用原 `paperskill-sync-state` 分支和完整 `versions`，自动将旧 `https://php-testbed-lyx.reduct.cn/Web/V1/Paperskill/create_version` 的状态头单向迁移到正式地址，并在发送任何新请求前先持久保存；Git 历史保留原状态。已入库 ID、元数据摘要、`pending/uncertain` 待核对项及 `not_found` 跳过项均不重置，已经成功的版本不会重新创建。

本规则只适用于上述已确认复制的两个接口地址；其他地址仍严格隔离，不能将任意测试库 ID 混用。无需新建状态分支、重新登记历史版本或全量重入库。如设置了 Actions Variable `PAPERSKILL_API_BASE_URL`，同步改为 `https://app.reduct.cn`；评分端 `PS_SCORE_DATABASE_BASE_URL` 保持同一正式域名。`page_path`、作者字段及其他接口参数保持原样。`coconut-yzp/Auto_Merge` 只调用 GitHub API，无业务入库域名需要调整。

## 本地使用

需要 Node.js 20+，无新增 npm 依赖。

```powershell
# 只检查数据，不进行网络请求
npm run sync:paperskill

# 预览单个版本及其祖先
npm run sync:paperskill -- --only attention_is_all_you_need/wangjiahao1025

# 实际上传；本地状态保存在 tmp/paperskill-sync/state.json
npm run sync:paperskill -- --apply --only attention_is_all_you_need/wangjiahao1025

# 验证转换、真实 multipart、本地模拟响应、去重和中断恢复
npm run test:paperskill-sync
```

本地状态与 Actions 状态彼此独立。不要用两份空状态向同一数据库重复上传；正式操作优先使用 Actions，或明确复用它的状态。报告默认在 `tmp/paperskill-sync/report.json`，工作目录已加入 `.gitignore`。

## 网页文件

本接口不接收 HTML/JS/CSS/图片，只保存版本信息和页面相对路径。对方网站若要独立展示完整交互教程，仍须约定构建文件的上传/托管流程。这次自动化不假定存在尚未提供的文件上传接口。
