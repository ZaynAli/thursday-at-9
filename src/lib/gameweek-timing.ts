import {
  DEFAULT_FANTASY_DEADLINE,
  GAME_TIME,
  LEAGUE_TIMEZONE,
} from "@/lib/constants";

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number; // 0 = Sunday … 6 = Saturday
}

const WEEKDAY_TO_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function getZonedParts(date: Date, timeZone: string = LEAGUE_TIMEZONE): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") map[part.type] = part.value;
  }

  const weekday = WEEKDAY_TO_INDEX[map.weekday ?? ""];
  if (weekday === undefined) {
    throw new Error(`Unexpected weekday token: ${map.weekday}`);
  }

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
    weekday,
  };
}

/**
 * Convert a wall-clock date/time in the league timezone to a UTC Date.
 * Handles EST/EDT automatically via America/New_York.
 */
export function zonedWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string = LEAGUE_TIMEZONE
): Date {
  let utcMs = Date.UTC(year, month - 1, day, hour, minute, 0);

  for (let i = 0; i < 3; i++) {
    const parts = getZonedParts(new Date(utcMs), timeZone);
    const asUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    );
    const desiredAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
    const diff = desiredAsUtc - asUtc;
    if (diff === 0) break;
    utcMs += diff;
  }

  return new Date(utcMs);
}

export function easternDateTimeToIso(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): string {
  return zonedWallTimeToUtc(year, month, day, hour, minute).toISOString();
}

/** Next occurrence of a weekday at a given Eastern wall-clock time. */
function getNextWeekdayDate(
  dayOfWeek: number,
  hour: number,
  minute: number,
  from: Date = new Date()
): Date {
  const now = getZonedParts(from);
  let daysUntil = (dayOfWeek - now.weekday + 7) % 7;

  const candidate = zonedWallTimeToUtc(now.year, now.month, now.day, hour, minute);
  if (daysUntil === 0 && candidate.getTime() <= from.getTime()) {
    daysUntil = 7;
  }

  const targetLocal = new Date(Date.UTC(now.year, now.month - 1, now.day));
  targetLocal.setUTCDate(targetLocal.getUTCDate() + daysUntil);

  return zonedWallTimeToUtc(
    targetLocal.getUTCFullYear(),
    targetLocal.getUTCMonth() + 1,
    targetLocal.getUTCDate(),
    hour,
    minute
  );
}

export function getNextGameDate(from: Date = new Date()): Date {
  return getNextWeekdayDate(
    GAME_TIME.dayOfWeek,
    GAME_TIME.hour,
    GAME_TIME.minute,
    from
  );
}

/** Fantasy auto-lock = kickoff (9:30 PM ET), unless admin locks earlier. */
export function getNextFantasyDeadline(from: Date = new Date()): Date {
  return getNextWeekdayDate(
    DEFAULT_FANTASY_DEADLINE.dayOfWeek,
    DEFAULT_FANTASY_DEADLINE.hour,
    DEFAULT_FANTASY_DEADLINE.minute,
    from
  );
}

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isExpired: boolean;
}

export function getCountdownTo(target: Date, now: Date = new Date()): CountdownParts {
  const totalMs = Math.max(0, target.getTime() - now.getTime());
  const isExpired = target.getTime() <= now.getTime();

  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((totalMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, totalMs, isExpired };
}

export function formatCountdown(parts: CountdownParts): string {
  if (parts.isExpired) return "LOCKED";
  if (parts.days > 0) {
    return `${parts.days}d ${String(parts.hours).padStart(2, "0")}:${String(parts.minutes).padStart(2, "0")}:${String(parts.seconds).padStart(2, "0")}`;
  }
  return `${String(parts.hours).padStart(2, "0")} : ${String(parts.minutes).padStart(2, "0")} : ${String(parts.seconds).padStart(2, "0")}`;
}

export function formatGameDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    timeZone: LEAGUE_TIMEZONE,
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/** Format a deadline instant in Eastern for UI copy. */
export function formatEasternDeadline(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: LEAGUE_TIMEZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}
