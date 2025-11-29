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

  .subtext {
    color: var(--secondary-text-color);
    margin-bottom: 24px;
  }

  section {
    background: var(--card-background-color);
    border-radius: 12px;
    border: 1px solid var(--divider-color);
    padding: 14px 20px;
    margin-bottom: 24px;
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

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 12px 8px;
    text-align: left;
    vertical-align: middle;
  }

  th {
    color: var(--secondary-text-color);
    font-weight: 600;
    border-bottom: 1px solid var(--divider-color);
  }

  td {
    border-bottom: 1px solid var(--divider-color);
  }

  .task-description {
    font-weight: 400;
    white-space: pre-wrap;
    color: var(--primary-text-color);
  }

  .actions {
    text-align: right;
    width: 110px;
    min-width: 110px;
    white-space: nowrap;
  }

  .actions button + button {
    margin-left: 8px;
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

  .info {
    color: var(--secondary-text-color);
    font-style: italic;
  }

  .error {
    color: var(--error-color);
    margin-bottom: 12px;
  }

  label {
    display: block;
    margin-bottom: 12px;
  }

  .label-text {
    display: block;
    font-weight: 600;
    margin-bottom: 10px;
  }

  .inline-fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    margin-top: 10px;
    margin-bottom: 12px;
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

  .recurrence-fields {
    margin-top: 4px;
  }

  .weekday-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .weekday-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 10px;
    border: 1px solid var(--divider-color);
    background: var(--card-background-color);
  }

  .weekday-chip input {
    width: auto;
    margin: 0;
  }

  .stacked {
    display: flex;
    flex-direction: column;
  }

  .form-header {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 4px;
    cursor: pointer;
  }

  .form-header-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  h2 {
    margin: 0;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
  }

  .form-toggle {
    margin-left: auto;
  }

  .form-fields {
    margin-top: 16px;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
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
    section {
      padding: 16px;
    }

    table,
    thead,
    tbody,
    th,
    td,
    tr {
      display: block;
    }

    th {
      display: none;
    }

    td {
      border: none;
      padding: 8px 0;
    }

    .actions {
      text-align: left;
    }
  }
`;
