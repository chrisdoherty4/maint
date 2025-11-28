export type FrequencyUnit = "days" | "weeks" | "months";

export interface MaintEntry {
  entry_id: string;
  title: string;
}

export interface MaintTask {
  task_id: string;
  description: string;
  frequency: number;
  frequency_unit: FrequencyUnit;
  last_completed: string | null;
  next_scheduled?: string | null;
}

export interface HassConnection {
  callWS<T>(params: Record<string, unknown>): Promise<T>;
}

export interface TaskPayload {
  description: string;
  frequency: number;
  frequency_unit: FrequencyUnit;
  last_completed: string;
}
