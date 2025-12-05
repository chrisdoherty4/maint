import type { HassConnection, MaintTask, RecurrenceType } from "../index.js";
import { type LocalizeFunc } from "../../formatting.js";
import { createTask, validateTaskFields } from "../index.js";

export interface CreateControllerState {
  open: boolean;
  error: string | null;
  lastCompleted: string;
  recurrenceType: RecurrenceType;
  datePickerOpen: boolean;
  busy: boolean;
}

export class CreateTaskController {
  constructor(private readonly onChange?: (state: CreateControllerState) => void) {}

  public state: CreateControllerState = {
    open: false,
    error: null,
    lastCompleted: "",
    recurrenceType: "interval",
    datePickerOpen: false,
    busy: false
  };

  private setState(next: Partial<CreateControllerState>): CreateControllerState {
    this.state = { ...this.state, ...next };
    this.onChange?.(this.state);
    return this.state;
  }

  public open(initialLastCompleted: string): CreateControllerState {
    return this.setState({
      open: true,
      error: null,
      lastCompleted: initialLastCompleted,
      recurrenceType: "interval",
      datePickerOpen: false,
      busy: false
    });
  }

  public close(): CreateControllerState {
    return this.setState({
      open: false,
      error: null,
      datePickerOpen: false,
      busy: false
    });
  }

  public setError(error: string | null): CreateControllerState {
    return this.setState({ error });
  }

  public updateLastCompleted(value: string): CreateControllerState {
    return this.setState({ lastCompleted: value, error: null });
  }

  public setRecurrenceType(type: RecurrenceType): CreateControllerState {
    return this.setState({ recurrenceType: type, error: null });
  }

  public openDatePicker(): CreateControllerState {
    return this.setState({ datePickerOpen: true });
  }

  public toggleDatePicker(): CreateControllerState {
    return this.setState({ datePickerOpen: !this.state.datePickerOpen });
  }

  public closeDatePicker(): CreateControllerState {
    return this.setState({ datePickerOpen: false });
  }

  public setDate(formatted: string): CreateControllerState {
    return this.setState({
      lastCompleted: formatted,
      datePickerOpen: false,
      error: null
    });
  }

  public resetLastCompleted(value: string): CreateControllerState {
    return this.setState({ lastCompleted: value });
  }

  public async submit(
    formData: FormData,
    hass: HassConnection,
    entryId: string,
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
      this.setState({ error: null, busy: true });
      const task = await createTask(hass, entryId, result.values);
      return { task };
    } catch (error) {
      console.error("Maint create task failed", error);
      this.setState({ error: errorText });
      return { error: errorText };
    } finally {
      this.setState({ busy: false });
    }
  }
}
