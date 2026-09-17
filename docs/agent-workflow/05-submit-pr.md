# 功能五：准备提交 PR

## 0. 准备 Pull Request 内容

Agent 可以先生成以下草稿供使用者核对内容：

**整合进 Pull Request（公开）：**

- Pull Request 标题和说明；
- 主要交互说明及其他；

Agent 可以在仓库外部新建 `PR_MATERIALS/` 目录，生成以下草稿：

- `PR_MATERIALS/01-pr-title-and-description.md` — PR 标题和说明
- `PR_MATERIALS/02-interactions.md` — 主要交互说明及其他

使用者确认后，Agent 整合进 Pull Request 的说明；`PR_MATERIALS/` 不提交到仓库。

## 1. Agent 提交前自动检查（必须全部通过）

Agent 必须针对最终待提交源码亲自运行检查，不得把命令交给使用者代为执行。推荐先运行一键预检：

```powershell
npm run preflight
```

`npm run preflight` 会复现 CI 的检查（`validate`、`validate:pr`、`build:changed`）并预演与基线分支的合并。**退出码非零时不得推送分支或创建 PR**；Agent 必须把预检打印的具体原因告诉使用者，修复后重跑直至通过。预检通过后，再执行以下补充检查：

```powershell
npm run validate
npm run catalog
git restore catalog/papers.json
npm run validate:pr -- main
npm run build:paper -- <paper-name>/<version>
git diff --check main...HEAD
git status --short
```

Agent 还必须检查最终差异，确认目录名称、项目结构、`paper.json`、分支范围和提交格式正确，且不包含 `node_modules/`、`dist/`、自动生成的 `catalog/papers.json`、密钥、个人隐私或本地绝对路径。

组装与生成阶段已经运行过语法门禁：`assemble-chapter-packets.js` 在合并每个 widget 后、以及 `validate-output.js` 在结构校验后，都会用项目自带的 TypeScript/esbuild 解析全部 `src/**`，缺括号或截断的 `.tsx` 会在生成阶段直接失败。若在生成之后又手工改过任何源码，必须先重跑该门禁再导入：

```powershell
node <paper-skill>/scripts/syntax-check.js <生成目录> --require-parser
```

`--require-parser` 在未安装依赖时返回非零，确保不是“跳过解析”而通过。所有自动检查必须针对**最终即将推送的那个 commit**运行；任一文件在检查之后发生改动，都要重新运行全部检查。

任一命令失败或发现格式问题时，必须先定位、修复并重新运行全部相关检查。所有自动检查通过前，不得进入网页预览、推送分支或创建 Pull Request。

## 2. 提交前网页预览（必须由使用者确认）

- 使用最终待提交源码完成构建并启动可运行的本地网页预览；
- 将可直接打开的预览地址提供给使用者，请使用者实际查看关键页面并操作主要交互；
- 同时根据最终的 `<paper-name>/<version>`，在当前对话中展示预计发布地址 `https://reducttech.github.io/PaperSkill/papers/<paper-name>/<version>/`，并提示“这是预计发布地址，该地址此时尚未上线，打开显示404属正常现象。如提交结构无误，提交5分钟内会进行自动审核合并，PR合并且GitHub Pages部署成功后才能访问，也可待邮件提示merged之后在网页进行自己的论文名搜索，确认最终网页。”；
- 请使用者确认桌面端和移动端页面显示、文字、图片、图表、资源加载与主要交互正常；
- 截图可以作为辅助记录，但不能代替使用者打开网页进行预览；
- 未获得使用者明确确认前，不得推送分支或创建 Pull Request。

预计发布地址仅在 Agent 与当前使用者的对话中展示，不写入教程项目、`paper.json`、项目 `README.md`、本地状态文件、PR 材料或 `catalog/papers.json`。

## 3. 技术步骤（Agent 自动执行）

- 获得网页预览确认后，向使用者展示最终改动范围、验证结果和待提交内容；
- 按照使用者开始使用本仓库时已经授予的公开 Pull Request 权限，推送个人分支并创建 Pull Request，无需再次询问是否允许投稿；不得直接推送 `main`。

## 4. 检查失败处理

Pull Request 检查失败时必须先读日志：如果失败发生在仓库校验、构建或范围检查步骤，修复项目后再推送；构建日志里的 `Expected "}" but found end of file` / `Unexpected end of file` 这类错误，优先检查被截断的 `src/modules/*.tsx`（生成阶段语法门禁本应在更早拦住它，说明生成后又改过文件或跳过了门禁）。如果失败发生在获取运行器、下载官方 Action 或访问 GitHub 服务阶段，先查看 GitHub Status，待服务恢复后使用 `Re-run jobs`，不得把平台故障误判为作品错误。
