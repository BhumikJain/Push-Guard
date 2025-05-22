import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    console.log('Push Guard extension is now active!');

    // Register the command to disable warnings
    let disableCommand = vscode.commands.registerCommand('push-guard.disable', () => {
        const config = vscode.workspace.getConfiguration('pushGuard');
        config.update('enabled', false, vscode.ConfigurationTarget.Workspace);
        vscode.window.showInformationMessage('Push Guard disabled for this workspace');
    });

    // Register the command to enable warnings
    let enableCommand = vscode.commands.registerCommand('push-guard.enable', () => {
        const config = vscode.workspace.getConfiguration('pushGuard');
        config.update('enabled', true, vscode.ConfigurationTarget.Workspace);
        vscode.window.showInformationMessage('Push Guard enabled for this workspace');
    });

    context.subscriptions.push(disableCommand, enableCommand);

    // Listen for when VS Code is about to close
    vscode.workspace.onWillSaveTextDocument(async (event) => {
        // This is a workaround since there's no direct onBeforeClose event
        // We'll check periodically if there are uncommitted changes
    });

    // Check for uncommitted changes periodically
    let interval = setInterval(async () => {
        await checkForUncommittedChanges();
    }, 30000); // Check every 30 seconds

    context.subscriptions.push({
        dispose: () => clearInterval(interval)
    });
}

async function checkForUncommittedChanges() {
    const config = vscode.workspace.getConfiguration('pushGuard');
    const enabled = config.get('enabled', true);
    
    if (!enabled) {
        return;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return;
    }

    for (const folder of workspaceFolders) {
        const hasGit = await checkIfGitRepo(folder.uri.fsPath);
        if (hasGit) {
            const hasUncommitted = await hasUncommittedChanges(folder.uri.fsPath);
            const hasUnpushed = await hasUnpushedCommits(folder.uri.fsPath);
            
            if (hasUncommitted || hasUnpushed) {
                await showPushGuardReminder(folder.uri.fsPath);
            }
        }
    }
}

async function checkIfGitRepo(workspacePath: string): Promise<boolean> {
    return new Promise((resolve) => {
        cp.exec('git rev-parse --git-dir', { cwd: workspacePath }, (error) => {
            resolve(!error);
        });
    });
}

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

async function showPushGuardReminder(workspacePath: string) {
    const hasUncommitted = await hasUncommittedChanges(workspacePath);
    const hasUnpushed = await hasUnpushedCommits(workspacePath);
    
    let message = '';
    if (hasUncommitted && hasUnpushed) {
        message = '🛡️ Push Guard: You have uncommitted changes and unpushed commits. Secure your code!';
    } else if (hasUncommitted) {
        message = '🛡️ Push Guard: You have uncommitted changes. Don\'t lose your work!';
    } else if (hasUnpushed) {
        message = '🛡️ Push Guard: You have unpushed commits waiting to be secured!';
    } else {
        return;
    }

    const action = await vscode.window.showWarningMessage(
        message,
        { modal: false },
        'Commit & Push',
        'Just Push',
        'Skip This Time',
        'Disable Push Guard'
    );

    switch (action) {
        case 'Commit & Push':
            await commitAndPush(workspacePath);
            break;
        case 'Just Push':
            await pushOnly(workspacePath);
            break;
        case 'Disable Push Guard':
            const config = vscode.workspace.getConfiguration('pushGuard');
            await config.update('enabled', false, vscode.ConfigurationTarget.Workspace);
            vscode.window.showInformationMessage('🛡️ Push Guard disabled for this workspace. Your code is on its own now!');
            break;
        case 'Skip This Time':
        default:
            // Do nothing, will remind again later
            break;
    }
}

async function commitAndPush(workspacePath: string) {
    const commitMessage = await vscode.window.showInputBox({
        prompt: '🛡️ Push Guard: Enter your commit message',
        placeHolder: 'Describe what you changed...',
        value: 'Update code',
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