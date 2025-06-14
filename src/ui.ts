import * as vscode from 'vscode';
import { CodeChangeTracker } from './types';
import { checkIfGitRepo, hasUncommittedChanges, hasUnpushedCommits, commitAndPush, pushOnly } from './git';
import { getCurrentStats, formatTime } from './stats';
import { getConfig } from './config';

export function createStatusBarItem(): vscode.StatusBarItem {
    let statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.command = 'push-guard.showStats';
    statusBarItem.text = `Push Guard: 0 lines changed`;
    statusBarItem.tooltip = 'Click to view stats or commit changes';
    statusBarItem.show();
    return statusBarItem;
}

export function updateStatusBar(statusBarItem: vscode.StatusBarItem, tracker: CodeChangeTracker) {
    statusBarItem.text = `Push Guard: ${tracker.totalLinesAdded} lines changed`;
}

export async function showLinesMilestone(tracker: CodeChangeTracker) {
    const config = getConfig();
    const linesThreshold = config.get('linesThreshold', 30);
    const timeMessage = formatTime(tracker.timeToReachThreshold);
    const fileCount = tracker.filesChanged.size;
    const fileText = fileCount === 1 ? 'file' : 'files';

    const message = `🛡️ Push Guard: Congratulations! You've made changes to ${tracker.totalLinesAdded} lines of code across ${fileCount} ${fileText} in ${timeMessage}. Guard notifications are now active!`;

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
        for (const folder of workspaceFolders) {
            const hasGit = await checkIfGitRepo(folder.uri.fsPath);
            if (hasGit) {
                const hasUncommitted = await hasUncommittedChanges(folder.uri.fsPath);
                const hasUnpushed = await hasUnpushedCommits(folder.uri.fsPath);

                if (hasUncommitted || hasUnpushed) {
                    const action = await vscode.window.showInformationMessage(
                        message + ' Would you like to secure your code now?',
                        'Commit & Push',
                        'Just Push',
                        'Maybe Later'
                    );

                    switch (action) {
                        case 'Commit & Push':
                            await commitAndPush(folder.uri.fsPath, tracker);
                            break;
                        case 'Just Push':
                            await pushOnly(folder.uri.fsPath);
                            break;
                        case 'Maybe Later':
                        default:
                            break;
                    }
                    return;
                }
            }
        }
    }

    vscode.window.showInformationMessage(message);
}

export async function showPushGuardReminder(workspacePath: string, isBeforeClose: boolean, tracker: CodeChangeTracker) {
    const now = Date.now();
    const minNotificationInterval = 60 * 1000; // 1 minute
    if (!isBeforeClose && now - tracker.lastNotificationTime < minNotificationInterval) {
        return;
    }

    const hasUncommitted = await hasUncommittedChanges(workspacePath);
    const hasUnpushed = await hasUnpushedCommits(workspacePath);

    const totalFileCount = tracker.filesChanged.size;
    const totalFileText = totalFileCount === 1 ? 'file' : 'files';
    const totalSessionTime = Date.now() - tracker.sessionStartTime;
    const totalTimeFormatted = formatTime(totalSessionTime);

    let baseMessage = isBeforeClose
        ? '🛡️ Push Guard: You are about to close VS Code with pending changes!'
        : '🛡️ Push Guard: You have pending changes.';

    if (hasUncommitted && hasUnpushed) {
        baseMessage += ' You have uncommitted changes and unpushed commits.';
    } else if (hasUncommitted) {
        baseMessage += ' You have uncommitted changes.';
    } else if (hasUnpushed) {
        baseMessage += ' You have unpushed commits waiting to be secured.';
    } else {
        return;
    }

    const progressMessage = `\n📈 Total Ang total progress: ${tracker.totalLinesAdded} lines changed in ${totalFileCount} ${totalFileText}\n⏱️ Total session time: ${totalTimeFormatted}`;
    const fullMessage = baseMessage + progressMessage + '\n\nSecure your code now?';

    const actions = isBeforeClose
        ? ['Commit & Push', 'Just Push', 'Close Anyway']
        : ['Commit & Push', 'Just Push', 'Skip This Time', 'Show Stats', 'Disable Push Guard'];

    const action = await vscode.window.showWarningMessage(
        fullMessage,
        { modal: isBeforeClose },
        ...actions
    );

    if (action) {
        tracker.lastNotificationTime = now;
    }

    switch (action) {
        case 'Commit & Push':
            await commitAndPush(workspacePath, tracker);
            break;
        case 'Just Push':
            await pushOnly(workspacePath);
            break;
        case 'Show Stats':
            const stats = getCurrentStats(tracker);
            vscode.window.showInformationMessage(stats, { modal: true });
            break;
        case 'Disable Push Guard':
            const config = getConfig();
            await config.update('enabled', false, vscode.ConfigurationTarget.Workspace);
            vscode.window.showInformationMessage('🛡️ Push Guard disabled for this workspace.');
            break;
        case 'Skip This Time':
        case 'Close Anyway':
        default:
            break;
    }
}