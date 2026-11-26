# 论文网页撤回预演

Pages 的 `deploy` job 成功后，`reconcile-publication` 使用只读权限核对部署 SHA、工作流运行及尝试编号、GitHub Pages 部署状态和该次构建上传的 `github-pages` 制品 ID。脚本从 GitHub Actions API 取得该制品的可信 SHA-256，下载原始 ZIP 并在打开 ZIP 前强制校验摘要。摘要缺失、格式无效、下载失败或不一致都会停止预演。校验通过后，脚本只读取 ZIP 内的 `artifact.tar`，将站点索引和网页入口与同一提交的 Git 跟踪文件逐版核对。报告分别记录 ZIP 摘要、内部 TAR 摘要和网页入口的 SHA-256。完整清单包含非 arXiv 版本，评分开关独立控制评分流程。

预演按 GitHub 上账本分支的提交 SHA 读取 `paperskill-sync-state.json`。账本分支缺失、权限不足、环境不匹配或数据异常时，报告停止原因。GitHub 的查询使用 GET，账本读取固定在一次不可变的提交上。

报告步骤独立等待 Pages 部署，不阻塞评分通知。执行过程中若 `main` 前进、最近部署被替换、部署状态改变或账本前进，预演停止。本轮扫描比较完整现状与账本，通过 Git 第一父链定位删除，前一次预演缺失或被取消时，下一次最新成功部署仍可找到有完整历史证据的候选。

## 报告和判定

在对应的 Pages 工作流运行详情下载 `paperskill-publication-preview-<run_id>-<attempt>`。

- `deployed-versions.json` 包含仓库、部署提交、运行及制品 ID、GitHub Actions ZIP 和内部 TAR 的独立校验和、全部论文版本和各网页入口校验和。
- `reconciliation.json` 包含 `withdraw`、`restore` 和 `blocked`。每项可追溯到版本、远端数字 ID、旧网页路径、归属核对凭据及 Git 证据。撤回证据包括删除提交、其第一父提交和被删除的路径。空的 `remaining_versions` 表示同篇当前没有其他发布版本。操作的最小粒度始终为版本 ID。
- `apply_allowed` 固定为 `false`。重复预演同一次部署会为同一候选生成相同的 `operation_key`。报告可以在后续部署发生时失效，未来执行接口须在写入前重新核验。
- 当前 Git 树仍有版本文件、元数据不可读、部署或制品验证失败时，以停止报告为准。非 arXiv 版本仍进入完整部署清单，历史记录缺乏明确 arXiv 标识时列入阻止项。一次消失超过 10 个已同步且未撤回版本，或账本至少 10 个已同步版本且消失比例超过 20% 时停止所有候选。
- 当前版本只有在第一父链上有从完整元数据及网页入口到整个版本前缀消失的同一次变更时，才具备自动识别所需的删除证据。分多次删除且先移除元数据的情况列入 `whole_directory_deletion_unproven`，报告提示维护者核对删除元数据与删除剩余文件的两个提交，以及对应的远端版本归属。
- #535 只清理 #519 留下的扁平产物。仍在部署清单中的合法版本不进入撤回候选。

## 确认版本归属与恢复状态

维护者需要依据数据库负责人提供的查验记录，确认数字 ID、版本键、网页路径和数据库环境。确认后可在部署提交中提供 `catalog/paperskill-ownership.json`。以下为格式示例。

```json
{
  "schema_version": 1,
  "repository": "ReductTech/PaperSkill",
  "endpoint": "https://app.reduct.cn/Web/V1/Paperskill/create_version",
  "versions": {
    "example_paper/alice1124": {
      "id": 123,
      "page_path": "papers/example_paper/alice1124/",
      "reference": "已核实记录的审计编号"
    }
  }
}
```

未登记、归属不一致或多个账本版本共用一个 ID 的项目进入 `blocked`。账本的 `synced` 及 ID 表示创建或认领记录，正式远端的当前归属还需要后端查询合同。已有撤回回执可随版本记录提供 `"publication": {"status": "withdrawn", "source_sha": "<成功撤回对应的提交 SHA>" }`。脚本核对该提交上的版本缺失、其后重新加入版本以及当前发布入口，生成同一远端 ID 的恢复候选。本阶段预演只读取这类回执。

## 删除联调与启用

后端提供的操作是向 [delete_version](https://app.reduct.cn/Web/V1/Paperskill/delete_version) 发送 `POST`，以 `multipart/form-data` 传入必填整数版本 ID `id`，将该版本的网页状态更新为删除。客户端从可核实的同步账本取值，只发送对应版本 ID。当前仓库的创建接口使用 multipart 并支持通过 `PAPERSKILL_API_HEADERS` 配置请求头。删除响应须为 HTTP 200 且可解析为 JSON，业务成功码、鉴权和重复删除语义仍待独立确认。 [Apifox 项目](https://app.apifox.com/project/5867189)

仓库变量 `PAPERSKILL_DELETE_ENABLED` 默认为关闭。仅当其设为 `true`，且同一次 Pages 部署成功时，才启动写入 job。该 job 独立于原有入库和评分通知流程。暂定契约沿用创建接口的鉴权方式及业务成功码 `200`。可以用 `PAPERSKILL_DELETE_CONTRACT` 覆盖。正式删除须在真实接口联调成功后启用。

- 暂定鉴权为 `create-headers`，与创建接口共用 `PAPERSKILL_API_HEADERS`，未设置时使用空鉴权头。可显式选择 `none`，也可用 `delete-headers` 和 `PAPERSKILL_DELETE_HEADERS` 配置独立鉴权。
- `successCode` 暂定为整数 `200`。客户端核对 HTTP 200、整数 `code`、字符串 `msg`，并要求 `data.id` 与发送的整数 ID 一致。模拟测试覆盖暂定业务码及显式覆盖。重复删除仍走人工核对。
- 启用前由后端确认删除仅影响该 ID 对应的网页版本，并保留同篇其他版本、作者与历史评分。此接口的请求范围是 ID，服务端数据保留语义需要在联调中核实。

写入 job 重新核对当前部署、制品、Git 证据、版本归属和账本。发送请求前，以远端 ID 在独立的 `paperskill-delete-journal.json` 中记录操作意向。部署或账本变化时停止。确认成功后才更新 `paperskill-sync-state.json` 的该版本记录，保留原 ID、入库指纹和删除回执。

接口失败、超时、响应不匹配或账本写入失败时，保留账本原记录和操作意向，交人工核对。操作日志中已有该 ID 时，重复运行会跳过该 ID。网页重新发布时也走人工核对，保留已确认的删除记录。

PR CI 遇到完整删除时跳过已删除的版本。其余教程仍走现有构建入口。有关脚本和测试位于 `.github/scripts/publication/`，以避免纳入评分清单的全局脚本摘要。

在本地或 CI 可运行 `node --test .github/scripts/publication/tests/*.test.js`，测试使用临时 Git 仓库、模拟 GitHub 接口和模拟删除接口。
