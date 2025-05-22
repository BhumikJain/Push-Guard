import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';

/**
 * Tracks code changes and manages notification state for the Push Guard extension
 */
let codeChangeTracker = {
    totalLinesAdded: 0,
    notificationsEnabled: false,
    lastNotificationTime: 0,
    startTime: 0,
    timeToReach30Lines: 0,
    filesChanged: new Set<string>(),
    sessionStartTime: 0,
    currentSessionLines: 0,
    currentSessionFiles: new Set<string>(),
    totalSessionTime: 0
};

/**
 * Extension activation entry point
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('Push Guard extension is now active!');

    codeChangeTracker.sessionStartTime = Date.now();
    codeChangeTracker.startTime = Date.now();

    const disableCommand = vscode.commands.registerCommand('push-guard.disable', () => {
        const config = vscode.workspace.getConfiguration('pushGuard');
        config.update('enabled', false, vscode.ConfigurationTarget.Workspace);
        vscode.window.showInformationMessage('Push Guard disabled for this workspace');
    });

    const enableCommand = vscode.commands.registerCommand('push-guard.enable', () => {
        const config = vscode.workspace.getConfiguration('pushGuard');
        config.update('enabled', true, vscode.ConfigurationTarget.Workspace);
        vscode.window.showInformationMessage('Push Guard enabled for this workspace');
    });

    const resetCounterCommand = vscode.commands.registerCommand('push-guard.resetCounter', () => {
        codeChangeTracker.totalLinesAdded = 0;
        codeChangeTracker.notificationsEnabled = false;
        codeChangeTracker.lastNotificationTime = 0;
        codeChangeTracker.startTime = Date.now();
        codeChangeTracker.timeToReach30Lines = 0;
        codeChangeTracker.filesChanged.clear();
        codeChangeTracker.sessionStartTime = Date.now();
        codeChangeTracker.currentSessionLines = 0;
        codeChangeTracker.currentSessionFiles.clear();
        codeChangeTracker.totalSessionTime = 0;
        vscode.window.showInformationMessage('Push Guard: Code counter reset');
    });

    const showStatsCommand = vscode.commands.registerCommand('push-guard.showStats', () => {
        const stats = getCurrentStats();
        vscode.window.showInformationMessage(stats);
    });

    context.subscriptions.push(disableCommand, enableCommand, resetCounterCommand, showStatsCommand);

    /**
     * Monitor document changes to track code modifications
     */
    let documentChangeListener = vscode.workspace.onDidChangeTextDocument((event) => {
        if (event.document.uri.scheme === 'file') {
            trackCodeChanges(event);
        }
    });

    context.subscriptions.push(documentChangeListener);

    /**
     * Periodic check for uncommitted changes (every minute, notifications every 15 minutes)
     */
    let interval = setInterval(async () => {
        if (codeChangeTracker.notificationsEnabled) {
            const now = Date.now();
            const timeSinceLastNotification = now - codeChangeTracker.lastNotificationTime;
            const fifteenMinutes = 15 * 60 * 1000;
            
            if (timeSinceLastNotification >= fifteenMinutes) {
                const shouldNotify = await checkForUncommittedChanges();
                if (shouldNotify) {
                    codeChangeTracker.lastNotificationTime = now;
                    codeChangeTracker.totalSessionTime = now - codeChangeTracker.sessionStartTime;
                }
            }
        }
    }, 60000);

    context.subscriptions.push({
        dispose: () => clearInterval(interval)
    });
}

/**
 * Tracks code changes in supported file types and updates counters
 */
async function trackCodeChanges(event: vscode.TextDocumentChangeEvent) {
    const fileName = event.document.fileName.toLowerCase();
    const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.html', '.css', '.scss', '.less', '.vue', '.svelte'];
    
    if (!codeExtensions.some(ext => fileName.endsWith(ext))) {
        return;
    }

    let linesChanged = 0;
    
    for (const change of event.contentChanges) {
        if (change.text !== undefined) {
            const newLines = change.text.split('\n').length - 1;
            const deletedLines = change.rangeLength > 0 ? 
                event.document.getText(change.range).split('\n').length - 1 : 0;
            
            if (change.rangeLength > 0) {
                linesChanged += Math.max(newLines, deletedLines);
            } else if (newLines > 0) {
                linesChanged += newLines;
            } else if (change.text.length > 0) {
                linesChanged += 1;
            }
        }
    }

    if (linesChanged > 0) {
        const filePath = event.document.fileName;
        
        codeChangeTracker.totalLinesAdded += linesChanged;
        codeChangeTracker.filesChanged.add(filePath);
        codeChangeTracker.currentSessionLines += linesChanged;
        codeChangeTracker.currentSessionFiles.add(filePath);
        
        console.log(`Push Guard: Total lines changed: ${codeChangeTracker.totalLinesAdded} in ${codeChangeTracker.filesChanged.size} files`);
        
        if (!codeChangeTracker.notificationsEnabled && codeChangeTracker.totalLinesAdded >= 30) {
            codeChangeTracker.notificationsEnabled = true;
            codeChangeTracker.lastNotificationTime = 0;
            codeChangeTracker.timeToReach30Lines = Date.now() - codeChangeTracker.startTime;
            
            await show30LinesMilestone();
        }
    }
}

