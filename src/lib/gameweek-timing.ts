import {
  DEFAULT_FANTASY_DEADLINE,
  GAME_TIME,
} from "@/lib/constants";

/** Get the next occurrence of a weekday at a given time */
function getNextWeekdayDate(
  dayOfWeek: number,
  hour: number,
  minute: number,
  from: Date = new Date()
): Date {
  const result = new Date(from);
  result.setHours(hour, minute, 0, 0);

  const currentDay = result.getDay();
  let daysUntil = (dayOfWeek - currentDay + 7) % 7;

  if (daysUntil === 0 && result <= from) {
    daysUntil = 7;
  }

  result.setDate(result.getDate() + daysUntil);
  return result;
}

export function getNextGameDate(from: Date = new Date()): Date {
  return getNextWeekdayDate(
    GAME_TIME.dayOfWeek,
    GAME_TIME.hour,
    GAME_TIME.minute,
    from
  );
}

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
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}
