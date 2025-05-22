# PushGuard

PushGuard is an intelligent VS Code extension that helps prevent you from losing your work by tracking your coding progress and reminding you to commit and push your Git changes. It actively monitors your code modifications and provides smart notifications to keep your work secure.

## 🚀 Features

### Smart Code Tracking
- 📊 **Line Change Counter**: Tracks the number of lines you've modified across multiple files
- ⏱️ **Session Time Tracking**: Monitors how long you've been coding and when you reach milestones
- 📁 **Multi-File Support**: Tracks changes across all supported code file types
- 🎯 **30-Line Milestone**: Celebrates when you've made substantial progress and activates push notifications

### Intelligent Push Reminders
- 🔔 **Periodic Notifications**: Reminds you every 15 minutes (after reaching 30 lines) if you have uncommitted/unpushed changes
- 📈 **Progress Statistics**: Shows your total lines changed, files modified, and session time in notifications
- 🛡️ **Gentle Persistence**: Non-intrusive reminders that help without interrupting your flow

### Git Integration
- 📝 **Smart Commit Messages**: Auto-generates commit messages based on your coding statistics
- ✅ **Quick Push Option**: Push existing commits without additional commits
- 🔄 **Automatic Git Operations**: Handles `git add`, `git commit`, and `git push` seamlessly
- 🌿 **Branch Detection**: Automatically detects and pushes to your current branch

### User Control
- ⚙️ **Enable/Disable Commands**: Toggle PushGuard on/off per workspace
- 🔄 **Reset Counter**: Reset your coding statistics and start fresh
- 📊 **Show Stats Command**: View your current coding session statistics anytime
- ❌ **Skip Options**: Dismiss notifications when you're not ready to commit

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

- Git must be installed and available in your system `PATH`
- The workspace must be a Git repository with a valid remote (`origin`) and current branch
- Supported file types for code tracking (see list above)

## 🧩 Extension Settings

PushGuard includes a configuration setting:
- `pushGuard.enabled`: Enable/disable PushGuard for the current workspace (default: `true`)

## 🎯 Usage

### Automatic Tracking
1. Start coding in any supported file type
2. PushGuard automatically tracks your line changes and time spent coding
3. Once you reach 30 lines of changes, you'll get a congratulatory milestone message
4. After the milestone, PushGuard will check every 15 minutes for uncommitted/unpushed changes

### Manual Commands
Access these commands via Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`):

- **`PushGuard: Enable`** - Enable PushGuard for current workspace
- **`PushGuard: Disable`** - Disable PushGuard for current workspace  
- **`PushGuard: Reset Counter`** - Reset all tracking statistics and start fresh
- **`PushGuard: Show Stats`** - View current session statistics

### Notification Actions
When PushGuard detects uncommitted/unpushed changes, you can:
- **Commit & Push**: Add, commit with a custom message, and push changes
- **Just Push**: Push existing commits without making new ones
- **Show Stats**: View detailed statistics about your coding session
- **Skip This Time**: Dismiss the notification (will remind again in 15 minutes)
- **Disable Push Guard**: Turn off PushGuard for this workspace

## 🔧 How It Works

1. **Code Monitoring**: PushGuard listens for document changes in supported file types
2. **Progress Tracking**: Counts line additions, modifications, and tracks files changed
3. **Milestone Detection**: Activates notifications once you've made substantial progress (30+ lines)
4. **Periodic Checks**: Every minute, checks for Git status; notifies every 15 minutes if changes exist
5. **Smart Statistics**: Provides meaningful progress information in all notifications

## 🐞 Known Issues

- Cannot detect window close/shutdown directly due to VS Code limitations
- Line counting considers both additions and modifications as changes
- Periodic checks run every minute but notifications are limited to 15-minute intervals
- Currently assumes `origin` as the remote and pushes to the current branch

## 📦 Release Notes

### 0.0.2
**Major Feature Release**
- ✨ **NEW**: Smart code change tracking with line counters
- ✨ **NEW**: Session time tracking and milestone celebrations  
- ✨ **NEW**: Progress statistics in all notifications
- ✨ **NEW**: Support for 15+ programming languages and file types
- ✨ **NEW**: 30-line milestone system with congratulatory messages
- ✨ **NEW**: Reset counter and show stats commands
- 🚀 **IMPROVED**: Smarter notification timing (15-minute intervals)
- 🚀 **IMPROVED**: Auto-generated commit messages with statistics
- 🚀 **IMPROVED**: Enhanced user experience with progress tracking

### 0.0.1
- Initial release of PushGuard
- Basic detection of uncommitted and unpushed changes
- Simple warning system with commit + push functionality

## 💡 Contributing

Feel free to open issues or contribute improvements! PushGuard is designed to be lightweight yet powerful, helping developers maintain good Git hygiene without being intrusive.

## 📚 Resources

- [VS Code Extension API Docs](https://code.visualstudio.com/api)
- [Git CLI Reference](https://git-scm.com/docs)

---

**Code with confidence - PushGuard has your back! 🛡️**