import type { Db } from "../db/db.js";
import type { Logger } from "../lib/logger.js";
import type { Job } from "../queue/jobs.js";
import { PermanentJobError, type JobHandler } from "../queue/worker.js";
import { formatPhone } from "../team/alerts.js";
import { eventIdFor, type CalendarClient } from "./google-calendar.js";

interface Row {
  id: string;
  status: string;
  starts_at: Date;
  ends_at: Date;
  patient_name: string;
  google_event_id: string | null;
  calendar_id: string | null;
  service: string;
  timezone: string;
  patient_wa_id: string | null;
}

/**
 * Leva o agendamento para a agenda do Google do profissional: cria o evento quando está
 * marcado e apaga quando foi cancelado/remarcado. O ID do evento é derivado do agendamento,
 * então repetir o job (nova tentativa) não duplica nada.
 */
export function createCalendarSyncHandler(deps: { db: Db; calendar: CalendarClient | null; logger: Logger }): JobHandler {
  return async (job: Job) => {
    const appointmentId = job.payload.appointmentId;
    if (typeof appointmentId !== "string") throw new PermanentJobError("Job de agenda sem appointmentId");

    const { rows } = await deps.db.query<Row>(
      `select a.id, a.status, a.starts_at, a.ends_at, a.patient_name, a.google_event_id,
              p.google_calendar_id as calendar_id, s.name as service, c.timezone, pt.wa_id as patient_wa_id
       from appointments a
       join professionals p on p.id = a.professional_id
       join services s on s.id = a.service_id
       join clinics c on c.id = a.clinic_id
       left join patients pt on pt.id = a.patient_id
       where a.id = $1`,
      [appointmentId],
    );
    const appointment = rows[0];
    if (!appointment) return;
    const log = deps.logger.child({ appointmentId });

    if (!appointment.calendar_id || !deps.calendar) {
      await deps.db.query(`update appointments set google_sync_status = 'not_configured' where id = $1`, [appointmentId]);
      return;
    }

    try {
      if (appointment.status === "scheduled") {
        const eventId = appointment.google_event_id ?? eventIdFor(appointment.id);
        await deps.calendar.insertEvent(appointment.calendar_id, {
          id: eventId,
          summary: `${appointment.service} - ${appointment.patient_name}`,
          description: [
            "Agendado pelo atendente do WhatsApp.",
            `Paciente: ${appointment.patient_name}`,
            appointment.patient_wa_id ? `WhatsApp: ${formatPhone(appointment.patient_wa_id)}` : null,
          ]
            .filter(Boolean)
            .join("\n"),
          start: new Date(appointment.starts_at),
          end: new Date(appointment.ends_at),
          timeZone: appointment.timezone,
        });
        await deps.db.query(
          `update appointments set google_event_id = $2, google_sync_status = 'synced', updated_at = now() where id = $1`,
          [appointmentId, eventId],
        );
        log.info("evento criado no Google Calendar");
      } else if (appointment.status === "cancelled" || (appointment.status === "expired" && appointment.google_event_id)) {
        // Sempre tenta apagar pelo ID determinístico: cobre o caso de o evento ter sido criado
        // sem o ID ter sido gravado aqui. Se ele não existir, o Google responde 404 e seguimos.
        await deps.calendar.deleteEvent(appointment.calendar_id, appointment.google_event_id ?? eventIdFor(appointment.id));
        await deps.db.query(`update appointments set google_sync_status = 'synced', updated_at = now() where id = $1`, [appointmentId]);
        log.info("evento removido do Google Calendar");
      }
    } catch (error) {
      await deps.db.query(`update appointments set google_sync_status = 'failed', updated_at = now() where id = $1`, [appointmentId]);
      throw error;
    }
  };
}
