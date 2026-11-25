"use client";

import * as React from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { ARGENTINA_TIME_ZONE, formatBackendDateTime } from "@/lib/dates";
import { calendarDate, calendarWeeks, shiftCalendarDay, shiftCalendarMonth } from "@/lib/calendar";
import { cn } from "@/lib/utils";

const weekdays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const monthFormat = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" });
const dayFormat = new Intl.DateTimeFormat("es-AR", { dateStyle: "full", timeZone: "UTC" });
const timeOptions = (count: number) => Array.from({ length: count }, (_, i) => {
  const value = String(i).padStart(2, "0");
  return { value, label: value };
});
const hours = timeOptions(24);
const minutes = timeOptions(60);

interface DateTimePickerProps {
  label: string;
  name: string;
  required?: boolean;
  disabled?: boolean;
}

/** Branded calendar; the form receives YYYY-MM-DDTHH:mm without timezone conversion. */
export function DateTimePicker({ label, name, required, disabled }: DateTimePickerProps) {
  const id = React.useId();
  const nativeInput = React.useRef<HTMLInputElement>(null);
  const trigger = React.useRef<HTMLButtonElement>(null);
  const calendar = React.useRef<HTMLDivElement>(null);
  const [value, setValue] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [day, setDay] = React.useState("");
  const [month, setMonth] = React.useState("");
  const [today, setToday] = React.useState("");
  const [focusedDay, setFocusedDay] = React.useState("");
  const [hour, setHour] = React.useState("08");
  const [minute, setMinute] = React.useState("00");
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    const form = nativeInput.current?.form;
    const reset = () => { setValue(""); setError(false); setOpen(false); };
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, []);

  function showCalendar() {
    const parts = new Intl.DateTimeFormat("en", {
      timeZone: ARGENTINA_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(new Date());
    const part = (type: string) => parts.find((p) => p.type === type)?.value;
    const current = `${part("year")}-${part("month")}-${part("day")}`;
    const selected = value.slice(0, 10) || current;
    setToday(current);
    setDay(selected);
    setFocusedDay(selected);
    setMonth(selected.slice(0, 7));
    setHour(value.slice(11, 13) || "08");
    setMinute(value.slice(14, 16) || "00");
    setOpen(true);
  }

  function navigateMonth(offset: number) {
    const next = shiftCalendarMonth(`${month}-01`, offset);
    setMonth(next.slice(0, 7));
    setFocusedDay(next);
  }

  function closeCalendar() {
    setOpen(false);
    requestAnimationFrame(() => trigger.current?.focus());
  }

  function onDayKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, date: string) {
    let next: string;
    const offset = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
    if (offset !== undefined) next = shiftCalendarDay(date, offset);
    else if (event.key === "PageUp" || event.key === "PageDown") {
      next = shiftCalendarMonth(date, (event.key === "PageUp" ? -1 : 1) * (event.shiftKey ? 12 : 1));
    } else if (event.key === "Home" || event.key === "End") {
      const weekday = (calendarDate(date).getUTCDay() + 6) % 7;
      next = shiftCalendarDay(date, (event.key === "Home" ? 0 : 6) - weekday);
    } else return;
    event.preventDefault();
    setFocusedDay(next);
    setMonth(next.slice(0, 7));
    requestAnimationFrame(() => calendar.current?.querySelector<HTMLButtonElement>(`[data-date="${next}"]`)?.focus());
  }

  return (
    <div className="relative w-full space-y-1.5">
      <label id={`${id}-label`} htmlFor={id} className="block text-sm font-medium text-foreground">{label}</label>
      <button ref={trigger} id={id} type="button" disabled={disabled} onClick={showCalendar}
        aria-haspopup="dialog" aria-expanded={open}
        aria-labelledby={`${id}-label ${id}-value`}
        aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
        className={cn("control-input flex items-center justify-between gap-3 text-left", error && "border-danger")}>
        <span id={`${id}-value`} className={cn("min-w-0 truncate font-mono", !value && "font-sans text-muted")}>
          {value ? formatBackendDateTime(value).slice(0, -3) : "Seleccionar fecha y hora"}
        </span>
        <CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0 text-accent" />
      </button>
      <span id={`${id}-hint`} className="sr-only">{required ? "Campo obligatorio. " : ""}Abrir calendario para seleccionar fecha y hora de Argentina.</span>
      <input ref={nativeInput} type="datetime-local" name={name} value={value} required={required} disabled={disabled}
        tabIndex={-1} aria-hidden="true" className="sr-only" onChange={(e) => setValue(e.target.value)}
        onInvalid={(e) => { e.preventDefault(); setError(true); showCalendar(); }} />
      {error && <p id={`${id}-error`} role="alert" className="text-xs font-medium text-danger-ink">Seleccioná la fecha y hora previstas.</p>}

      <Modal isOpen={open} onClose={closeCalendar} title="Fecha y hora previstas"
        description="Hora de Argentina (UTC−03:00)" className="max-w-sm p-4 sm:p-5">
        {month && <>
          <div className="mb-3 flex items-center justify-between gap-2">
            <Button type="button" variant="ghost" size="sm" aria-label="Mes anterior" onClick={() => navigateMonth(-1)}><ChevronLeft aria-hidden="true" className="h-5 w-5" /></Button>
            <h3 id={`${id}-month`} aria-live="polite" className="text-sm font-semibold first-letter:uppercase">{monthFormat.format(calendarDate(`${month}-01`))}</h3>
            <Button type="button" variant="ghost" size="sm" aria-label="Mes siguiente" onClick={() => navigateMonth(1)}><ChevronRight aria-hidden="true" className="h-5 w-5" /></Button>
          </div>
          <div ref={calendar} role="grid" aria-labelledby={`${id}-month`}>
            <div role="row" className="grid grid-cols-7">
              {weekdays.map((weekday) => <span key={weekday} role="columnheader" className="py-2 text-center text-xs font-medium text-muted">{weekday}</span>)}
            </div>
            {calendarWeeks(`${month}-01`).map((week) => <div key={week[0]} role="row" className="grid grid-cols-7 gap-y-1">
              {week.map((date) => <div key={date} role="gridcell" aria-selected={day === date} className="p-0.5">
                <button type="button" data-date={date} tabIndex={focusedDay === date ? 0 : -1}
                  autoFocus={focusedDay === date} aria-label={dayFormat.format(calendarDate(date))}
                  aria-current={date === today ? "date" : undefined}
                  onKeyDown={(e) => onDayKeyDown(e, date)}
                  onClick={() => { setDay(date); setFocusedDay(date); setMonth(date.slice(0, 7)); }}
                  className={cn("min-h-10 w-full rounded-lg border border-transparent font-mono text-sm transition-colors hover:bg-elevated",
                    date.slice(0, 7) === month ? "text-foreground" : "text-muted",
                    date === today && day !== date && "border-accent/60 text-accent",
                    day === date && "bg-accent font-semibold text-canvas hover:bg-accent-bright")}>{calendarDate(date).getUTCDate()}</button>
              </div>)}
            </div>)}
          </div>
          <p className="sr-only">Usá las flechas para recorrer los días, Re Pág y Av Pág para cambiar de mes y Enter para seleccionar.</p>
          <div className="mt-4 flex items-end gap-3 border-t border-line pt-4">
            <Clock3 aria-hidden="true" className="mb-3 h-5 w-5 shrink-0 text-accent" />
            <Select label="Hora" value={hour} onChange={(e) => setHour(e.target.value)} options={hours} className="font-mono" />
            <span aria-hidden="true" className="mb-3 text-muted">:</span>
            <Select label="Minutos" value={minute} onChange={(e) => setMinute(e.target.value)} options={minutes} className="font-mono" />
          </div>
          <div className="mt-5 flex flex-wrap justify-between gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => { setDay(today); setFocusedDay(today); setMonth(today.slice(0, 7)); }}>Hoy</Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={closeCalendar}>Cancelar</Button>
              <Button type="button" size="sm" onClick={() => { setValue(`${day}T${hour}:${minute}`); setError(false); closeCalendar(); }}>Aplicar</Button>
            </div>
          </div>
        </>}
      </Modal>
    </div>
  );
}
