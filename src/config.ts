import * as vscode from 'vscode';

export function getConfig() {
    return vscode.workspace.getConfiguration('pushGuard');
}