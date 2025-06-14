import * as vscode from 'vscode';
import { CodeChangeTracker } from './types';
import { getConfig } from './config';
import { showLinesMilestone } from './ui';

export function trackCodeChanges(event: vscode.TextDocumentChangeEvent, statusBarItem: vscode.StatusBarItem, tracker: CodeChangeTracker) {
    const fileName = event.document.fileName.toLowerCase();
    const codeExtensions = [
        '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs',
        '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.html', '.css',
        '.scss', '.less', '.vue', '.svelte'
    ];

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

        tracker.totalLinesAdded += linesChanged;
        tracker.filesChanged.add(filePath);
        tracker.currentSessionLines += linesChanged;
        tracker.currentSessionFiles.add(filePath);

        statusBarItem.text = `Push Guard: ${tracker.totalLinesAdded} lines changed`;

        console.log(`Push Guard: Total lines changed: ${tracker.totalLinesAdded} in ${tracker.filesChanged.size} files`);

        const config = getConfig();
        const linesThreshold = config.get('linesThreshold', 30);

        if (!tracker.notificationsEnabled && tracker.totalLinesAdded >= linesThreshold) {
            tracker.notificationsEnabled = true;
            tracker.lastNotificationTime = 0;
            tracker.timeToReachThreshold = Date.now() - tracker.startTime;

            showLinesMilestone(tracker);
        }
    }
}

export function resetTracker(tracker: CodeChangeTracker) {
    tracker.totalLinesAdded = 0;
    tracker.notificationsEnabled = false;
    tracker.lastNotificationTime = 0;
    tracker.lastSaveCheckTime = 0;
    tracker.startTime = Date.now();
    tracker.timeToReachThreshold = 0;
    tracker.filesChanged.clear();
    tracker.sessionStartTime = Date.now();
    tracker.currentSessionLines = 0;
    tracker.currentSessionFiles.clear();
    tracker.totalSessionTime = 0;
}