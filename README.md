# Push Guard

Push Guard is an intelligent VS Code extension that helps prevent you from losing your work by tracking code changes and reminding you to commit and push to Git. It monitors your coding progress, provides smart notifications, and integrates seamlessly with Git to keep your work secure.

## 🚀 Features

### Smart Code Tracking
- 📊 **Line Change Counter**: Tracks lines modified across supported file types.
- ⏱️ **Session Time Tracking**: Monitors coding duration and milestone achievements.
- 📁 **Multi-File Support**: Tracks changes in multiple files across your workspace.
- 🎯 **Configurable Milestone**: Activates notifications after a customizable line threshold (default: 30 lines).
- 📈 **Productivity Stats**: Shows lines changed, files modified, session time, and lines per minute.

### Intelligent Push Reminders
- 🔔 **Periodic Notifications**: Reminds you at configurable intervals (default: 15 minutes) about uncommitted or unpushed changes.
- 🛡️ **Status Bar Updates**: Displays lines changed in the status bar, clickable to view stats or commit.
- 🚨 **Close Protection**: Warns you before closing VS Code if changes are pending (Alt+F4 or Cmd+Q).
- 💾 **Save Protection**: Checks for pending changes on file save, with configurable frequency to support auto-save.
- 📈 **Progress Insights**: Includes session stats in all notifications for context.

### Git Integration
- 📝 **Smart Commit Messages**: Auto-generates commit messages based on lines and files changed.
- ✅ **Quick Push Option**: Push existing commits without new commits.
- 🔄 **Automatic Git Operations**: Handles `git add`, `git commit`, and `git push` seamlessly.
- 🌿 **Branch Detection**: Automatically pushes to the current branch.

### User Control
- ⚙️ **Enable/Disable Commands**: Toggle Push Guard per workspace.
- 🔄 **Reset Counter**: Reset tracking statistics to start fresh.
- 📊 **Show Stats Command**: View detailed session statistics anytime.
- ❌ **Skip Options**: Dismiss notifications when not ready to commit.
- 🛠️ **Configurable Settings**: Customize line thresholds, notification intervals, and save checks.

### Supported File Types
- **JavaScript/TypeScript**: `.js`, `.ts`, `.jsx`, `.tsx`
- **Python**: `.py`
- **Web Technologies**: `.html`, `.css`, `.scss`, `.less`, `.vue`, `.svelte`
- **Mobile/Native**: `.swift`, `.kt`, `.java`
- **Systems Programming**: `.cpp`, `.c`, `.cs`, `.go`, `.rs`
- **Other Languages**: `.php`, `.rb`

## 📸 Preview

