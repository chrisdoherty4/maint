import { html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { formatIsoDate, parseIsoDate } from "../formatting.js";

@customElement("maint-date-picker")
export class MaintDatePicker extends LitElement {
  @property({ type: Boolean }) public open = false;
  @property({ type: String }) public value: string | null | undefined = null;
  @property({ type: String }) public locale?: string;
  @property({ type: Number }) public weekStart = 1;

  @state() private visibleMonth: Date = this.startOfMonth(this.todayDate());

  protected createRenderRoot() {
    // Render in light DOM so existing panel styles apply without duplication.
    return this;
  }

  protected willUpdate(changed: Map<string, unknown>): void {
    if (changed.has("value") && this.value) {
      const parsed = parseIsoDate(this.value);
      if (parsed) {
        this.visibleMonth = this.startOfMonth(parsed);
      }
    }
  }

  protected render() {
    if (!this.open) {
      return nothing;
    }

    const locale = this.locale;
    const today = this.todayDate();
    const selected = this.parseSelectedDate() ?? today;
    const monthLabel = this.formatMonthLabel(this.visibleMonth, locale);
    const weekStart = this.weekStart ?? this.firstWeekday(locale);
    const weekdayLabels = this.weekdayLabels(locale, weekStart);
    const startOffset = (this.visibleMonth.getDay() - weekStart + 7) % 7;
    const start = new Date(this.visibleMonth);
    start.setDate(1 - startOffset);

    const days = Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return {
        date,
        inMonth: date.getMonth() === this.visibleMonth.getMonth(),
        isToday: this.isSameDay(date, today),
        isSelected: this.isSameDay(date, selected)
      };
    });

    return html`
      <div class="date-picker-popup date-picker-surface">
        <div class="date-picker-header">
          <button
            type="button"
            class="icon-button"
            aria-label="Previous month"
            @click=${() => this.changeMonth(-1)}
          >
            <ha-icon icon="mdi:chevron-left" aria-hidden="true"></ha-icon>
          </button>
          <div class="date-picker-month">${monthLabel}</div>
          <button
            type="button"
            class="icon-button"
            aria-label="Next month"
            @click=${() => this.changeMonth(1)}
          >
            <ha-icon icon="mdi:chevron-right" aria-hidden="true"></ha-icon>
          </button>
        </div>
        <div class="date-picker-weekdays">
          ${weekdayLabels.map((label) => html`<span>${label}</span>`)}
        </div>
        <div class="date-picker-grid">
          ${days.map(
        (day) => html`
              <button
                type="button"
                class=${this.dayClass(day)}
                aria-label=${this.formatDayAria(day.date, locale)}
                @click=${() => this.selectDate(day.date)}
              >
                ${day.date.getDate()}
              </button>
            `
      )}
        </div>
      </div>
    `;
  }

  private todayDate(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  private parseSelectedDate(): Date | null {
    if (!this.value) {
      return null;
    }
    return parseIsoDate(this.value);
  }

  private startOfMonth(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), 1);
  }

  private isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  private formatMonthLabel(value: Date, locale?: string): string {
    try {
      return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(value);
    } catch {
      return `${value.toLocaleString(undefined, { month: "long" })} ${value.getFullYear()}`;
    }
  }

  private firstWeekday(locale?: string): number {
    const intlLocale = (Intl as unknown as { Locale?: typeof Intl.Locale }).Locale;
    if (intlLocale) {
      try {
        const info = new intlLocale(locale ?? "en");
        const first = (info as unknown as { weekInfo?: { firstDay?: number } }).weekInfo?.firstDay;
        if (typeof first === "number") {
          return first;
        }
      } catch {
        // Ignore and fall through to heuristic.
      }
    }

    const code = (locale ?? "").toLowerCase();
    if (code.startsWith("en-us")) {
      return 0;
    }
    return 1;
  }

  private weekdayLabels(locale: string | undefined, weekStart: number): string[] {
    const base = new Date(2024, 0, 1);
    const labels = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(base);
      day.setDate(base.getDate() + index);
      try {
        return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(day);
      } catch {
        return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index];
      }
    });

    const rotated = labels.slice(weekStart).concat(labels.slice(0, weekStart));
    return rotated;
  }

  private dayClass(day: {
    inMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
  }): string {
    let className = "date-picker-day";
    if (!day.inMonth) {
      className += " muted";
    }
    if (day.isToday) {
      className += " today";
    }
    if (day.isSelected) {
      className += " selected";
    }
    return className;
  }

  private formatDayAria(date: Date, locale?: string): string {
    try {
      return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(date);
    } catch {
      return formatIsoDate(date);
    }
  }

  private changeMonth(delta: number): void {
    const next = new Date(this.visibleMonth);
    next.setMonth(next.getMonth() + delta);
    this.visibleMonth = this.startOfMonth(next);
  }

  private selectDate(date: Date): void {
    const formatted = formatIsoDate(date);
    this.dispatchEvent(
      new CustomEvent("date-selected", {
        detail: { value: formatted },
        bubbles: true,
        composed: true
      })
    );
  }
}