/**
 * Shows congratulatory message when 30 lines milestone is reached
 */
async function show30LinesMilestone() {
    const timeMessage = formatTime(codeChangeTracker.timeToReach30Lines);
    const fileCount = codeChangeTracker.filesChanged.size;
    const fileText = fileCount === 1 ? 'file' : 'files';
    
    const message = `🛡️ Push Guard: Congratulations! You've made changes to ${codeChangeTracker.totalLinesAdded} lines of code across ${fileCount} ${fileText} in ${timeMessage}. Guard notifications are now active!`;
    
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
                            await commitAndPush(folder.uri.fsPath);
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

/**
 * Formats milliseconds into human-readable time string
 */
function formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
}

/**
 * Returns formatted statistics about current coding session
 */
function getCurrentStats(): string {
    const totalTime = Date.now() - codeChangeTracker.sessionStartTime;
    const totalTimeFormatted = formatTime(totalTime);
    const fileCount = codeChangeTracker.filesChanged.size;
    const fileText = fileCount === 1 ? 'file' : 'files';
    
    return `📊 Push Guard Stats: ${codeChangeTracker.totalLinesAdded} lines changed in ${fileCount} ${fileText} over ${totalTimeFormatted}`;
}

/**
 * Checks all workspace folders for uncommitted changes and triggers notifications
 */
async function checkForUncommittedChanges(): Promise<boolean> {
    const config = vscode.workspace.getConfiguration('pushGuard');
    const enabled = config.get('enabled', true);
    
    if (!enabled) {
        return false;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return false;
    }

    for (const folder of workspaceFolders) {
        const hasGit = await checkIfGitRepo(folder.uri.fsPath);
        if (hasGit) {
            const hasUncommitted = await hasUncommittedChanges(folder.uri.fsPath);
            const hasUnpushed = await hasUnpushedCommits(folder.uri.fsPath);
            
            if (hasUncommitted || hasUnpushed) {
                await showPushGuardReminder(folder.uri.fsPath);
                return true;
            }
        }
    }
    return false;
}

/**
 * Checks if directory is a Git repository
 */
async function checkIfGitRepo(workspacePath: string): Promise<boolean> {
    return new Promise((resolve) => {
        cp.exec('git rev-parse --git-dir', { cwd: workspacePath }, (error) => {
            resolve(!error);
        });
    });
}

/**
 * Checks for uncommitted changes in Git repository
 */
async function hasUncommittedChanges(workspacePath: string): Promise<boolean> {
    return new Promise((resolve) => {
        cp.exec('git status --porcelain', { cwd: workspacePath }, (error, stdout) => {
            if (error) {
                resolve(false);
                return;
            }
            resolve(stdout.trim().length > 0);
        });
    });
}

/**
 * Checks for unpushed commits in Git repository
 */
async function hasUnpushedCommits(workspacePath: string): Promise<boolean> {
    return new Promise((resolve) => {
        cp.exec('git log @{u}..HEAD --oneline', { cwd: workspacePath }, (error, stdout) => {
            if (error) {
                resolve(false);
                return;
            }
            resolve(stdout.trim().length > 0);
        });
    });
}

/**
 * Gets the current Git branch name
 */
async function getCurrentBranch(workspacePath: string): Promise<string> {
    return new Promise((resolve) => {
        cp.exec('git branch --show-current', { cwd: workspacePath }, (error, stdout) => {
            if (error) {
                resolve('main');
                return;
            }
            resolve(stdout.trim() || 'main');
        });
    });
}

/**
 * Displays Push Guard reminder with session statistics and action options
 */
