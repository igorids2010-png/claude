import type { Queryable } from "../db/db.js";

export interface ChannelRow {
  channel_id: string;
  clinic_id: string;
  clinic_name: string;
  clinic_active: boolean;
  channel_active: boolean;
  phone_number_id: string;
  access_token_ciphertext: string;
}

const CHANNEL_SELECT = `
  select ch.id as channel_id, c.id as clinic_id, c.name as clinic_name, c.active as clinic_active,
         ch.active as channel_active, ch.phone_number_id, ch.access_token_ciphertext
  from clinic_channels ch
  join clinics c on c.id = ch.clinic_id`;

/** O phone_number_id do webhook diz para qual clínica a mensagem foi enviada. */
export async function findChannelByPhoneNumberId(db: Queryable, phoneNumberId: string): Promise<ChannelRow | null> {
  const { rows } = await db.query<ChannelRow>(`${CHANNEL_SELECT} where ch.phone_number_id = $1`, [phoneNumberId]);
  return rows[0] ?? null;
}
