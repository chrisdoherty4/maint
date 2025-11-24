const DOMAIN = "maint";

const STYLE = `
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

  .form-header {
    display: flex;
    align-items: flex-start;
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

  .subtext-inline {
    color: var(--secondary-text-color);
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

class MaintPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._entries = [];
    this._tasks = [];
    this._selectedEntryId = null;
    this._initialized = false;
    this._busy = false;
    this._error = null;
    this._editingTaskId = null;
    this._confirmTaskId = null;
    this._formExpanded = true;
  }

  connectedCallback() {
    this.render();
  }

  set hass(value) {
    this._hass = value;
    if (!this._initialized) {
      this._initialized = true;
      this._initialize();
    }
  }

  async _initialize() {
    try {
      const entries = await this._hass.callWS({
        type: "config_entries/get",
        domain: DOMAIN,
      });
      this._entries = entries.map((entry) => ({
        entry_id: entry.entry_id,
        title: entry.title,
      }));
      if (this._entries.length && !this._selectedEntryId) {
        this._selectedEntryId = this._entries[0].entry_id;
      }
      if (this._selectedEntryId) {
        await this._loadTasks();
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Maint panel failed to load entries", err);
      this._error = "Unable to load maint entries.";
    } finally {
      this.render();
    }
  }

  async _loadTasks() {
    if (!this._selectedEntryId) {
      this._tasks = [];
      this._editingTaskId = null;
      this.render();
      return;
    }
    try {
      this._busy = true;
      this.render();
      this._tasks = await this._hass.callWS({
        type: "maint/task/list",
        entry_id: this._selectedEntryId,
      });
      this._editingTaskId = null;
      this._confirmTaskId = null;
      this._formExpanded = this._tasks.length === 0;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Maint panel failed to load tasks", err);
      this._error = "Unable to load tasks.";
    } finally {
      this._busy = false;
      this.render();
    }
  }

  render() {
    if (!this.shadowRoot) {
      return;
    }
    const hasEntries = this._entries.length > 0;
    const formDisabled = !this._selectedEntryId;
    const disabledAttr = formDisabled ? "disabled" : "";
    const entriesSelect = hasEntries
      ? ""
      : `<p class="info">Add a Maint integration entry to start tracking tasks.</p>`;

    const formToggleIcon = this._formExpanded ? "▾" : "▴";
    const formToggleLabel = this._formExpanded
      ? "Collapse form"
      : "Expand form";

    const formSection = `
        <section>
          <div class="form-header" tabindex="0" role="button" aria-expanded="${this._formExpanded}">
            <div class="form-header-text">
              <h2>Create task</h2>
              <p class="subtext-inline">Track when work is complete and when it should be done again.</p>
            </div>
            <button
              type="button"
              id="form-toggle"
              class="icon-button form-toggle"
              aria-label="${formToggleLabel}"
              title="${formToggleLabel}"
            >
              ${formToggleIcon}
            </button>
          </div>
          ${
            this._error
              ? `<div class="error">${this._escape(this._error)}</div>`
              : ""
          }
          ${
            !hasEntries
              ? `<p class="info">Add a Maint integration entry to enable task tracking.</p>`
              : ""
          }
          ${
            this._formExpanded
              ? `<form id="task-form">
                  <div class="form-fields">
                    <label>
                      <span class="label-text">Description</span>
                      <input type="text" name="description" required placeholder="Smoke detector battery" ${disabledAttr} />
                    </label>
                    <div class="inline-fields">
                      <label>
                        <span class="label-text">Frequency (days)</span>
                        <input type="number" name="frequency" min="1" step="1" required placeholder="90" ${disabledAttr} />
                      </label>
                      <label>
                        <span class="label-text">Starting from</span>
                        <input type="date" name="last_completed" ${disabledAttr} />
                      </label>
                    </div>
                  </div>
                  <div class="form-actions">
                    <button type="submit" ${this._busy || formDisabled ? "disabled" : ""}>
                      ${this._busy ? "Saving…" : "Create task"}
                    </button>
                  </div>
                </form>`
              : ""
          }
        </section>
      `;

    const tasksRows = this._tasks
      .map((task) => {
        const taskId = this._escape(task.task_id);
        const isEditing = this._editingTaskId === task.task_id;
        const description = task.description ?? "";
        const saveLabel = isEditing
          ? this._busy
            ? "Saving…"
            : "Save"
          : "Edit";
        const saveIcon = isEditing ? "✔" : "✎";
        const saveDisabled = isEditing && this._busy ? "disabled" : "";
        return `
            <tr data-task-row="${taskId}">
              <td>
                ${
                  isEditing
                    ? `<input type="text" name="description" value="${this._escape(description)}" />`
                    : `<div class="task-description">${this._escape(description)}</div>`
                }
              </td>
              <td>
                ${
                  isEditing
                    ? `<input type="number" name="frequency" min="1" step="1" value="${this._escape(task.frequency ?? "")}" />`
                    : this._formatFrequency(task.frequency)
                }
              </td>
              <td>
                ${
                  isEditing
                    ? `<input type="date" name="last_completed" value="${this._formatDateInput(task.last_completed)}" />`
                    : this._formatDate(task.last_completed)
                }
              </td>
              <td>${this._formatDate(this._nextScheduled(task))}</td>
              <td class="actions">
                <button
                  type="button"
                  class="icon-button edit-task"
                  data-task="${taskId}"
                  ${saveDisabled}
                  aria-label="${saveLabel}"
                  title="${saveLabel}"
                >
                  ${saveIcon}
                </button>
                <button
                  type="button"
                  class="icon-button delete-task"
                  data-task="${taskId}"
                  aria-label="Delete"
                  title="Delete"
                >
                  🗑
                </button>
              </td>
            </tr>
          `;
      })
      .join("");

    const confirmTask =
      this._confirmTaskId === null
        ? null
        : (this._tasks.find((task) => task.task_id === this._confirmTaskId) ??
          null);

    const confirmModal = confirmTask
      ? `
        <div class="modal-backdrop">
          <div class="modal">
            <h3>Delete task?</h3>
            <p>Are you sure you want to delete "${this._escape(confirmTask.description)}"?</p>
            <div class="modal-actions">
              <button type="button" class="button-secondary" id="cancel-delete" ${this._busy ? "disabled" : ""}>
                Cancel
              </button>
              <button type="button" class="button-danger" id="confirm-delete" ${this._busy ? "disabled" : ""}>
                Delete
              </button>
            </div>
          </div>
        </div>
      `
      : "";

    const tasksSection = `
        <section>
          <h2>Tasks</h2>
          ${
            formDisabled
              ? `<p class="info">Add the Maint integration to start tracking tasks.</p>`
              : this._tasks.length === 0
                ? `<p class="info">No tasks yet. Use the form above to create one.</p>`
                : `
                <div class="task-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Frequency</th>
                        <th>Last completed</th>
                        <th>Next scheduled</th>
                        <th class="actions">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${tasksRows}
                    </tbody>
                  </table>
                </div>
              `
          }
        </section>
      `;

    this.shadowRoot.innerHTML = `
      <style>${STYLE}</style>
      <div class="container">
        <h1>Maintenance</h1>
        <p class="subtext">Manage recurring tasks and keep your home on track.</p>
        ${entriesSelect}
        ${formSection}
        ${tasksSection}
        ${confirmModal}
      </div>
    `;

    this._bindActions();
  }

  _bindActions() {
    if (!this.shadowRoot) {
      return;
    }
    const form = this.shadowRoot.querySelector("#task-form");
    if (form) {
      form.addEventListener("submit", (event) => this._handleCreate(event));
    }
    this.shadowRoot.querySelectorAll(".delete-task").forEach((button) => {
      button.addEventListener("click", (event) => this._promptDelete(event));
    });
    this.shadowRoot.querySelectorAll(".edit-task").forEach((button) => {
      button.addEventListener("click", (event) => this._handleEdit(event));
    });
    const toggle = this.shadowRoot.querySelector("#form-toggle");
    if (toggle) {
      toggle.addEventListener("click", () => this._toggleForm());
    }
    const formHeader = this.shadowRoot.querySelector(".form-header");
    if (formHeader) {
      formHeader.addEventListener("click", () => this._toggleForm());
      formHeader.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this._toggleForm();
        }
      });
    }
    const confirmDelete = this.shadowRoot.querySelector("#confirm-delete");
    if (confirmDelete) {
      confirmDelete.addEventListener("click", () => this._handleDelete());
    }
    const cancelDelete = this.shadowRoot.querySelector("#cancel-delete");
    if (cancelDelete) {
      cancelDelete.addEventListener("click", () => this._cancelDelete());
    }
  }

  async _handleCreate(event) {
    event.preventDefault();
    if (!this._selectedEntryId) {
      return;
    }
    this._error = null;
    const form = event.target;
    const formData = new FormData(form);
    const description = (formData.get("description") || "").toString().trim();
    if (!description) {
      this._error = "Enter a description.";
      this.render();
      return;
    }
    const frequency = this._parseFrequency(formData.get("frequency"));
    if (frequency === null) {
      this._error = "Enter how often the task repeats.";
      this.render();
      return;
    }
    // const payload = {
    //   description,
    //   frequency,
    //   last_completed: this._parseDate(formData.get("last_completed")),
    // };

    const lastCompleted = this._parseDate(formData.get("last_completed"));
    if (lastCompleted === null) {
      this._error = "Enter a valid date for last completed.";
      this.render();
      return;
    }

    try {
      this._busy = true;
      this.render();
      const created = await this._hass.callWS({
        type: "maint/task/create",
        entry_id: this._selectedEntryId,
        description,
        frequency,
        last_completed: lastCompleted,
      });
      this._tasks = [...this._tasks, created];
      form.reset();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Maint panel failed to create task", err);
      this._error = "Could not create task. Check the logs for details.";
    } finally {
      this._busy = false;
      this.render();
    }
  }

  _promptDelete(event) {
    if (!this._selectedEntryId) {
      return;
    }
    const taskId = event.currentTarget.dataset.task;
    if (!taskId) {
      return;
    }
    this._confirmTaskId = taskId;
    this.render();
  }

  async _handleDelete() {
    if (!this._selectedEntryId || !this._confirmTaskId) {
      return;
    }
    const taskId = this._confirmTaskId;
    try {
      this._busy = true;
      this.render();
      await this._hass.callWS({
        type: "maint/task/delete",
        entry_id: this._selectedEntryId,
        task_id: taskId,
      });
      this._tasks = this._tasks.filter((task) => task.task_id !== taskId);
      if (this._editingTaskId === taskId) {
        this._editingTaskId = null;
      }
      if (this._tasks.length === 0) {
        this._formExpanded = true;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Maint panel failed to delete task", err);
      this._error = "Could not delete the task.";
    } finally {
      this._busy = false;
      this._confirmTaskId = null;
      this.render();
    }
  }

  _cancelDelete() {
    this._confirmTaskId = null;
    this.render();
  }

  _handleEdit(event) {
    if (!this._selectedEntryId) {
      return;
    }
    const taskId = event.currentTarget.dataset.task;
    if (!taskId) {
      return;
    }
    if (this._editingTaskId !== taskId) {
      this._error = null;
      this._editingTaskId = taskId;
      this.render();
      return;
    }
    this._error = null;
    void this._saveTaskEdits(taskId);
  }

  _toggleForm() {
    this._formExpanded = !this._formExpanded;
    this.render();
  }

  async _saveTaskEdits(taskId) {
    const row = this.shadowRoot
      ? Array.from(this.shadowRoot.querySelectorAll("[data-task-row]")).find(
          (element) => element.dataset.taskRow === taskId,
        )
      : null;
    if (!row) {
      return;
    }
    const descriptionInput = row.querySelector('input[name="description"]');
    const frequencyInput = row.querySelector('input[name="frequency"]');
    const dateInput = row.querySelector('input[name="last_completed"]');

    const description = (descriptionInput?.value || "").toString().trim();
    if (!description) {
      this._error = "Enter a description.";
      this.render();
      return;
    }
    const frequency = this._parseFrequency(frequencyInput?.value);
    if (frequency === null) {
      this._error = "Enter how often the task repeats.";
      this.render();
      return;
    }
    const lastCompleted = this._parseDate(dateInput?.value);
    if (lastCompleted === null) {
      this._error = "Enter a valid date for last completed.";
      this.render();
      return;
    }

    try {
      this._busy = true;
      this.render();
      const updated = await this._hass.callWS({
        type: "maint/task/update",
        entry_id: this._selectedEntryId,
        task_id: taskId,
        description,
        frequency,
        last_completed: lastCompleted,
      });
      this._tasks = this._tasks.map((task) =>
        task.task_id === taskId ? updated : task,
      );
      this._editingTaskId = null;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Maint panel failed to update task", err);
      this._error = "Could not update the task.";
    } finally {
      this._busy = false;
      this.render();
    }
  }

  _parseDate(value) {
    if (!value) {
      return null;
    }
    const strValue = value.toString().trim();
    if (!strValue) {
      return null;
    }
    const parsed = new Date(strValue);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return strValue;
  }

  _formatDate(value) {
    if (!value) {
      return "—";
    }
    const parts = value.toString().split("T")[0].split("-");
    const [year, month, day] = parts.map((part) => Number(part));
    if ([year, month, day].some((part) => Number.isNaN(part))) {
      return "—";
    }
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString();
  }

  _parseFrequency(value) {
    if (value === null || value === undefined) {
      return null;
    }
    const rawValue = value.toString().trim();
    if (!rawValue) {
      return null;
    }
    const parsed = Number(rawValue);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return null;
    }
    return Math.floor(parsed);
  }

  _formatDateInput(value) {
    if (!value) {
      return "";
    }
    const parts = value.toString().split("T")[0].split("-");
    const [year, month, day] = parts.map((part) => Number(part));
    if ([year, month, day].some((part) => Number.isNaN(part))) {
      return "";
    }
    return `${year.toString().padStart(4, "0")}-${month
      .toString()
      .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
  }

  _formatFrequency(value) {
    if (!value || Number.isNaN(Number(value))) {
      return "—";
    }
    const days = Number(value);
    return days === 1 ? "Every day" : `Every ${days} days`;
  }

  _nextScheduled(task) {
    if (!task) {
      return null;
    }
    if (task.next_scheduled) {
      return task.next_scheduled;
    }
    if (!task.last_completed || !task.frequency) {
      return null;
    }
    const parts = task.last_completed.toString().split("T")[0].split("-");
    const [year, month, day] = parts.map((part) => Number(part));
    if ([year, month, day].some((part) => Number.isNaN(part))) {
      return null;
    }
    const next = new Date(year, month - 1, day);
    next.setDate(next.getDate() + Number(task.frequency));
    return `${next.getFullYear().toString().padStart(4, "0")}-${(
      next.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${next.getDate().toString().padStart(2, "0")}`;
  }

  _escape(value) {
    if (value === undefined || value === null) {
      return "";
    }
    return value
      .toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

customElements.define("maint-panel", MaintPanel);
