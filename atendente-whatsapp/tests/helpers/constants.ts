import { pino } from "pino";

export const APP_SECRET = "test-app-secret";
export const VERIFY_TOKEN = "test-verify-token-1234567890";
export const ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
export const ACCESS_TOKEN = "EAAG-test-token";
export const PHONE_NUMBER_ID = "111111111111111";
export const PATIENT_WA_ID = "5511999990000";
export const silentLogger = pino({ level: "silent" });
