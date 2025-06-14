import * as vscode from 'vscode';
import * as cp from 'child_process';
import { CodeChangeTracker } from './types';

export async function checkIfGitRepo(workspacePath: string): Promise<boolean> {
    return new Promise((resolve) => {
        cp.exec('git rev-parse --git-dir', { cwd: workspacePath }, (error) => {
            resolve(!error);
        });
    });
}

export async function hasUncommittedChanges(workspacePath: string): Promise<boolean> {
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

export async function hasUnpushedCommits(workspacePath: string): Promise<boolean> {
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

export async function getCurrentBranch(workspacePath: string): Promise<string> {
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

export async function commitAndPush(workspacePath: string, tracker: CodeChangeTracker) {
    const hasUncommitted = await hasUncommittedChanges(workspacePath);
    if (!hasUncommitted) {
        vscode.window.showInformationMessage('No changes to commit.');
        return;
    }

    const totalLines = tracker.totalLinesAdded;
    const fileCount = tracker.filesChanged.size;
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

export async function pushOnly(workspacePath: string) {
    const hasUnpushed = await hasUnpushedCommits(workspacePath);
    if (!hasUnpushed) {
        vscode.window.showInformationMessage('No commits to push.');
        return;
    }

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
            if (error && error.code !== 0) {
                reject(`Command '${command}' failed with exit code ${error.code}: ${stderr || error.message}`);
            } else {
                if (stderr && !stderr.includes('warning')) {
                    console.warn(`Git command warning: ${stderr}`);
                }
                resolve(stdout);
            }
        });
    });
}