import { css } from "lit";

export const styles = css`
  :host {
    --maint-panel-max-width: 900px;
    --maint-panel-padding: 24px;
    display: block;
    box-sizing: border-box;
  }

  .container {
    padding: var(--maint-panel-padding);
    max-width: var(--maint-panel-max-width);
    margin: 0 auto;
  }

  h1 {
    font-size: 24px;
    margin-bottom: 4px;
  }

  .page-header {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }

  .page-header h1 {
    margin: 0;
  }

  .title-block {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
    min-width: 240px;
  }

  .page-header button {
    margin-left: auto;
    align-self: center;
  }

  .subtext {
    color: var(--secondary-text-color);
    margin-bottom: 24px;
  }

  .page-header .subtext {
    margin: 0;
  }

  section {
    background: var(--card-background-color);
    border-radius: 12px;
    border: 1px solid var(--divider-color);
    padding: 14px 20px;
    margin-bottom: 24px;
  }

  .tasks-section {
    margin-top: 12px;
    padding: 0;
    overflow: hidden;
  }

  .tasks-section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
  }

  .tasks-section-header h2 {
    margin: 0;
    flex: 1;
  }

  .tasks-create-button {
    margin-left: auto;
  }

  .tasks-section-divider {
    height: 1px;
    width: 100%;
    background: var(--divider-color);
  }

  .tasks-section-content {
    display: flex;
    flex-direction: column;
  }

  .tasks-section-empty {
    margin: 0;
    padding: 14px 20px;
  }

  select,
  input,
  textarea,
  button {
    font: inherit;
  }

  select,
  input,
  textarea {
    width: 100%;
    padding: 8px;
    border-radius: 8px;
    border: 1px solid var(--divider-color);
    box-sizing: border-box;
    background: var(--card-background-color);
    color: var(--primary-text-color);
  }

  textarea {
    resize: vertical;
    min-height: 60px;
  }

  button {
    background-color: var(--primary-color);
    color: var(--text-primary-color);
    border: none;
    border-radius: 8px;
    padding: 10px 16px;
    cursor: pointer;
  }

  button[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .task-list {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .task-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 0;
    width: 100%;
  }

  .task-row + .task-row {
    border-top: 1px solid var(--divider-color);
  }

  maint-task-row + maint-task-row .task-row {
    border-top: 1px solid var(--divider-color);
  }

  .task-details {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-left: 20px;
  }

  .task-description-line {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    flex-wrap: wrap;
  }

  .task-description {
    font-weight: 700;
    font-size: 16px;
    white-space: pre-wrap;
    color: var(--primary-text-color);
    margin-bottom: 2px;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    color: var(--text-primary-color);
    line-height: 1;
  }

  .pill-due {
    background: var(--warning-color);
  }

  .task-meta {
    display: grid;
    grid-template-columns: minmax(120px, auto) minmax(0, 1fr);
    gap: 8px 24px;
    color: var(--secondary-text-color);
    font-size: 14px;
  }

  .task-meta-column {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .task-meta-title {
    font-style: italic;
    font-weight: 700;
    color: var(--secondary-text-color);
  }

  .task-meta-value {
    color: var(--secondary-text-color);
  }

  .task-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
    min-width: 140px;
    padding-right: 20px;
    box-sizing: border-box;
  }

.action-buttons {
  display: flex;
  gap: 8px;
}

  .icon-button {
    background: none;
    color: var(--primary-text-color);
    padding: 8px;
    min-width: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

.icon-button ha-icon {
  width: 20px;
  height: 20px;
}

.tooltipped {
  position: relative;
}

.tooltipped::after {
  content: attr(data-label);
  position: absolute;
  left: 50%;
  bottom: calc(100% + 12px);
  transform: translate(-50%, 4px);
  background: var(--primary-color);
  color: var(--text-primary-color);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 6px 10px;
  white-space: nowrap;
  font-size: 12px;
  opacity: 0;
  pointer-events: none;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.3);
  transition: opacity 0.2s ease 0.6s, transform 0.2s ease 0.6s;
  z-index: 2;
}

.tooltipped::before {
  content: "";
  position: absolute;
  left: 50%;
  bottom: calc(100% + 2px);
  transform: translate(-50%, 8px);
  border: 8px solid transparent;
  border-top-color: var(--primary-color);
  opacity: 0;
  filter: drop-shadow(0 -1px 0 rgba(0, 0, 0, 0.15));
  transition: opacity 0.2s ease 0.6s, transform 0.2s ease 0.6s;
  z-index: 1;
}

.tooltipped:hover::after,
.tooltipped:focus-visible::after,
.tooltipped:hover::before,
.tooltipped:focus-visible::before {
  opacity: 1;
  transform: translate(-50%, 0);
}

  .info {
    color: var(--secondary-text-color);
    font-style: italic;
  }

  .error {
    color: var(--error-color);
    margin-bottom: 12px;
  }

  .global-error {
    margin: 0 0 16px;
  }

  .task-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  label {
    display: block;
    margin-bottom: 0;
  }

  .form-row {
    margin: 2px 0;
  }

  .label-text {
    display: block;
    font-weight: 600;
    margin-bottom: 6px;
  }

  .task-form > div.form-row {
    width: 100%;
  }

  .grid-two-up {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 10px;
    width: 100%;
  }

  .weekly-inline {
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 0.75rem;
    width: 100%;
  }

  .weekly-every {
    flex: 0 0 auto;
    min-width: 150px;
  }

  .weekly-every-input {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
  }

  .weekly-every-field {
    width: 100%;
  }

  .weeks-suffix {
    white-space: nowrap;
    color: var(--secondary-text-color);
  }

  .weekday-selection {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    flex: 1 1 auto;
  }

  .weekday-row-label {
    font-weight: 600;
  }

  .weekday-row {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    align-items: center;
    width: 100%;
    min-width: 0;
    flex: 0 0 auto;
  }

  .date-input-wrapper {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    align-items: center;
    position: relative;
  }

  .date-input-wrapper maint-date-picker {
    display: contents;
  }

  .date-picker-toggle {
    min-width: 36px;
    height: 36px;
    padding: 6px;
  }

  .date-picker-popup {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 6px;
    padding: 12px;
    background: var(--card-background-color);
    border: 1px solid var(--divider-color);
    border-radius: 10px;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
    width: 260px;
    z-index: 5;
  }

  .date-picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
  }

  .date-picker-month {
    font-weight: 600;
    flex: 1;
    text-align: center;
  }

  .date-picker-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    font-size: 12px;
    color: var(--secondary-text-color);
    margin-bottom: 6px;
  }

  .date-picker-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 6px;
    width: 100%;
  }

  .date-picker-day {
    height: 36px;
    width: 100%;
    padding: 6px 0;
    box-sizing: border-box;
    min-width: 0;
    border-radius: 8px;
    border: 1px solid var(--divider-color);
    background: var(--card-background-color);
    color: var(--primary-text-color);
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  }

  .date-picker-day.muted {
    color: var(--secondary-text-color);
    opacity: 0.7;
  }

  .date-picker-day.today {
    border-color: var(--primary-color);
  }

  .date-picker-day.selected {
    background: var(--primary-color);
    color: var(--text-primary-color);
    border-color: var(--primary-color);
  }

  .date-picker-day .ha-icon {
    display: none;
  }

  .date-picker-day:focus-visible {
    outline: 2px solid var(--primary-color);
  }

  .frequency-editor {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
    align-items: flex-start;
  }

  .frequency-editor select,
  .frequency-editor input {
    width: 100%;
  }

  .optional-config {
    margin-top: 12px;
    padding: 0;
  }

  .optional-config summary {
    cursor: pointer;
    font-weight: 700;
    color: var(--primary-text-color);
    outline: none;
    padding: 0;
    margin-bottom: 6px;
    list-style: none;
    display: inline-flex;
    align-items: center;
  }

  .optional-config summary::-webkit-details-marker,
  .optional-config summary::marker {
    display: none;
    content: "";
  }

  .optional-config summary::before {
    content: "▶";
    display: inline-block;
    width: 1rem;
    text-align: center;
    color: var(--secondary-text-color);
    margin-right: 4px;
  }

  .optional-config[open] summary::before {
    content: "▼";
  }

  .optional-body {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .optional-body label {
    display: block;
  }

  .help-text {
    margin: 0;
    font-size: 0.9rem;
    color: var(--secondary-text-color);
  }

  .weekday-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .weekday-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .week-interval-input {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: 100%;
  }

  .week-interval-input-field {
    flex: 1;
    min-width: 80px;
  }

  .weekday-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 10px;
    border: 1px solid var(--divider-color);
    background: var(--card-background-color);
    margin: 2px 6px 6px 0;
  }

  .weekday-chip input {
    width: auto;
    margin: 0;
  }

  .stacked {
    display: flex;
    flex-direction: column;
  }

  .form-header-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  h2 {
    margin: 0;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 12vh;
    z-index: 10;
  }

  .modal {
    background: var(--card-background-color);
    border: 1px solid var(--divider-color);
    border-radius: 12px;
    padding: 20px;
    max-width: 420px;
    width: calc(100% - 32px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }

  .modal.edit-modal {
    max-width: 720px;
    width: calc(100% - 48px);
  }

  .modal h3 {
    margin: 0 0 8px;
    font-size: 18px;
  }

  .modal p {
    margin: 0 0 16px;
    color: var(--secondary-text-color);
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .button-secondary {
    background: none;
    color: var(--primary-text-color);
    border: 1px solid var(--divider-color);
  }

  .button-danger {
    background: var(--error-color);
    color: var(--text-primary-color);
  }

  @media (max-width: 720px) {
    :host {
      --maint-panel-padding: 16px;
    }

    .container {
      max-width: none;
      margin: 0;
    }

    section {
      padding: 16px;
    }

    .tasks-section {
      margin-left: calc(-1 * var(--maint-panel-padding));
      margin-right: calc(-1 * var(--maint-panel-padding));
      border-radius: 0;
      border-left: none;
      border-right: none;
    }

    .tasks-section-header,
    .tasks-section-content,
    .tasks-section-empty {
      padding-left: var(--maint-panel-padding);
      padding-right: var(--maint-panel-padding);
    }

    .tasks-section-header {
      padding-top: var(--maint-panel-padding);
      padding-bottom: var(--maint-panel-padding);
    }

    .task-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 0;
    }

    .task-details {
      padding-left: 0;
      width: 100%;
    }

    .task-actions {
      width: 100%;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      margin-left: 0;
      min-width: 0;
    }

    .task-last-completed {
      text-align: left;
    }

    .action-buttons {
      margin-left: auto;
    }

    .weekly-inline {
      flex-direction: column;
      gap: 0.5rem;
    }

    .weekly-every {
      flex: 1 1 auto;
      max-width: none;
      min-width: 0;
    }

    .weekday-selection {
      width: 100%;
    }

    .weekday-row {
      width: 100%;
      justify-content: flex-start;
    }

    .modal {
      border-radius: 0;
      max-width: none;
      width: 100vw;
      margin: 0;
      border-left: none;
      border-right: none;
    }

    .modal.edit-modal {
      width: 100vw;
    }
  }
`;
