import type { BusyInterval, CalendarClient, CalendarEvent } from "../../src/scheduling/google-calendar.js";

/** Google Calendar falso: guarda eventos criados/apagados e devolve ocupações programadas. */
export function createFakeCalendar() {
  const busy = new Map<string, BusyInterval[]>();
  const inserted: Array<CalendarEvent & { calendarId: string }> = [];
  const deleted: Array<{ calendarId: string; eventId: string }> = [];
  const state = { failFreeBusy: false, freeBusyCalls: 0 };

  const client: CalendarClient = {
    async freeBusy(calendarIds, timeMin, timeMax) {
      state.freeBusyCalls++;
      if (state.failFreeBusy) throw new Error("Google fora do ar");
      return new Map(
        calendarIds.map((id) => [id, (busy.get(id) ?? []).filter((b) => b.start < timeMax && timeMin < b.end)]),
      );
    },
    async insertEvent(calendarId, event) {
      if (!inserted.some((e) => e.id === event.id)) inserted.push({ ...event, calendarId });
    },
    async deleteEvent(calendarId, eventId) {
      deleted.push({ calendarId, eventId });
    },
  };

  return {
    client,
    inserted,
    deleted,
    state,
    setBusy: (calendarId: string, intervals: BusyInterval[]) => busy.set(calendarId, intervals),
  };
}
