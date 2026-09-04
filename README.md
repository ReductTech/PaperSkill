# Paper Skill：交互式论文教程生成工具

PaperSkill 用于把 AI 与机器学习论文制作成中文交互式教学网页。使用者可以在 Agent 协助下完成环境准备、论文解析、网页生成、人工准确性核验、本地预览，以及可选的仓库导入和 Pull Request 提交。

生成结果是完整的 React + TypeScript（Vite）项目，不是单独的 HTML 文件。项目可以保留在本地使用，也可以经过检查后贡献到本仓库，由 GitHub Pages 构建为公开网页。

**在线教程集合：** https://reducttech.github.io/PaperSkill/#start

## 快速开始

准备一篇机器学习或人工智能论文的 PDF、LaTeX、正文或公开链接，然后把下面的指令发送给支持 Skill 的 Agent：

```text
请访问仓库 https://github.com/ReductTech/PaperSkill，首先读取 docs/AGENT_WORKFLOW.md（菜单模式），不必读取项目中的其他源码，先向我展示功能菜单，由我选择要执行的功能。
```

Agent 应展示以下菜单：

1. 自动准备环境
2. 调用 `paper-skill` 生成网页
3. 人工校验网页准确性
4. 导入主仓库
5. 准备提交 PR

选择功能 1 后，Agent 会检查 GitHub 登录、Node.js、npm、Git 和 Paper Skill；选择功能 2 后，Agent 会读取论文、生成网页并完成基础工程检查。每项功能结束后，Agent 都会重新显示菜单并等待下一次选择。

也可以自行下载仓库并按 [贡献指南](docs/PARTICIPATING.md) 操作，但建议让 Agent 按菜单逐步执行，以免遗漏校验和预览环节。

## 生成后需要确认什么

功能 2 完成后，Agent 会提供本地预览地址和项目文件夹，并提示选择下一项功能。选择功能 3，按照原论文检查：

- 研究问题、方法结构、公式、实验数字和结论是否准确；
- 中文讲解和章节顺序是否足够清楚；
- 交互是否真正表达论文概念，并且操作反馈正确；
- 桌面端和手机端是否存在溢出、遮挡、空白或资源丢失；
- 论文链接与图片等外部素材是否可追溯且允许公开使用。

完成后按照 Agent 的提示明确确认核验结果。只需要本地网页的使用者可以在这里结束；希望贡献到公共教程集合的使用者再选择功能 4 和功能 5。

详细核验要求由 Agent 在功能 3 中展示并引导完成。

## 系统支持

环境配置会根据操作系统自动选择入口：

- Windows 使用 `scripts/setup-participant.ps1` 和 PowerShell/winget；
- macOS、Linux 使用 `scripts/setup-participant.sh`，脚本会识别 Homebrew 或当前 Linux 发行版的包管理器。

两种入口都会检查 Node.js 20+、npm、Git、GitHub 连接和 Paper Skill 完整性。需要账号登录、系统授权或管理员权限时，Agent 会暂停并等待使用者处理。

## 仓库结构

```text
PaperSkill/
|-- docs/               # 使用流程、人工核验和贡献说明
|-- paper-skill/        # 共享生成 Skill，由核心维护者维护
|-- html_output/        # 已导入的完整教程项目
|-- catalog/            # 自动生成的论文索引
|-- portal/             # GitHub Pages 教程集合入口
|-- scripts/            # 环境配置、导入、验证、索引和构建工具
`-- .github/            # PR 模板、自动检查和部署流程
```

贡献到本仓库的教程统一放入 `html_output/<paper-name>/`。`paper-name` 是论文标题全称的小写下划线形式，例如 `attention_is_all_you_need`。不要把教程直接放在仓库根目录，也不要提交 `node_modules/`、`dist/`、论文 PDF、密钥、个人隐私、本地绝对路径或未获授权的素材。

`main` 只通过 Pull Request 合并。创建 Pull Request 前，Agent 必须完成提交格式、目录范围和构建检查，并提供最终网页预览；论文事实与教学质量仍须由使用者人工确认。详细流程见 [文档索引](docs/README.md)。
