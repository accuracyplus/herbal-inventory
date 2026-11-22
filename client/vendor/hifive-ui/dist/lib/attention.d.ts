/**
 * D-063 (accepted 21 Nov 2026): when a system that affects a person is down,
 * that app's logo carries an amber dot wherever it appears (the dock, the apps
 * grid, rows in Waiting for you), with one line of words. It clears itself
 * when the check passes. Staff get no Morning check tile; the panel stays
 * admin-only. The dot reports a fault, not something unread, so Part P's
 * no-unread-dots rule still holds.
 *
 * The dot is never the only carrier: these words go beside it, or are read
 * aloud where there is no room to show them.
 */
export declare const ATTENTION_WORDS = "{app} is slow right now. We're on it.";
/** The one line for an app that is slow: "Performance Hub is slow right now. We're on it." */
export declare function slowLine(appName: string, words?: string): string;