![PushGuard Screenshot](https://github.com/user-attachments/assets/95c204ff-e001-42fa-a24d-6609b1ebd746)

## ⚙️ Requirements

- **Git**: Must be installed and available in your system `PATH`.
- **Git Repository**: Workspace must be a Git repository with a valid remote (`origin`) and current branch.
- **Supported Files**: Tracks changes in supported file types (see list above).

## 🧩 Extension Settings

Customize Push Guard via VS Code settings:
- `pushGuard.enabled`: Enable/disable Push Guard for the workspace (default: `true`).
- `pushGuard.linesThreshold`: Number of lines changed to enable notifications (default: `30`).
- `pushGuard.notificationInterval`: Interval in minutes for periodic notifications (default: `15`).
- `pushGuard.checkOnSave`: Check for unpushed changes when saving files (default: `true`).
- `pushGuard.checkOnSaveInterval`: Minimum interval in minutes between save-triggered checks to prevent notification spam with auto-save (default: `5`).

Example `settings.json`:
```json
{
  "pushGuard.enabled": true,
  "pushGuard.linesThreshold": 50,
  "pushGuard.notificationInterval": 30,
  "pushGuard.checkOnSave": true,
  "pushGuard.checkOnSaveInterval": 5,
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000
}
```

## 🎯 Usage

### Automatic Tracking
1. Open a Git repository in VS Code.
2. Start coding in supported file types.
3. Push Guard tracks line changes and updates the status bar.
4. After reaching the line threshold (default: 30), notifications activate.
5. Periodic reminders (default: every 15 minutes) check for uncommitted/unpushed changes.
6. Save a file to trigger a check (if `pushGuard.checkOnSave` is enabled, limited by `pushGuard.checkOnSaveInterval`).

### Manual Commands
Access via Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`):
- **Push Guard: Enable**: Enable Push Guard for the workspace.
- **Push Guard: Disable**: Disable Push Guard for the workspace.
- **Push Guard: Reset Counter**: Reset tracking statistics.
- **Push Guard: Show Stats**: View detailed session statistics.
- **Push Guard: Commit and Push**: Manually commit and push changes.
- **Push Guard: Check Before Closing**: Check for pending changes before closing VS Code.

### Notification Actions
When prompted about pending changes, choose:
- **Commit & Push**: Commit with a custom message and push.
- **Just Push**: Push existing commits.
- **Show Stats**: View detailed session stats.
- **Skip This Time/Close Anyway**: Dismiss the notification.
- **Disable Push Guard**: Turn off Push Guard for the workspace.

## 🔧 How It Works

1. **Code Monitoring**: Listens for changes in supported file types.
2. **Progress Tracking**: Counts lines added/modified and files changed.
3. **Milestone Detection**: Activates notifications after the line threshold.
4. **Periodic Checks**: Checks Git status every minute, notifies based on configured interval.
5. **Save Protection**: Checks on file save, debounced to avoid spam with auto-save.
6. **Close Protection**: Warns on window close or file save if changes are pending.
7. **Smart Statistics**: Provides productivity insights in notifications and stats.

## 🐞 Known Issues

- Limited to Git repositories; other SCM systems are not supported.
- Multi-root workspaces may trigger notifications for each Git repository.
- Line counting includes both additions and modifications.
- Close detection relies on `Alt+F4`/`Cmd+Q` or file saves due to VS Code API limitations.

## 🔧 Troubleshooting

- **Push errors**: Ensure Git is installed, and the repository has a valid remote (`origin`). Check error messages for details (e.g., "Permission denied" may indicate authentication issues).
- **Excessive notifications with auto-save**: Set `pushGuard.checkOnSaveInterval` to a higher value (e.g., 10 minutes) or disable `pushGuard.checkOnSave`.
- **No notifications**: Verify `pushGuard.enabled` is `true` and the workspace is a Git repository.
- **Intrusive notifications**: Adjust `pushGuard.notificationInterval` or disable `pushGuard.checkOnSave` in settings.

## 📦 Release Notes

### 0.0.3
**Auto-Save Support and Enhancements**
- ✨ **NEW**: Debounced save checks to support auto-save (`files.autoSave: afterDelay`).
- ✨ **NEW**: `pushGuard.checkOnSaveInterval` setting to control save check frequency.
- ✨ **NEW**: Notification suppression to avoid redundant prompts.
- 🚀 **IMPROVED**: Refined notification logic for better UX with frequent saves.
- 🐞 **FIXED**: Potential notification spam with auto-save enabled.
- ✨ **NEW**: Status bar for passive line change tracking.
- ✨ **NEW**: Configurable line threshold and notification interval.
- ✨ **NEW**: Enhanced statistics with lines per minute.
- ✨ **NEW**: File save checks and close protection.
- 🚀 **IMPROVED**: Error handling for Git commands with detailed messages.
- 🚀 **IMPROVED**: Pre-checks for commit/push to prevent unnecessary operations.
- 🐞 **FIXED**: Push errors due to misinterpretation of Git warnings.
- 🐞 **FIXED**: Unified command namespace to push-guard.

### 0.0.2
- Smart code change tracking and milestone notifications.
- Support for multiple programming languages.
- Auto-generated commit messages and progress stats.

### 0.0.1
- Initial release with basic Git status checking and push reminders.

## 💡 Contributing

Contributions are welcome! Fork the repository, make changes, and submit a pull request. Report issues or feature requests on [GitHub](https://github.com/BhumikJain/Push-Guard).

## 📜 License

MIT License. See [LICENSE](https://github.com/BhumikJain/Push-Guard/blob/production/LICENSE).

## 🌟 Share the Love

I’m excited to share Push Guard on LinkedIn to showcase its features and gather feedback from the developer community. Try it out, share your thoughts, and help make it even better!

---

**Code with confidence - Push Guard has your back! 🛡️**
```