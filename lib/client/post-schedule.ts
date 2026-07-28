import { POST_RETENTION_MS } from "@/lib/post-retention-config";

const KATHMANDU_OFFSET_MS = (5 * 60 + 45) * 60 * 1000;
const DATETIME_LOCAL_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?$/;

export function parseKathmanduDatetimeLocal(value: string) {
  const match = value.match(DATETIME_LOCAL_PATTERN);

  if (!match) return null;

  const [, year, month, day, hour, minute, second = "0"] = match;

  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    ),
  );
}

export function dateToKathmanduDatetimeLocal(value: string | Date | null | undefined) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 16);
}

export function getCurrentKathmanduDatetimeLocal() {
  return new Date(Date.now() + KATHMANDU_OFFSET_MS).toISOString().slice(0, 16);
}

export function getScheduleLimit(createdAt: string | Date) {
  const expirationDate = new Date(new Date(createdAt).getTime() + POST_RETENTION_MS);
  return dateToKathmanduDatetimeLocal(expirationDate.toISOString());
}