async function showPushGuardReminder(workspacePath: string) {
    const hasUncommitted = await hasUncommittedChanges(workspacePath);
    const hasUnpushed = await hasUnpushedCommits(workspacePath);
    
    const totalFileCount = codeChangeTracker.filesChanged.size;
    const totalFileText = totalFileCount === 1 ? 'file' : 'files';
    const totalSessionTime = Date.now() - codeChangeTracker.sessionStartTime;
    const totalTimeFormatted = formatTime(totalSessionTime);
    
    let baseMessage = '';
    if (hasUncommitted && hasUnpushed) {
        baseMessage = '🛡️ Push Guard: You have uncommitted changes and unpushed commits.';
    } else if (hasUncommitted) {
        baseMessage = '🛡️ Push Guard: You have uncommitted changes.';
    } else if (hasUnpushed) {
        baseMessage = '🛡️ Push Guard: You have unpushed commits waiting to be secured.';
    } else {
        return;
    }

    const progressMessage = `\n📈 Total progress: ${codeChangeTracker.totalLinesAdded} lines changed in ${totalFileCount} ${totalFileText}\n⏱️ Total session time: ${totalTimeFormatted}`;
    const fullMessage = baseMessage + progressMessage + '\n\nSecure your code now?';

    const action = await vscode.window.showWarningMessage(
        fullMessage,
        { modal: false },
        'Commit & Push',
        'Just Push',
        'Skip This Time',
        'Show Stats',
        'Disable Push Guard'
    );

    switch (action) {
        case 'Commit & Push':
            await commitAndPush(workspacePath);
            break;
        case 'Just Push':
            await pushOnly(workspacePath);
            break;
        case 'Show Stats':
            const stats = getCurrentStats();
            vscode.window.showInformationMessage(stats);
            break;
        case 'Disable Push Guard':
            const config = vscode.workspace.getConfiguration('pushGuard');
            await config.update('enabled', false, vscode.ConfigurationTarget.Workspace);
            vscode.window.showInformationMessage('🛡️ Push Guard disabled for this workspace. Your code is on its own now!');
            break;
        case 'Skip This Time':
        default:
            break;
    }
}

/**
 * Commits all changes and pushes to remote repository
 */
async function commitAndPush(workspacePath: string) {
    const totalLines = codeChangeTracker.totalLinesAdded;
    const fileCount = codeChangeTracker.filesChanged.size;
    const defaultMessage = `Update code - ${totalLines} lines across ${fileCount} files`;

    const commitMessage = await vscode.window.showInputBox({
        prompt: '🛡️ Push Guard: Enter your commit message',
        placeHolder: 'Describe what you changed...',
        value: defaultMessage,
        validateInput: (value) => {
            if (!value || value.trim().length === 0) {
                return 'Commit message cannot be empty';
            }
            return null;
        }
    });

    if (!commitMessage) {
        return;
    }

    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: '🛡️ Push Guard: Securing your code...',
        cancellable: false
    }, async (progress) => {
        try {
            progress.report({ increment: 25, message: 'Adding files...' });
            await executeGitCommand('git add .', workspacePath);
            
            progress.report({ increment: 25, message: 'Committing changes...' });
            await executeGitCommand(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, workspacePath);
            
            progress.report({ increment: 25, message: 'Pushing to remote...' });
            const branch = await getCurrentBranch(workspacePath);
            await executeGitCommand(`git push origin ${branch}`, workspacePath);
            
            progress.report({ increment: 25, message: 'Code secured!' });
            vscode.window.showInformationMessage('🛡️ Push Guard: Your code is now safely pushed to the remote repository!');
        } catch (error) {
            vscode.window.showErrorMessage(`🛡️ Push Guard failed to secure your code: ${error}`);
        }
    });
}

/**
 * Pushes existing commits to remote repository
 */
async function pushOnly(workspacePath: string) {
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: '🛡️ Push Guard: Pushing your commits...',
        cancellable: false
    }, async (progress) => {
        try {
            const branch = await getCurrentBranch(workspacePath);
            await executeGitCommand(`git push origin ${branch}`, workspacePath);
            vscode.window.showInformationMessage('🛡️ Push Guard: Your commits are now safely pushed!');
        } catch (error) {
            vscode.window.showErrorMessage(`🛡️ Push Guard failed to push: ${error}`);
        }
    });
}

/**
 * Executes Git command with error handling
 */
async function executeGitCommand(command: string, workspacePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        cp.exec(command, { cwd: workspacePath }, (error, stdout, stderr) => {
            if (error) {
                reject(error.message);
                return;
            }
            if (stderr && !stderr.includes('warning')) {
                reject(stderr);
                return;
            }
            resolve(stdout);
        });
    });
}

export function deactivate() {}