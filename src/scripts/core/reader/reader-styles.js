/**
 * @fileoverview CSS styles for the floating reader-page UI elements.
 * Extracted from progress-tracker.js to keep style definitions separate from logic.
 * Injected into the page via <style> tags by ProgressTracker.
 * @module core/reader/reader-styles
 */

/**
 * CSS for the floating bottom-left status picker button shown on reader pages.
 * @type {string}
 */
export var STATUS_BUTTON_CSS = `
    .bmh-reader-status-btn {
        position: fixed;
        bottom: 24px;
        left: 24px;
        z-index: 2147483646;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 50px;
        color: #fff;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        animation: bmh-status-btn-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    .bmh-reader-status-btn:hover {
        transform: translateY(-3px) scale(1.04);
        box-shadow: 0 12px 32px rgba(0,0,0,0.6);
        border-color: rgba(255,255,255,0.2);
    }
    .bmh-reader-status-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
        transition: background 0.3s ease;
        box-shadow: 0 0 8px currentColor;
    }
    .bmh-reader-status-label {
        white-space: nowrap;
    }
    @keyframes bmh-status-btn-in {
        from { opacity: 0; transform: translateY(16px) scale(0.9); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
    }
`;

/**
 * CSS for the floating bottom-right toast notification shown when a new entry is added.
 * @type {string}
 */
export var NOTIFICATION_CSS = `
    .bmh-notification {
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        color: #ffffff;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.08);
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 2147483647;
        opacity: 0;
        transform: translateY(20px) scale(0.95);
        transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .bmh-notification.bmh-show {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
    .bmh-notification-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(16, 185, 129, 0.15);
        border-radius: 50%;
        width: 28px;
        height: 28px;
        color: #10b981;
        flex-shrink: 0;
    }
    .bmh-notification-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    .bmh-notification-title {
        font-weight: 600;
        color: #f1f5f9;
    }
    .bmh-notification-message {
        color: #94a3b8;
        font-size: 12px;
    }
`;
