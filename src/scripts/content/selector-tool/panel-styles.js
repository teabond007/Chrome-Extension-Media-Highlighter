/**
 * @fileoverview CSS styles for the Selector Tool panel.
 * Extracted from panel.js to keep style definitions separate from logic.
 * The panel renders inside Shadow DOM so styles are fully isolated.
 * @module selector-tool/panel-styles
 */

/**
 * All CSS rules for the selector panel UI rendered inside Shadow DOM.
 * Injected as a <style> tag by getPanelHTML().
 * @type {string}
 */
export var PANEL_CSS = `
    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }
    .panel {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 1px solid rgba(117, 81, 255, 0.3);
        border-radius: 16px;
        padding: 20px;
        width: 340px;
        color: #fff;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(117, 81, 255, 0.2);
    }
    .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .group-tabs {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 16px;
        max-height: 180px;
        overflow-y: auto;
        padding-right: 4px;
    }
    .group-tab-row {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 8px;
        padding: 6px 10px;
        cursor: pointer;
        transition: all 0.15s ease;
    }
    .group-tab-row:hover {
        background: rgba(117, 81, 255, 0.15);
        border-color: rgba(117, 81, 255, 0.3);
    }
    .group-tab-row.active {
        background: rgba(117, 81, 255, 0.25);
        border-color: rgba(117, 81, 255, 0.5);
    }
    .group-tab-row.complete {
        border-color: rgba(16, 185, 129, 0.4);
    }
    .group-num {
        font-size: 12px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.5);
        min-width: 16px;
    }
    .group-name-input {
        flex: 1;
        background: transparent;
        border: none;
        border-bottom: 1px solid transparent;
        color: #fff;
        font-size: 12px;
        padding: 2px 0;
        font-family: inherit;
        outline: none;
        transition: border-color 0.15s;
        width: 100%;
    }
    .group-name-input:focus {
        border-bottom-color: rgba(117, 81, 255, 0.8);
    }
    .group-name-input::placeholder {
        color: rgba(255, 255, 255, 0.3);
    }
    .group-check-icon {
        display: inline-block;
        width: 10px;
        height: 10px;
        flex-shrink: 0;
    }
    .group-tab-row.complete .group-check-icon {
        mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>');
        -webkit-mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>');
        mask-repeat: no-repeat;
        -webkit-mask-repeat: no-repeat;
        mask-size: contain;
        -webkit-mask-size: contain;
        background-color: #10b981;
    }
    .group-delete-btn {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.4);
        cursor: pointer;
        padding: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.15s;
        flex-shrink: 0;
    }
    .group-delete-btn:hover {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
    }
    .group-add-row-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px dashed rgba(255, 255, 255, 0.2);
        color: rgba(255, 255, 255, 0.6);
        padding: 8px;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.15s;
        width: 100%;
        margin-top: 4px;
    }
    .group-add-row-btn:hover {
        background: rgba(117, 81, 255, 0.2);
        border-color: rgba(117, 81, 255, 0.4);
        color: #fff;
    }
    .panel-title {
        font-size: 16px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .close-btn {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: #fff;
        width: 28px;
        height: 28px;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        transition: background 0.2s;
    }
    .close-btn:hover {
        background: rgba(239, 68, 68, 0.3);
    }
    .field-tabs {
        display: flex;
        gap: 6px;
        margin-bottom: 16px;
    }
    .field-tab {
        flex: 1;
        padding: 8px 4px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: rgba(255, 255, 255, 0.6);
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
    }
    .field-tab:hover {
        background: rgba(117, 81, 255, 0.2);
    }
    .field-tab.active {
        background: rgba(117, 81, 255, 0.3);
        border-color: rgba(117, 81, 255, 0.5);
        color: #fff;
    }
    .field-tab.complete {
        border-color: rgba(16, 185, 129, 0.5);
    }
    .field-tab .tab-check-icon {
        display: inline-block;
        width: 10px;
        height: 10px;
        vertical-align: middle;
    }
    .field-tab.complete .tab-check-icon {
        mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>');
        -webkit-mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>');
        mask-repeat: no-repeat;
        -webkit-mask-repeat: no-repeat;
        mask-size: contain;
        -webkit-mask-size: contain;
        background-color: #10b981;
    }
    .path-display {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        padding: 10px 12px;
        margin-bottom: 16px;
        min-height: 48px;
    }
    .path-display.assigned {
        border-color: rgba(16, 185, 129, 0.4);
    }
    .path-segments {
        font-family: 'Fira Code', 'Consolas', monospace;
        font-size: 11px;
        color: #6AD2FF;
        word-break: break-all;
        line-height: 1.6;
    }
    .path-segment {
        color: #6AD2FF;
    }
    .path-segment.gen-target {
        color: #10b981;
        font-weight: 700;
        background: rgba(16, 185, 129, 0.15);
        padding: 1px 3px;
        border-radius: 3px;
    }
    .path-segment.dimmed {
        color: rgba(255, 255, 255, 0.25);
    }
    .path-separator {
        color: rgba(255, 255, 255, 0.3);
        margin: 0 2px;
    }
    .path-separator.dimmed {
        color: rgba(255, 255, 255, 0.15);
    }
    .path-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 6px;
    }
    .path-badge {
        font-size: 10px;
        padding: 1px 6px;
        border-radius: 4px;
        font-weight: 600;
    }
    .match-badge {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
    }
    .assigned-badge {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
    }
    .depth-controls {
        display: flex;
        gap: 4px;
    }
    .depth-btn {
        background: rgba(16, 185, 129, 0.15);
        border: 1px solid rgba(16, 185, 129, 0.3);
        color: #10b981;
        width: 24px;
        height: 24px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 700;
        transition: all 0.15s;
    }
    .depth-btn:hover {
        background: rgba(16, 185, 129, 0.3);
    }
    .depth-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }
    .path-selector {
        font-family: 'Fira Code', 'Consolas', monospace;
        font-size: 11px;
        color: #6AD2FF;
        word-break: break-all;
        line-height: 1.4;
    }
    .path-empty {
        text-align: center;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.4);
        padding: 8px 0;
    }
    .nav-buttons {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin-bottom: 16px;
    }
    .nav-btn {
        padding: 10px 8px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: #fff;
        font-size: 18px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .nav-btn:hover {
        background: rgba(117, 81, 255, 0.3);
        transform: translateY(-1px);
    }
    .nav-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }
    .action-buttons {
        display: flex;
        gap: 10px;
    }
    .action-btn {
        flex: 1;
        padding: 12px;
        border: none;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
    }
    .confirm-btn {
        background: linear-gradient(135deg, #7551ff, #6AD2FF);
        color: #fff;
    }
    .confirm-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(117, 81, 255, 0.4);
    }
    .save-btn {
        background: linear-gradient(135deg, #10b981, #059669);
        color: #fff;
    }
    .save-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
    }
    .instructions {
        margin-top: 12px;
        padding: 10px;
        background: rgba(117, 81, 255, 0.1);
        border-radius: 8px;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.7);
        text-align: center;
    }
`;
