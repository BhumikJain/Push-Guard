# PushGuard

PushGuard is a lightweight VS Code extension that helps prevent you from accidentally closing your editor with uncommitted or unpushed Git changes. It provides a simple reminder and a direct way to commit and push your changes — right from within the editor.

## 🚀 Features

- 🔔 **Push Reminder**: Warns you when uncommitted or unpushed changes are detected in your workspace.
- 📝 **Commit Prompt**: Asks for a commit message and runs `git add`, `git commit`, and `git push` automatically.
- ✅ **Quick Push Option**: Push directly from the warning dialog without opening the terminal.
- ❌ **Dismiss Option**: Dismiss the warning if you're not ready to push — without blocking VS Code shutdown.
- 💡 **Lightweight and non-intrusive**: No background processes, just smart hooks at the right moments.

> Note: Due to VS Code API limitations, the extension cannot block window shutdown directly. Instead, PushGuard triggers warnings based on file saves, command invocations, or periodically.

## 📸 Preview

![PushGuard Screenshot](https://github.com/user-attachments/assets/95c204ff-e001-42fa-a24d-6609b1ebd746)

## ⚙️ Requirements

- Git must be installed and available in your system `PATH`.
- The workspace must be a Git repository with a valid remote (`origin`) and current branch.

## 🧩 Extension Settings

Currently, there are no configurable settings. Future versions may allow:

- Customizing the trigger conditions (on save, on interval, etc.)
- Enabling/disabling push guard per workspace

## 🎯 Usage

1. Make some changes in a Git-tracked project.
2. Save or run the `PushGuard: Push Now` command from the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
3. If uncommitted or unpushed changes exist, you'll be prompted to commit and push.
4. Provide a commit message and confirm.
5. Your changes will be committed and pushed to the current branch on `origin`.

## 🐞 Known Issues

- Cannot detect window close/shutdown directly due to VS Code limitations.
- Only supports the first folder in a multi-root workspace.
- Currently assumes `origin` as the remote and pushes to the current branch.

## 📦 Release Notes

### 1.0.0

- Initial release of PushGuard
- Detects uncommitted and unpushed changes
- Warns user and allows commit + push directly from prompt

## 💡 Contributing

Feel free to open issues or contribute improvements!

## 📚 Resources

- [VS Code Extension API Docs](https://code.visualstudio.com/api)
- [Git CLI Reference](https://git-scm.com/docs)

---

**Stay safe and never forget to push again with PushGuard!**
