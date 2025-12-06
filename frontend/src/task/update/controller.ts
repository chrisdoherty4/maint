import type { HassConnection, MaintTask, RecurrenceType } from "../index.js";
import { formatDateInput, type LocalizeFunc } from "../../formatting.js";
import { updateTask } from "../index.js";
import { validateTaskFields } from "../index.js";
import type { EditFormState } from "./view.js";

export interface EditControllerState {
  open: boolean;
  taskId: string | null;
  form: EditFormState | null;
  error: string | null;
  datePickerOpen: boolean;
  busy: boolean;
}

export class UpdateTaskController {
  constructor(private readonly onChange?: (state: EditControllerState) => void) {}

  public state: EditControllerState = {
    open: false,
    taskId: null,
    form: null,
    error: null,
    datePickerOpen: false,
    busy: false
  };

  private setState(next: Partial<EditControllerState>): EditControllerState {
    this.state = { ...this.state, ...next };
    this.onChange?.(this.state);
    return this.state;
  }

  public start(task: MaintTask, hass?: HassConnection): EditControllerState {
    const baseForm: EditFormState = {
      description: task.description ?? "",
      last_completed: formatDateInput(task.last_completed, hass),
      recurrence_type: task.recurrence.type,
      interval_every: "",
      interval_unit: "days",
      weekly_every: "1",
      weekly_days: []
    };

    if (task.recurrence.type === "interval") {
      baseForm.interval_every = task.recurrence.every.toString();
      baseForm.interval_unit = task.recurrence.unit;
    } else if (task.recurrence.type === "weekly") {
      baseForm.weekly_every = (task.recurrence.every ?? 1).toString();
      baseForm.weekly_days = task.recurrence.days.map((day) => day.toString());
    }

    return this.setState({
      open: true,
      taskId: task.task_id,
      form: baseForm,
      error: null,
      datePickerOpen: false,
      busy: false
    });
  }

  public cancel(): EditControllerState {
    return this.setState({
      open: false,
      taskId: null,
      form: null,
      error: null,
      datePickerOpen: false,
      busy: false
    });
  }

  public setError(error: string | null): EditControllerState {
    return this.setState({ error });
  }

  public updateField(name: string, value: string): EditControllerState {
    if (!this.state.form) {
      return this.state;
    }

    const nextForm: EditFormState = { ...this.state.form };
    switch (name) {
      case "description":
        nextForm.description = value;
        break;
      case "last_completed":
        nextForm.last_completed = value;
        break;
      case "interval_every":
        nextForm.interval_every = value;
        break;
      case "interval_unit":
        nextForm.interval_unit = value as EditFormState["interval_unit"];
        break;
      case "weekly_every":
        nextForm.weekly_every = value;
        break;
      default:
        break;
    }

    return this.setState({ form: nextForm, error: null });
  }

  public toggleWeeklyDay(value: string, checked: boolean): EditControllerState {
    if (!this.state.form) {
      return this.state;
    }
    const nextDays = new Set(this.state.form.weekly_days);
    if (checked) {
      nextDays.add(value);
    } else {
      nextDays.delete(value);
    }
    const sortedDays = Array.from(nextDays).sort((a, b) => Number(a) - Number(b));
    return this.setState({
      form: { ...this.state.form, weekly_days: sortedDays },
      error: null
    });
  }

  public setRecurrenceType(type: RecurrenceType): EditControllerState {
    if (!this.state.form) {
      return this.state;
    }
    const nextForm: EditFormState = { ...this.state.form, recurrence_type: type };
    if (type === "weekly" && nextForm.weekly_days.length === 0) {
      nextForm.weekly_days = ["0"];
      nextForm.weekly_every = "1";
    }
    return this.setState({ form: nextForm, error: null });
  }

  public openDatePicker(): EditControllerState {
    return this.setState({ datePickerOpen: true });
  }

  public toggleDatePicker(): EditControllerState {
    return this.setState({ datePickerOpen: !this.state.datePickerOpen });
  }

  public closeDatePicker(): EditControllerState {
    return this.setState({ datePickerOpen: false });
  }

  public setDate(formatted: string): EditControllerState {
    if (!this.state.form) {
      return this.state;
    }
    return this.setState({
      form: { ...this.state.form, last_completed: formatted },
      error: null,
      datePickerOpen: false
    });
  }

  public resetAfterDelete(taskId: string): EditControllerState {
    if (this.state.taskId !== taskId) {
      return this.state;
    }
    return this.cancel();
  }

  public async submit(
    formData: FormData,
    hass: HassConnection,
    entryId: string,
    taskId: string,
    localize: LocalizeFunc,
    errorText: string
  ): Promise<{ task?: MaintTask; error?: string }> {
    const result = validateTaskFields(
      {
        description: formData.get("description"),
        last_completed: formData.get("last_completed"),
        recurrence_type: formData.get("recurrence_type"),
        interval_every: formData.get("interval_every"),
        interval_unit: formData.get("interval_unit"),
        weekly_every: formData.get("weekly_every"),
        weekly_days: formData.getAll("weekly_days")
      },
      localize,
      hass
    );

    if (result.error) {
      this.setState({ error: result.error });
      return { error: result.error };
    }

    if (!result.values) {
      return {};
    }

    try {
      this.setState({ error: null });
      this.setState({ busy: true });
      const updated = await updateTask(hass, entryId, taskId, result.values);
      return { task: updated };
    } catch (error) {
      console.error("Maint update task failed", error);
      this.setState({ error: errorText });
      return { error: errorText };
    } finally {
      this.setState({ busy: false });
    }
  }
}
