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
        <>
            <div>
                <label>Frequency</label>
                <select
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
                    <div className="flex flex-wrap gap-2">
                        {WEEKDAY_LABELS.map((label, day) => (
                            <button
                                key={label}
                                type="button"
                                onClick={() => toggleWeekday(day)}
                                disabled={disabled}
                                className={
                                    value.weekdays.includes(day)
                                        ? 'rounded bg-emerald-600 px-2 py-1 text-sm'
                                        : 'rounded border border-neutral-600 px-2 py-1 text-sm'
                                }
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {value.frequency === 'monthly' && (
                <div>
                    <label>Days of the month</label>
                    <input
                        type="text"
                        value={value.monthDaysText}
                        onChange={(e) => update({ monthDaysText: e.target.value })}
                        placeholder="1, 15"
                        disabled={disabled}
                    />
                    <p className="text-sm">
                        Comma-separated (1–31). A habit on the 31st falls on the last day of shorter months.
                    </p>
                </div>
            )}

            {value.frequency === 'custom' && (
                <div>
                    <label>Every N days</label>
                    <input
                        type="number"
                        min={1}
                        max={365}
                        value={value.intervalDays}
                        onChange={(e) => update({ intervalDays: Number(e.target.value) })}
                        disabled={disabled}
                    />
                </div>
            )}
        </>
    );
};
