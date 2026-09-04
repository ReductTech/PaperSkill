# 功能一：自动准备环境

Agent 在执行其他步骤前，应先完成以下确认，具体步骤：

1. 获取或更新 `https://github.com/ReductTech/PaperSkill`；
2. 根据使用者权限使用官方仓库或个人 Fork；
3. 检查 Node.js 20+、npm、Git、Git 身份和 GitHub 连接；命令行尚未获得 GitHub 授权时，调用官方登录流程并等待使用者确认；
4. 找到当前 Agent 的 Skill 根目录；
5. 根据操作系统运行对应的自动配置入口。Windows 使用：

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\setup-participant.ps1 `
     -AgentSkillsDirectory "<Agent Skill 根目录>" `
     -InstallMissingTools `
     -ReplaceExistingSkill
   ```

   macOS 或 Linux 使用：

   ```bash
   chmod +x ./scripts/setup-participant.sh
   ./scripts/setup-participant.sh \
     --agent-skills-directory "<Agent Skill 根目录>" \
     --install-missing-tools \
     --replace-existing-skill
   ```

   Shell 脚本会自动识别 macOS 的 Homebrew，或 Linux 的 apt、dnf、yum、pacman、zypper、apk。两个系统入口均会在 Paper Skill 内部标识和完整文件指纹一致时跳过安装；替换参数只用于在检测到差异时自动更新。需要管理员权限、安装 Xcode Command Line Tools 或刷新终端环境时，应暂停并让使用者确认后继续；
6. 将仓库中的 `paper-skill/` 视为唯一来源，核对安装目录中的内部标识和完整文件指纹均与仓库一致；即使内部标识相同，只要文件内容不同也必须用仓库副本替换。内部标识仅用于仓库维护和自动校验，不向使用者展示，也不要求使用者填写；
7. 重新加载 Agent 后确认能够识别 `paper-skill`。

