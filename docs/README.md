# 文档索引

以下四份文件是当前仓库的完整文档入口：

| 文件 | 使用者 | 用途 |
| --- | --- | --- |
| [AGENT_WORKFLOW.md](AGENT_WORKFLOW.md) | Agent | 从环境准备、Skill 安装、项目生成和人工修改协作，到校验与 Pull Request 准备的全流程规范 |
| [RUBRIC.md](RUBRIC.md) | 参与者、教师 | 评分权重和至少三项实质性修改的判定标准 |
| [PARTICIPATING.md](PARTICIPATING.md) | Agent、参与者 | 分支、完整项目导入、本地校验、Pull Request 和失败处理 |
| [SUBMISSION.md](SUBMISSION.md) | 参与者、教师 | GitHub 作品与考核外部材料的提交边界 |

Agent 执行采用菜单模式：`docs/AGENT_WORKFLOW.md` 为入口，Agent 收到参与者从根 `README.md` 复制的指令后，先展示功能菜单由参与者选择，再读取 `docs/agent-workflow/` 下对应的说明文件执行（功能1-5各占一个文件）。

参与者通常只需先看仓库根目录的 `README.md` 和 `RUBRIC.md`。其余文件由 Agent 按功能选择读取；遇到 GitHub 提交或自动检查问题时，再查看 `PARTICIPATING.md`。
