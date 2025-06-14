import { CodeChangeTracker } from './types';

export function formatTime(milliseconds: number): string {
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

export function getCurrentStats(tracker: CodeChangeTracker): string {
    const totalTime = Date.now() - tracker.sessionStartTime;
    const totalTimeFormatted = formatTime(totalTime);
    const fileCount = tracker.filesChanged.size;
    const fileText = fileCount === 1 ? 'file' : 'files';
    const totalTimeMinutes = totalTime / 60000;
    const linesPerMinute = totalTimeMinutes > 0 ? tracker.totalLinesAdded / totalTimeMinutes : 0;

    return [
        `📊 Push Guard Stats:`,
        `Total lines changed: ${tracker.totalLinesAdded}`,
        `Files modified: ${fileCount} ${fileText}`,
        `Session duration: ${totalTimeFormatted}`,
        `Lines per minute: ${linesPerMinute.toFixed(2)}`
    ].join('\n');
}