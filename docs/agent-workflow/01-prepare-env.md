# 功能一：自动准备环境

1. 获取或更新 `https://github.com/ReductTech/PaperSkill`；
2. 根据参与者权限使用官方仓库或个人 Fork；
3. 检查 Node.js 20+、npm、Git、Git 身份和 GitHub 连接；命令行尚未获得 GitHub 授权时，调用官方登录流程并等待参与者确认；
4. 找到当前 Agent 的 Skill 根目录；
5. 在 Windows 上优先运行：

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\setup-participant.ps1 `
     -AgentSkillsDirectory "<Agent Skill 根目录>" `
     -InstallMissingTools `
     -ReplaceExistingSkill
   ```

6. 其他系统执行等价检查和复制操作；
7. 将仓库中的 `paper-skill/` 视为唯一来源，核对安装目录中的版本和完整文件指纹均与仓库一致；即使版本号相同，只要文件内容不同也必须用仓库副本替换；
8.  重新加载 Agent 后确认能够识别 `paper-skill`。

只有 Fork 确认、管理员权限、缺失的 Git 身份和 Agent 重载需要参与者操作。
