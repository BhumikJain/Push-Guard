import * as vscode from 'vscode';
import { resetTracker } from './tracker';
import { commitAndPush, pushOnly, checkIfGitRepo, hasUncommittedChanges, hasUnpushedCommits } from './git';
import { createStatusBarItem, updateStatusBar, showLinesMilestone, showPushGuardReminder } from './ui';
import { getCurrentStats } from './stats';
import { getConfig } from './config';
import { CodeChangeTracker } from './types';
import { trackCodeChanges } from './tracker';

// Tracks code changes and manages notification state
let codeChangeTracker: CodeChangeTracker = {
    totalLinesAdded: 0,
    notificationsEnabled: false,
    lastNotificationTime: 0,
    lastSaveCheckTime: 0,
    startTime: 0,
    timeToReachThreshold: 0,
    filesChanged: new Set<string>(),
    sessionStartTime: 0,
    currentSessionLines: 0,
    currentSessionFiles: new Set<string>(),
    totalSessionTime: 0
};

export function activate(context: vscode.ExtensionContext) {
    console.log('Push Guard extension is now active!');

    codeChangeTracker.sessionStartTime = Date.now();
    codeChangeTracker.startTime = Date.now();

    // Create status bar item
    let statusBarItem = createStatusBarItem();
    context.subscriptions.push(statusBarItem);

    // Register commands
    const disableCommand = vscode.commands.registerCommand('push-guard.disable', async () => {
        await getConfig().update('enabled', false, vscode.ConfigurationTarget.Workspace);
        vscode.window.showInformationMessage('Push Guard disabled for this workspace');
    });

    const enableCommand = vscode.commands.registerCommand('push-guard.enable', async () => {
        await getConfig().update('enabled', true, vscode.ConfigurationTarget.Workspace);
        vscode.window.showInformationMessage('Push Guard enabled for this workspace');
    });

    const resetCounterCommand = vscode.commands.registerCommand('push-guard.resetCounter', () => {
        resetTracker(codeChangeTracker);
        updateStatusBar(statusBarItem, codeChangeTracker);
        vscode.window.showInformationMessage('Push Guard: Code counter reset');
    });

    const showStatsCommand = vscode.commands.registerCommand('push-guard.showStats', () => {
        const stats = getCurrentStats(codeChangeTracker);
        vscode.window.showInformationMessage(stats, { modal: true });
    });

    const commitAndPushCommand = vscode.commands.registerCommand('push-guard.commitAndPush', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open.');
            return;
        }
        const workspacePath = workspaceFolders[0].uri.fsPath;
        await commitAndPush(workspacePath, codeChangeTracker);
    });

    const checkBeforeCloseCommand = vscode.commands.registerCommand('push-guard.beforeClose', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
            const workspacePath = workspaceFolders[0].uri.fsPath;
            const hasChanges = await hasUncommittedChanges(workspacePath);
            if (hasChanges) {
                vscode.window.showWarningMessage('You have uncommitted changes!');
            }
        }
    });

    context.subscriptions.push(
        disableCommand,
        enableCommand,
        resetCounterCommand,
        showStatsCommand,
        commitAndPushCommand,
        checkBeforeCloseCommand
    );

    // Monitor document changes
    let documentChangeListener = vscode.workspace.onDidChangeTextDocument((event) => {
        if (event.document.uri.scheme === 'file') {
            trackCodeChanges(event, statusBarItem, codeChangeTracker);
        }
    });

    // Check on file save with debounce
    let saveListener = vscode.workspace.onDidSaveTextDocument(async (document) => {
        const config = getConfig();
        if (!config.get('checkOnSave', true) || document.uri.scheme !== 'file') {
            return;
        }
        const now = Date.now();
        const checkInterval = config.get('checkOnSaveInterval', 5) * 60 * 1000;
        if (now - codeChangeTracker.lastSaveCheckTime < checkInterval) {
            return;
        }
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
            const hasGit = await checkIfGitRepo(workspaceFolders[0].uri.fsPath);
            if (hasGit) {
                codeChangeTracker.lastSaveCheckTime = now;
                const workspacePath = workspaceFolders[0].uri.fsPath;
                const hasChanges = await hasUncommittedChanges(workspacePath);
                if (hasChanges) {
                    vscode.window.showWarningMessage('You have uncommitted changes!');
                }
            }
        }
    });

    context.subscriptions.push(documentChangeListener, saveListener);

    // Periodic check for uncommitted changes
    let interval = setInterval(async () => {
        const config = getConfig();
        const enabled = config.get('enabled', true);
        if (!enabled || !codeChangeTracker.notificationsEnabled) {
            return;
        }
        const notificationInterval = config.get('notificationInterval', 15);
        const intervalMs = notificationInterval * 60 * 1000;
        const now = Date.now();
        const timeSinceLastNotification = now - codeChangeTracker.lastNotificationTime;

        if (timeSinceLastNotification >= intervalMs) {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            let shouldNotify = false;
            if (workspaceFolders) {
                const workspacePath = workspaceFolders[0].uri.fsPath;
                shouldNotify = await hasUncommittedChanges(workspacePath);
            }
            if (shouldNotify) {
                codeChangeTracker.lastNotificationTime = now;
                codeChangeTracker.totalSessionTime = now - codeChangeTracker.sessionStartTime;
            }
        }
    }, 60000);

    context.subscriptions.push({
        dispose: () => clearInterval(interval)
    });
}

export function deactivate() {}