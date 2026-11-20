import type { Frequency } from "../services/habit";
import { WEEKDAY_LABELS, type ScheduleDraft } from "../utils/schedule";

interface ScheduleFieldsProps {
    value: ScheduleDraft;
    onChange: (value: ScheduleDraft) => void;
    disabled?: boolean;
}

export const ScheduleFields = ({ value, onChange, disabled }: ScheduleFieldsProps) => {
    const update = (patch: Partial<ScheduleDraft>) => onChange({ ...value, ...patch });

    const toggleWeekday = (day: number) => {
        const weekdays = value.weekdays.includes(day)
            ? value.weekdays.filter(current => current !== day)
            : [...value.weekdays, day].sort((a, b) => a - b);
        update({ weekdays });
    };

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="frequency">Frequency</label>
                <select
                    id="frequency"
                    value={value.frequency}
                    onChange={(e) => update({ frequency: e.target.value as Frequency })}
                    disabled={disabled}
                >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly — pick weekdays</option>
                    <option value="monthly">Monthly — pick days of the month</option>
                    <option value="custom">Custom — every N days</option>
                </select>
            </div>

            {value.frequency === 'weekly' && (
                <div>
                    <label>Repeat on</label>
                    <div className="flex flex-wrap gap-1.5">
                        {WEEKDAY_LABELS.map((label, day) => {
                            const selected = value.weekdays.includes(day);
                            return (
                                <button
                                    key={label}
                                    type="button"
                                    onClick={() => toggleWeekday(day)}
                                    disabled={disabled}
                                    aria-pressed={selected}
                                    className={
                                        selected
                                            ? 'border-moss bg-moss-soft px-2.5 py-1 text-xs text-moss'
                                            : 'px-2.5 py-1 text-xs text-muted'
                                    }
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                    {value.weekdays.length === 0 && (
                        <p className="hint">Pick the days this habit is due.</p>
                    )}
                </div>
            )}

            {value.frequency === 'monthly' && (
                <div>
                    <label htmlFor="month-days">Days of the month</label>
                    <input
                        id="month-days"
                        type="text"
                        value={value.monthDaysText}
                        onChange={(e) => update({ monthDaysText: e.target.value })}
                        placeholder="1, 15, 31"
                        disabled={disabled}
                    />
                    <p className="hint">
                        Comma-separated, 1–31. A habit on the 31st falls on the last day of shorter
                        months.
                    </p>
                </div>
            )}

            {value.frequency === 'custom' && (
                <div>
                    <label htmlFor="interval-days">Every N days</label>
                    <input
                        id="interval-days"
                        type="number"
                        min={1}
                        max={365}
                        value={value.intervalDays}
                        onChange={(e) => update({ intervalDays: Number(e.target.value) })}
                        disabled={disabled}
                    />
                    <p className="hint">Counted from the day the habit was created.</p>
                </div>
            )}
        </div>
    );
};
