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

## 后端合同与接入点

`scripts/lib/paperskill-lifecycle.js` 保留三个注入操作 `lookup(identity)`、`withdraw(identity, context)` 和 `restore(identity, context)`。测试使用模拟接口，生产预演入口未装配业务传输。

- 查验要求返回远端版本 ID、来源仓库、数据库环境、版本键、网页路径及公开状态。后端应明确区分查无记录、归属冲突、已撤回和活跃状态。
- 撤回与恢复应接收相同身份字段、部署 SHA、部署 ID、服务端认可的顺序标记、期望旧状态及幂等操作键。响应应明确最终版本 ID、发布状态、是否发生变化及对应的操作身份。同键重试应可读回已完成结果。
- 写入前须在服务端事务内校验版本归属及顺序。软撤回保留论文、同篇其他版本、贡献者、历史评分和审计记录。超时后须能按操作键或版本 ID 查询结果，避免盲目重发。正式路由、结构、鉴权、幂等、顺序与保留语义由后端合同确定。
- 接入正式 API 后，在调用模块中装配传输和超时处理，为生产写入设置单独开关与权限，把确认后的状态及操作回执持久化到同步账本。执行端还需复用 `scripts/lib/github-publication.js` 的部署核验和 ID 归属约束。

`npm run test:publication-reconciliation` 在临时 Git 仓库和模拟接口上验证上述行为。仓库侧工作流只产生审阅报告。
