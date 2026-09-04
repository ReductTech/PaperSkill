# 参与指南

本文只规定网页项目进入 GitHub 仓库的技术流程。参与者的完整教程项目统一提交到 `html_output/<paper-name>/`，不得放在仓库根目录或其他目录。完整自动化流程见 [AGENT_WORKFLOW.md](AGENT_WORKFLOW.md)，提交要求见 [SUBMISSION.md](SUBMISSION.md)。

## 1. 论文与目录标识

当前阶段不要求预先认领论文。一篇论文对应一个作品目录，目录名是论文名称（论文全称转小写、单词间用下划线连接，例如 `attention_is_all_you_need`）：

```text
html_output/deep_residual_learning_for_image_recognition/
html_output/attention_is_all_you_need/
```

`paperName` 表示论文名称（论文全称转小写、单词间用下划线连接，例如 `attention_is_all_you_need`），同时作为目录名与 `paper.json` 中的唯一标识。最终目录固定为 `html_output/<paper-name>/`。

## 2. 生成项目

`paper-skill/` 是共享生成规范，普通参与者不得修改。请在仓库外的独立工作目录中调用 Skill，生成：

```text
<paper-short-name>_output/
```

完成论文核查和人工修改后，再通过下方导入命令将完整项目复制到本仓库的 `html_output/` 目录。不要手动只提交生成项目中的单个 `index.html`。

## 3. 创建分支并导入

分支命名：

```text
paper/<paper-name>
```

在仓库根目录运行：

```powershell
npm run import -- <生成目录> <paper-name> --title "英文论文名" --paper-url "论文链接" --participant "姓名" --github "GitHub用户名"
```

导入后生成：

```text
html_output/<paper-name>/
```

该目录就是网页项目在 GitHub 中的最终提交位置。后续修改也应在这个目录内完成，不要修改 `html_output/` 或作品目录的名称。

## 4. 项目结构

每篇教程必须包含：

```text
html_output/<paper-name>/
|-- paper.json
|-- README.md
|-- package.json
|-- package-lock.json
|-- index.html
|-- vite.config.ts
|-- tsconfig.json
|-- public/
`-- src/
```

`paper.json` 必须符合 `schemas/paper.schema.json`，并由导入脚本自动生成。参与者无需填写或修改仓库内部追踪字段。其中：

- `paperName` 必须与目录名一致；
- 分支名为 `paper/<paper-name>`；
- 同一 `paperUrl` 对应一个作品目录。

不得提交 `node_modules/`、`dist/`、本地缓存、密钥、个人隐私或未获授权的素材。使用论文图片或其他外部素材时，应在项目 `README.md` 中注明来源并确认允许公开使用。

## 5. 本地验收

创建 Pull Request 前，Agent 必须针对最终待提交源码在仓库根目录自动执行以下命令，不得交给参与者代为执行：

```powershell
npm run validate
npm run catalog
git restore catalog/papers.json
npm run validate:pr -- main
npm run build:paper -- <paper-name>
git diff --check main...HEAD
git status --short
```

`npm run validate:pr` 在普通本地终端中没有 Pull Request 基准信息，会主动跳过；本地验收必须显式追加 `-- main`。
`npm run build:paper` 只安装、检查并构建本次提交的教程，普通参与者不需要在本地重复构建仓库中的全部作品。`npm run build:site` 保留给管理员完整验收、共享构建逻辑修改和 GitHub Pages 正式部署。
`npm run catalog` 用于在本地确认全部 `paper.json` 可以正常生成索引。它会修改 `catalog/papers.json`，普通参与者不得提交该文件，应在创建 Pull Request 前运行 `git restore catalog/papers.json`。索引由管理员在审核发布时基于最新 `main` 统一生成。

Agent 必须继续检查最终差异，确认目录名称、项目结构、`paper.json`、分支范围和提交格式正确，且不包含 `node_modules/`、`dist/`、自动生成的 `catalog/papers.json`、密钥、个人隐私或本地绝对路径。任一检查失败时，必须先修复并重新运行相关检查；不得带错进入预览或 Pull Request 阶段。

还应人工确认：

- 参与者已逐项对照原论文，确认研究问题、方法、公式、模型结构、实验数字、结论和局限准确；
- 已使用最终待提交源码启动网页预览，参与者实际查看并确认桌面端和移动端显示、图片、图表、资源加载与主要交互正常；
- 图片来源和论文链接可追溯；
- 页面中没有个人隐私、密钥或本地绝对路径。

论文内容的人工核验和最终网页预览确认均未完成时，不得创建 Pull Request。截图只能作为辅助记录，不能替代参与者实际打开和操作网页。

## 6. 创建 Pull Request

一份参与者 PR 原则上只修改：

```text
html_output/<paper-name>/
```

普通参与任务不得同时修改 `paper-skill/`、管理脚本、工作流或其他论文目录。Agent 自动检查全部通过，并完成人工内容核验和网页预览确认后，方可推送个人分支并创建 Pull Request；不要直接推送 `main`。

Pull Request 创建后，作品保持 `review` 状态。普通参与者 PR 不提交 `catalog/papers.json`，PR 自动检查也不要求总索引与新增作品同步。

工程和内容检查通过后，由管理员在最新的 `main` 上将作品 `paper.json` 中的 `status` 改为 `published`，运行 `npm run catalog`，并统一提交 `paper.json` 与 `catalog/papers.json`。`npm run build:site` 也会在正式部署时根据全部 `paper.json` 重新生成站点使用的目录索引。

## 7. Pull Request 检查失败时

先点击失败检查的名称或 `View details` 查看日志，不要仅根据红色叉号修改项目：

- 日志已经执行到 `validate`、`validate:pr`、`build:changed` 或 `build:site`：按具体报错修改项目，再提交新的分支提交；
- 日志停在等待托管运行器、下载 `actions/checkout`、`Service Unavailable` 或 GitHub API 错误：这是平台服务问题，先查看 [GitHub Status](https://www.githubstatus.com/)；
- GitHub Actions 恢复后，在检查详情页选择 `Re-run jobs`，无需创建重复提交；
- 检查变成绿色后再合并 Pull Request。不要为了绕过检查直接推送 `main`。
