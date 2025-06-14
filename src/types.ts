export interface CodeChangeTracker {
    totalLinesAdded: number;
    notificationsEnabled: boolean;
    lastNotificationTime: number;
    lastSaveCheckTime: number;
    startTime: number;
    timeToReachThreshold: number;
    filesChanged: Set<string>;
    sessionStartTime: number;
    currentSessionLines: number;
    currentSessionFiles: Set<string>;
    totalSessionTime: number;
}