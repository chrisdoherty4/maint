export interface DatePickerState {
  target: "create" | "edit" | null;
}

export class DatePickerController {
  public state: DatePickerState = {
    target: null
  };

  public open(target: "create" | "edit"): DatePickerState {
    this.state = { target };
    return this.state;
  }

  public close(): DatePickerState {
    this.state = { target: null };
    return this.state;
  }

  public toggle(target: "create" | "edit"): DatePickerState {
    if (this.state.target === target) {
      return this.close();
    }
    return this.open(target);
  }
}
